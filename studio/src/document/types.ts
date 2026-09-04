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

export type StudioEventPolicy = string | readonly string[];

export type StudioPatchTarget =
  | { readonly kind: "event-target" }
  | { readonly kind: "node"; readonly uid: Uid };

export type StudioPatchAction =
  | { readonly op: "set"; readonly target: StudioPatchTarget; readonly value: StudioExpression }
  | { readonly op: "remove"; readonly target: StudioPatchTarget };

export interface StudioLogicRule {
  readonly id: string;
  readonly on: StudioEventPolicy;
  readonly when?: StudioExpression;
  readonly actions: readonly StudioPatchAction[];
}

export interface StudioEventDefinition {
  readonly id: string;
  readonly title: string;
  readonly name: string;
  readonly target: { readonly kind: "form" } | { readonly kind: "node"; readonly uid: Uid };
  readonly payload?: StudioExpression;
  readonly source?: "user" | "adapter" | "system";
}

interface StudioNodeBase {
  readonly uid: Uid;
  readonly presentation?: JsonObject;
  readonly behavior?: StudioNodeBehavior;
  readonly legacy?: JsonObject;
}

interface StudioValidatedNodeBase extends StudioNodeBase {
  readonly validators?: readonly StudioValidatorSpec[];
  readonly transforms?: readonly StudioLogicRule[];
}

export interface StudioFieldNode extends StudioValidatedNodeBase {
  readonly kind: "field";
  readonly runtimeId: string;
  readonly definition: StudioDefinitionRef;
  readonly props: JsonObject;
  readonly computed?: StudioExpression;
  readonly derivedProps?: Readonly<Record<string, StudioExpression>>;
  readonly reducers?: readonly StudioLogicRule[];
}

export interface StudioGroupNode extends StudioValidatedNodeBase {
  readonly kind: "group";
  readonly runtimeId: string;
  readonly childUids: readonly Uid[];
}

export type StudioCollectionItemKey =
  | { readonly kind: "index" }
  | { readonly kind: "property"; readonly property: string };

interface StudioCollectionNodeBase extends StudioValidatedNodeBase {
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

export interface StudioWizardNode extends StudioValidatedNodeBase {
  readonly kind: "wizard";
  readonly runtimeId: string;
  readonly stageUids: readonly Uid[];
  readonly initialStageUid?: Uid;
  readonly navigation?: {
    readonly validateCurrent?: boolean;
    readonly nonLinear?: boolean;
    /** Safe synchronous transition policy. The event scope exposes `from` and `to`. */
    readonly guard?: StudioExpression;
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
export interface StudioFragmentInstanceNode extends StudioValidatedNodeBase {
  readonly kind: "fragment";
  readonly runtimeId: string;
  readonly fragmentUid: Uid;
  readonly overrides?: Readonly<Record<Uid, StudioFragmentNodeOverride>>;
}

export type StudioValidationSeverity = "error" | "warning";
export type StudioValidationEventPolicy = string | readonly string[];
export type StudioValidationPath = readonly (number | string)[];

export interface StudioLocalizedValidationMessage {
  readonly default: string;
  /** Locale keys are matched against `context.locale` in preview scenarios. */
  readonly translations?: Readonly<Record<string, string>>;
}

export type StudioServiceScenarioOutcome = "pending" | "success" | "failure" | "stale" | "cancelled";

/** Deterministic local-preview behavior. Transport and credential configuration never belongs here. */
export interface StudioServiceScenario {
  readonly outcome: StudioServiceScenarioOutcome;
  readonly code?: string;
  readonly message?: string;
  readonly severity?: StudioValidationSeverity;
}

interface StudioValidatorBase {
  /** Optional only for compatibility with early document-v1 required rules. */
  readonly id?: string;
  readonly code?: string;
  readonly on?: StudioValidationEventPolicy;
  readonly revealOn?: StudioValidationEventPolicy;
  readonly severity?: StudioValidationSeverity;
  readonly message?: string | StudioLocalizedValidationMessage;
  readonly when?: StudioExpression;
  readonly includeDisabled?: boolean;
  readonly dependencies?: readonly StudioValidationPath[];
  /** Defaults to the validator owner's path. */
  readonly issuePath?: StudioValidationPath;
}

export type StudioValidatorSpec = StudioValidatorBase & (
  | { readonly kind: "required" }
  | { readonly kind: "length"; readonly min?: number; readonly max?: number }
  | { readonly kind: "range"; readonly min?: number; readonly max?: number }
  | { readonly kind: "pattern"; readonly pattern: string; readonly flags?: string }
  | {
      readonly kind: "comparison";
      readonly operator: "===" | "!==" | "<" | "<=" | ">" | ">=";
      readonly other: StudioExpression;
    }
  | {
      readonly kind: "collection";
      readonly min?: number;
      readonly max?: number;
      readonly uniqueBy?: readonly string[];
    }
  | {
      readonly kind: "service";
      /** Resolves only through a trusted environment registry outside the project document. */
      readonly service: StudioDefinitionRef;
      /** Defaults to the validator owner's current field value. */
      readonly request?: StudioExpression;
    }
);

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
  /** JSON-safe deterministic preview responses keyed by async-service name. */
  readonly services?: Readonly<Record<string, StudioServiceScenario>>;
}

export interface StudioFormDocument {
  readonly uid: Uid;
  readonly title: string;
  readonly runtime: { readonly schemaId: string; readonly schemaVersion: number };
  readonly rootNodeUids: readonly Uid[];
  readonly nodes: Readonly<Record<Uid, StudioNode>>;
  readonly validators?: readonly StudioValidatorSpec[];
  readonly events?: readonly StudioEventDefinition[];
  readonly transforms?: readonly StudioLogicRule[];
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
