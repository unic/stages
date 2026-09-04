import {
  stages,
  type Diagnostic,
  type JsonValue,
  type StagesChange,
  type SerializedStagesState,
} from "@stages/core";
import type { CompiledStudioForm, StudioFieldRegistry } from "../compiler/types";
import type { JsonObject } from "../document";
import { translateStudioRuntimeDiagnostic } from "./diagnostics";
import type {
  StudioPreviewCallbacks,
  StudioPreviewController,
  StudioPreviewCreationOptions,
  StudioPreviewHost,
  StudioPreviewHostOptions,
  StudioPreviewReset,
  StudioPreviewHostUpdate,
  StudioRuntimeDiagnostic,
  StudioTelemetryEvent,
} from "./types";

function callbacksFrom(input: StudioPreviewCallbacks): StudioPreviewCallbacks {
  return {
    ...(input.onProposal === undefined ? {} : { onProposal: input.onProposal }),
    ...(input.onDiagnostic === undefined ? {} : { onDiagnostic: input.onDiagnostic }),
    ...(input.onControllerChange === undefined ? {} : { onControllerChange: input.onControllerChange }),
    ...(input.telemetry === undefined ? {} : { telemetry: input.telemetry }),
  };
}

function creationFrom(input: StudioPreviewCreationOptions): StudioPreviewCreationOptions {
  return {
    ...(input.codec === undefined ? {} : { codec: input.codec }),
    ...(input.migrations === undefined ? {} : { migrations: input.migrations }),
    ...(input.extensionCodecs === undefined ? {} : { extensionCodecs: input.extensionCodecs }),
    ...(input.durableExtensionNamespaces === undefined ? {} : { durableExtensionNamespaces: input.durableExtensionNamespaces }),
    ...(input.validationFailureIssue === undefined ? {} : { validationFailureIssue: input.validationFailureIssue }),
  };
}

function creationChanged(
  previous: StudioPreviewCreationOptions,
  next: StudioPreviewCreationOptions,
): boolean {
  return previous.codec !== next.codec
    || !sameArray(previous.migrations, next.migrations)
    || !sameRecord(previous.extensionCodecs, next.extensionCodecs)
    || !sameArray(previous.durableExtensionNamespaces, next.durableExtensionNamespaces)
    || previous.validationFailureIssue !== next.validationFailureIssue;
}

function sameArray<T>(left: readonly T[] | undefined, right: readonly T[] | undefined): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function sameRecord(
  left: Readonly<object> | undefined,
  right: Readonly<object> | undefined,
): boolean {
  if (left === right) return true;
  const leftEntries = Object.entries(left ?? {});
  const rightEntries = Object.entries(right ?? {});
  const rightRecord = right as Readonly<Record<string, unknown>> | undefined;
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([key, value]) => rightRecord?.[key] === value);
}

const EMPTY_OBJECT: JsonObject = Object.freeze({});

class PreviewHost implements StudioPreviewHost {
  private controllerValue: StudioPreviewController;
  private compiledValue: CompiledStudioForm;
  private canonicalValueValue: unknown;
  private contextValue: JsonObject;
  private extensionsValue: JsonObject;
  private creationValue: StudioPreviewCreationOptions;
  private callbacksValue: StudioPreviewCallbacks;
  private pendingProposalValue: StagesChange<unknown> | undefined;
  private controllerUnsubscribe: (() => void) | undefined;
  private readonly listeners = new Set<() => void>();
  private destroyedValue = false;
  private acceptedRevisionValue = 0;

  constructor(options: StudioPreviewHostOptions) {
    this.compiledValue = options.compiled;
    this.canonicalValueValue = options.value;
    this.contextValue = options.context ?? EMPTY_OBJECT;
    this.extensionsValue = options.extensions ?? EMPTY_OBJECT;
    this.creationValue = creationFrom(options);
    this.callbacksValue = callbacksFrom(options);
    this.controllerValue = this.createController();
    this.acceptedRevisionValue = this.controllerValue.getSnapshot().revision;
    this.observeController();
  }

  get controller(): StudioPreviewController { return this.controllerValue; }
  get canonicalValue(): unknown { return this.canonicalValueValue; }
  get pendingProposal(): StagesChange<unknown> | undefined { return this.pendingProposalValue; }
  get acceptedRevision(): number { return this.acceptedRevisionValue; }
  get destroyed(): boolean { return this.destroyedValue; }

