import type { DataPath, NodeAddress, RenderNodeSnapshot, StagesChange, StagesSnapshot } from "@stages/core";
import type { StudioDiagnostic } from "../compiler";
import type { JsonValue, Uid } from "../document";
import type { StudioRuntimeDiagnostic } from "./types";

export type StudioProblem = StudioDiagnostic | StudioRuntimeDiagnostic;
export type StudioProblemGroupBy = "entity" | "form" | "severity" | "source";

export interface StudioProblemFilters {
  readonly source?: StudioProblem["source"] | "all";
  readonly severity?: StudioProblem["severity"] | "all";
  readonly formUid?: Uid | "all";
  readonly entityUid?: Uid | "all";
}

export interface StudioProblemGroup {
  readonly key: string;
  readonly label: string;
  readonly problems: readonly StudioProblem[];
}

export interface StudioRuntimeOccurrence {
  readonly kind: RenderNodeSnapshot["kind"];
  readonly id: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly rowKey?: string;
  readonly activeStage?: string;
}

export interface StudioRuntimeInspection {
  readonly stale: boolean;
  readonly revision: number;
  readonly acceptedRevision: number;
  readonly validation: StagesSnapshot<unknown>["validation"];
  readonly activeStages: readonly StudioRuntimeOccurrence[];
  readonly rows: readonly StudioRuntimeOccurrence[];
  readonly occurrences: readonly StudioRuntimeOccurrence[];
}

export interface StudioSupportReportInput {
  readonly project: { readonly uid: Uid; readonly title: string };
  readonly form: { readonly uid: Uid; readonly title: string; readonly schemaId: string; readonly schemaVersion: number };
  readonly snapshot: StagesSnapshot<unknown>;
  readonly acceptedRevision: number;
  readonly canonicalValue: unknown;
  readonly pendingProposal?: StagesChange<unknown>;
  readonly lastTransaction?: StagesChange<unknown>;
  readonly problems: readonly StudioProblem[];
  readonly context?: unknown;
  readonly extensions?: unknown;
}

function groupKey(problem: StudioProblem, groupBy: StudioProblemGroupBy): string {
  if (groupBy === "form") return problem.formUid ?? "unassigned";
  if (groupBy === "entity") return problem.entityUid ?? problem.formUid ?? "unassigned";
  return problem[groupBy];
}

export function filterAndGroupStudioProblems(
  problems: readonly StudioProblem[],
  filters: StudioProblemFilters = {},
  groupBy: StudioProblemGroupBy = "source",
): readonly StudioProblemGroup[] {
  const filtered = problems.filter((problem) => (
    (filters.source === undefined || filters.source === "all" || problem.source === filters.source)
    && (filters.severity === undefined || filters.severity === "all" || problem.severity === filters.severity)
    && (filters.formUid === undefined || filters.formUid === "all" || problem.formUid === filters.formUid)
    && (filters.entityUid === undefined || filters.entityUid === "all" || problem.entityUid === filters.entityUid)
  ));
  const groups = new Map<string, StudioProblem[]>();
  for (const problem of filtered) {
    const key = groupKey(problem, groupBy);
    groups.set(key, [...(groups.get(key) ?? []), problem]);
  }
  return [...groups].map(([key, grouped]) => ({ key, label: key === "unassigned" ? `No ${groupBy}` : key, problems: grouped }));
}

function runtimeOccurrences(nodes: readonly RenderNodeSnapshot[]): readonly StudioRuntimeOccurrence[] {
  const occurrences: StudioRuntimeOccurrence[] = [];
  const visit = (node: RenderNodeSnapshot) => {
    occurrences.push({
      kind: node.kind,
      id: node.id,
      path: node.path,
      address: node.address,
      ...(node.kind === "row" ? { rowKey: node.id } : {}),
      ...(node.kind === "wizard" && node.activeStage !== undefined ? { activeStage: node.activeStage } : {}),
    });
    if (node.kind !== "field") node.nodes.forEach(visit);
  };
  nodes.forEach(visit);
  return occurrences;
}

export function inspectStudioRuntime(
  snapshot: StagesSnapshot<unknown>,
  acceptedRevision: number,
  pendingProposal?: StagesChange<unknown>,
): StudioRuntimeInspection {
  const occurrences = runtimeOccurrences(snapshot.nodes);
  return {
    stale: pendingProposal !== undefined || snapshot.revision !== acceptedRevision,
    revision: snapshot.revision,
    acceptedRevision,
    validation: snapshot.validation,
    activeStages: occurrences.filter((occurrence) => occurrence.activeStage !== undefined),
    rows: occurrences.filter((occurrence) => occurrence.kind === "row"),
    occurrences,
  };
}

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /(?:authorization|cookie|credential|password|secret|token|api[-_]?key|session)/i;

function redactedJson(value: unknown, key = "", seen = new WeakSet<object>()): JsonValue {
  if (SENSITIVE_KEY.test(key)) return REDACTED;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value !== "object") return `[${typeof value}]`;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactedJson(item, "", seen));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [childKey, redactedJson(child, childKey, seen)]));
}

/** Creates deterministic, JSON-safe support text with common secret-bearing keys redacted. */
export function createStudioSupportReport(input: StudioSupportReportInput): string {
  const inspection = inspectStudioRuntime(input.snapshot, input.acceptedRevision, input.pendingProposal);
  return JSON.stringify(redactedJson({
    format: "stages-studio-support",
    formatVersion: 1,
    project: input.project,
    form: input.form,
    runtime: inspection,
    canonicalValue: input.canonicalValue,
    context: input.context,
    extensions: input.extensions,
    pendingTransaction: input.pendingProposal,
    lastTransaction: input.lastTransaction,
    problems: input.problems,
  }), null, 2);
}
