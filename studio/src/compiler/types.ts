import type { DataPath, NodeAddress, StagesSchema } from "@stages/core";
import type { JsonObject, StudioFormDocument, StudioNode, Uid } from "../document";
import type {
  StudioBlockKey,
  StudioFieldRegistry,
  StudioLayoutSpec,
  StudioThemeTokens,
} from "../registry";

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
  readonly fragmentDefinitionUid?: Uid;
  readonly fragmentNodeUid?: Uid;
  readonly fragmentInstanceUids?: readonly Uid[];
}

export interface StudioSourceMapEntry {
  readonly uid: Uid;
  readonly runtimePath: DataPath;
  readonly runtimeAddress: NodeAddress;
  readonly fragmentDefinitionUid?: Uid;
  readonly fragmentNodeUid?: Uid;
  readonly fragmentInstanceUids?: readonly Uid[];
}

export interface StudioSourceMap {
  readonly byUid: ReadonlyMap<Uid, StudioSourceMapEntry>;
  readonly uidByPath: ReadonlyMap<string, Uid>;
  readonly uidByAddress: ReadonlyMap<string, Uid>;
}

interface StudioRenderNodeBase {
  readonly uid: Uid;
  readonly presentation: JsonObject;
  readonly layout: StudioLayoutSpec;
  readonly hidden: boolean;
  readonly children: readonly StudioRenderNode[];
}

export type StudioRuntimeRenderKind = Exclude<StudioNode["kind"], "block" | "fragment">;

export interface StudioRuntimeRenderNode<TKind extends StudioRuntimeRenderKind = StudioRuntimeRenderKind> extends StudioRenderNodeBase {
  readonly kind: TKind;
  readonly runtimePath: DataPath;
  readonly runtimeAddress: NodeAddress;
}

export interface StudioBlockRenderNode extends StudioRenderNodeBase {
  readonly kind: "block";
  readonly definition: StudioBlockKey;
  readonly props: JsonObject;
}

export type StudioRenderNode = StudioBlockRenderNode | {
  readonly [TKind in StudioRuntimeRenderKind]: StudioRuntimeRenderNode<TKind>;
}[StudioRuntimeRenderKind];

export interface StudioRenderPlan {
  readonly formUid: Uid;
  readonly theme: StudioThemeTokens;
  readonly nodes: readonly StudioRenderNode[];
}

export interface CompiledStudioForm {
  /** Ephemeral ordinary-node graph used by the preview after fragment expansion. */
  readonly expandedForm: StudioFormDocument;
  readonly schema: StagesSchema<unknown, StudioFieldRegistry, unknown>;
  readonly fields: StudioFieldRegistry;
  readonly renderPlan: StudioRenderPlan;
  readonly sourceMap: StudioSourceMap;
  readonly diagnostics: readonly StudioDiagnostic[];
}
