import { applyPatches, getAtPath, pathsEqual } from "./path.js";
import { reduceCollectionCommand, type CollectionCommand } from "./collections.js";
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

function toJson(value: unknown, path: DataPath = [], seen = new Set<object>()): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    throw new TypeError(`Non-finite number at ${JSON.stringify(path)}.`);
  }
  if (typeof value !== "object") throw new TypeError(`Unsupported ${typeof value} at ${JSON.stringify(path)}.`);
  if (seen.has(value)) throw new TypeError(`Cyclic value at ${JSON.stringify(path)}.`);
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item, index) => toJson(item, [...path, index], seen));
    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`Unsupported object at ${JSON.stringify(path)}.`);
    }
    const output: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value as Readonly<Record<string, unknown>>)) {
      output[key] = toJson(item, [...path, key], seen);
    }
    return output;
  } finally {
    seen.delete(value);
  }
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
): RenderNodeSnapshot {
  const key = addressKey(node.address);
  const nodeIssues = issues.filter((issue) => pathsEqual(issue.path, node.path));
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
        validating: false,
        issues: nodeIssues,
        visibleIssues: nodeIssues,
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
          node.config.kind === "wizard"
            ? interaction.activeWizards.get(addressKey(node.address)) === branch.id
            : undefined,
        ))
      : node.children
        .filter((child) => child.visible)
        .map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues)),
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
      .map((child) => mapSnapshotNode(child, value, baseline, fields, interaction, issues)),
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
  const restored = options.state;
  let value = (restored === undefined ? options.value : restored.value) as TValue;
  const baseline = (restored === undefined ? options.value : restored.baseline) as TValue;
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
  let focused = new Map<string, NodeAddress>();
  let touched = new Map<string, NodeAddress>();
  let visited = new Map<string, NodeAddress>();
  let activeWizards = new Map<string, ActiveWizardState>();
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
  }
  let validation = emptyValidation;
  let validationRun = 0;
  let publishedEvaluation: EvaluatedSchema<TValue, TFields, TContext> | undefined;
  let transactionEvaluation: EvaluatedSchema<TValue, TFields, TContext> | undefined;
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

  function evaluated(currentValue: TValue) {
    const result = evaluateSchema({
      schema: schemaInput,
      value: readonlyValue(currentValue),
      context: readonlyValue(context),
      meta: meta(),
      fields: options.fields,
    });
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
      const key = `${item.code}:${JSON.stringify(item.path)}:${item.message}`;
      if (!reportedDiagnostics.has(key)) {
        reportedDiagnostics.add(key);
        options.onDiagnostic?.(item);
      }
    }
    return result;
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
    knownIdentities = nextIdentities;
  }

  function snapshot(): StagesSnapshot<TValue> {
    if (!dirtySnapshot) return cachedSnapshot;
    const result = evaluated(value);
    publishedEvaluation = result;
    reconcileInteraction(result.nodes);
    const previousNodes = indexSnapshotNodes(cachedSnapshot.nodes);
    const nextNodes = result.nodes
      .filter((node) => node.visible)
      .map((node) => mapSnapshotNode(node, value, baseline, options.fields, {
        focused,
        touched,
        visited,
        activeWizards: new Map([...activeWizards].map(([key, state]) => [key, state.stage])),
      }, validation.issues))
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
        const change: StagesChange<TValue> = {
          value: next,
          previousValue: value,
          patches: transactionPatches,
          events: transactionEvents,
          source: "user",
          transactionId: ++transactionId,
        };
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
    if (input.value !== undefined) value = input.value;
    if (input.context !== undefined) context = input.context;
    if (input.schema !== undefined) schemaInput = input.schema;
    publishedEvaluation = undefined;
    revision += 1;
    validationRun += 1;
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
      else if (target.config.navigation?.validateCurrent === true && validation.status !== "valid") rejection = "Current wizard state must be valid before navigation.";
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
    const candidates = validatorsFor(result.nodes).filter(({ node }) => {
      if (!node.visible) return false;
      if (validateOptions.scope === undefined || validateOptions.scope === "form") return true;
      return "path" in validateOptions.scope
        ? pathsEqual(node.path.slice(0, validateOptions.scope.path.length), validateOptions.scope.path)
        : addressStartsWith(node.address, validateOptions.scope.address);
    });
    validation = { ...emptyValidation, status: "pending", pendingCount: candidates.length, unknownCount: 0 };
    dirtySnapshot = true;
    schedule();
    const issueGroups = await Promise.all(candidates.map(async ({ node, validator }): Promise<readonly ValidationIssue[]> => {
      const contextValue = {
        value: readonlyValue(value),
        context: readonlyValue(context),
        meta: meta(),
        path: node.path,
        address: node.address,
        fieldValue: getAtPath(value, node.path),
        parentValue: getAtPath(value, node.path.slice(0, -1)),
        event: validateOptions.event ?? "validate",
        fieldState: {
          disabled: node.disabled,
          focused: focused.has(addressKey(node.address)),
          touched: touched.has(addressKey(node.address)),
          visited: visited.has(addressKey(node.address)),
        },
      };
      try {
        if (validator.when?.(contextValue) === false) return [];
        return await validator.validate(contextValue);
      } catch (error) {
        return [{
          id: `${validator.id}.rejected`,
          code: "validator-rejected",
          path: node.path,
          severity: "error",
          message: error instanceof Error ? error.message : String(error),
        }];
      }
    }));
    if (destroyed || run !== validationRun) return validation;
    const issues = issueGroups.flat();
    const hasErrors = issues.some((issue) => issue.severity === "error");
    validation = {
      status: hasErrors ? "invalid" : "valid",
      isValid: !hasErrors,
      issues,
      visibleIssues: validateOptions.reveal === false ? [] : issues,
      pendingCount: 0,
      unknownCount: 0,
    };
    revision += 1;
    schedule();
    return validation;
  }

  function serialize(): SerializedStagesState {
    const current = snapshot();
    const evaluatedCurrent = publishedEvaluation ?? evaluated(value);
    return {
      format: "stages",
      formatVersion: 1,
      schema: { id: evaluatedCurrent.schema.id, version: evaluatedCurrent.schema.version },
      value: toJson(current.value),
      baseline: toJson(baseline),
      meta: {
        touched: toJson([...touched.values()]),
        visited: toJson([...visited.values()]),
        activeWizards: toJson([...activeWizards.values()].map((state) => [state.address, state.stage])),
        collectionKeys: [],
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
      proposal = undefined;
      transactionEvents = [];
      transactionPatches = [];
      transactionEvaluation = undefined;
      publishedEvaluation = undefined;
    },
  };
}
