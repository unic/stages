import { applyPatches, getAtPath, pathsEqual } from "./path.js";
import { reduceCollectionCommand, type CollectionCommand } from "./collections.js";
import {
  decodeJson,
  encodeJson,
  migrateSerializedState,
  validateSerializedState,
} from "./serialization.js";
import {
  evaluateSchema,
  initialFieldValue,
  type EvaluatedSchema,
  type NormalizedBranch,
  type NormalizedNode,
} from "./schema.js";
import type {
  ContainerSnapshot,
  DataPath,
  Diagnostic,
  DeepReadonly,
  DynamicMetaSnapshot,
  FieldDefinition,
  FieldSnapshot,
  JsonValue,
  NodeAddress,
  NodeConfig,
  RenderNodeSnapshot,
  SerializedStagesState,
  StagesChange,
  StagesController,
  StagesEvent,
  StagesOptions,
  StagesPatch,
  StagesSchemaInput,
  StagesSnapshot,
  StagesUpdate,
  ValidateOptions,
  ValidationIssue,
  ValidationCancellationSignal,
  ValidationSnapshot,
  ValidatorConfig,
} from "./types.js";

const emptyValidation: ValidationSnapshot = {
  status: "unknown",
  isValid: false,
  issues: [],
  visibleIssues: [],
  pendingCount: 0,
  unknownCount: 1,
};

function readonlyValue<TValue>(value: TValue): DeepReadonly<TValue> {
  return value as DeepReadonly<TValue>;
}

function addressKey(address: NodeAddress): string {
  return address.map((segment) => `${segment.kind}:${segment.id.length}:${segment.id}`).join("/");
}

function addressStartsWith(address: NodeAddress, prefix: NodeAddress): boolean {
  return prefix.length <= address.length && prefix.every((segment, index) => {
    const candidate = address[index];
    return candidate?.kind === segment.kind && candidate.id === segment.id;
  });
}

function fieldDefinition(fields: unknown, type: string): FieldDefinition<unknown, unknown, unknown> | undefined {
  if (fields === null || typeof fields !== "object") return undefined;
  return (fields as Readonly<Record<string, FieldDefinition<unknown, unknown, unknown>>>)[type];
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => deepEqual(item, right[index]));
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const keys = Object.keys(leftRecord);
  return keys.length === Object.keys(rightRecord).length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key) && deepEqual(leftRecord[key], rightRecord[key]));
}

function indexSnapshotNodes(
  nodes: readonly RenderNodeSnapshot[],
  index = new Map<string, RenderNodeSnapshot>(),
): ReadonlyMap<string, RenderNodeSnapshot> {
  for (const node of nodes) {
    index.set(addressKey(node.address), node);
    if (node.kind !== "field") indexSnapshotNodes(node.nodes, index);
  }
  return index;
}

function shareSnapshotNode(
  next: RenderNodeSnapshot,
  previous: ReadonlyMap<string, RenderNodeSnapshot>,
): RenderNodeSnapshot {
  const previousNode = previous.get(addressKey(next.address));
  if (next.kind === "field") return previousNode !== undefined && deepEqual(previousNode, next) ? previousNode : next;

  const sharedChildren = next.nodes.map((node) => shareSnapshotNode(node, previous));
  const candidate: ContainerSnapshot = sharedChildren.every((node, index) => node === next.nodes[index])
    ? next
    : { ...next, nodes: sharedChildren };
  return previousNode !== undefined && deepEqual(previousNode, candidate) ? previousNode : candidate;
}

interface InteractionState {
  readonly focused: Readonly<{ has(value: string): boolean }>;
  readonly touched: Readonly<{ has(value: string): boolean }>;
  readonly visited: Readonly<{ has(value: string): boolean }>;
  readonly activeWizards: ReadonlyMap<string, string>;
}

interface ActiveWizardState {
  readonly address: NodeAddress;
  readonly stage: string;
}

interface CollectionKeyState {
  readonly address: NodeAddress;
  readonly keys: readonly string[];
}

interface ValidationRecord {
  readonly address: NodeAddress;
  readonly validator: object;
  readonly dependencyPaths: readonly DataPath[];
  readonly dependencyValues: readonly unknown[];
  readonly context: unknown;
  readonly status: "pending" | "complete";
  readonly issues: readonly ValidationIssue[];
  readonly revealed: boolean;
  readonly token: number;
  readonly cancel: () => void;
}

function eventNames(value: string | readonly string[] | undefined): readonly string[] {
  if (value === undefined) return [];
  return typeof value === "string" ? [value] : value;
}

function validationRecordKey(address: NodeAddress, validatorId: string): string {
  return `${addressKey(address)}#${validatorId.length}:${validatorId}`;
}

const passiveValidationSignal: ValidationCancellationSignal = {
  aborted: false,
  onCancel: () => () => undefined,
};

