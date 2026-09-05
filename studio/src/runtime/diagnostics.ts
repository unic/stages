import type { Diagnostic } from "@stages/core";
import { resolveStudioSourceEntry } from "../compiler/source-map";
import type { StudioSourceMap } from "../compiler/types";
import type { StudioRuntimeDiagnostic } from "./types";
import type { Uid } from "../document";

export function translateStudioRuntimeDiagnostic(
  diagnostic: Diagnostic,
  sourceMap: StudioSourceMap,
  formUid?: Uid,
  value?: unknown,
): StudioRuntimeDiagnostic {
  const entry = resolveStudioSourceEntry(sourceMap, diagnostic.path, value, diagnostic.address);
  const entityUid = entry?.uid;
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    source: "runtime",
    message: diagnostic.message,
    runtimePath: diagnostic.path,
    runtimeAddress: diagnostic.address,
    ...(formUid === undefined ? {} : { formUid }),
    ...(entityUid === undefined ? {} : { entityUid }),
    ...(entry?.fragmentDefinitionUid === undefined ? {} : { fragmentDefinitionUid: entry.fragmentDefinitionUid }),
    ...(entry?.fragmentNodeUid === undefined ? {} : { fragmentNodeUid: entry.fragmentNodeUid }),
    ...(entry?.fragmentInstanceUids === undefined ? {} : { fragmentInstanceUids: entry.fragmentInstanceUids }),
  };
}
