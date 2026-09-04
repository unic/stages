import { getAtPath, type DataPath, type ValidationContext, type ValidatorConfig } from "@stages/core";
import type { StudioValidatorSpec } from "../document/types";
import { evaluateStudioExpression } from "../expressions/evaluator";
import { studioExpressionDependencies } from "../expressions/serialization";
import type { StudioAsyncServiceBindings, StudioAsyncServiceResult } from "../registry/services";
import { resolveStudioMessage, type StudioLocalizationOptions } from "../localization";

export const STUDIO_VALIDATOR_CATALOG = Object.freeze({
  required: { displayName: "Required", description: "Requires a present, non-empty value." },
  length: { displayName: "Length", description: "Checks text or array length." },
  range: { displayName: "Range", description: "Checks a numeric minimum or maximum." },
  pattern: { displayName: "Pattern", description: "Matches text against a regular expression." },
  comparison: { displayName: "Comparison", description: "Compares the owner value with an expression." },
  collection: { displayName: "Collection aggregate", description: "Checks row count or uniqueness." },
  service: { displayName: "Async service", description: "Invokes a versioned trusted host binding." },
} as const);

export interface StudioValidatorCompilationDiagnostic {
  readonly index: number;
  readonly code: string;
  readonly message: string;
}

export interface CompiledStudioValidators {
  readonly validators: readonly ValidatorConfig<unknown, unknown>[];
  readonly diagnostics: readonly StudioValidatorCompilationDiagnostic[];
}

export interface CompileStudioValidatorsOptions {
  readonly serviceBindings?: StudioAsyncServiceBindings;
  readonly localization?: StudioLocalizationOptions;
}

function messageFor(spec: StudioValidatorSpec, context: ValidationContext<unknown, unknown>, localization?: StudioLocalizationOptions): string | undefined {
  if (typeof spec.message === "string") return spec.message;
  if (spec.message === undefined) return undefined;
  const locale = context.context !== null && typeof context.context === "object"
    ? (context.context as Readonly<Record<string, unknown>>)["locale"]
    : undefined;
  const requestedLocale = typeof locale === "string" ? locale : localization?.defaultLocale;
  if (spec.message.key !== undefined && requestedLocale !== undefined && localization !== undefined) {
    const resolved = resolveStudioMessage(spec.message.key, requestedLocale, localization).value;
    if (resolved !== undefined) return resolved;
  }
  return typeof locale === "string" ? spec.message.translations?.[locale] ?? spec.message.default : spec.message.default;
}

function expressionInput(context: ValidationContext<unknown, unknown>) {
  return { value: context.value, row: context.parentValue, context: context.context, extensions: context.meta.extensions, metadata: context.meta };
}

