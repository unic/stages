import type { DataPath, StagesSnapshot, ValidationIssue, ValidationSnapshot } from "@stages/core";
import type { StudioSourceMap } from "../compiler/types";
import type { Uid } from "../document/types";
import { studioRuntimePathKey } from "../compiler/source-map";

export interface StudioValidationIssueInspection {
  readonly issue: ValidationIssue;
  /** Studio entity targeted by the issue path, when source mapping is possible. */
  readonly targetUid?: Uid;
  readonly visible: boolean;
}

export interface StudioValidationInspection {
  readonly status: ValidationSnapshot["status"];
  readonly pendingCount: number;
  readonly unknownCount: number;
  readonly issues: readonly StudioValidationIssueInspection[];
}

function targetUidForPath(path: DataPath, sourceMap: StudioSourceMap): Uid | undefined {
  const exact = sourceMap.uidByPath.get(studioRuntimePathKey(path));
  if (exact !== undefined) return exact;
  if (!path.some((segment) => typeof segment === "number")) return undefined;
  return sourceMap.uidByPath.get(studioRuntimePathKey(path.filter((segment) => typeof segment !== "number")));
}

export function inspectStudioValidation(snapshot: StagesSnapshot<unknown>, sourceMap: StudioSourceMap): StudioValidationInspection {
  const visible = new Set(snapshot.validation.visibleIssues);
  return {
    status: snapshot.validation.status,
    pendingCount: snapshot.validation.pendingCount,
    unknownCount: snapshot.validation.unknownCount,
    issues: snapshot.validation.issues.map((issue) => {
      const targetUid = targetUidForPath(issue.path, sourceMap);
      return { issue, visible: visible.has(issue), ...(targetUid === undefined ? {} : { targetUid }) };
    }),
  };
}

export function firstVisibleErrorPath(validation: ValidationSnapshot): DataPath | undefined {
  return validation.visibleIssues.find(({ severity }) => severity === "error")?.path;
}

export function focusFirstVisibleValidationError(root: ParentNode): boolean {
  for (const candidate of root.querySelectorAll<HTMLElement>("[aria-invalid='true']")) {
    if (candidate.hidden || candidate.closest("[hidden],[aria-hidden='true']") !== null || candidate.matches(":disabled")) continue;
    candidate.focus();
    return true;
  }
  return false;
}
