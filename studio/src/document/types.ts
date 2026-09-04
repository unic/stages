declare const uidBrand: unique symbol;

export type Uid = string & { readonly [uidBrand]: "Uid" };
export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject;
export interface JsonObject { readonly [key: string]: JsonValue; }

export interface StudioDefinitionRef {
  readonly key: string;
  readonly version: number;
}

interface StudioNodeBase {
  readonly uid: Uid;
  readonly runtimeId: string;
}

export interface StudioFieldNode extends StudioNodeBase {
  readonly kind: "field";
  readonly definition: StudioDefinitionRef;
  readonly props: JsonObject;
}

export interface StudioGroupNode extends StudioNodeBase {
  readonly kind: "group";
  readonly childUids: readonly Uid[];
}

export type StudioNode = StudioFieldNode | StudioGroupNode;

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
