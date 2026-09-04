import type { DataPath, NodeAddress, StagesSchema } from "@stages/core";
import type { JsonObject, StudioNode, Uid } from "../document";
import type { StudioFieldRegistry } from "../registry";

export type { StudioFieldRegistry } from "../registry";

export interface StudioDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning" | "info";
  readonly source: "compiler";
  readonly message: string;
  readonly formUid?: Uid;
  readonly entityUid?: Uid;
  readonly propertyPath?: readonly (number | string)[];
  readonly runtimePath?: DataPath;
  readonly runtimeAddress?: NodeAddress;
  readonly helpId?: string;
}

export interface StudioSourceMapEntry {
  readonly uid: Uid;
  readonly runtimePath: DataPath;
  readonly runtimeAddress: NodeAddress;
}

export interface StudioSourceMap {
  readonly byUid: ReadonlyMap<Uid, StudioSourceMapEntry>;
  readonly uidByPath: ReadonlyMap<string, Uid>;
  readonly uidByAddress: ReadonlyMap<string, Uid>;
}

export interface StudioRenderNode {
  readonly uid: Uid;
  readonly kind: Extract<StudioNode["kind"], "field" | "group">;
  readonly runtimePath: DataPath;
  readonly runtimeAddress: NodeAddress;
  readonly presentation: JsonObject;
  readonly children: readonly StudioRenderNode[];
}

export interface StudioRenderPlan {
  readonly formUid: Uid;
  readonly nodes: readonly StudioRenderNode[];
}

export interface CompiledStudioForm {
  readonly schema: StagesSchema<unknown, StudioFieldRegistry, unknown>;
  readonly fields: StudioFieldRegistry;
  readonly renderPlan: StudioRenderPlan;
  readonly sourceMap: StudioSourceMap;
  readonly diagnostics: readonly StudioDiagnostic[];
}
