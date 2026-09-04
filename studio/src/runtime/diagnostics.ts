import type { Diagnostic, NodeAddress } from "@stages/core";
import { studioRuntimeAddressKey, studioRuntimePathKey } from "../compiler/source-map";
import type { StudioSourceMap } from "../compiler/types";
import type { StudioRuntimeDiagnostic } from "./types";
import type { Uid } from "../document";

function schemaAddress(address: NodeAddress): NodeAddress {
  return address.filter((segment) => segment.kind !== "row");
}

export function translateStudioRuntimeDiagnostic(
  diagnostic: Diagnostic,
  sourceMap: StudioSourceMap,
  formUid?: Uid,
): StudioRuntimeDiagnostic {
  const addressUid = sourceMap.uidByAddress.get(studioRuntimeAddressKey(diagnostic.address))
    ?? sourceMap.uidByAddress.get(studioRuntimeAddressKey(schemaAddress(diagnostic.address)));
  const pathUid = sourceMap.uidByPath.get(studioRuntimePathKey(diagnostic.path))
    ?? sourceMap.uidByPath.get(studioRuntimePathKey(diagnostic.path.filter((segment) => typeof segment !== "number")));
  const entityUid = addressUid ?? pathUid;
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    source: "runtime",
    message: diagnostic.message,
    runtimePath: diagnostic.path,
    runtimeAddress: diagnostic.address,
    ...(formUid === undefined ? {} : { formUid }),
    ...(entityUid === undefined ? {} : { entityUid }),
  };
}