function evaluate(expression: NonNullable<StudioValidatorSpec["when"]>, context: ValidationContext<unknown, unknown>): unknown {
  const result = evaluateStudioExpression(expression, expressionInput(context));
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function applies(spec: StudioValidatorSpec, context: ValidationContext<unknown, unknown>): boolean {
  if (spec.when === undefined) return true;
  const value = evaluate(spec.when, context);
  if (typeof value !== "boolean") throw new TypeError("Validator condition must evaluate to a boolean.");
  return value;
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || value === false
    || (typeof value === "string" && value.trim().length === 0)
    || (Array.isArray(value) && value.length === 0);
}

function compare(operator: Extract<StudioValidatorSpec, { kind: "comparison" }>["operator"], left: unknown, right: unknown): boolean {
  if (operator === "===") return Object.is(left, right);
  if (operator === "!==") return !Object.is(left, right);
  if (typeof left === "number" && typeof right === "number") {
    if (operator === "<") return left < right;
    if (operator === "<=") return left <= right;
    if (operator === ">") return left > right;
    return left >= right;
  }
  if (typeof left === "string" && typeof right === "string") {
    if (operator === "<") return left < right;
    if (operator === "<=") return left <= right;
    if (operator === ">") return left > right;
    return left >= right;
  }
  return false;
}

function uniqueCollection(values: readonly unknown[], path: readonly string[]): boolean {
  const seen = new Set<string>();
  for (const value of values) {
    const key = path.length === 0 ? value : getAtPath(value, path);
    const encoded = key === undefined ? "undefined" : JSON.stringify(key);
    if (seen.has(encoded)) return false;
    seen.add(encoded);
  }
  return true;
}

function passes(spec: StudioValidatorSpec, context: ValidationContext<unknown, unknown>, pattern?: RegExp): boolean {
  const value = context.fieldValue;
  if (spec.kind === "required") return !isMissing(value);
  if (spec.kind === "length") {
    if (value === null || value === undefined || value === "") return true;
    if (typeof value !== "string" && !Array.isArray(value)) return false;
    return (spec.min === undefined || value.length >= spec.min) && (spec.max === undefined || value.length <= spec.max);
  }
  if (spec.kind === "range") {
    if (value === null || value === undefined || value === "") return true;
    return typeof value === "number" && Number.isFinite(value)
      && (spec.min === undefined || value >= spec.min) && (spec.max === undefined || value <= spec.max);
  }
  if (spec.kind === "pattern") {
    if (value === null || value === undefined || value === "") return true;
    if (typeof value !== "string" || pattern === undefined) return false;
    pattern.lastIndex = 0;
    return pattern.test(value);
  }
  if (spec.kind === "comparison") return compare(spec.operator, value, evaluate(spec.other, context));
  if (spec.kind === "service") return true;
  if (!Array.isArray(value)) return false;
  return (spec.min === undefined || value.length >= spec.min)
    && (spec.max === undefined || value.length <= spec.max)
    && (spec.uniqueBy === undefined || uniqueCollection(value, spec.uniqueBy));
}

function inferredDependencies(spec: StudioValidatorSpec): readonly DataPath[] {
  const expressions = [
    spec.when,
    spec.kind === "comparison" ? spec.other : undefined,
    spec.kind === "service" ? spec.request : undefined,
  ].filter((value) => value !== undefined);
  const paths = [...(spec.dependencies ?? [])];
  for (const expression of expressions) for (const dependency of studioExpressionDependencies(expression)) {
    if (dependency.scope === "value") paths.push(dependency.path);
  }
  return Object.freeze([...new Map(paths.map((path) => [JSON.stringify(path), Object.freeze([...path]) as DataPath])).values()]);
}

export function defaultStudioValidator(kind: StudioValidatorSpec["kind"], id: string = kind): StudioValidatorSpec {
  const common = { id, on: ["input", "submit"], revealOn: ["blur", "submit"], severity: "error" as const };
  if (kind === "required") return { ...common, kind, message: "This value is required." };
  if (kind === "length") return { ...common, kind, min: 1, message: "The value is too short." };
  if (kind === "range") return { ...common, kind, min: 0, message: "The value is outside the allowed range." };
  if (kind === "pattern") return { ...common, kind, pattern: ".+", message: "The value does not match the required format." };
  if (kind === "comparison") return { ...common, kind, operator: "===", other: { kind: "literal", value: "" }, message: "The values do not match." };
  if (kind === "service") return { ...common, kind, service: { key: "availability", version: 1 }, message: "The service rejected this value." };
  return { ...common, kind, min: 1, message: "The collection does not meet its requirements." };
}

function serviceIssues(
  spec: Extract<StudioValidatorSpec, { readonly kind: "service" }>,
  id: string,
  context: ValidationContext<unknown, unknown>,
  result: StudioAsyncServiceResult,
  localization?: StudioLocalizationOptions,
) {
  if (result.status === "success") return [];
  const message = result.message ?? messageFor(spec, context, localization);
  return [{
    id,
    code: result.code?.trim() || spec.code?.trim() || "service-rejected",
    path: spec.issuePath ?? context.path,
    severity: result.severity ?? spec.severity ?? "error",
    ...(message === undefined ? {} : { message }),
    ...(result.meta === undefined ? {} : { meta: result.meta }),
  }] as const;
}

export function compileStudioValidators(
  specs: readonly StudioValidatorSpec[] | undefined,
  options: CompileStudioValidatorsOptions = {},
): CompiledStudioValidators {
  const validators: ValidatorConfig<unknown, unknown>[] = [];
  const diagnostics: StudioValidatorCompilationDiagnostic[] = [];
  const ids = new Set<string>();
  for (const [index, spec] of (specs ?? []).entries()) {
    if (spec.id !== undefined && spec.id.trim().length === 0) {
      diagnostics.push({ index, code: "compiler.invalid-validator-id", message: "Validator ID must be non-empty." });
      continue;
    }
    const id = spec.id ?? `${spec.kind}.${index + 1}`;
    if (ids.has(id)) {
      diagnostics.push({ index, code: "compiler.duplicate-validator-id", message: `Validator ID ${id} is duplicated.` });
      continue;
    }
    ids.add(id);
    const policies = [spec.on ?? ["input", "submit"], spec.revealOn].filter((policy) => policy !== undefined);
    if (policies.some((policy) => typeof policy === "string" ? policy.length === 0 : policy.length === 0 || policy.some((event) => event.length === 0))) {
      diagnostics.push({ index, code: "compiler.invalid-validator-events", message: `Validator ${id} has an empty event policy.` });
      continue;
    }
    if (("min" in spec && spec.min !== undefined && !Number.isFinite(spec.min))
      || ("max" in spec && spec.max !== undefined && !Number.isFinite(spec.max))
      || ("min" in spec && "max" in spec && spec.min !== undefined && spec.max !== undefined && spec.min > spec.max)) {
      diagnostics.push({ index, code: "compiler.invalid-validator-range", message: `Validator ${id} has invalid bounds.` });
      continue;
    }
    let pattern: RegExp | undefined;
    if (spec.kind === "pattern") {
      try { pattern = new RegExp(spec.pattern, spec.flags); }
      catch { diagnostics.push({ index, code: "compiler.invalid-validator-pattern", message: `Validator ${id} has an invalid regular expression.` }); continue; }
    }
    const serviceBinding = spec.kind === "service" ? options.serviceBindings?.resolve(spec.service) : undefined;
    if (spec.kind === "service" && serviceBinding === undefined) {
      diagnostics.push({ index, code: "compiler.unresolved-service-binding", message: `Async service ${spec.service.key}@${spec.service.version} is not bound in this environment.` });
      continue;
    }
    const dependencies = inferredDependencies(spec);
    const validate: ValidatorConfig<unknown, unknown>["validate"] = spec.kind === "service"
      ? async (context) => {
          const input = spec.request === undefined ? context.fieldValue : evaluate(spec.request, context);
          const result = await serviceBinding!.invoke({ input, validation: context });
          return serviceIssues(spec, id, context, result, options.localization);
        }
      : (context) => {
          if (passes(spec, context, pattern)) return [];
          const message = messageFor(spec, context, options.localization);
          return [{ id, code: spec.code?.trim() || spec.kind, path: spec.issuePath ?? context.path, severity: spec.severity ?? "error", ...(message === undefined ? {} : { message }) }];
        };
    validators.push({
      id,
      on: spec.on ?? ["input", "submit"],
      ...(spec.revealOn === undefined ? {} : { revealOn: spec.revealOn }),
      ...(spec.includeDisabled === undefined ? {} : { includeDisabled: spec.includeDisabled }),
      ...(dependencies.length === 0 ? {} : { dependencies }),
      ...(spec.when === undefined ? {} : { when: (context) => applies(spec, context) }),
      validate,
    });
  }
  return { validators: Object.freeze(validators), diagnostics: Object.freeze(diagnostics) };
}
