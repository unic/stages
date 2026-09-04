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
  readonly validators?: readonly StudioValidatorSpec[];
}

export interface StudioGroupNode extends StudioNodeBase {
  readonly kind: "group";
  readonly runtimeId: string;
  readonly childUids: readonly Uid[];
}

export interface StudioCollectionNode extends StudioNodeBase {
  readonly kind: "collection";
  readonly runtimeId: string;
  readonly childUids: readonly Uid[];
  readonly min?: number;
  readonly max?: number;
  readonly initialRows?: number;
}

export interface StudioWizardNode extends StudioNodeBase {
  readonly kind: "wizard";
  readonly runtimeId: string;
  readonly stageUids: readonly Uid[];
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

export interface StudioValidatorSpec {
  readonly kind: "required";
  readonly message: string;
}

export type StudioNode = StudioBlockNode | StudioCollectionNode | StudioFieldNode
  | StudioGroupNode | StudioStageNode | StudioWizardNode;

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
  /** Reserved for the explicit fragment model introduced by its own slice. */
  readonly fragments: JsonObject;
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
