import type {
  DataPath,
  FieldEventReducer,
  StagesPatch,
  TransformConfig,
  TransformContext,
} from "@stages/core";
import type { StudioExpression } from "../expressions/types.js";
import { evaluateStudioExpression } from "../expressions/evaluator.js";
import type { StudioLogicRule, StudioPatchAction, StudioPatchTarget, Uid } from "../document/types.js";

export interface StudioLogicCompileIssue {
  readonly code: "compiler.invalid-patch-target";
  readonly message: string;
  readonly ruleIndex: number;
  readonly actionIndex: number;
  readonly targetUid?: Uid;
}

interface CompileOptions {
  readonly pathsByUid: ReadonlyMap<Uid, DataPath>;
  readonly onIssue: (issue: StudioLogicCompileIssue) => void;
}

function matches(policy: string | readonly string[], eventName: string): boolean {
  return typeof policy === "string" ? policy === eventName : policy.includes(eventName);
}

/** Rehydrates collection row indexes when a picked target is in the event target's current row. */
export function resolveStudioPatchPath(
  target: StudioPatchTarget,
  pathsByUid: ReadonlyMap<Uid, DataPath>,
  eventPath: DataPath,
): DataPath | undefined {
  if (target.kind === "event-target") return eventPath;
  const staticTarget = pathsByUid.get(target.uid);
  if (staticTarget === undefined) return undefined;
  const eventStrings: string[] = [];
  const rowIndexes: Array<{ readonly prefix: readonly string[]; readonly value: number }> = [];
  for (const segment of eventPath) {
    if (typeof segment === "number") rowIndexes.push({ prefix: [...eventStrings], value: segment });
    else eventStrings.push(segment);
  }
  if (rowIndexes.length === 0) return staticTarget;
  const output: Array<number | string> = [];
  const targetStrings: string[] = [];
  for (const segment of staticTarget) {
    if (typeof segment === "number") { output.push(segment); continue; }
    for (const row of rowIndexes) {
      if (row.prefix.length === targetStrings.length && row.prefix.every((value, index) => value === targetStrings[index])) output.push(row.value);
    }
    output.push(segment);
    targetStrings.push(segment);
  }
  for (const row of rowIndexes) {
    if (row.prefix.length === targetStrings.length && row.prefix.every((value, index) => value === targetStrings[index])) output.push(row.value);
  }
  return output;
}

function expressionValue(expression: StudioExpression, input: Parameters<typeof evaluateStudioExpression>[1]): unknown {
  const result = evaluateStudioExpression(expression, input);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function compileActions(
  rules: readonly StudioLogicRule[] | undefined,
  options: CompileOptions,
): readonly StudioLogicRule[] {
  if (rules === undefined) return [];
  return rules.map((rule, ruleIndex) => ({
    ...rule,
    actions: rule.actions.filter((action, actionIndex) => {
      if (action.target.kind === "event-target" || options.pathsByUid.has(action.target.uid)) return true;
      options.onIssue({
        code: "compiler.invalid-patch-target",
        message: `Patch target ${action.target.uid} does not resolve to a runtime data node.`,
        ruleIndex,
        actionIndex,
        targetUid: action.target.uid,
      });
      return false;
    }),
  }));
}

function patchesFor(
  actions: readonly StudioPatchAction[],
  pathsByUid: ReadonlyMap<Uid, DataPath>,
  eventPath: DataPath,
  input: Parameters<typeof evaluateStudioExpression>[1],
): readonly StagesPatch[] {
  const patches: StagesPatch[] = [];
  for (const action of actions) {
    const path = resolveStudioPatchPath(action.target, pathsByUid, eventPath);
    if (path === undefined) continue;
    if (action.op === "remove") patches.push({ op: "remove", path });
    else patches.push({ op: "set", path, value: expressionValue(action.value, input) });
  }
  return patches;
}

export function compileStudioTransforms(
  rules: readonly StudioLogicRule[] | undefined,
  options: CompileOptions,
): readonly TransformConfig<unknown, unknown>[] {
  return compileActions(rules, options).map((rule) => ({
    on: rule.on,
    ...(rule.when === undefined ? {} : {
      when: (context: TransformContext<unknown, unknown>) => expressionValue(rule.when!, {
        value: context.value,
        row: context.parentValue,
        context: context.context,
        extensions: context.meta.extensions,
        metadata: context.meta,
        event: context.event,
      }) === true,
    }),
    apply: (context: TransformContext<unknown, unknown>) => patchesFor(rule.actions, options.pathsByUid, context.path, {
      value: context.value,
      row: context.parentValue,
      context: context.context,
      extensions: context.meta.extensions,
      metadata: context.meta,
      event: context.event,
    }),
  }));
}

export function compileStudioReducer(
  rules: readonly StudioLogicRule[] | undefined,
  fallback: FieldEventReducer<unknown> | undefined,
  options: CompileOptions,
): FieldEventReducer<unknown> | undefined {
  const compiled = compileActions(rules, options);
  if (compiled.length === 0) return fallback;
  return (context) => {
    for (const rule of compiled) {
      if (!matches(rule.on, context.event.name)) continue;
      const input = { value: context.value, row: context.value, event: context.event };
      if (rule.when !== undefined && expressionValue(rule.when, input) !== true) continue;
      return { patches: patchesFor(rule.actions, options.pathsByUid, context.path, input) };
    }
    return fallback?.(context);
  };
}
