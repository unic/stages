import type { StudioProjectDocument, Uid } from "../document/types";

export interface LegacyStudioInput {
  readonly config: unknown;
  readonly fieldsets?: unknown;
  readonly generalConfig?: unknown;
  readonly value?: unknown;
}

export interface LegacyImportOptions {
  readonly fieldTypes: readonly string[];
  readonly blockTypes?: readonly string[];
  readonly projectUid?: Uid;
  readonly formUid?: Uid;
}

export interface LegacyImportDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly path: readonly (number | string)[];
  readonly entityUid?: Uid;
}

export type LegacyImportResult =
  | {
    readonly ok: true;
    readonly value: StudioProjectDocument;
    readonly diagnostics: readonly LegacyImportDiagnostic[];
  }
  | {
    readonly ok: false;
    readonly diagnostics: readonly LegacyImportDiagnostic[];
  };
