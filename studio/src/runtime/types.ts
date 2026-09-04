import type {
  StagesChange,
  StagesController,
  StagesExtensionCodec,
  StagesSnapshot,
  StagesStateMigration,
  StagesValueCodec,
  ValidationFailureIssueFactory,
} from "@stages/core";
import type { CompiledStudioForm, StudioDiagnostic, StudioFieldRegistry } from "../compiler/types";
import type { JsonObject } from "../document";

export type StudioPreviewController = StagesController<unknown, StudioFieldRegistry, unknown>;
export type StudioPreviewSnapshot = StagesSnapshot<unknown>;

export interface StudioRuntimeDiagnostic extends Omit<StudioDiagnostic, "source"> {
  readonly source: "runtime";
}

export type StudioTelemetryEvent =
  | Readonly<{ name: "preview.proposal"; transactionId: number; eventCount: number; patchCount: number }>
  | Readonly<{ name: "preview.proposal-accepted"; transactionId: number }>
  | Readonly<{ name: "preview.proposal-rejected"; transactionId: number }>
  | Readonly<{ name: "preview.diagnostic"; code: string; severity: StudioRuntimeDiagnostic["severity"] }>
  | Readonly<{ name: "preview.recreated" }>;

/** Optional trusted-host port. Telemetry receives metadata only, never values, payloads, or credentials. */
export interface StudioTelemetryPort {
  emit(event: StudioTelemetryEvent): void;
}

export interface StudioPreviewCallbacks {
  readonly onProposal?: (proposal: StagesChange<unknown>) => void;
  readonly onDiagnostic?: (diagnostic: StudioRuntimeDiagnostic) => void;
  readonly onControllerChange?: (controller: StudioPreviewController) => void;
  readonly telemetry?: StudioTelemetryPort;
}

export interface StudioPreviewCreationOptions {
  readonly codec?: StagesValueCodec<unknown>;
  readonly migrations?: readonly StagesStateMigration[];
  readonly extensionCodecs?: Readonly<Record<string, StagesExtensionCodec>>;
  readonly validationFailureIssue?: ValidationFailureIssueFactory;
}

export interface StudioPreviewHostOptions extends StudioPreviewCallbacks, StudioPreviewCreationOptions {
  readonly compiled: CompiledStudioForm;
  readonly value: unknown;
  readonly context?: JsonObject;
  readonly extensions?: JsonObject;
}

export interface StudioPreviewHostUpdate extends StudioPreviewCallbacks, StudioPreviewCreationOptions {
  readonly compiled: CompiledStudioForm;
  readonly value: unknown;
  readonly context?: JsonObject;
  readonly extensions?: JsonObject;
}

export interface StudioPreviewHost {
  readonly controller: StudioPreviewController;
  readonly canonicalValue: unknown;
  readonly pendingProposal: StagesChange<unknown> | undefined;
  readonly acceptedRevision: number;
  readonly destroyed: boolean;
  getSnapshot(): StudioPreviewSnapshot;
  getDiagnostics(): readonly StudioRuntimeDiagnostic[];
  subscribe(listener: () => void): () => void;
  update(input: StudioPreviewHostUpdate): void;
  setCallbacks(callbacks: StudioPreviewCallbacks): void;
  acceptProposal(transactionId: number, replacementValue?: unknown): boolean;
  rejectProposal(transactionId: number): boolean;
  replaceValue(value: unknown): void;
  destroy(): void;
}

export interface UseStudioPreviewHostResult {
  readonly host: StudioPreviewHost;
  readonly controller: StudioPreviewController;
  readonly snapshot: StudioPreviewSnapshot;
  readonly diagnostics: readonly StudioRuntimeDiagnostic[];
}
