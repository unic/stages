import { addressKey } from "./address.js";
import { getFieldDefinition } from "./fields.js";
import { isSafePathSegment, pathsEqual } from "./path.js";
import type { NormalizedNode } from "./schema.js";
import type {
  DataPath,
  FieldValidator,
  NodeAddress,
  ValidationCancellationSignal,
  ValidationIssue,
  ValidatorConfig,
} from "./types.js";

export interface ValidationTarget {
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly visible: boolean;
  readonly disabled: boolean;
}

export interface ValidationCandidate<TValue, TContext> {
  readonly node: ValidationTarget;
  readonly validator: ValidatorConfig<TValue, TContext>;
  readonly identity: object;
  readonly keyId: string;
  readonly intrinsic: boolean;
}

export function eventNames(value: string | readonly string[] | undefined): readonly string[] {
  if (value === undefined) return [];
  return typeof value === "string" ? [value] : value;
}

export function validationRecordKey(address: NodeAddress, validatorId: string): string {
  return `${addressKey(address)}#${validatorId.length}:${validatorId}`;
}

export const passiveValidationSignal: ValidationCancellationSignal = {
  aborted: false,
  onCancel: () => () => undefined,
};

export function createValidationCancellation(): Readonly<{
  signal: ValidationCancellationSignal;
  cancel: () => void;
}> {
  let aborted = false;
  const listeners = new Set<() => void>();
  const signal: ValidationCancellationSignal = {
    get aborted() {
      return aborted;
    },
    onCancel(listener) {
      if (aborted) {
        listener();
        return () => undefined;
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    signal,
    cancel() {
      if (aborted) return;
      aborted = true;
      for (const listener of [...listeners]) listener();
      listeners.clear();
    },
  };
}

export function pathsIntersect(left: DataPath, right: DataPath): boolean {
  const commonLength = Math.min(left.length, right.length);
  return pathsEqual(left.slice(0, commonLength), right.slice(0, commonLength));
}

export function checkedValidationIssues(value: unknown): readonly ValidationIssue[] {
  if (!Array.isArray(value)) throw new TypeError("Validator result must be an array of issues.");
  for (const issue of value) {
    if (issue === null || typeof issue !== "object" || Array.isArray(issue)) {
      throw new TypeError("Each validation issue must be an object.");
    }
    const candidate = issue as Readonly<Record<string, unknown>>;
    const path = candidate["path"];
    const meta = candidate["meta"];
    if (typeof candidate["id"] !== "string" || candidate["id"].length === 0
      || typeof candidate["code"] !== "string" || candidate["code"].length === 0
      || (candidate["severity"] !== "error" && candidate["severity"] !== "warning")
      || !Array.isArray(path)
      || !path.every((segment) =>
        (typeof segment === "string" || typeof segment === "number") && isSafePathSegment(segment),
      )
      || (candidate["message"] !== undefined && typeof candidate["message"] !== "string")
      || (meta !== undefined && (meta === null || typeof meta !== "object" || Array.isArray(meta)))) {
      throw new TypeError("Validator returned a malformed issue.");
    }
  }
  return value as readonly ValidationIssue[];
}

export function validatorsFor<TValue, TFields, TContext>(
  nodes: readonly NormalizedNode<TValue, TFields, TContext>[],
  fields: TFields,
  rootValidators: readonly ValidatorConfig<TValue, TContext>[] = [],
): readonly ValidationCandidate<TValue, TContext>[] {
  const output: ValidationCandidate<TValue, TContext>[] = [];
  const root: ValidationTarget = { path: [], address: [], visible: true, disabled: false };
  for (const validator of rootValidators) {
    output.push({ node: root, validator, identity: validator, keyId: `config:${validator.id}`, intrinsic: false });
  }
  for (const node of nodes) {
    for (const validator of node.config.validators ?? []) {
      output.push({ node, validator, identity: validator, keyId: `config:${validator.id}`, intrinsic: false });
    }
    if (node.config.kind === "field") {
      const definition = getFieldDefinition(fields, node.config.type);
      for (const fieldValidator of definition?.validators ?? []) {
        const intrinsicValidator = fieldValidator as FieldValidator<unknown, unknown>;
        const validator: ValidatorConfig<TValue, TContext> = {
          id: fieldValidator.id,
          on: [],
          validate: ({ fieldValue }) => intrinsicValidator.validate(fieldValue, node.props).map((issue) => ({
            ...issue,
            path: node.path,
          })),
        };
        output.push({
          node,
          validator,
          identity: fieldValidator,
          keyId: `field:${fieldValidator.id}`,
          intrinsic: true,
        });
      }
    }
    output.push(...validatorsFor(node.children, fields));
  }
  return output;
}
