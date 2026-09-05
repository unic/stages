import type { DataPath, NodeAddress, StagesSchema, StagesSchemaInput } from "@stages/core";
import type { JsonObject, StudioFormDocument, StudioNode, Uid } from "../document/index.js";
import type {
  StudioBlockKey,
  StudioFieldRegistry,
  StudioLayoutSpec,
  StudioThemeTokens,
} from "../registry/index.js";
import type { StudioAsyncServiceBindings } from "../registry/index.js";
import type { StudioLocalizationOptions } from "../localization/index.js";

export type { StudioFieldRegistry } from "../registry/index.js";

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

export interface StudioSourceVariant {
  readonly collectionPath: DataPath;
  readonly discriminator: string;
  readonly variantId: string;
}

export interface StudioSourceMapEntry {
  readonly uid: Uid;
  readonly variants?: readonly StudioSourceVariant[];
  readonly runtimePath: DataPath;
  readonly runtimeAddress: NodeAddress;
  readonly fragmentDefinitionUid?: Uid;
  readonly fragmentNodeUid?: Uid;
  readonly fragmentInstanceUids?: readonly Uid[];
}

export interface StudioSourceMap {
  readonly entriesByPath: ReadonlyMap<string, readonly StudioSourceMapEntry[]>;
  readonly entriesByAddress: ReadonlyMap<string, readonly StudioSourceMapEntry[]>;
  readonly byUid: ReadonlyMap<Uid, StudioSourceMapEntry>;
  /** Only unqualified, unambiguous definitions; use occurrence resolution for variants. */
  readonly uidByPath: ReadonlyMap<string, Uid>;
  /** Only unqualified, unambiguous definitions; use occurrence resolution for variants. */
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
  readonly schemaInput: StagesSchemaInput<unknown, StudioFieldRegistry, unknown>;
  readonly fields: StudioFieldRegistry;
  readonly renderPlan: StudioRenderPlan;
  readonly sourceMap: StudioSourceMap;
  readonly diagnostics: readonly StudioDiagnostic[];
}

export interface StudioCompileOptions {
  readonly customFields?: readonly import("../fields.js").ResolvedPortableField[];
  readonly serviceBindings?: StudioAsyncServiceBindings;
  readonly localization?: StudioLocalizationOptions;
}