function createValidationCancellation(): Readonly<{
  signal: ValidationCancellationSignal;
  cancel: () => void;
}> {
  let aborted = false;
  const listeners = new Set<() => void>();
  const signal: ValidationCancellationSignal = {
    get aborted() {
      return aborted;
    },
    onCancel(listener) {
      if (aborted) {
        listener();
        return () => undefined;
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    signal,
    cancel() {
      if (aborted) return;
      aborted = true;
      for (const listener of [...listeners]) listener();
      listeners.clear();
    },
  };
}

function pathsIntersect(left: DataPath, right: DataPath): boolean {
  const commonLength = Math.min(left.length, right.length);
  return pathsEqual(left.slice(0, commonLength), right.slice(0, commonLength));
}

function initialScopeValue<TValue, TFields, TContext>(
  nodes: readonly NodeConfig<TValue, TFields, TContext>[],
  fields: TFields,
): Readonly<Record<string, unknown>> {
  const value: Record<string, unknown> = {};
  for (const node of nodes) {
    if (node.kind === "field") {
      const definition = fieldDefinition(fields, node.type);
      value[node.id] = definition === undefined ? undefined : initialFieldValue(definition);
    } else if (node.kind === "group") {
      value[node.id] = initialScopeValue(node.nodes, fields);
    } else if (node.kind === "collection") {
      value[node.id] = [];
    } else {
      const wizardValue: Record<string, unknown> = {};
      for (const stage of node.stages) wizardValue[stage.id] = initialScopeValue(stage.nodes, fields);
      value[node.id] = wizardValue;
    }
  }
  return value;
}

function eventRecord(payload: unknown): Readonly<Record<string, unknown>> | undefined {
  return payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Readonly<Record<string, unknown>>
    : undefined;
}

function parseNodeAddress(value: unknown): NodeAddress | undefined {
  if (!Array.isArray(value)) return undefined;
  const address: Array<Readonly<{ kind: "node" | "row"; id: string }>> = [];
  for (const candidate of value) {
    const record = eventRecord(candidate);
    const kind = record?.["kind"];
    const id = record?.["id"];
    if ((kind !== "node" && kind !== "row") || typeof id !== "string") return undefined;
    address.push({ kind, id });
  }
  return address;
}

type ParsedCollectionCommand =
  | Readonly<{ command: CollectionCommand }>
  | Readonly<{ code: string; message: string }>;

function parseCollectionCommand<TValue, TFields, TContext>(
  node: NormalizedNode<TValue, TFields, TContext>,
  event: StagesEvent,
  fields: TFields,
): ParsedCollectionCommand {
  if (node.config.kind !== "collection") return { code: "event.target-kind", message: "Collection event requires a collection target." };
  const payload = eventRecord(event.payload) ?? {};

  if (event.name === "collection:add") {
    const index = payload["index"];
    if (index !== undefined && typeof index !== "number") return { code: "collection.payload", message: "Add index must be a number." };
    let item: unknown;
    if (Object.prototype.hasOwnProperty.call(payload, "value")) {
      item = payload["value"];
    } else if (node.config.variants !== undefined) {
      const variant = payload["variant"];
      if (typeof variant !== "string" || node.config.variants[variant] === undefined) {
        return { code: "collection.variant", message: "Adding to a union collection requires a known variant." };
      }
      const variantConfig = node.config.variants[variant];
      if (variantConfig === undefined) return { code: "collection.variant", message: "Unknown collection variant." };
      item = {
        ...initialScopeValue(variantConfig.nodes, fields),
        [node.config.discriminator]: variant,
      };
    } else {
      item = initialScopeValue(node.config.nodes, fields);
    }
    return {
      command: {
        name: "collection:add",
        item,
        ...(index === undefined ? {} : { index }),
      },
    };
  }

  if (event.name === "collection:remove") {
    return typeof payload["index"] === "number"
      ? { command: { name: event.name, index: payload["index"] } }
      : { code: "collection.payload", message: "Remove requires a numeric index." };
  }
  if (event.name === "collection:replace") {
    return typeof payload["index"] === "number" && Object.prototype.hasOwnProperty.call(payload, "value")
      ? { command: { name: event.name, index: payload["index"], item: payload["value"] } }
      : { code: "collection.payload", message: "Replace requires an index and value." };
  }
  if (event.name === "collection:duplicate") {
    const index = payload["index"];
    const toIndex = payload["toIndex"];
    return typeof index === "number" && (toIndex === undefined || typeof toIndex === "number")
      ? { command: { name: event.name, index, ...(toIndex === undefined ? {} : { toIndex }) } }
      : { code: "collection.payload", message: "Duplicate requires numeric indexes." };
  }
  if (event.name === "collection:move") {
    return typeof payload["from"] === "number" && typeof payload["to"] === "number"
      ? { command: { name: event.name, from: payload["from"], to: payload["to"] } }
      : { code: "collection.payload", message: "Move requires numeric from and to indexes." };
  }
  if (event.name === "collection:sort") {
    const order = payload["order"];
    return Array.isArray(order) && order.every((index) => typeof index === "number")
      ? { command: { name: event.name, order } }
      : { code: "collection.payload", message: "Sort requires a numeric order array." };
  }
  return { code: "collection.event", message: `Unknown collection event \"${event.name}\".` };
}

function mapSnapshotNode<TValue, TFields, TContext>(
  node: NormalizedNode<TValue, TFields, TContext>,
  value: TValue,
  baseline: TValue,
  fields: TFields,
  interaction: InteractionState,
  issues: readonly ValidationIssue[],
  visibleIssues: readonly ValidationIssue[],
  validationByAddress: ReadonlyMap<string, ValidationSnapshot>,
): RenderNodeSnapshot {
  const key = addressKey(node.address);
  const nodeIssues = issues.filter((issue) => pathsEqual(issue.path, node.path));
  const nodeVisibleIssues = visibleIssues.filter((issue) => pathsEqual(issue.path, node.path));
  if (node.config.kind === "field") {
    const definition = fieldDefinition(fields, node.config.type);
    const currentValue = getAtPath(value, node.path);
    const baselineValue = getAtPath(baseline, node.path);
    const initialValue = baselineValue === undefined && definition !== undefined
      ? initialFieldValue(definition)
      : baselineValue;
    const snapshot: FieldSnapshot = {
      kind: "field",
      id: node.config.id,
      type: node.config.type,
      view: definition?.view,
      path: node.path,
      address: node.address,
      value: currentValue,
      initialValue,
      props: node.props,
      state: {
        disabled: node.disabled,
        visible: node.visible,
        focused: interaction.focused.has(key),
        touched: interaction.touched.has(key),
        dirty: !deepEqual(currentValue, initialValue),
        validating: (validationByAddress.get(key)?.pendingCount ?? 0) > 0,
        issues: nodeIssues,
        visibleIssues: nodeVisibleIssues,
      },
    };
    return snapshot;
  }
  const snapshot: ContainerSnapshot = {
    kind: node.config.kind,
    id: node.config.id,
    path: node.path,
    address: node.address,
    state: { disabled: node.disabled, visible: node.visible },
    nodes: node.branches.length > 0
      ? node.branches
        .filter((branch) => branch.visible)
        .map((branch) => mapSnapshotBranch(
          branch,
          value,
          baseline,
          fields,
          interaction,
          issues,
          visibleIssues,
          validationByAddress,
          node.config.kind === "wizard"
            ? interaction.activeWizards.get(addressKey(node.address)) === branch.id
            : undefined,
        ))
      : node.children
        .filter((child) => child.visible)
        .map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress)),
    validation: validationByAddress.get(key) ?? emptyValidation,
    ...(node.config.kind === "collection" ? {
      size: Array.isArray(getAtPath(value, node.path)) ? (getAtPath(value, node.path) as readonly unknown[]).length : 0,
      canAdd: node.config.max === undefined || node.branches.length < node.config.max,
      canRemove: node.config.min === undefined || node.branches.length > node.config.min,
    } : {}),
    ...(node.config.kind === "wizard" ? (() => {
      const visibleStages = node.branches.filter((branch) => branch.visible);
      const activeStage = interaction.activeWizards.get(addressKey(node.address)) ?? visibleStages[0]?.id;
      const activeIndex = visibleStages.findIndex((branch) => branch.id === activeStage);
      return {
        ...(activeStage === undefined ? {} : { activeStage }),
        visibleStageIds: visibleStages.map((branch) => branch.id),
        canPrevious: !node.disabled && activeIndex > 0,
        canNext: !node.disabled && activeIndex >= 0 && activeIndex < visibleStages.length - 1,
        canGo: !node.disabled && node.config.navigation?.nonLinear === true,
      };
    })() : {}),
  };
  return snapshot;
}