  getSnapshot = () => this.controllerValue.getSnapshot();

  getDiagnostics = (): readonly StudioRuntimeDiagnostic[] => this.controllerValue
    .getSnapshot()
    .diagnostics
    .map((diagnostic) => translateStudioRuntimeDiagnostic(
      diagnostic,
      this.compiledValue.sourceMap,
      this.compiledValue.renderPlan.formUid,
    ));

  subscribe = (listener: () => void): (() => void) => {
    if (this.destroyedValue) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setCallbacks(callbacks: StudioPreviewCallbacks): void {
    this.callbacksValue = callbacksFrom(callbacks);
  }

  update(input: StudioPreviewHostUpdate): void {
    if (this.destroyedValue) return;
    this.setCallbacks(input);
    const nextCreation = creationFrom(input);
    const recreate = !sameRecord(input.compiled.fields, this.compiledValue.fields)
      || creationChanged(this.creationValue, nextCreation);
    const previousCompiled = this.compiledValue;
    const previousValue = this.canonicalValueValue;
    const previousContext = this.contextValue;
    const previousExtensions = this.extensionsValue;
    this.compiledValue = input.compiled;
    this.canonicalValueValue = input.value;
    this.contextValue = input.context ?? EMPTY_OBJECT;
    this.extensionsValue = input.extensions ?? EMPTY_OBJECT;
    this.creationValue = nextCreation;
    if (!Object.is(input.value, previousValue)) this.pendingProposalValue = undefined;

    if (recreate) {
      this.replaceController();
      return;
    }
    const dynamic: {
      value?: unknown;
      context?: unknown;
      schema?: CompiledStudioForm["schemaInput"];
      extensions?: Readonly<Record<string, unknown>>;
    } = {};
    if (!Object.is(input.value, previousValue)) dynamic.value = input.value;
    if (!Object.is(this.contextValue, previousContext)) dynamic.context = this.contextValue;
    if (input.compiled.schemaInput !== previousCompiled.schemaInput) dynamic.schema = input.compiled.schemaInput;
    if (this.extensionsValue !== previousExtensions) dynamic.extensions = this.extensionsValue;
    if (Object.keys(dynamic).length > 0) {
      this.controllerValue.update(dynamic);
      if (dynamic.value !== undefined) this.acceptedRevisionValue = this.controllerValue.getSnapshot().revision;
    }
  }

  acceptProposal(transactionId: number, replacementValue?: unknown): boolean {
    if (this.destroyedValue || this.pendingProposalValue?.transactionId !== transactionId) return false;
    const value = arguments.length >= 2 ? replacementValue : this.pendingProposalValue.value;
    this.pendingProposalValue = undefined;
    this.canonicalValueValue = value;
    this.controllerValue.update({ value });
    this.acceptedRevisionValue = this.controllerValue.getSnapshot().revision;
    this.emitTelemetry({ name: "preview.proposal-accepted", transactionId });
    return true;
  }

  rejectProposal(transactionId: number): boolean {
    if (this.destroyedValue || this.pendingProposalValue?.transactionId !== transactionId) return false;
    this.pendingProposalValue = undefined;
    this.controllerValue.update({ value: this.canonicalValueValue });
    this.acceptedRevisionValue = this.controllerValue.getSnapshot().revision;
    this.emitTelemetry({ name: "preview.proposal-rejected", transactionId });
    return true;
  }

  replaceValue(value: unknown): void {
    if (this.destroyedValue) return;
    this.pendingProposalValue = undefined;
    this.canonicalValueValue = value;
    this.controllerValue.update({ value });
    this.acceptedRevisionValue = this.controllerValue.getSnapshot().revision;
  }

  reset(input: StudioPreviewReset): void {
    if (this.destroyedValue) return;
    const previousValue = this.canonicalValueValue;
    const previousContext = this.contextValue;
    const previousExtensions = this.extensionsValue;
    const previousProposal = this.pendingProposalValue;
    this.pendingProposalValue = undefined;
    this.canonicalValueValue = input.value;
    this.contextValue = input.context ?? EMPTY_OBJECT;
    this.extensionsValue = input.extensions ?? EMPTY_OBJECT;
    try {
      this.replaceController();
    } catch (error) {
      this.canonicalValueValue = previousValue;
      this.contextValue = previousContext;
      this.extensionsValue = previousExtensions;
      this.pendingProposalValue = previousProposal;
      throw error;
    }
  }

  serialize(): SerializedStagesState {
    const state = this.controllerValue.serialize();
    const durable = this.creationValue.durableExtensionNamespaces;
    if (durable === undefined) return state;
    const serializedExtensions = state.meta["extensions"];
    const extensionRecord = serializedExtensions !== null && typeof serializedExtensions === "object" && !Array.isArray(serializedExtensions)
      ? serializedExtensions as Readonly<Record<string, JsonValue>>
      : undefined;
    const extensions = extensionRecord !== undefined
      ? Object.fromEntries(durable.flatMap((namespace) => Object.prototype.hasOwnProperty.call(extensionRecord, namespace)
        ? [[namespace, extensionRecord[namespace]!]]
        : []))
      : {};
    return { ...state, meta: { ...state.meta, extensions } };
  }

  recreate(state: SerializedStagesState): void {
    if (this.destroyedValue) return;
    this.pendingProposalValue = undefined;
    this.replaceController(state);
    this.canonicalValueValue = this.controllerValue.getSnapshot().value;
  }

  destroy(): void {
    if (this.destroyedValue) return;
    this.destroyedValue = true;
    this.controllerUnsubscribe?.();
    this.controllerUnsubscribe = undefined;
    this.controllerValue.destroy();
    this.listeners.clear();
    this.pendingProposalValue = undefined;
  }

  private createController(state?: SerializedStagesState): StudioPreviewController {
    const creation = this.creationValue;
    const options = {
      schema: this.compiledValue.schemaInput,
      fields: this.compiledValue.fields,
      ...(state === undefined ? { value: this.canonicalValueValue } : { state }),
      context: this.contextValue,
      extensions: this.extensionsValue,
      ...(creation.codec === undefined ? {} : { codec: creation.codec }),
      ...(creation.migrations === undefined ? {} : { migrations: creation.migrations }),
      ...(creation.extensionCodecs === undefined ? {} : { extensionCodecs: creation.extensionCodecs }),
      ...(creation.validationFailureIssue === undefined ? {} : { validationFailureIssue: creation.validationFailureIssue }),
      onChange: (proposal: StagesChange<unknown>) => this.receiveProposal(proposal),
      onDiagnostic: (diagnostic: Diagnostic) => this.receiveDiagnostic(diagnostic),
    };
    return stages<unknown, StudioFieldRegistry, unknown>(options);
  }

  private observeController(): void {
    this.controllerUnsubscribe = this.controllerValue.subscribe(() => this.notify());
  }

  private replaceController(state?: SerializedStagesState): void {
    const previous = this.controllerValue;
    const next = this.createController(state);
    this.controllerUnsubscribe?.();
    this.controllerValue = next;
    this.observeController();
    previous.destroy();
    this.callbacksValue.onControllerChange?.(this.controllerValue);
    this.acceptedRevisionValue = this.controllerValue.getSnapshot().revision;
    this.emitTelemetry({ name: "preview.recreated" });
    this.notify();
  }

  private receiveProposal(proposal: StagesChange<unknown>): void {
    if (this.destroyedValue) return;
    this.pendingProposalValue = proposal;
    this.emitTelemetry({ name: "preview.proposal", transactionId: proposal.transactionId, eventCount: proposal.events.length, patchCount: proposal.patches.length });
    this.callbacksValue.onProposal?.(proposal);
  }

  private receiveDiagnostic(diagnostic: Diagnostic): void {
    if (this.destroyedValue) return;
    this.callbacksValue.onDiagnostic?.(
      translateStudioRuntimeDiagnostic(
        diagnostic,
        this.compiledValue.sourceMap,
        this.compiledValue.renderPlan.formUid,
      ),
    );
    this.emitTelemetry({ name: "preview.diagnostic", code: diagnostic.code, severity: diagnostic.severity });
  }

  private notify(): void {
    const snapshot = this.controllerValue.getSnapshot();
    if (this.pendingProposalValue === undefined && Object.is(snapshot.value, this.canonicalValueValue)) {
      this.acceptedRevisionValue = snapshot.revision;
    }
    for (const listener of this.listeners) listener();
  }

  private emitTelemetry(event: StudioTelemetryEvent): void {
    try {
      this.callbacksValue.telemetry?.emit(event);
    } catch {
      // Optional observability must never alter controlled runtime behavior.
    }
  }
}

export function createStudioPreviewHost(options: StudioPreviewHostOptions): StudioPreviewHost {
  return new PreviewHost(options);
}
