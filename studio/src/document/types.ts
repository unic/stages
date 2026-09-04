declare const uidBrand: unique symbol;

export type Uid = string & { readonly [uidBrand]: "Uid" };
export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject;
export interface JsonObject { readonly [key: string]: JsonValue; }

import type { StudioExpression } from "../expressions/types";

export interface StudioDefinitionRef {
  readonly key: string;
  readonly version: number;
}

export interface StudioNodeBehavior {
  readonly when?: StudioExpression;
  readonly disabled?: boolean | StudioExpression;
  /** Omits the node from factory output rather than retaining dormant identity. */
  readonly presentWhen?: StudioExpression;
}

interface StudioNodeBase {
  readonly uid: Uid;
  readonly presentation?: JsonObject;
  readonly behavior?: StudioNodeBehavior;
  readonly legacy?: JsonObject;
}

export interface StudioFieldNode extends StudioNodeBase {
  readonly kind: "field";
  readonly runtimeId: string;
  readonly definition: StudioDefinitionRef;
  readonly props: JsonObject;
  readonly computed?: StudioExpression;
  readonly derivedProps?: Readonly<Record<string, StudioExpression>>;
  readonly validators?: readonly StudioValidatorSpec[];
}

export interface StudioGroupNode extends StudioNodeBase {
  readonly kind: "group";
  readonly runtimeId: string;
  readonly childUids: readonly Uid[];
}

export type StudioCollectionItemKey =
  | { readonly kind: "index" }
  | { readonly kind: "property"; readonly property: string };

interface StudioCollectionNodeBase extends StudioNodeBase {
  readonly kind: "collection";
  readonly runtimeId: string;
  readonly min?: number;
  readonly max?: number;
  readonly initialRows?: number;
  readonly itemKey?: StudioCollectionItemKey;
}

export type StudioHomogeneousCollectionNode = StudioCollectionNodeBase & {
      readonly childUids: readonly Uid[];
      readonly discriminator?: never;
      readonly variantUids?: never;
    };

export type StudioVariantCollectionNode = StudioCollectionNodeBase & {
      readonly childUids?: never;
      readonly discriminator: string;
      readonly variantUids: readonly Uid[];
      /** Variant used only when Studio explicitly creates initial scenario rows. */
      readonly initialVariantUid?: Uid;
    };

export type StudioCollectionNode = StudioHomogeneousCollectionNode | StudioVariantCollectionNode;

export function isStudioVariantCollection(node: StudioCollectionNode): node is StudioVariantCollectionNode {
  return Array.isArray(node.variantUids);
}

export interface StudioVariantNode extends StudioNodeBase {
  readonly kind: "variant";
  /** Compiles to the discriminator value; it does not add a data-path segment. */
  readonly runtimeId: string;
  readonly childUids: readonly Uid[];
}

export interface StudioWizardNode extends StudioNodeBase {
  readonly kind: "wizard";
  readonly runtimeId: string;
  readonly stageUids: readonly Uid[];
  readonly initialStageUid?: Uid;
  readonly navigation?: {
    readonly validateCurrent?: boolean;
    readonly nonLinear?: boolean;
  };
}

export interface StudioStageNode extends StudioNodeBase {
  readonly kind: "stage";
  readonly runtimeId: string;
  readonly childUids: readonly Uid[];
}

export interface StudioBlockNode extends StudioNodeBase {
  readonly kind: "block";
  readonly definition: StudioDefinitionRef;
  readonly props: JsonObject;
}

export interface StudioFragmentNodeOverride {
  readonly runtimeId?: string;
  readonly props?: JsonObject;
  readonly presentation?: JsonObject;
}

/** A linked use of a reusable fragment. It compiles as an ordinary runtime group. */
export interface StudioFragmentInstanceNode extends StudioNodeBase {
  readonly kind: "fragment";
  readonly runtimeId: string;
  readonly fragmentUid: Uid;
  readonly overrides?: Readonly<Record<Uid, StudioFragmentNodeOverride>>;
}

export interface StudioValidatorSpec {
  readonly kind: "required";
  readonly message: string;
}

export type StudioNode = StudioBlockNode | StudioCollectionNode | StudioFieldNode
  | StudioFragmentInstanceNode | StudioGroupNode | StudioStageNode | StudioVariantNode | StudioWizardNode;

export interface StudioFragmentDefinition {
  readonly uid: Uid;
  readonly title: string;
  readonly version: number;
  readonly parameters: readonly string[];
  readonly rootNodeUids: readonly Uid[];
  readonly nodes: Readonly<Record<Uid, StudioNode>>;
}

export interface StudioScenario {
  readonly uid: Uid;
  readonly title: string;
  readonly value: JsonValue;
  readonly context?: JsonObject;
  readonly extensions?: JsonObject;
}

export interface StudioFormDocument {
  readonly uid: Uid;
  readonly title: string;
  readonly runtime: { readonly schemaId: string; readonly schemaVersion: number };
  readonly rootNodeUids: readonly Uid[];
  readonly nodes: Readonly<Record<Uid, StudioNode>>;
  readonly scenarios: readonly StudioScenario[];
  readonly settings: JsonObject;
}

export interface StudioProjectDocument {
  readonly format: "stages-studio";
  readonly formatVersion: 1;
  readonly project: { readonly uid: Uid; readonly title: string; readonly defaultLocale: string };
  readonly forms: Readonly<Record<Uid, StudioFormDocument>>;
  readonly fragments: Readonly<Record<Uid, StudioFragmentDefinition>>;
  /** JSON-safe resources only; executable definitions never live here. */
  readonly resources: JsonObject;
}

export type DiagnosticPath = readonly (number | string)[];
export interface StudioDocumentDiagnostic {
  readonly code: string;
  readonly severity: "error";
  readonly source: "document";
  readonly message: string;
  readonly propertyPath: DiagnosticPath;
  readonly formUid?: Uid;
  readonly entityUid?: Uid;
}

export interface StudioDocumentLimits {
  readonly maxBytes: number;
  readonly maxForms: number;
  readonly maxNodesPerForm: number;
  readonly maxNodesPerProject: number;
  readonly maxScenariosPerForm: number;
  readonly maxFragments: number;
  readonly maxNodesPerFragment: number;
  readonly maxDepth: number;
  readonly maxJsonDepth: number;
}

export interface StudioDocumentValidationOptions {
  readonly limits?: Partial<StudioDocumentLimits>;
  readonly supportedDefinitions?: Readonly<Record<string, readonly number[]>>;
}

export type StudioDocumentResult =
  | { readonly ok: true; readonly value: StudioProjectDocument; readonly migrations: readonly string[] }
  | { readonly ok: false; readonly diagnostics: readonly StudioDocumentDiagnostic[] };