function mapSnapshotBranch<TValue, TFields, TContext>(
  branch: NormalizedBranch<TValue, TFields, TContext>,
  value: TValue,
  baseline: TValue,
  fields: TFields,
  interaction: InteractionState,
  issues: readonly ValidationIssue[],
  visibleIssues: readonly ValidationIssue[],
  validationByAddress: ReadonlyMap<string, ValidationSnapshot>,
  active: boolean | undefined,
): ContainerSnapshot {
  return {
    kind: branch.kind,
    id: branch.id,
    path: branch.path,
    address: branch.address,
    state: { disabled: branch.disabled, visible: branch.visible },
    nodes: branch.children
      .filter((child) => child.visible)
      .map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues, visibleIssues, validationByAddress)),
    validation: validationByAddress.get(addressKey(branch.address)) ?? emptyValidation,
    ...(active === undefined ? {} : { active }),
  };
}

function validatorsFor<TValue, TFields, TContext>(
  nodes: readonly NormalizedNode<TValue, TFields, TContext>[],
): readonly Readonly<{ node: NormalizedNode<TValue, TFields, TContext>; validator: ValidatorConfig<TValue, TContext> }>[] {
  const output: Array<Readonly<{ node: NormalizedNode<TValue, TFields, TContext>; validator: ValidatorConfig<TValue, TContext> }>> = [];
  for (const node of nodes) {
    for (const validator of node.config.validators ?? []) output.push({ node, validator });
    output.push(...validatorsFor(node.children));
  }
  return output;
}

