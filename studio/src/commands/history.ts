import type { StudioProjectDocument, Uid } from "../document";
import { executeStudioCommand } from "./engine";
import type {
  StudioCommand,
  StudioHistoryDispatchOptions,
  StudioHistoryEntry,
  StudioHistoryResult,
  StudioHistoryState,
} from "./types";

export const DEFAULT_HISTORY_CHECKPOINTS = 100;

export function createStudioHistory(
  project: StudioProjectDocument,
  options: { readonly maxCheckpoints?: number; readonly saved?: boolean } = {},
): StudioHistoryState {
  const maxCheckpoints = options.maxCheckpoints ?? DEFAULT_HISTORY_CHECKPOINTS;
  if (!Number.isSafeInteger(maxCheckpoints) || maxCheckpoints < 1) {
    throw new RangeError("maxCheckpoints must be a positive integer.");
  }
  return {
    present: project,
    past: [],
    future: [],
    revision: 0,
    savedRevision: options.saved === false ? -1 : 0,
    nextRevision: 1,
    maxCheckpoints,
  };
}

export function isStudioHistoryDirty(history: StudioHistoryState): boolean {
  return history.revision !== history.savedRevision;
}

export function markStudioHistorySaved(history: StudioHistoryState): StudioHistoryState {
  return history.savedRevision === history.revision ? history : { ...history, savedRevision: history.revision };
}

function combinedUids(first: readonly Uid[], second: readonly Uid[]): readonly Uid[] {
  return [...new Set([...first, ...second])];
}

export function dispatchStudioCommand(
  history: StudioHistoryState,
  command: StudioCommand,
  options: StudioHistoryDispatchOptions = {},
): StudioHistoryResult {
  const result = executeStudioCommand(history.present, command);
  if (!result.ok) return { ok: false, history, failure: result.failure };
  if (!result.changed) return { ok: true, history, affectedUids: [], changed: false };
  const label = options.label ?? (command.type === "transaction" ? command.label : command.type);
  const coalesceKey = options.coalesceKey === undefined || (command.type !== "node.update" && command.type !== "form.update")
    ? undefined
    : command.type === "node.update"
      ? `${command.formUid}:${command.uid}:${Object.keys(command.changes).sort().join(",")}:${options.coalesceKey}`
      : `${command.formUid}:form:${Object.keys(command.changes).sort().join(",")}:${options.coalesceKey}`;
  const previous = history.past.at(-1);
  const canCoalesce = coalesceKey !== undefined
    && previous?.coalesceKey === coalesceKey
    && history.future.length === 0
    && previous.afterRevision === history.revision
    && history.savedRevision !== history.revision;
  const afterRevision = history.nextRevision;
  let past: readonly StudioHistoryEntry[];
  if (canCoalesce && previous) {
    const entry: StudioHistoryEntry = {
      ...previous,
      label,
      after: result.document,
      afterRevision,
      affectedUids: combinedUids(previous.affectedUids, result.affectedUids),
    };
    past = [...history.past.slice(0, -1), entry];
  } else {
    const entry: StudioHistoryEntry = {
      label,
      before: history.present,
      after: result.document,
      beforeRevision: history.revision,
      afterRevision,
      affectedUids: result.affectedUids,
      ...(coalesceKey === undefined ? {} : { coalesceKey }),
    };
    past = [...history.past, entry];
  }
  if (past.length > history.maxCheckpoints) past = past.slice(-history.maxCheckpoints);
  return {
    ok: true,
    history: {
      ...history,
      present: result.document,
      past,
      future: [],
      revision: afterRevision,
      nextRevision: afterRevision + 1,
    },
    affectedUids: result.affectedUids,
    changed: true,
  };
}

export function undoStudioHistory(history: StudioHistoryState): StudioHistoryState {
  const entry = history.past.at(-1);
  if (!entry) return history;
  return {
    ...history,
    present: entry.before,
    past: history.past.slice(0, -1),
    future: [entry, ...history.future],
    revision: entry.beforeRevision,
  };
}

export function redoStudioHistory(history: StudioHistoryState): StudioHistoryState {
  const entry = history.future[0];
  if (!entry) return history;
  return {
    ...history,
    present: entry.after,
    past: [...history.past, entry].slice(-history.maxCheckpoints),
    future: history.future.slice(1),
    revision: entry.afterRevision,
  };
}