export function stages<TValue, TFields, TContext = unknown>(
  options: StagesOptions<TValue, TFields, TContext>,
): StagesController<TValue, TFields, TContext> {
  const restored = options.state === undefined
    ? undefined
    : migrateSerializedState(validateSerializedState(options.state), options.migrations ?? []);
  const decodeValue = (encoded: JsonValue): TValue =>
    options.codec === undefined ? decodeJson(encoded) as TValue : options.codec.decode(encoded);
  const encodeValue = (decoded: DeepReadonly<TValue>): JsonValue =>
    encodeJson(options.codec === undefined ? decoded : options.codec.encode(decoded));
  let value = restored === undefined ? options.value as TValue : decodeValue(restored.value);
  const baseline = restored === undefined ? options.value as TValue : decodeValue(restored.baseline);
  let context = options.context as TContext;
  let schemaInput: StagesSchemaInput<TValue, TFields, TContext> = options.schema;
  let revision = 0;
  let transactionId = 0;
  let destroyed = false;
  let batchDepth = 0;
  let scheduled = false;
  let flushing = false;
  let dirtySnapshot = true;
  let proposal: TValue | undefined;
  let transactionEvents: StagesEvent[] = [];
  let transactionPatches: StagesPatch[] = [];
  let transactionCollectionKeys: Map<string, CollectionKeyState> | undefined;
  let focused = new Map<string, NodeAddress>();
  let touched = new Map<string, NodeAddress>();
  let visited = new Map<string, NodeAddress>();
  let activeWizards = new Map<string, ActiveWizardState>();
  let collectionKeys = new Map<string, CollectionKeyState>();
  let rowKeyCounter = 0;
  let pendingAcceptance: Readonly<{
    proposedValue: TValue;
    previousValue: TValue;
    collectionKeys: Map<string, CollectionKeyState>;
  }> | undefined;
  if (restored !== undefined) {
    const serializedTouched = restored.meta["touched"];
    if (Array.isArray(serializedTouched)) {
      for (const item of serializedTouched) {
        const address = parseNodeAddress(item);
        if (address !== undefined) touched.set(addressKey(address), address);
      }
    }
    const serializedVisited = restored.meta["visited"];
    if (Array.isArray(serializedVisited)) {
      for (const item of serializedVisited) {
        const address = parseNodeAddress(item);
        if (address !== undefined) visited.set(addressKey(address), address);
      }
    }
    const serializedWizards = restored.meta["activeWizards"];
    if (Array.isArray(serializedWizards)) {
      for (const item of serializedWizards) {
        if (!Array.isArray(item) || item.length !== 2 || typeof item[1] !== "string") continue;
        const address = parseNodeAddress(item[0]);
        if (address !== undefined) activeWizards.set(addressKey(address), { address, stage: item[1] });
      }
    }
    const serializedCollectionKeys = restored.meta["collectionKeys"];
    if (Array.isArray(serializedCollectionKeys)) {
      for (const item of serializedCollectionKeys) {
        if (!Array.isArray(item) || item.length !== 2 || !Array.isArray(item[1])) continue;
        const address = parseNodeAddress(item[0]);
        const keys = item[1];
        if (address !== undefined && keys.every((key) => typeof key === "string")) {
          collectionKeys.set(addressKey(address), { address, keys });
        }
      }
    }
  }
  let validation = emptyValidation;
  let validationRun = 0;
  let validationToken = 0;
  const validationRecords = new Map<string, ValidationRecord>();
  let publishedEvaluation: EvaluatedSchema<TValue, TFields, TContext> | undefined;
  let transactionEvaluation: EvaluatedSchema<TValue, TFields, TContext> | undefined;
  let lastValidEvaluation: EvaluatedSchema<TValue, TFields, TContext> | undefined;
  let expectedSchemaIdentity: Readonly<{ id: string; version: number }> | undefined;
  const listeners = new Set<() => void>();
  const selectorListeners = new Set<() => void>();
  const reportedDiagnostics = new Set<string>();
  let runtimeDiagnostics: Diagnostic[] = [];
  let knownIdentities = new Map<string, string>();
  let cachedSnapshot: StagesSnapshot<TValue>;

  function meta(): DynamicMetaSnapshot {
    return {
      revision,
      isDirty: !deepEqual(value, baseline),
      touched: [...touched.values()],
      visited: [...visited.values()],
      activeWizards: new Map([...activeWizards].map(([key, state]) => [key, state.stage])),
      extensions: {},
    };
  }

  function reportRuntimeDiagnostic(
    code: string,
    message: string,
    path: DataPath,
    address: NodeAddress,
  ): void {
    const item: Diagnostic = { code, message, severity: "error", path, address };
    runtimeDiagnostics = [...runtimeDiagnostics.slice(-99), item];
    options.onDiagnostic?.(item);
  }

  function reportSchemaDiagnostic(item: Diagnostic): void {
    const key = `${item.code}:${JSON.stringify(item.path)}:${item.message}`;
    if (reportedDiagnostics.has(key)) return;
    reportedDiagnostics.add(key);
    options.onDiagnostic?.(item);
  }

  function evaluated(currentValue: TValue) {
    const currentCollectionKeys = transactionCollectionKeys ?? collectionKeys;
    let result: EvaluatedSchema<TValue, TFields, TContext>;
    try {
      result = evaluateSchema({
        schema: schemaInput,
        value: readonlyValue(currentValue),
        context: readonlyValue(context),
        meta: meta(),
        fields: options.fields,
        collectionKeys: new Map([...currentCollectionKeys].map(([key, state]) => [key, state.keys])),
      });
    } catch (error) {
      if (lastValidEvaluation === undefined) throw error;
      const failure: Diagnostic = {
        code: "schema.factory-failed",
        message: error instanceof Error ? error.message : String(error),
        severity: "error",
        path: [],
        address: [],
      };
      reportSchemaDiagnostic(failure);
      return {
        schema: lastValidEvaluation.schema,
        nodes: lastValidEvaluation.nodes,
        diagnostics: [failure],
      };
    }
    const expectedIdentity = expectedSchemaIdentity;
    const identityChanged = expectedIdentity !== undefined
      && (result.schema.id !== expectedIdentity.id || result.schema.version !== expectedIdentity.version);
    if (identityChanged && expectedIdentity !== undefined) {
      const failure: Diagnostic = {
        code: "schema.identity-changed",
        message: `Schema factory changed root identity from ${expectedIdentity.id}@${expectedIdentity.version} to ${result.schema.id}@${result.schema.version}.`,
        severity: "error",
        path: [],
        address: [],
      };
      result = { ...result, diagnostics: [...result.diagnostics, failure] };
    }
    if (restored !== undefined && (
      restored.format !== "stages"
      || restored.formatVersion !== 1
      || restored.schema.id !== result.schema.id
      || restored.schema.version !== result.schema.version
    )) {
      throw new TypeError(
        `Serialized state targets ${restored.schema.id}@${restored.schema.version}, not ${result.schema.id}@${result.schema.version}.`,
      );
    }
    for (const item of result.diagnostics) {
      reportSchemaDiagnostic(item);
    }
    if (result.diagnostics.some((item) => item.severity === "error") && lastValidEvaluation !== undefined) {
      return {
        schema: lastValidEvaluation.schema,
        nodes: lastValidEvaluation.nodes,
        diagnostics: result.diagnostics,
      };
    }
    if (!result.diagnostics.some((item) => item.severity === "error")) {
      expectedSchemaIdentity ??= { id: result.schema.id, version: result.schema.version };
      lastValidEvaluation = result;
    }
    return result;
  }

  function allocateRowKey(used: ReadonlySet<string>): string {
    let key: string;
    do {
      rowKeyCounter += 1;
      key = `row:${rowKeyCounter}`;
    } while (used.has(key));
    return key;
  }

  function synchronizeCollectionKeys(
    nodes: readonly NormalizedNode<TValue, TFields, TContext>[],
    currentValue: TValue,
  ): void {
    const synchronize = (items: readonly NormalizedNode<TValue, TFields, TContext>[]): void => {
      for (const node of items) {
        if (node.config.kind === "collection" && node.config.itemKey === undefined) {
          const key = addressKey(node.address);
          const current = getAtPath(currentValue, node.path);
          const length = Array.isArray(current) ? current.length : 0;
          const existing = collectionKeys.get(key)?.keys ?? node.branches.map((branch) => branch.id);
          const keys = existing.slice(0, length);
          const used = new Set(keys);
          while (keys.length < length) {
            const next = allocateRowKey(used);
            keys.push(next);
            used.add(next);
          }
          collectionKeys.set(key, { address: node.address, keys });
        }
        synchronize(node.children);
      }
    };
    synchronize(nodes);
  }

  function updateTransactionCollectionKeys(
    node: NormalizedNode<TValue, TFields, TContext>,
    command: CollectionCommand,
  ): void {
    if (node.config.kind !== "collection" || node.config.itemKey !== undefined) return;
    const key = addressKey(node.address);
    const state = transactionCollectionKeys?.get(key) ?? collectionKeys.get(key);
    const keys = (state?.keys ?? node.branches.map((branch) => branch.id)).slice();
    const used = new Set(keys);
    if (command.name === "collection:add") {
      keys.splice(command.index ?? keys.length, 0, allocateRowKey(used));
    } else if (command.name === "collection:remove") {
      keys.splice(command.index, 1);
    } else if (command.name === "collection:duplicate") {
      keys.splice(command.toIndex ?? command.index + 1, 0, allocateRowKey(used));
    } else if (command.name === "collection:move") {
      const moved = keys.splice(command.from, 1);
      const movedKey = moved[0];
      if (movedKey !== undefined) keys.splice(command.to, 0, movedKey);
    } else if (command.name === "collection:sort") {
      const sorted = command.order.map((index) => keys[index]).filter((item): item is string => item !== undefined);
      keys.splice(0, keys.length, ...sorted);
    }
    transactionCollectionKeys ??= new Map(collectionKeys);
    transactionCollectionKeys.set(key, { address: node.address, keys });
  }

  function reconcileInteraction(nodes: readonly NormalizedNode<TValue, TFields, TContext>[]): void {
    const nextIdentities = new Map<string, string>();
    const collect = (items: readonly NormalizedNode<TValue, TFields, TContext>[]): void => {
      for (const node of items) {
        const key = addressKey(node.address);
        const signature = node.config.kind === "field"
          ? `field:${node.config.type}`
          : node.config.kind;
        nextIdentities.set(key, signature);
        collect(node.children);
      }
    };
    collect(nodes);

    const retainCompatible = (entries: Map<string, NodeAddress>): Map<string, NodeAddress> => {
      const retained = new Map<string, NodeAddress>();
      for (const [key, address] of entries) {
        const previous = knownIdentities.get(key);
        const next = nextIdentities.get(key);
        if (next !== undefined && (previous === undefined || previous === next)) retained.set(key, address);
      }
      return retained;
    };
    focused = retainCompatible(focused);
    touched = retainCompatible(touched);
    visited = retainCompatible(visited);
    const nextActiveWizards = new Map<string, ActiveWizardState>();
    const initializeWizards = (items: readonly NormalizedNode<TValue, TFields, TContext>[]): void => {
      for (const node of items) {
        if (node.config.kind === "wizard") {
          const key = addressKey(node.address);
          const visibleStages = node.branches.filter((branch) => branch.visible);
          const previous = activeWizards.get(key);
          const configured = node.config.initialStage;
          const stage = previous !== undefined && visibleStages.some((branch) => branch.id === previous.stage)
            ? previous.stage
            : configured !== undefined && visibleStages.some((branch) => branch.id === configured)
              ? configured
              : visibleStages[0]?.id;
          if (stage !== undefined) nextActiveWizards.set(key, { address: node.address, stage });
        }
        initializeWizards(node.children);
      }
    };
    initializeWizards(nodes);
    activeWizards = nextActiveWizards;
    synchronizeCollectionKeys(nodes, value);
    const retainedCollectionKeys = new Map<string, CollectionKeyState>();
    for (const [key, state] of collectionKeys) {
      if (nextIdentities.get(key) === "collection") retainedCollectionKeys.set(key, state);
    }
    collectionKeys = retainedCollectionKeys;
    for (const [key, record] of validationRecords) {
      const identityKey = addressKey(record.address);
      const previousIdentity = knownIdentities.get(identityKey);
      const nextIdentity = nextIdentities.get(identityKey);
      if (nextIdentity === undefined || (previousIdentity !== undefined && previousIdentity !== nextIdentity)) {
        record.cancel();
        validationRecords.delete(key);
      }
    }
    knownIdentities = nextIdentities;
  }

  function validatorPaths(
    node: NormalizedNode<TValue, TFields, TContext>,
    validator: ValidatorConfig<TValue, TContext>,
  ): readonly DataPath[] {
    const paths: DataPath[] = [node.path];
    for (const dependency of validator.dependencies ?? []) {
      if (!paths.some((path) => pathsEqual(path, dependency))) paths.push(dependency);
    }
    return paths;
  }

  function dependencyValues(paths: readonly DataPath[], currentValue: TValue): readonly unknown[] {
    return paths.map((path) => getAtPath(currentValue, path));
  }

  function recordIsCurrent(
    record: ValidationRecord,
    node: NormalizedNode<TValue, TFields, TContext>,
    validator: ValidatorConfig<TValue, TContext>,
    currentValue: TValue,
  ): boolean {
    return record.validator === validator
      && record.context === context
      && record.dependencyValues.length === record.dependencyPaths.length
      && deepEqual(record.dependencyValues, dependencyValues(record.dependencyPaths, currentValue))
      && pathsEqual(record.dependencyPaths[0] ?? [], node.path);
  }

  function validationContext(
    node: NormalizedNode<TValue, TFields, TContext>,
    currentValue: TValue,
    event: string,
    signal: ValidationCancellationSignal = passiveValidationSignal,
  ) {
    const key = addressKey(node.address);
    return {
      value: readonlyValue(currentValue),
      context: readonlyValue(context),
      meta: meta(),
      path: node.path,
      address: node.address,
      fieldValue: getAtPath(currentValue, node.path),
      parentValue: getAtPath(currentValue, node.path.slice(0, -1)),
      event,
      signal,
      fieldState: {
        disabled: node.disabled,
        focused: focused.has(key),
        touched: touched.has(key),
        visited: visited.has(key),
      },
    };
  }

  function inValidationScope(
    node: NormalizedNode<TValue, TFields, TContext>,
    scope: ValidateOptions["scope"],
  ): boolean {
    if (scope === undefined || scope === "form") return true;
    return "path" in scope
      ? pathsEqual(node.path.slice(0, scope.path.length), scope.path)
      : addressStartsWith(node.address, scope.address);
  }

  function deriveValidation(
    result: EvaluatedSchema<TValue, TFields, TContext>,
    currentValue: TValue,
    scope: ValidateOptions["scope"] = "form",
  ): ValidationSnapshot {
    const issues: ValidationIssue[] = [];
    const visibleIssues: ValidationIssue[] = [];
    let pendingCount = 0;
    let unknownCount = 0;

    for (const { node, validator } of validatorsFor(result.nodes)) {
      if (!node.visible || !inValidationScope(node, scope)) continue;
      const key = validationRecordKey(node.address, validator.id);
      const record = validationRecords.get(key);
      let applicable = true;
      try {
        applicable = validator.when?.(validationContext(node, currentValue, "status")) !== false;
      } catch {
        applicable = true;
      }
      if (!applicable) {
        record?.cancel();
        validationRecords.delete(key);
        continue;
      }
      if (record === undefined) {
        unknownCount += 1;
        continue;
      }
      if (!recordIsCurrent(record, node, validator, currentValue)) {
        record.cancel();
        validationRecords.delete(key);
        unknownCount += 1;
        continue;
      }
      if (record.status === "pending") pendingCount += 1;
      issues.push(...record.issues);
      if (record.revealed) visibleIssues.push(...record.issues);
    }

    const hasErrors = issues.some((issue) => issue.severity === "error");
    const status = hasErrors
      ? "invalid"
      : pendingCount > 0
        ? "pending"
        : unknownCount > 0
          ? "unknown"
          : "valid";
    return {
      status,
      isValid: status === "valid",
      issues,
      visibleIssues,
      pendingCount,
      unknownCount,
    };
  }

  function validationIndex(
    result: EvaluatedSchema<TValue, TFields, TContext>,
    currentValue: TValue,
  ): ReadonlyMap<string, ValidationSnapshot> {
    const index = new Map<string, ValidationSnapshot>();
    const collect = (nodes: readonly NormalizedNode<TValue, TFields, TContext>[]): void => {
      for (const node of nodes) {
        index.set(
          addressKey(node.address),
          deriveValidation(result, currentValue, { address: node.address }),
        );
        for (const branch of node.branches) {
          index.set(
            addressKey(branch.address),
            deriveValidation(result, currentValue, { address: branch.address }),
          );
        }
        collect(node.children);
      }
    };
    collect(result.nodes);
    return index;
  }

  function runValidation(
    result: EvaluatedSchema<TValue, TFields, TContext>,
    currentValue: TValue,
    event: string,
    force: boolean,
    reveal: boolean,
    scope: ValidateOptions["scope"] = "form",
    targetAddress?: NodeAddress,
    affectedPaths: readonly DataPath[] = [],
  ): Promise<void> {
    const pending: Promise<void>[] = [];
    for (const { node, validator } of validatorsFor(result.nodes)) {
      if (!node.visible || !inValidationScope(node, scope)) continue;
      const key = validationRecordKey(node.address, validator.id);
      const previous = validationRecords.get(key);
      const paths = validatorPaths(node, validator);
      const relevant = force
        || targetAddress === undefined
        || addressStartsWith(targetAddress, node.address)
        || paths.some((path) => affectedPaths.some((affected) => pathsIntersect(path, affected)));
      if (!relevant) continue;
      const shouldReveal = reveal || eventNames(validator.revealOn).includes(event);
      const shouldRun = force || eventNames(validator.on).includes(event);
      const contextValue = validationContext(node, currentValue, event);
      let applicable = true;
      try {
        applicable = validator.when?.(contextValue) !== false;
      } catch (error) {
        previous?.cancel();
        validationRecords.set(key, {
          address: node.address,
          validator,
          dependencyPaths: paths,
          dependencyValues: dependencyValues(paths, currentValue),
          context,
          status: "complete",
          issues: [{
            id: `${validator.id}.when-failed`,
            code: "validator-when-failed",
            path: node.path,
            severity: "error",
            message: error instanceof Error ? error.message : String(error),
          }],
          revealed: shouldReveal || previous?.revealed === true,
          token: ++validationToken,
          cancel: () => undefined,
        });
        continue;
      }
      if (!applicable) {
        previous?.cancel();
        validationRecords.delete(key);
        continue;
      }
      if (!shouldRun) {
        if (shouldReveal && previous !== undefined) validationRecords.set(key, { ...previous, revealed: true });
        continue;
      }

      const values = dependencyValues(paths, currentValue);
      const token = ++validationToken;
      const revealed = shouldReveal || previous?.revealed === true;
      previous?.cancel();
      const cancellation = createValidationCancellation();
      const runContext = validationContext(node, currentValue, event, cancellation.signal);
      try {
        const output = validator.validate(runContext);
        if (output !== null && typeof output === "object" && "then" in output) {
          validationRecords.set(key, {
            address: node.address,
            validator,
            dependencyPaths: paths,
            dependencyValues: values,
            context,
            status: "pending",
            issues: previous !== undefined && recordIsCurrent(previous, node, validator, currentValue) ? previous.issues : [],
            revealed,
            token,
            cancel: cancellation.cancel,
          });
          const completion = Promise.resolve(output).then(
            (issues) => issues,
            (error: unknown): readonly ValidationIssue[] => [{
              id: `${validator.id}.rejected`,
              code: "validator-rejected",
              path: node.path,
              severity: "error",
              message: error instanceof Error ? error.message : String(error),
            }],
          ).then((issues) => {
            if (destroyed) return;
            const record = validationRecords.get(key);
            const latestValue = proposal ?? value;
            if (record?.token !== token || !recordIsCurrent(record, node, validator, latestValue)) return;
            validationRecords.set(key, { ...record, status: "complete", issues });
            revision += 1;
            dirtySnapshot = true;
            schedule();
          });
          pending.push(completion);
        } else {
          validationRecords.set(key, {
            address: node.address,
            validator,
            dependencyPaths: paths,
            dependencyValues: values,
            context,
            status: "complete",
            issues: output,
            revealed,
            token,
            cancel: cancellation.cancel,
          });
        }
      } catch (error) {
        validationRecords.set(key, {
          address: node.address,
          validator,
          dependencyPaths: paths,
          dependencyValues: values,
          context,
          status: "complete",
          issues: [{
            id: `${validator.id}.rejected`,
            code: "validator-rejected",
            path: node.path,
            severity: "error",
            message: error instanceof Error ? error.message : String(error),
          }],
          revealed,
          token,
          cancel: cancellation.cancel,
        });
      }
    }
    return Promise.all(pending).then(() => undefined);
  }

  function snapshot(): StagesSnapshot<TValue> {
    if (!dirtySnapshot) return cachedSnapshot;
    const result = evaluated(value);
    publishedEvaluation = result;
    reconcileInteraction(result.nodes);
    validation = deriveValidation(result, value);
    const indexedValidation = validationIndex(result, value);
    const previousNodes = indexSnapshotNodes(cachedSnapshot.nodes);
    const nextNodes = result.nodes
      .filter((node) => node.visible)
      .map((node) => mapSnapshotNode(node, value, baseline, options.fields, {
        focused,
        touched,
        visited,
        activeWizards: new Map([...activeWizards].map(([key, state]) => [key, state.stage])),
      }, validation.issues, validation.visibleIssues, indexedValidation))
      .map((node) => shareSnapshotNode(node, previousNodes));
    cachedSnapshot = {
      value: readonlyValue(value),
      revision,
      nodes: nextNodes,
      validation,
      diagnostics: [...result.diagnostics, ...runtimeDiagnostics],
    };
    dirtySnapshot = false;
    return cachedSnapshot;
  }

  function notify(): void {
    dirtySnapshot = true;
    snapshot();
    for (const listener of [...listeners]) listener();
    for (const listener of [...selectorListeners]) listener();
  }

  function flush(): void {
    scheduled = false;
    if (destroyed) return;
    flushing = true;
    try {
      if (proposal !== undefined && !Object.is(proposal, value)) {
        const next = proposal;
        const previousValue = value;
        const change: StagesChange<TValue> = {
          value: next,
          previousValue,
          patches: transactionPatches,
          events: transactionEvents,
          source: "user",
          transactionId: ++transactionId,
        };
        if (transactionCollectionKeys !== undefined) {
          pendingAcceptance = {
            proposedValue: next,
            previousValue,
            collectionKeys: new Map(transactionCollectionKeys),
          };
        } else {
          pendingAcceptance = undefined;
        }
        proposal = undefined;
        transactionEvents = [];
        transactionPatches = [];
        options.onChange?.(change);
      } else {
        proposal = undefined;
        transactionEvents = [];
        transactionPatches = [];
      }
    } finally {
      flushing = false;
      transactionEvaluation = undefined;
      transactionCollectionKeys = undefined;
    }
    notify();
  }

  function schedule(): void {
    dirtySnapshot = true;
    if (scheduled || batchDepth > 0 || destroyed) return;
    scheduled = true;
    void Promise.resolve().then(flush);
  }

  function update(input: StagesUpdate<TValue, TFields, TContext>): void {
    if (destroyed) return;
    const invalidateAllValidation = input.context !== undefined || input.schema !== undefined;
    if (input.value !== undefined) {
      if (pendingAcceptance !== undefined) {
        if (!deepEqual(input.value, pendingAcceptance.previousValue)) {
          collectionKeys = new Map(pendingAcceptance.collectionKeys);
        }
        pendingAcceptance = undefined;
      }
      value = input.value;
      if (publishedEvaluation !== undefined) synchronizeCollectionKeys(publishedEvaluation.nodes, value);
    }
    if (input.context !== undefined) context = input.context;
    if (input.schema !== undefined) {
      schemaInput = input.schema;
      expectedSchemaIdentity = undefined;
    }
    publishedEvaluation = undefined;
    revision += 1;
    validationRun += 1;
    if (invalidateAllValidation) {
      for (const record of validationRecords.values()) record.cancel();
      validationRecords.clear();
    } else if (input.value !== undefined) {
      for (const [key, record] of validationRecords) {
        if (!deepEqual(record.dependencyValues, dependencyValues(record.dependencyPaths, value))) {
          record.cancel();
          validationRecords.delete(key);
        }
      }
    }
    validation = emptyValidation;
    dirtySnapshot = true;
    if (!flushing) schedule();
  }

  function dispatch(event: StagesEvent): void {
    if (destroyed) return;
    const draft = proposal ?? value;
    const result = transactionEvaluation ?? publishedEvaluation ?? evaluated(draft);
    transactionEvaluation = result;
    const allNodes: NormalizedNode<TValue, TFields, TContext>[] = [];
    const collect = (nodes: readonly NormalizedNode<TValue, TFields, TContext>[]): void => {
      for (const node of nodes) {
        allNodes.push(node);
        collect(node.children);
      }
    };
    collect(result.nodes);
    const target = event.target.kind === "field"
      ? allNodes.find((node) => node.config.kind === "field" && pathsEqual(node.path, event.target.kind === "field" ? event.target.path : []))
      : event.target.kind === "node"
        ? allNodes.find((node) => addressKey(node.address) === addressKey(event.target.kind === "node" ? event.target.address : []))
        : undefined;
    let commandRejected = false;

    if (event.target.kind !== "form" && target === undefined) {
      commandRejected = event.name.startsWith("collection:") || event.name.startsWith("wizard:");
      reportRuntimeDiagnostic(
        "event.target-missing",
        "Event target does not exist in the current schema.",
        event.target.kind === "field" ? event.target.path : [],
        event.target.kind === "node" ? event.target.address : [],
      );
    }

    if (target !== undefined) {
      const key = addressKey(target.address);
      if (event.name === "focus") {
        focused = new Map(focused).set(key, target.address);
        visited = new Map(visited).set(key, target.address);
      } else if (event.name === "blur") {
        const nextFocused = new Map(focused);
        nextFocused.delete(key);
        focused = nextFocused;
        touched = new Map(touched).set(key, target.address);
      }
    }

    let patches: readonly StagesPatch[] = [];
    if (target?.config.kind === "field" && target.visible && !target.disabled) {
      const definition = fieldDefinition(options.fields, target.config.type);
      const reduced = definition?.reduce?.({ value: getAtPath(draft, target.path), event, path: target.path });
      if (reduced !== undefined) {
        patches = "patches" in reduced ? reduced.patches : [{ op: "set", path: target.path, value: reduced.value }];
      }
    } else if (target?.config.kind === "collection" && event.name.startsWith("collection:")) {
      if (!target.visible || target.disabled) {
        commandRejected = true;
        reportRuntimeDiagnostic("collection.disabled", "Cannot change a hidden or disabled collection.", target.path, target.address);
      } else {
        const current = getAtPath(draft, target.path);
        if (!Array.isArray(current)) {
          commandRejected = true;
          reportRuntimeDiagnostic("collection.value", "Collection commands require an array value.", target.path, target.address);
        } else {
          const parsed = parseCollectionCommand(target, event, options.fields);
          if ("command" in parsed) {
            const commandResult = reduceCollectionCommand(current, parsed.command, {
              ...(target.config.min === undefined ? {} : { min: target.config.min }),
              ...(target.config.max === undefined ? {} : { max: target.config.max }),
            });
            if (commandResult.accepted) {
              updateTransactionCollectionKeys(target, parsed.command);
              patches = [{ op: "set", path: target.path, value: commandResult.value }];
            } else {
              commandRejected = true;
              reportRuntimeDiagnostic(commandResult.code, commandResult.message, target.path, target.address);
            }
          } else {
            commandRejected = true;
            reportRuntimeDiagnostic(parsed.code, parsed.message, target.path, target.address);
          }
        }
      }
    } else if (target?.config.kind === "wizard" && event.name.startsWith("wizard:")) {
      const visibleStages = target.branches.filter((branch) => branch.visible);
      const key = addressKey(target.address);
      const currentStage = activeWizards.get(key)?.stage ?? visibleStages[0]?.id;
      const currentIndex = visibleStages.findIndex((branch) => branch.id === currentStage);
      const currentBranch = visibleStages[currentIndex];
      const currentStageValidation = currentBranch === undefined
        ? emptyValidation
        : deriveValidation(result, draft, { address: currentBranch.address });
      let requestedStage: string | undefined;
      if (event.name === "wizard:next") requestedStage = visibleStages[currentIndex + 1]?.id;
      if (event.name === "wizard:previous") requestedStage = visibleStages[currentIndex - 1]?.id;
      if (event.name === "wizard:go") {
        const payload = eventRecord(event.payload);
        requestedStage = typeof event.payload === "string"
          ? event.payload
          : typeof payload?.["stage"] === "string"
            ? payload["stage"]
            : undefined;
      }

      let rejection: string | undefined;
      if (!target.visible || target.disabled) rejection = "Cannot navigate a hidden or disabled wizard.";
      else if (requestedStage === undefined || !visibleStages.some((branch) => branch.id === requestedStage)) rejection = "Wizard target is not a visible stage.";
      else if (event.name === "wizard:go" && target.config.navigation?.nonLinear !== true) rejection = "Non-linear wizard navigation is disabled.";
      else if (target.config.navigation?.validateCurrent === true && currentStageValidation.status !== "valid") rejection = "Current wizard stage must be valid before navigation.";
      else if (currentStage !== undefined && target.config.navigation?.guard !== undefined) {
        try {
          if (!target.config.navigation.guard(readonlyValue(draft), currentStage, requestedStage)) rejection = "Wizard navigation guard rejected the target stage.";
        } catch (error) {
          rejection = `Wizard navigation guard failed: ${error instanceof Error ? error.message : String(error)}`;
        }
      }

      if (rejection === undefined && requestedStage !== undefined) {
        activeWizards = new Map(activeWizards).set(key, { address: target.address, stage: requestedStage });
      } else if (rejection !== undefined) {
        commandRejected = true;
        reportRuntimeDiagnostic("wizard.navigation-rejected", rejection, target.path, target.address);
      }
    }

    let nextDraft = applyPatches(draft, patches);
    const matchingNodes = target === undefined || commandRejected
      ? []
      : allNodes.filter((node) => addressStartsWith(target.address, node.address)).sort((left, right) => right.address.length - left.address.length);
    for (const node of matchingNodes) {
      for (const transform of node.config.transforms ?? []) {
        const names = typeof transform.on === "string" ? [transform.on] : transform.on;
        if (!names.includes(event.name)) continue;
        const transformContext = {
          value: readonlyValue(nextDraft),
          context: readonlyValue(context),
          meta: meta(),
          path: target?.path ?? [],
          address: target?.address ?? [],
          fieldValue: target === undefined ? undefined : getAtPath(nextDraft, target.path),
          parentValue: target === undefined ? undefined : getAtPath(nextDraft, target.path.slice(0, -1)),
          event,
        };
        if (transform.when?.(transformContext) === false) continue;
        const derived = transform.apply(transformContext);
        nextDraft = applyPatches(nextDraft, derived);
        patches = [...patches, ...derived];
      }
    }
    for (const transform of commandRejected ? [] : result.schema.transforms ?? []) {
      const names = typeof transform.on === "string" ? [transform.on] : transform.on;
      if (!names.includes(event.name)) continue;
      const transformContext = {
        value: readonlyValue(nextDraft),
        context: readonlyValue(context),
        meta: meta(),
        path: target?.path ?? [],
        address: target?.address ?? [],
        fieldValue: target === undefined ? undefined : getAtPath(nextDraft, target.path),
        parentValue: target === undefined ? undefined : getAtPath(nextDraft, target.path.slice(0, -1)),
        event,
      };
      if (transform.when?.(transformContext) === false) continue;
      const derived = transform.apply(transformContext);
      nextDraft = applyPatches(nextDraft, derived);
      patches = [...patches, ...derived];
    }

    if (!commandRejected) {
      void runValidation(
        result,
        nextDraft,
        event.name,
        false,
        false,
        "form",
        target?.address,
        patches.map((patch) => patch.path),
      );
      validation = deriveValidation(result, nextDraft);
    }

    if (!Object.is(nextDraft, draft)) proposal = nextDraft;
    transactionEvents.push(event);
    transactionPatches.push(...patches);
    revision += 1;
    schedule();
  }

  async function validate(validateOptions: ValidateOptions = {}): Promise<ValidationSnapshot> {
    if (destroyed) return validation;
    const run = ++validationRun;
    const result = publishedEvaluation ?? evaluated(value);
    const pending = runValidation(
      result,
      value,
      validateOptions.event ?? "validate",
      true,
      validateOptions.reveal === true,
      validateOptions.scope,
    );
    validation = deriveValidation(result, value);
    dirtySnapshot = true;
    schedule();
    await pending;
    if (destroyed || run !== validationRun) return validation;
    const scopedValidation = deriveValidation(result, value, validateOptions.scope);
    validation = deriveValidation(result, value);
    revision += 1;
    schedule();
    return scopedValidation;
  }

  function serialize(): SerializedStagesState {
    const current = snapshot();
    const evaluatedCurrent = publishedEvaluation ?? evaluated(value);
    return {
      format: "stages",
      formatVersion: 1,
      schema: { id: evaluatedCurrent.schema.id, version: evaluatedCurrent.schema.version },
      value: encodeValue(current.value),
      baseline: encodeValue(readonlyValue(baseline)),
      meta: {
        touched: encodeJson([...touched.values()]),
        visited: encodeJson([...visited.values()]),
        activeWizards: encodeJson([...activeWizards.values()].map((state) => [state.address, state.stage])),
        collectionKeys: encodeJson([...collectionKeys.values()].map((state) => [state.address, state.keys])),
      },
    };
  }

  cachedSnapshot = {
    value: readonlyValue(value),
    revision,
    nodes: [],
    validation,
    diagnostics: [],
  };
  snapshot();

  return {
    getSnapshot: snapshot,
    subscribe(listener) {
      if (destroyed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeSelector(selector, listener, isEqual = Object.is) {
      if (destroyed) return () => undefined;
      let selected = selector(snapshot());
      const notifySelector = (): void => {
        const nextSelected = selector(snapshot());
        if (isEqual(selected, nextSelected)) return;
        const previousSelected = selected;
        selected = nextSelected;
        listener(nextSelected, previousSelected);
      };
      selectorListeners.add(notifySelector);
      return () => selectorListeners.delete(notifySelector);
    },
    update,
    dispatch,
    batch(run) {
      if (destroyed) return;
      batchDepth += 1;
      try {
        run();
      } finally {
        batchDepth -= 1;
        if (batchDepth === 0) schedule();
      }
    },
    validate,
    serialize,
    destroy() {
      destroyed = true;
      validationRun += 1;
      listeners.clear();
      selectorListeners.clear();
      activeWizards.clear();
      collectionKeys.clear();
      for (const record of validationRecords.values()) record.cancel();
      validationRecords.clear();
      proposal = undefined;
      transactionEvents = [];
      transactionPatches = [];
      transactionEvaluation = undefined;
      transactionCollectionKeys = undefined;
      publishedEvaluation = undefined;
      lastValidEvaluation = undefined;
      pendingAcceptance = undefined;
    },
  };
}
