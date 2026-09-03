# Stages v1.0 TypeScript Rewrite — Architecture and Delivery Plan

Status: accepted for implementation; implementation in progress

Baseline: [`CURRENT_IMPLEMENTATION_API.md`](./CURRENT_IMPLEMENTATION_API.md)

Implementation started in [`packages/core`](../packages/core). The first slice
establishes the strict public contract, compile-time API fixtures, immutable path
and patch primitives, recursive dynamic schema evaluation, diagnostics, and a
controlled-controller spike. Run `npm run check:v1` for contract checks and
`npm run test:v1` for the executable core tests. The controller and serialized
state APIs in this slice are foundations, not a declaration that later phase
exit criteria are complete. The controller foundation now also includes
explicit row/stage snapshot branches, dynamic metadata reconciliation,
structurally shared selector subscriptions, per-controller queues, and stale
async-validation protection. Collection events now cover immutable
add/remove/replace/duplicate/move/sort commands, constraints, union defaults,
and rejection diagnostics. Nested wizard snapshots expose active stages and
navigation capabilities, with metadata-only next/previous/go events, guards,
and durable active-stage recreation. Validation is indexed by stable validator
and node identity, with event and reveal policies, selective dependency
invalidation, conditional exclusion, scoped and per-stage aggregation, async
race protection, and deterministic rejection issues.
Engine-owned collection row keys now follow accepted move/sort/duplicate
commands, remain isolated from rejected controlled proposals, preserve row
interaction identity, and round-trip through serialized state. Dynamic wizard
stage visibility also reconciles the active stage to a valid fallback.
The persistence boundary now validates the versioned envelope at runtime,
encodes JSON with precise error codes and paths, supports explicit value
codecs for richer domain types, applies ordered schema migrations to value and
baseline, and rejects ambiguous, cyclic, malformed, or failing migrations.
The adapter layer now includes a dependency-free DOM reference renderer,
native text/number/checkbox field definitions, accessible issue wiring, React
lifecycle and selector-bound field helpers, and a reusable adapter contract
harness. Executable Vue-style and Angular-style proofs consume the same opaque
views, snapshots, subscriptions, and events without core changes.
Async validators now receive a framework-neutral cooperative cancellation
signal; dependency invalidation, superseding runs, structural removal, and
controller teardown cancel pending work in addition to suppressing stale
results. Invalid dynamic schema revisions retain the previous valid normalized
tree and publish structured factory, resolver, or root-identity diagnostics
until configuration recovers. Root validators now share the same indexed
execution model as node validators, `init` policies run at controller creation,
and form reset is a controlled baseline proposal with reset transaction
provenance and cleared interaction metadata. Reducer and transform failures are
now isolated as rejected value transactions with structured diagnostics.
Normalization rejects malformed transform and validator policies, duplicate
validator identities, unsafe dependency paths, and non-object resolver props;
dynamic failures retain the previous valid tree until recovery. Disabled-node
validation is now an explicit per-validator opt-in, and malformed synchronous
or asynchronous issue results are converted into deterministic rejection
issues at the runtime boundary. Validation reveal state is now durable by node
address and round-trips through recreation without persisting validation
results or ephemeral focus state. Runtime normalization now also guards every
structural boundary: unknown kinds, malformed child arrays, union variants,
wizard stages, and invalid collection item-key results become diagnostics and
cannot displace a previously valid dynamic tree. Registry-level field
validators now run as reusable intrinsic validators with engine-assigned paths
and independent identities from node-configured validators. Registered
extension namespaces can now drive dynamic configuration, update independently,
and round-trip richer metadata through explicit codecs without opening an
arbitrary persistence channel. Reusing a stable node address with an
incompatible kind or field type now emits a transition diagnostic and discards
all identity-bound interaction and validation state.
Collection mutation events can now target stable row addresses directly, and
the React adapter exposes the documented selector-based
`useStagesCollection()` binding with typed item values and add/remove/move
commands. The React `useStagesWizard()` binding exposes visible stage
descriptors, per-stage validation, navigation capabilities, and guarded
previous/next/go commands from the same selector-based contract.
DOM mounts preserve the active field across controller-driven rerenders and
expose path-based focus plus first-visible-error navigation on their mounted
handle.
A production-style vanilla wizard now exercises the public core and DOM
packages with controlled updates, scoped validation, accessible error focus,
navigation, and serialization; its strict typecheck runs as part of
`npm run check:v1`.
A production-style React wizard exercises controlled `useStages()` lifecycle,
typed custom fields, stable collection-row commands, wizard bindings, and
application-owned error focus against React 19. Controller teardown is deferred
across React Strict Mode effect replay and still completes after a real unmount.
Release verification now packs all four v1 packages, validates their tarball
contents and export maps, installs them offline into an isolated consumer, and
checks runtime imports, declaration consumption, controlled updates, adapter
notifications, serialization, and recreation against the packed artifacts.

## 1. Outcome

Stages v1.0 will be a dependency-free, framework-agnostic TypeScript form engine. A single `stages()` factory will create an isolated controller for anything from one field to deeply nested forms, collections, and wizards.

The engine will own form behavior and interaction metadata. It will not own the application's canonical value and it will not render framework components. Framework adapters will subscribe to the engine, render its node snapshot, and connect any native or custom component to the same event API.

The rewrite is intentionally not API compatible with `react-stages` 0.x. It will preserve the useful ideas—configuration, headless rendering, arbitrary fields, event-driven behavior, nested data, validation, and wizards—without preserving React-specific contracts or accidental behavior.

## 2. Design principles

1. **One engine entry point.** `stages()` replaces the orchestration previously split between `Stages` and `Form`.
2. **Controlled value.** The application supplies the canonical value and accepts or rejects proposed changes.
3. **Pure core, imperative shell.** Schema normalization, event reduction, transforms, validation derivation, and navigation decisions are pure functions. The controller only schedules transactions, runs effects, and manages subscriptions.
4. **Framework-neutral snapshots.** The core imports no DOM or framework APIs and never creates React, Vue, Angular, or other view objects.
5. **Recursive by construction.** Groups, collections, and wizards all use one recursive node model and can be nested without special subform boundaries.
6. **Events are the extension point.** Input parsing, cleanup, computed values, cross-field changes, validation, collection actions, and wizard navigation all flow through named events.
7. **Immutable updates.** Consumer values and configuration are never mutated. Unchanged branches preserve reference identity.
8. **Validity is never guessed.** The snapshot distinguishes valid, invalid, pending, and not-yet-known validation states.
9. **Serializable state has a versioned contract.** Persisted state contains JSON-safe data and durable interaction state, never functions, components, pending work, or browser handles.
10. **No module-global instance state.** Request IDs, batching, caches, metadata, and cancellation belong to one controller.
11. **No runtime utility dependencies.** Path access, immutable updates, equality, ordering, and scheduling use small purpose-built internal functions.
12. **Configuration remains dynamic.** Pure schema factories, predicates, derived props, and conditional validators can react to controlled value, external context, and controller metadata without depending on framework renders.

## 3. Scope

### 3.1 Required for v1.0

- Strict TypeScript core with no runtime dependencies.
- `stages()` controller and fully typed public contracts.
- Controlled values and immutable change proposals.
- Recursive fields, groups, collections, collection variants, wizards, and stages.
- Pure dynamic schema factories, conditional nodes, derived props, dynamic disabled state, and conditional validators.
- Arbitrary named events and event transforms.
- Synchronous and asynchronous validation with full-form validity status.
- Internal automatic batching and an explicit batch API.
- Framework-neutral render snapshots and field/component registration.
- Versioned serialization and recreation.
- Dirty, touched, visited, disabled, visible, focused, and validating metadata.
- Cancellation and stale-result protection for asynchronous validation.
- A reference DOM adapter and a first-party React adapter.
- Adapter contract tests demonstrating that Vue- and Angular-style integrations need no core changes.
- Migration documentation from the concepts in 0.x.

### 3.2 Deliberately outside the core

- Markup, styling, accessibility policy, and error message rendering.
- URL/hash routing.
- Browser storage and autosave policy.
- Focus management and scrolling.
- Remote option fetching and application data loading.
- Analytics and devtools UI.
- Framework lifecycle management.

These behaviors can be implemented by adapters or subscribers. The core will expose the events, state, and serialization hooks they need.

### 3.3 Not planned as v1.0 core features

- A 0.x compatibility layer.
- Runtime fieldset/template registries. Plain TypeScript functions can compose configuration before it reaches the engine.
- A special `subform` node. Every container is already recursively nestable.
- A special interface-state data channel mixed into form data. UI-only state belongs to controller metadata or an adapter extension.
- Built-in persistence, undo history, hash routing, debugger UI, or remote-option cache.
- Arbitrary Lodash-style string paths.

These can be reconsidered as optional packages after the v1 core contract is stable.

### 3.4 Goal traceability

| Rewrite goal | Planned contract |
| --- | --- |
| Fully typed TypeScript rewrite | Strict compiler settings, registry inference, readonly inputs, and compile-time API fixtures. |
| Framework agnostic | Framework-neutral core snapshots plus a documented adapter contract. |
| Functional programming | Pure normalization/reduction/derivation with a small stateful controller shell. |
| No Lodash or similar libraries | Segment-array paths and purpose-built immutable utilities; zero third-party core runtime dependencies. |
| One `stages()` root | One controller factory; wizards are recursive config nodes. |
| Any native or custom field | Typed field registry with opaque adapter-specific view tokens and arbitrary events. |
| Controlled input | Changes are proposals until the owner supplies the accepted value back through `update`. |
| Unlimited container nesting | One recursive node union and traversal for groups, collections, and wizards. |
| Serializable/recreatable state | Versioned JSON envelope, codecs, schema versions, migrations, and durable metadata. |
| Flexible event validation plus full validity | Per-validator event policies and a four-state aggregate validity contract. |
| Event-based transforms | Named events and deterministic transforms returning immutable patches. |
| Internal batching | Per-controller transactions, automatic microtask flush, explicit `batch`, and selector subscriptions. |
| Config-first simple-to-complex use | Immutable recursive schema with typed composition, predicates, transforms, and validators. |
| Dynamic configuration | Pure schema factories and explicit resolvers receive controlled value, external context, and readonly controller metadata. |

## 4. Proposed public API

The following is an API direction, not final declaration-file syntax. The implementation should refine names through compile-tested examples before freezing them.

```ts
const form = stages<ApplicationValue, AppFieldViews, ApplicationContext>({
  schema: {
    id: "subsidy-application",
    version: 1,
    nodes: applicationConfig,
  },
  value,
  fields,
  context: { locale: "de-CH" },
  onChange(change) {
    // The owner decides whether to accept the proposed value.
    setValue(change.value);
  },
});

const unsubscribe = form.subscribe(() => {
  render(form.getSnapshot());
});

form.dispatch({
  name: "input",
  target: { kind: "field", path: ["person", "email"] },
  payload: "person@example.com",
});

// Synchronize value and external context accepted or replaced by the owner.
form.update({ value, context: { locale: "de-CH" } });
```

The controller should expose only cohesive engine operations:

```ts
interface StagesController<
  TValue,
  TFields = Readonly<Record<string, unknown>>,
  TContext = unknown,
> {
  getSnapshot(): StagesSnapshot<TValue>;
  subscribe(listener: () => void): () => void;
  update(input: StagesUpdate<TValue, TFields, TContext>): void;
  dispatch(event: StagesEvent): void;
  batch(run: () => void): void;
  validate(options?: ValidateOptions): Promise<ValidationSnapshot>;
  serialize(): SerializedStagesState;
  destroy(): void;
}

interface StagesUpdate<TValue, TFields, TContext> {
  value?: TValue;
  context?: TContext;
  schema?: StagesSchemaInput<TValue, TFields, TContext>;
}
```

`stages()` is the only core constructor. Instance methods are not alternative form engines. Framework packages may expose lifecycle helpers, but they must wrap an existing controller rather than introduce another source of form state.

### 4.1 Controlled-value contract

- `options.value` or the value decoded from `options.state` is the initial canonical value.
- Events create a proposed next value and emit one structured `onChange` notification per transaction.
- The proposal does not become canonical until the owner supplies it through `update({ value })`.
- The owner may normalize, replace, or reject a proposal.
- A transaction keeps a private draft so several events in the same batch reduce in order against one value.
- Controller-owned metadata, such as focus or the active wizard stage, may change without a value change.
- `context` and explicit schema input are controlled like `value`; `update({ value, context, schema })` applies them atomically and triggers one dynamic reevaluation/subscriber flush.
- Context/schema-only updates never call value `onChange`.
- `onChange` receives one named object, never positional arguments.

```ts
interface StagesChange<TValue> {
  value: TValue;
  previousValue: TValue;
  patches: readonly StagesPatch[];
  events: readonly StagesEvent[];
  source: "user" | "external" | "restore" | "reset";
  transactionId: number;
}
```

The public contract must define callback and subscription order, including what happens when `update()` is called synchronously inside `onChange`.

### 4.2 Paths and node addresses

Data paths will be segment arrays:

```ts
type DataPath = readonly (string | number)[];
```

This avoids ambiguous dots/brackets, removes the Lodash contract, supports arbitrary property names, and is straightforward to serialize. Configuration IDs must reject `__proto__`, `prototype`, and `constructor` wherever an object property could be written.

The engine also needs a separate `NodeAddress`. A data path identifies a value; a node address identifies rendered/controller state. Collection entries use stable row IDs in node addresses so touched/errors/component identity survive moves. Snapshots expose both forms and adapters must not invent path strings.

## 5. Configuration model

### 5.1 Recursive discriminated union

Structural kinds and registered field types must be separate. This avoids reserving field names such as `group` or `wizard`.

```ts
interface DynamicMetaSnapshot {
  revision: number;
  isDirty: boolean;
  touched: readonly NodeAddress[];
  visited: readonly NodeAddress[];
  activeWizards: ReadonlyMap<NodeAddress, string>;
  extensions: Readonly<Record<string, unknown>>;
}

interface DynamicConfigContext<TValue, TContext = unknown> {
  value: DeepReadonly<TValue>;
  context: DeepReadonly<TContext>;
  meta: DeepReadonly<DynamicMetaSnapshot>;
}

interface NodeResolverContext<TValue, TContext = unknown>
  extends DynamicConfigContext<TValue, TContext> {
  path: DataPath;
  address: NodeAddress;
  fieldValue: unknown;
  parentValue: unknown;
}

type NodePredicate<TValue, TContext = unknown> = (
  context: NodeResolverContext<TValue, TContext>,
) => boolean;

type DerivedProps<TValue, TContext = unknown> = (
  context: NodeResolverContext<TValue, TContext>,
) => Readonly<Record<string, unknown>>;

interface StagesSchema<TValue, TFields, TContext = unknown> {
  id: string;
  version: number;
  nodes: readonly NodeConfig<TValue, TFields, TContext>[];
}

type StagesSchemaFactory<TValue, TFields, TContext = unknown> = (
  context: DynamicConfigContext<TValue, TContext>,
) => StagesSchema<TValue, TFields, TContext>;

type StagesSchemaInput<TValue, TFields, TContext = unknown> =
  | StagesSchema<TValue, TFields, TContext>
  | StagesSchemaFactory<TValue, TFields, TContext>;

type NodeConfig<TValue, TFields, TContext = unknown> =
  | FieldNodeConfig<TValue, TFields, TContext>
  | GroupNodeConfig<TValue, TFields, TContext>
  | CollectionNodeConfig<TValue, TFields, TContext>
  | WizardNodeConfig<TValue, TFields, TContext>;

interface FieldNodeConfig<TValue, TFields, TContext = unknown> {
  kind: "field";
  id: string;
  type: keyof TFields;
  props?: Readonly<Record<string, unknown>>;
  deriveProps?: DerivedProps<TValue, TContext>;
  when?: boolean | NodePredicate<TValue, TContext>;
  disabled?: boolean | NodePredicate<TValue, TContext>;
  transforms?: readonly TransformConfig<TValue, TContext>[];
  validators?: readonly ValidatorConfig<TValue, TContext>[];
}

interface GroupNodeConfig<TValue, TFields, TContext = unknown> {
  kind: "group";
  id: string;
  nodes: readonly NodeConfig<TValue, TFields, TContext>[];
  when?: boolean | NodePredicate<TValue, TContext>;
  disabled?: boolean | NodePredicate<TValue, TContext>;
  transforms?: readonly TransformConfig<TValue, TContext>[];
  validators?: readonly ValidatorConfig<TValue, TContext>[];
}

interface CollectionNodeBase<TValue, TContext = unknown> {
  kind: "collection";
  id: string;
  min?: number;
  max?: number;
  itemKey?: (item: Readonly<unknown>, index: number) => string;
  when?: boolean | NodePredicate<TValue, TContext>;
  disabled?: boolean | NodePredicate<TValue, TContext>;
  transforms?: readonly TransformConfig<TValue, TContext>[];
  validators?: readonly ValidatorConfig<TValue, TContext>[];
}

type CollectionNodeConfig<TValue, TFields, TContext = unknown> =
  CollectionNodeBase<TValue, TContext> &
  (
    | {
        nodes: readonly NodeConfig<TValue, TFields, TContext>[];
        discriminator?: never;
        variants?: never;
      }
    | {
        nodes?: never;
        discriminator: string;
        variants: Readonly<
          Record<string, CollectionVariantConfig<TValue, TFields, TContext>>
        >;
      }
  );

interface CollectionVariantConfig<TValue, TFields, TContext = unknown> {
  nodes: readonly NodeConfig<TValue, TFields, TContext>[];
}

interface WizardNodeConfig<TValue, TFields, TContext = unknown> {
  kind: "wizard";
  id: string;
  stages: readonly StageNodeConfig<TValue, TFields, TContext>[];
  initialStage?: string;
  navigation?: WizardNavigationConfig<TValue>;
  when?: boolean | NodePredicate<TValue, TContext>;
  disabled?: boolean | NodePredicate<TValue, TContext>;
  transforms?: readonly TransformConfig<TValue, TContext>[];
  validators?: readonly ValidatorConfig<TValue, TContext>[];
}

interface StageNodeConfig<TValue, TFields, TContext = unknown> {
  id: string;
  nodes: readonly NodeConfig<TValue, TFields, TContext>[];
  when?: boolean | NodePredicate<TValue, TContext>;
  disabled?: boolean | NodePredicate<TValue, TContext>;
}
```

Every group, collection, wizard, and stage contributes its ID to the data path. This keeps nested data deterministic and follows the current library's general model. If transparent/presentational containers are needed, they should be a later explicit node kind rather than a flag that changes path semantics.

Homogeneous collections put their repeated child schema directly in `nodes`. Every array entry is an implicit object scope, so those child IDs resolve beneath the current row without adding another data-path segment:

```ts
{
  kind: "collection",
  id: "members",
  nodes: [
    { kind: "field", id: "name", type: "text" },
    { kind: "field", id: "email", type: "text" },
  ],
}
```

Union collections omit `nodes` and instead declare a discriminator plus named `variants`:

```ts
{
  kind: "collection",
  id: "contacts",
  discriminator: "kind",
  variants: {
    person: {
      nodes: [
        { kind: "field", id: "firstName", type: "text" },
        { kind: "field", id: "lastName", type: "text" },
      ],
    },
    company: {
      nodes: [
        { kind: "field", id: "companyName", type: "text" },
      ],
    },
  },
}
```

This produces entries such as `{ kind: "person", firstName: "..." }`. The discriminator property is part of domain data and selects exactly one variant. A collection must define either `nodes` or `variants`, never both. This replaces the current implicit `__typename` union behavior with an explicit contract.

### 5.2 Dynamic configuration

Dynamic configuration is a required v1 capability. `stages()` accepts either an immutable schema object or a pure `StagesSchemaFactory`. Node-level resolvers cover changing properties without rebuilding stable structure; the schema factory covers genuinely structural changes such as adding stages or selecting a different subtree.

Every dynamic callback receives readonly inputs:

- `value`: the current transaction draft while reducing an event and the latest externally accepted controlled value otherwise;
- `context`: an externally controlled application value for locale, permissions, feature flags, or previously loaded async data;
- `meta`: a readonly controller snapshot for durable UI state such as touched/visited nodes and active wizard stages;
- node resolvers additionally receive `path`, stable `address`, `fieldValue`, and `parentValue`.

The supported node-level mechanisms are explicit:

- `deriveProps(context)` returns props that are shallow-merged over static `props` for the registered view;
- `when(context)` controls whether a field/container is applicable and appears in render snapshots;
- `disabled(context)` controls engine disabled state and cascades from a disabled container to its descendants;
- validator `when(context)` controls whether that validator participates;
- transforms and navigation guards receive the same controlled value/context model.

For example, the behavior in `demo/pages/dynamicfields.jsx` is expressed without recreating its stable six-field structure:

```ts
const dynamicFieldsSchema = {
  id: "dynamic-fields",
  version: 1,
  nodes: [
    { kind: "field", id: "field1", type: "text" },
    {
      kind: "field",
      id: "field2",
      type: "text",
      deriveProps: ({ value }) => ({
        required: Boolean(value.field1),
      }),
      validators: [
        {
          id: "field2.required",
          on: ["init", "input", "submit"],
          when: ({ value }) => Boolean(value.field1),
          validate: required("Enter Field 2."),
        },
      ],
    },
    { kind: "field", id: "field3", type: "text" },
    {
      kind: "field",
      id: "field4",
      type: "text",
      disabled: ({ value }) => !value.field3,
    },
    { kind: "field", id: "name", type: "text" },
    {
      kind: "field",
      id: "age",
      type: "number",
      deriveProps: ({ value }) => ({
        label: value.name ? `What is the age of ${value.name}?` : "Age",
      }),
    },
  ],
} satisfies StagesSchema<DynamicFieldsValue, typeof fields>;
```

Conditional fields use `when` instead of a render-time omission:

```ts
{
  kind: "field",
  id: "companyName",
  type: "text",
  when: ({ value }) => value.customerType === "company",
}
```

A `when: false` node is dormant: it is absent from render snapshots and full-form validation, but its controlled value and interaction metadata are retained so toggling it back on does not lose user work. Removing a node from a schema factory result is a structural removal: its controller metadata is discarded, while domain data remains untouched unless an explicit transform removes it.

Draft-based evaluation is used to validate and describe a proposed transaction, but it does not make the draft canonical. Published value-dependent configuration remains based on the last externally accepted value. If `onChange` synchronously supplies the proposal through `update({ value })`, acceptance and dynamic publication are coalesced into the same subscriber flush; if the owner rejects it, the draft-derived configuration is discarded.

For structural changes, a schema factory is guaranteed—not optional:

```ts
const insuranceSchema: StagesSchemaFactory<
  InsuranceValue,
  typeof fields,
  InsuranceContext
> = ({ value, context }) => ({
  id: "insurance",
  version: 1,
  nodes: [
    productField,
    ...(value.product === "vehicle" ? vehicleNodes : propertyNodes),
    ...(context.features.includes("broker") ? brokerNodes : []),
  ],
});
```

Factories and resolvers are synchronous and pure. The schema factory runs at most once per transaction, and each resolver runs at most once for its node/address. Async work happens outside the schema and enters through controlled `context`. The engine reevaluates dynamic callbacks after value, context, exposed metadata, or explicit schema input changes, then recursively normalizes and diffs the result before publishing a snapshot.

Stable kind/ID/address identity preserves compatible controller metadata and snapshot references across reevaluation. Removing, renaming, retyping, or moving a structural node is treated as removal plus addition; the engine emits diagnostics for incompatible identity reuse. No dynamic callback may mutate inputs, dispatch events, start async work, or depend on framework render timing.

Applications may also replace a static schema or factory through `update({ schema })`. Runtime `modifyConfig`, partial recursive expansion, string templates, and magic `*Fn` prop names will not return.

### 5.3 Schema validation

Normalization fails early with structured diagnostics for:

- duplicate sibling IDs or stage IDs;
- unsafe property keys;
- unknown field types;
- invalid collection constraints;
- collections that define both or neither of `nodes` and `variants`;
- union collections with an unsafe/missing discriminator or invalid variants;
- invalid wizard targets;
- invalid event and validator definitions;
- unstable or missing identities required for state reconciliation;
- a schema factory changing root ID/version during normal reevaluation;
- resolver results with invalid prop/output shapes.

Development builds may freeze normalized configuration to detect mutation. Production behavior must not depend on freezing.

Factory/resolver exceptions and invalid dynamic results are reported as structured controller diagnostics—with callback/node identity and revision—through `snapshot.diagnostics` and optional `onDiagnostic`. The previous valid normalized schema remains active; the engine never publishes a partially normalized dynamic tree.

## 6. Field and component registration

A field definition describes how a field participates in the engine. The view token remains opaque to core code and is interpreted by a framework adapter.

```ts
interface FieldDefinition<TValue, TProps, TView> {
  view: TView;
  initialValue?: TValue | (() => TValue);
  reduce?: FieldEventReducer<TValue>;
  validators?: readonly FieldValidator<TValue, TProps>[];
}

type FieldValidationIssue = Omit<ValidationIssue, "path">;

interface FieldValidator<TValue, TProps> {
  id: string;
  validate(
    value: DeepReadonly<TValue>,
    props: DeepReadonly<TProps>,
  ): readonly FieldValidationIssue[];
}
```

The registry is passed to `stages()`. Its keys form the allowed `type` union in field configuration, and each entry carries its own value, props, event-payload, and view-token types. Public implementation code uses `unknown` at untrusted boundaries rather than `any`.

Registry validators express synchronous constraints intrinsic to a field type.
They run on initialization, explicit validation, and relevant field/form events.
The engine attaches the normalized field path to every returned issue, so one
definition can be reused at any nesting depth. They use the same result
validation, disabled-node exclusion, aggregation, and reveal state as schema
validators, while their cache identity is namespaced separately from node
validator IDs. Presentation timing beyond explicit `validate({ reveal: true })`
can be configured with a node validator when needed.

A rendered field snapshot keeps engine state and user props separate:

```ts
interface FieldSnapshot<TFieldValue = unknown, TView = unknown> {
  kind: "field";
  type: string;
  view: TView;
  path: DataPath;
  address: NodeAddress;
  value: TFieldValue;
  initialValue: TFieldValue;
  props: Readonly<Record<string, unknown>>;
  state: {
    disabled: boolean;
    visible: boolean;
    focused: boolean;
    touched: boolean;
    dirty: boolean;
    validating: boolean;
    issues: readonly ValidationIssue[];
    visibleIssues: readonly ValidationIssue[];
  };
}
```

`FieldSnapshot.props` is the resolved result of static `props` shallow-merged with `deriveProps` for the snapshot's current value/context/meta revision. Adapters receive the snapshot plus a typed `emit(name, payload)` function. User configuration cannot overwrite engine event handlers, values, validity, or identity as it can in 0.x.

Custom rich-text editors, date pickers, maps, uploads, and other non-native controls use the exact same registry and event contracts as text inputs. The core makes no assumptions about DOM events or string values.

## 7. Event and transform model

All interactions enter through a named event:

```ts
interface StagesEvent<TPayload = unknown> {
  name: string;
  target: StagesEventTarget;
  payload?: TPayload;
  source?: "user" | "adapter" | "system";
}
```

The core will document conventional names such as `init`, `input`, `change`, `focus`, `blur`, `submit`, `reset`, `collection:add`, `collection:remove`, `collection:move`, `wizard:next`, `wizard:previous`, and `wizard:go`. Custom names remain valid.

One event transaction runs in this order:

1. Resolve the target against the normalized schema and current collection keys.
2. Let the registered field definition decode/reduce its raw event.
3. Apply matching target transforms in declaration order.
4. Apply matching ancestor and root transforms, nearest ancestor first.
5. Apply the returned patches immutably to the transaction draft.
6. Reevaluate the schema factory and node resolvers once against the transaction draft, controlled context, and metadata.
7. Normalize/diff structural changes and reconcile conditional nodes, collection addresses, and wizard state.
8. Recompute or invalidate validation results affected by value or configuration changes.
9. Queue asynchronous effects with per-instance cancellation tokens.
10. Commit controller metadata and emit at most one value change and one subscriber notification at flush.

Transforms are synchronous and pure in v1. They receive readonly context and return patches; they never receive setters or mutate data.

```ts
interface TransformConfig<TValue, TContext = unknown> {
  on: string | readonly string[];
  when?: (context: TransformContext<TValue, TContext>) => boolean;
  apply(
    context: TransformContext<TValue, TContext>,
  ): readonly StagesPatch[];
}
```

Examples of 0.x behavior expressed as events:

| 0.x feature | v1 event-based equivalent |
| --- | --- |
| `filter` / `cast.data` | field reducer or `input` transform |
| `cleanUp` / `precision` | `blur` transform |
| `clearFields` | `change` transform returning remove patches |
| `computedValue` | ancestor/root `change` transform returning set patches |
| collection sort | collection event transform |
| action callback | application event followed by `validate()` when needed |
| custom validation event predicates | dispatch the custom event or use validator `when` |

Transforms run once per matching source event. Derived patches do not recursively retrigger the same transform. If cascading events are later allowed, they must have explicit loop detection and a documented maximum depth.

Patches are applied sequentially: the field reducer first, then target and
ancestor transforms from nearest to farthest, then root transforms. When paths
overlap, the later patch observes and writes over the earlier draft. A reducer,
predicate, transform, or patch failure rejects all value patches from that
event and publishes a diagnostic; later transforms do not run.

## 8. Validation model

Validation execution and issue presentation are separate concerns.

Each validator has a stable ID, dependencies, event policy, optional presentation policy, and a synchronous or asynchronous function. It returns zero or more structured issues rather than React nodes or copies of field configuration.

```ts
interface ValidatorConfig<TValue, TContext = unknown> {
  id: string;
  on: string | readonly string[];
  revealOn?: string | readonly string[];
  includeDisabled?: boolean;
  when?: (
    context: ValidationContext<TValue, TContext>,
  ) => boolean;
  dependencies?: readonly DataPath[];
  validate(
    context: ValidationContext<TValue, TContext>,
  ):
    | readonly ValidationIssue[]
    | Promise<readonly ValidationIssue[]>;
}

interface ValidationContext<TValue, TContext = unknown>
  extends NodeResolverContext<TValue, TContext> {
  event: string;
  fieldState: Readonly<FieldInteractionState>;
}

interface ValidationIssue {
  id: string;
  code: string;
  path: DataPath;
  severity: "error" | "warning";
  message?: string;
  meta?: Readonly<Record<string, unknown>>;
}

type ValidationStatus = "valid" | "invalid" | "pending" | "unknown";

interface ValidationSnapshot {
  status: ValidationStatus;
  isValid: boolean; // Exactly: status === "valid"
  issues: readonly ValidationIssue[];
  visibleIssues: readonly ValidationIssue[];
  pendingCount: number;
  unknownCount: number;
}
```

Rules:

- Sync validators configured for the current event run inside the same transaction.
- Async validators are cancellable and keyed by controller, validator, target address, dependencies, and value revision.
- A changed dependency makes the old result stale immediately.
- Stale async completions cannot update current state.
- Rejections become a configurable validation/system issue; they are never unhandled.
- Validator `when` is reevaluated from the same draft/context as dynamic configuration. A false validator is excluded rather than considered unknown.
- Validators attached to disabled nodes are excluded unless `includeDisabled` is explicitly true.
- When a validator becomes inapplicable, pending work is cancelled and its issues are removed. When it becomes applicable again, it is stale until its event policy or `validate()` runs it for the current dependencies.
- Event policy determines when a validator runs. Presentation policy determines when its issue becomes visible.
- A validator that has not run for the current dependencies makes aggregate status `unknown`, not valid.
- Pending work makes aggregate status `pending` unless a current error already makes it `invalid`; counts remain available in either case.
- `validate()` runs all applicable validators for a scope, regardless of their normal event policy, and resolves only when the result for that revision is definitive.
- `isValid` is true only for a complete, current, error-free result. Consumers never need to inspect error-object shapes.
- Malformed synchronous or asynchronous validator results become deterministic `validator-rejected` issues rather than escaping the controller.

Full-form validity includes every currently applicable node, including inactive stages of a wizard. A node excluded by `when` does not participate. Disabled-field participation must be explicit in validator configuration; it must not vary by adapter. Per-stage and per-subtree validity are derived from the same index for navigation and progress.

## 9. Groups, collections, and wizards

All containers are handled by the same recursive walker and reducer. There are no top-level-only expansion rules.

### 9.1 Collections

Collections provide typed commands for add, remove, replace, duplicate, move, and sort. Constraint failures such as `min` and `max` produce a rejected command result or issue; they never report a change when nothing changed.

A homogeneous collection repeats its direct `nodes` for every row. A union collection selects one entry from `variants` using its configured discriminator. Adding a union entry requires a variant key, and the engine writes the corresponding discriminator value into the new domain object.

Row identity is metadata, not injected into domain data. The default strategy preserves keys by accepted array position. Applications that reorder or replace items externally should provide `itemKey`. Duplicate keys are a schema/runtime diagnostic.

Collection-wide validation—uniqueness, counts, sums, and cross-row rules—uses ordinary validators. There is no separate rule language with different semantics.

### 9.2 Wizards

A wizard keeps its active stage in controller metadata while its stages shape domain data. Navigation is event-driven and addressable at any nesting depth.

The snapshot exposes visible stages, active stage, per-stage validation status, and navigation capabilities. A navigation policy can require current-stage validation, allow non-linear navigation, or run a pure guard. The core does not change URLs; a router adapter can synchronize wizard events and serialized active-stage state with any routing system.

Inactive stages remain in the render snapshot as descriptors, allowing adapters to render one stage, all stages, tabs, accordions, or a progress overview. The adapter—not the core—chooses markup and mounting policy.

## 10. Batching and subscriptions

Every controller has its own queue and scheduler.

- Synchronous dispatches in one JavaScript turn are automatically batched in a microtask.
- `batch(fn)` groups dispatches across library/application helper calls.
- One transaction produces at most one `onChange` call and one general subscription notification.
- Metadata-only events do not call `onChange`.
- Async completions create new transactions and can themselves be batched.
- Dispatch during a callback queues a following transaction; reducers are never re-entered.
- `destroy()` cancels work, clears scheduled flushes, and makes later async completions inert.

Snapshots use structural sharing. The adapter contract includes selector subscriptions so a field component rerenders only when its selected field snapshot changes. Performance tests must assert notification counts, not only wall-clock timing.

An opt-in synchronous flush may be considered for framework integration, but it must not become the default and must preserve transaction semantics.

## 11. Serialization and recreation

The default persistence boundary is JSON. `serialize()` returns a versioned JSON-safe envelope:

```ts
interface SerializedStagesState {
  format: "stages";
  formatVersion: 1;
  schema: { id: string; version: number };
  value: JsonValue;
  baseline: JsonValue;
  meta: {
    touched: readonly SerializedNodeAddress[];
    visited: readonly SerializedNodeAddress[];
    revealedValidation: readonly SerializedNodeAddress[];
    activeWizards: readonly [SerializedNodeAddress, string][];
    collectionKeys: readonly [SerializedNodeAddress, readonly string[]][];
    extensions?: Readonly<Record<string, JsonValue>>;
  };
}
```

It excludes focus, rendered views, callbacks, schema objects/factories, external context, subscriptions, pending requests, abort controllers, option data, and cached validation results. Validation and dynamic configuration are recomputed on recreation. Dirty state is derived by comparing value with the serialized baseline.

`stages()` accepts either a controlled initial `value` or a serialized `state`, not both. Recreation requires the same schema object/factory, the current external context, a matching schema ID, and a compatible version. Applications can register explicit schema migrations and value codecs. The default codec rejects unsupported values such as `Date`, `File`, class instances, functions, symbols, cycles, `NaN`, and infinities with a precise path instead of silently losing them through `JSON.stringify`.

Extension metadata is serialized only through a registered namespaced codec. This keeps framework state and application secrets out of persistence by default.

```ts
interface StagesExtensionCodec {
  encode(value: unknown): JsonValue;
  decode(value: JsonValue): unknown;
}
```

Codecs are registered through `extensionCodecs`; initial or controlled metadata
is supplied through `extensions` and `update({ extensions })`. Extension state
is exposed read-only at `meta.extensions` to schema factories and resolvers.
Only own, non-empty, safe registered namespaces are accepted. Serialization
fails for unregistered namespaces or codec errors instead of silently dropping
state. On recreation, each persisted namespace is decoded before the first
schema evaluation.

## 12. Framework adapter boundary

The core supplies:

- immutable snapshots;
- selector subscriptions;
- normalized render nodes;
- opaque registered view tokens;
- typed event emitters;
- stable node addresses and collection row keys;
- validation and navigation commands.

An adapter supplies:

- component instantiation and lifecycle;
- mapping a field snapshot and user props to component props/signals/inputs;
- event wiring;
- container layouts;
- DOM IDs, ARIA relationships, focus, and scroll behavior;
- framework-specific batching integration where needed.

The DOM reference adapter's mounted handle exposes `focus(path, options)` and
`focusFirstIssue(options)`. Both commands return whether focus reached a
rendered field. Controller-driven rerenders restore the active field without
scrolling, while an explicit focus command forwards the caller's browser
`FocusOptions`.

Suggested package layout:

```text
packages/
  core/       # stages(), types, pure reducer, scheduler, serialization
  dom/        # dependency-free reference renderer and native fields
  react/      # React peer dependency; lifecycle/subscription helpers
  test-kit/   # adapter contract harness and fixtures
examples/
  vanilla/
  react/
  vue-integration/
  angular-integration/
```

The Vue and Angular examples may initially be integration proofs rather than supported packages. Their purpose before v1 is to prove that no React assumption leaked into core or the adapter contract. Astro can use the DOM adapter directly or a framework island.

The core package must be safe to import during server rendering and must not reference `window`, `document`, storage, timers, or framework globals at module initialization.

## 13. TypeScript and package standards

- `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` enabled.
- No public or internal explicit `any`; use generics and narrow `unknown` at boundaries.
- Registry inference constrains field `type`, `props`, emitted payloads, and field values.
- Config examples use `satisfies` so inference remains useful without widening.
- Readonly input types make the functional contract visible to consumers.
- ESM-first package with declaration files and explicit export maps.
- Zero third-party runtime dependencies in core and DOM packages. Framework packages use their framework as a peer dependency only.
- Browser/Node targets and CJS support are a release decision, not an accidental build-tool default.
- Semver applies independently to serialized format, schema version, and package API.

## 14. Functional runtime architecture

The core should be organized around these boundaries:

```text
schema input + value/context/meta -> evaluate -> normalize/diff
                                                |
event queue -> pure reduce -> draft + patches -> reevaluate dynamics
                                                |
                                      derive snapshot/validity
                                                |
controller -> schedule effects, flush changes, notify subscribers
```

Suggested internal modules:

- `types`: public and internal discriminated unions.
- `path`: safe immutable get/set/remove and path comparison.
- `schema`: pure factory/resolver evaluation, recursive normalization, indexing, diagnostics, and identity-based schema diff.
- `events`: event targeting, transaction construction, and command reduction.
- `transforms`: deterministic transform selection and patch application.
- `collections`: row identity and immutable collection commands.
- `wizards`: active-stage state and navigation decisions.
- `validation`: dependency index, scheduling, cancellation, issues, and aggregation.
- `snapshot`: structural sharing and selector-ready projections.
- `serialization`: codecs, envelope validation, and migrations.
- `controller`: the only stateful shell; batching, effects, callbacks, and teardown.

No module may mutate the normalized schema, external value, previous snapshot, or reducer input. Side effects are values returned by the reducer and interpreted by the controller.

## 15. 0.x concept decisions

| 0.x concept | v1 decision |
| --- | --- |
| `Stages` + `Form` | Replace with one `stages()` controller and wizard nodes in config. |
| React render props | Replace with framework-neutral snapshots/subscriptions and adapters. |
| `plainFields` | Move to the DOM adapter as reference field definitions/views. |
| exported Lodash `get` | Remove. Public paths are segment arrays. |
| config arrays/functions | Keep as immutable schema objects or guaranteed pure schema factories; evaluate from controlled value/context and normalize recursively without mutation. |
| string templates / fieldsets | Use normal typed config-composition functions outside runtime. |
| magic `*Fn` props | Replace with typed `deriveProps`, `when`, `disabled`, and validator `when` resolvers. |
| groups | Keep as recursive structural nodes. |
| collections/unions | Keep with immutable commands, explicit variants, and stable row keys. |
| subforms | Remove; recursive nodes cover the use case. |
| embedded and outer wizards | Unify as the same nestable wizard node. |
| filter/cast/cleanup/precision | Replace with field reducers and event transforms. |
| computed values / clear fields | Replace with event transforms returning patches. |
| dynamic options / async form data | Load externally, then supply results through controlled `context`; field adapters may own option-resource behavior. |
| registry/type/custom validation | Unify as structured validators with dependency and event policy. |
| collection rule language | Replace with ordinary collection validators. |
| interface state | Move to typed controller/adapter metadata; never merge into domain value. |
| dirty/touched/focus | Keep as consistently derived or controller-owned metadata. |
| undo/redo | Optional subscriber/extension after v1 core; serialization makes it possible. |
| autosave | External persistence adapter based on `subscribe` and `serialize`. |
| hash router | External router adapter based on wizard events/state. |
| DOM error scrolling | Adapter concern using visible issues and node addresses. |
| global debugger hook | Per-controller subscriber/devtools adapter. |

No known correctness bug or module-global behavior in the baseline is a compatibility target.

## 16. Implementation phases and exit criteria

### Phase 0 — Contract fixtures and API spike

Create compile-tested examples for:

- a controlled one-field form;
- a group inside a collection inside a wizard;
- a wizard inside a collection and a wizard inside a stage;
- a discriminated collection;
- a custom non-native field;
- parity with `demo/pages/dynamicfields.jsx` using derived props, disabled predicates, and conditional validators;
- a pure schema factory that adds/removes a stable structural subtree from controlled value and external context;
- sync and async event validation;
- serialization and recreation;
- external value rejection/normalization;
- 100 events in one explicit batch.

Exit when the proposed config, registry, controller, event, snapshot, context, and serialization types can express all fixtures without `any` or framework imports.

### Phase 1 — Pure schema and value core

Implement safe paths, patches, structural sharing, schema factories, node resolvers, recursive normalization/diffing, diagnostics, node indexes, and pure state reduction. Add mutation/freeze tests and multiple-controller isolation tests.

Exit when arbitrary recursive and dynamic schemas work without collections/wizards receiving special top-level treatment, stable identities retain compatible metadata, and removed structures cannot leak active controller state.

### Phase 2 — Controller, controlled handshake, and batching

Implement `stages()`, transactions, controlled value/context/schema inputs, subscriptions, selectors, default microtask batching, explicit batches, update reconciliation, and teardown.

Exit when one batch produces exactly one change callback and one notification, rejected proposals do not become canonical, and separate controllers cannot affect each other.

### Phase 3 — Events and transforms

Implement typed field reducers, event targeting, transform ordering, patch conflict rules, standard collection events, and transform diagnostics.

Exit when every old value-processing use case in the migration table is represented by deterministic event fixtures.

### Phase 4 — Validation

Implement issues, dependency invalidation, conditional validators, event/presentation policies, aggregate status, scoped/full validation, async cancellation, stale-result protection, and stage validity.

Exit when `isValid` can never be true with stale, unknown, pending, or failed error validators and every async rejection is handled.

### Phase 5 — Collections and nested wizards

Complete stable row identity, variants, collection constraints, nested navigation, navigation guards, stage progress, conditional stages, and schema reconciliation.

Exit when every group/collection/wizard nesting permutation shares the same traversal and passes move/reorder/state-preservation tests.

### Phase 6 — Serialization

Implement JSON codecs, envelope validation, schema/version checks, migrations, extension namespaces, and recreation tests.

Exit when a controller can be destroyed and recreated with equal durable value/metadata and no leaked ephemeral state.

### Phase 7 — Adapters and accessibility reference

Build DOM and React adapters, native reference fields, selector integration, focus/error hooks, and custom-component examples. Build Vue and Angular contract proofs.

Exit when the same schema and value fixtures run through every proof without a core branch for a specific framework.

### Phase 8 — Hardening and v1 release

Add type tests, reducer/property tests, SSR tests, async race tests, performance budgets, package/export verification, API documentation, migration mapping, and release candidates.

Exit when all acceptance criteria below pass against the packed artifacts, not only source imports.

## 17. v1.0 acceptance criteria

- Core has zero runtime dependencies and no framework or DOM imports.
- Package import is SSR-safe.
- Strict TypeScript build has no explicit `any` escape hatches.
- Every supported structural node can nest inside every other permitted structural node to arbitrary practical depth.
- Input/config objects remain unchanged after every public operation.
- The behaviors in `demo/pages/dynamicfields.jsx` work through explicit resolvers without framework-driven schema reconstruction.
- A schema factory can add/remove nested fields, collections, and stages from controlled value/context while preserving all compatible stable identities.
- A schema factory runs at most once per transaction; each node resolver runs at most once per node/address, and none observe stale value or context.
- One hundred synchronous dispatches in a batch produce one proposed-value callback and one subscriber flush.
- Selector subscribers for unaffected field snapshots are not invoked as changed.
- Two controllers with identical paths have completely independent queues, validation, keys, and metadata.
- Async validation cancellation, rejection, and out-of-order completion are deterministic and tested.
- `snapshot.validation.isValid` is true only for a current, complete, error-free full-form result.
- Serialization either round-trips exactly through its codec or fails with a precise diagnostic; it never silently drops data.
- Recreated state preserves value, baseline, touched/visited exposure, wizard locations, and collection row identity.
- A custom non-native component can be registered without changing core code.
- The same core controller contract is demonstrated from DOM, React, Vue-style, and Angular-style integrations.
- Migration docs explicitly map or reject every public 0.x concept listed in the baseline.

## 18. Decisions to ratify before implementation

The plan recommends the following; changing one later would be expensive:

1. Use `kind` for structural nodes and reserve `type` only for registered fields.
2. Use segment-array paths only; do not accept Lodash-compatible strings in core.
3. Make every group, collection, wizard, and stage ID contribute to domain paths.
4. Treat all applicable wizard stages as part of full-form validity, even when inactive.
5. Make the engine strictly controlled: proposals require a later external `update({ value })`.
6. Use microtask batching by default.
7. Make JSON the default serialization boundary and require codecs for richer values.
8. Keep remote data, persistence, router, focus, undo, and devtools outside core.
9. Ship DOM and React adapters for v1; use Vue and Angular integrations as architecture proofs before promising supported packages.
10. Decide whether v1 is ESM-only and whether the package remains `react-stages` or moves to a framework-neutral name before publishing the first release candidate.

Implementation should begin with the Phase 0 fixtures only after items 1–9 are accepted or amended. Package naming and module-format decisions must be fixed before public prereleases.

## 19. Full React usage example

This example makes the proposed React integration concrete. It is intentionally a complete controlled form rather than isolated configuration fragments.

It assumes the React adapter exposes these thin utilities:

- `useStages(factory, { value, context? })` creates and subscribes to the core controller, synchronizes the latest controlled inputs through `controller.update()`, and destroys the controller on unmount;
- `StagesField` subscribes to exactly one field path, renders that field's registered React `view`, and wires its typed `emit` function to `controller.dispatch()`;
- `useStagesField(controller, path)` exposes the same selected field binding when an application wants to invoke or wrap the registered view itself;
- `StagesFields` is an optional recursive renderer for generated/default layouts. It is not required and is not used below.

These utilities do not own form data or behavior. The only engine constructor remains the core `stages()` function. The exact adapter names are part of the Phase 0 API spike and should be compile-tested before they are frozen.

```tsx
// ApplicationForm.tsx
import { useState, type FormEvent, type HTMLInputTypeAttribute } from "react";
import {
  stages,
  type StagesSchema,
  type TransformConfig,
  type ValidationIssue,
} from "@stages/core";
import {
  StagesField,
  useStages,
  type ReactFieldProps,
  type ReactFieldRegistry,
} from "@stages/react";

type ApplicationValue = {
  name: string;
  email: string;
  acceptTerms: boolean;
};

type TextFieldConfig = {
  label: string;
  inputType?: HTMLInputTypeAttribute;
  autoComplete?: string;
};

type CheckboxFieldConfig = {
  label: string;
};

function VisibleIssues({
  id,
  issues,
}: {
  id: string;
  issues: readonly ValidationIssue[];
}) {
  if (issues.length === 0) return null;

  return (
    <ul id={id} role="alert">
      {issues.map((issue) => (
        <li key={issue.id}>{issue.message ?? issue.code}</li>
      ))}
    </ul>
  );
}

function TextField({
  id,
  field,
  props,
  emit,
}: ReactFieldProps<string, TextFieldConfig>) {
  const errorsId = `${id}-errors`;
  const hasVisibleErrors = field.state.visibleIssues.length > 0;

  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        type={props.inputType ?? "text"}
        autoComplete={props.autoComplete}
        value={field.value}
        disabled={field.state.disabled}
        aria-invalid={hasVisibleErrors}
        aria-describedby={hasVisibleErrors ? errorsId : undefined}
        onChange={(event) => emit("input", event.currentTarget.value)}
        onFocus={() => emit("focus")}
        onBlur={() => emit("blur")}
      />
      <VisibleIssues id={errorsId} issues={field.state.visibleIssues} />
    </div>
  );
}

function CheckboxField({
  id,
  field,
  props,
  emit,
}: ReactFieldProps<boolean, CheckboxFieldConfig>) {
  const errorsId = `${id}-errors`;
  const hasVisibleErrors = field.state.visibleIssues.length > 0;

  return (
    <div>
      <label>
        <input
          id={id}
          type="checkbox"
          checked={field.value}
          disabled={field.state.disabled}
          aria-invalid={hasVisibleErrors}
          aria-describedby={hasVisibleErrors ? errorsId : undefined}
          onChange={(event) => emit("input", event.currentTarget.checked)}
          onFocus={() => emit("focus")}
          onBlur={() => emit("blur")}
        />
        {props.label}
      </label>
      <VisibleIssues id={errorsId} issues={field.state.visibleIssues} />
    </div>
  );
}

const fields = {
  text: {
    view: TextField,
    initialValue: "",
    reduce({ event }) {
      if (event.name !== "input" || typeof event.payload !== "string") {
        return undefined;
      }

      return { value: event.payload };
    },
  },
  checkbox: {
    view: CheckboxField,
    initialValue: false,
    reduce({ event }) {
      if (event.name !== "input" || typeof event.payload !== "boolean") {
        return undefined;
      }

      return { value: event.payload };
    },
  },
} as const satisfies ReactFieldRegistry;

const trimOnBlur = {
  on: "blur",
  apply({ path, fieldValue }) {
    if (typeof fieldValue !== "string") return [];

    const trimmedValue = fieldValue.trim();
    if (trimmedValue === fieldValue) return [];

    return [{ op: "set", path, value: trimmedValue }];
  },
} satisfies TransformConfig<ApplicationValue>;

const schema = {
  id: "contact-form",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "name",
      type: "text",
      props: {
        label: "Name",
        autoComplete: "name",
      },
      transforms: [trimOnBlur],
      validators: [
        {
          id: "name.required",
          on: ["init", "input", "blur", "submit"],
          revealOn: ["blur", "submit"],
          validate({ fieldValue, path }) {
            return typeof fieldValue === "string" && fieldValue.trim() !== ""
              ? []
              : [
                  {
                    id: "name.required",
                    code: "required",
                    path,
                    severity: "error",
                    message: "Enter your name.",
                  },
                ];
          },
        },
      ],
    },
    {
      kind: "field",
      id: "email",
      type: "text",
      props: {
        label: "Email",
        inputType: "email",
        autoComplete: "email",
      },
      transforms: [trimOnBlur],
      validators: [
        {
          id: "email.required",
          on: ["init", "input", "blur", "submit"],
          revealOn: ["blur", "submit"],
          validate({ fieldValue, path }) {
            return typeof fieldValue === "string" && fieldValue.trim() !== ""
              ? []
              : [
                  {
                    id: "email.required",
                    code: "required",
                    path,
                    severity: "error",
                    message: "Enter your email address.",
                  },
                ];
          },
        },
        {
          id: "email.format",
          on: ["init", "input", "blur", "submit"],
          revealOn: ["blur", "submit"],
          validate({ fieldValue, path }) {
            const isEmpty =
              typeof fieldValue !== "string" || fieldValue.trim() === "";
            const hasValidShape =
              typeof fieldValue === "string" &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue);

            return isEmpty || hasValidShape
              ? []
              : [
                  {
                    id: "email.format",
                    code: "email",
                    path,
                    severity: "error",
                    message: "Enter a valid email address.",
                  },
                ];
          },
        },
      ],
    },
    {
      kind: "field",
      id: "acceptTerms",
      type: "checkbox",
      props: {
        label: "I accept the terms.",
      },
      validators: [
        {
          id: "acceptTerms.required",
          on: ["init", "input", "submit"],
          revealOn: ["submit"],
          validate({ fieldValue, path }) {
            return fieldValue === true
              ? []
              : [
                  {
                    id: "acceptTerms.required",
                    code: "required",
                    path,
                    severity: "error",
                    message: "Accept the terms before submitting.",
                  },
                ];
          },
        },
      ],
    },
  ],
} as const satisfies StagesSchema<ApplicationValue, typeof fields>;

const initialValue: ApplicationValue = {
  name: "",
  email: "",
  acceptTerms: false,
};

const fieldPaths = {
  name: ["name"],
  email: ["email"],
  acceptTerms: ["acceptTerms"],
} as const;

export function ApplicationForm() {
  const [value, setValue] = useState<ApplicationValue>(initialValue);
  const [submittedValue, setSubmittedValue] = useState<string>();

  const { controller, snapshot } = useStages(
    () =>
      stages<ApplicationValue, typeof fields>({
        schema,
        fields,
        value: initialValue,
        onChange({ value: proposedValue }) {
          // Accept the proposal. The hook supplies this value back to the
          // controller on the next render, completing the controlled cycle.
          setValue(proposedValue);
        },
      }),
    { value },
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedValue(undefined);

    const validation = await controller.validate({
      scope: "form",
      event: "submit",
      reveal: true,
    });

    if (!validation.isValid) return;

    // Submit the latest externally accepted value, not an event payload or
    // a second internal copy owned by Stages.
    setSubmittedValue(
      JSON.stringify(controller.getSnapshot().value, null, 2),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header>
        <h1>Contact application</h1>
        <p>Tell us how we can contact you.</p>
      </header>

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact details</h2>

        <div className="form-row form-row--wide">
          <StagesField controller={controller} path={fieldPaths.name} />
        </div>

        <div className="form-row form-row--wide">
          <StagesField controller={controller} path={fieldPaths.email} />
          <p className="field-help">
            We will only use this address to reply to your application.
          </p>
        </div>
      </section>

      <aside className="terms-panel" aria-label="Terms">
        <StagesField controller={controller} path={fieldPaths.acceptTerms} />
      </aside>

      <footer className="form-actions">
        <p aria-live="polite">
          Full form status: {snapshot.validation.status}
        </p>

        <button
          type="submit"
          disabled={snapshot.validation.status === "pending"}
        >
          Submit
        </button>
      </footer>

      {submittedValue !== undefined && (
        <output>
          <strong>Submitted value</strong>
          <pre>{submittedValue}</pre>
        </output>
      )}
    </form>
  );
}
```

The controlled lifecycle is:

1. A field component emits `input`, `focus`, or `blur`; it never changes form state directly.
2. The controller reduces the event, applies matching transforms and validation, and batches a proposed value.
3. `onChange` gives that proposal to React state.
4. `useStages(..., { value })` supplies the accepted React value back to the controller.
5. Each manually placed `StagesField` subscribes to its own path and rerenders only when that selected field snapshot changes.
6. Submission asks for definitive full-form validation, reveals submit issues, and reads the latest accepted controlled value.

The `<header>`, `<section>`, help text, `<aside>`, `<footer>`, and ordering are entirely application-owned React layout. `StagesField` only renders the one registered field placed at that exact position. An application needing even more control can replace it with `useStagesField()` and render the returned binding through its own component composition. Field behavior, transforms, validation, aggregate validity, batching, and form state remain in the framework-neutral controller.

## 20. React collection management example

Collections use the same manual layout model. The React adapter's `useStagesCollection(controller, path)` hook selects one collection and returns typed row bindings and commands:

```ts
interface ReactCollectionBinding<TItem> {
  items: readonly ReactCollectionItemBinding<TItem>[];
  canAdd: boolean;
  add(value: TItem): void;
}

interface ReactCollectionItemBinding<TItem> {
  key: string;
  index: number;
  value: Readonly<TItem>;
  address: NodeAddress;
  canRemove: boolean;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  fieldPath(field: keyof TItem): DataPath;
  remove(): void;
  moveTo(index: number): void;
}
```

`key` and `address` use the controller's stable collection-row identity. The current numeric index appears only in the data path. Moving a row therefore preserves its touched state, validation exposure, async request identity, and React component identity.

The following example reuses the `text` field definition from the preceding example through a shared `fields` module. Everything specific to the collection is included here.

```tsx
// TeamForm.tsx
import { useState, type FormEvent } from "react";
import {
  stages,
  type StagesSchema,
  type TransformConfig,
  type ValidatorConfig,
} from "@stages/core";
import {
  StagesField,
  useStages,
  useStagesCollection,
} from "@stages/react";
import { fields } from "./fields";

type TeamMember = {
  name: string;
  email: string;
};

type TeamValue = {
  members: TeamMember[];
};

function required(
  id: string,
  message: string,
): ValidatorConfig<TeamValue> {
  return {
    id,
    on: ["init", "input", "blur", "submit"],
    revealOn: ["blur", "submit"],
    validate({ fieldValue, path }) {
      return typeof fieldValue === "string" && fieldValue.trim() !== ""
        ? []
        : [
            {
              id,
              code: "required",
              path,
              severity: "error",
              message,
            },
          ];
    },
  };
}

const trimOnBlur = {
  on: "blur",
  apply({ path, fieldValue }) {
    if (typeof fieldValue !== "string") return [];

    const trimmedValue = fieldValue.trim();
    return trimmedValue === fieldValue
      ? []
      : [{ op: "set", path, value: trimmedValue }];
  },
} satisfies TransformConfig<TeamValue>;

const schema = {
  id: "team-form",
  version: 1,
  nodes: [
    {
      kind: "collection",
      id: "members",
      min: 1,
      max: 5,
      nodes: [
        {
          kind: "field",
          id: "name",
          type: "text",
          props: {
            label: "Name",
            autoComplete: "name",
          },
          transforms: [trimOnBlur],
          validators: [
            required("member.name.required", "Enter the member's name."),
          ],
        },
        {
          kind: "field",
          id: "email",
          type: "text",
          props: {
            label: "Email",
            inputType: "email",
            autoComplete: "email",
          },
          transforms: [trimOnBlur],
          validators: [
            required(
              "member.email.required",
              "Enter the member's email address.",
            ),
          ],
        },
      ],
    },
  ],
} as const satisfies StagesSchema<TeamValue, typeof fields>;

const initialValue: TeamValue = {
  members: [
    {
      name: "",
      email: "",
    },
  ],
};

const membersPath = ["members"] as const;

export function TeamForm() {
  const [value, setValue] = useState<TeamValue>(initialValue);
  const [submittedValue, setSubmittedValue] = useState<string>();

  const { controller, snapshot } = useStages(
    () =>
      stages<TeamValue, typeof fields>({
        schema,
        fields,
        value: initialValue,
        onChange({ value: proposedValue }) {
          setValue(proposedValue);
        },
      }),
    { value },
  );

  const members = useStagesCollection(controller, membersPath);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedValue(undefined);

    const validation = await controller.validate({
      scope: "form",
      event: "submit",
      reveal: true,
    });

    if (!validation.isValid) return;

    setSubmittedValue(
      JSON.stringify(controller.getSnapshot().value, null, 2),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header>
        <h1>Team members</h1>
        <p>Add between one and five people and arrange their order.</p>
      </header>

      <div className="member-list">
        {members.items.map((member) => (
          <fieldset className="member-card" key={member.key}>
            <legend>Member {member.index + 1}</legend>

            <div className="member-card__fields">
              <StagesField
                controller={controller}
                path={member.fieldPath("name")}
              />
              <StagesField
                controller={controller}
                path={member.fieldPath("email")}
              />
            </div>

            <div className="member-card__actions">
              <button
                type="button"
                disabled={!member.canMovePrevious}
                onClick={() => member.moveTo(member.index - 1)}
              >
                Move up
              </button>
              <button
                type="button"
                disabled={!member.canMoveNext}
                onClick={() => member.moveTo(member.index + 1)}
              >
                Move down
              </button>
              <button
                type="button"
                disabled={!member.canRemove}
                onClick={() => member.remove()}
              >
                Remove
              </button>
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        disabled={!members.canAdd}
        onClick={() => members.add({ name: "", email: "" })}
      >
        Add member
      </button>

      <footer className="form-actions">
        <p aria-live="polite">
          {members.items.length} of 5 members · Full form status:{" "}
          {snapshot.validation.status}
        </p>
        <button
          type="submit"
          disabled={snapshot.validation.status === "pending"}
        >
          Submit team
        </button>
      </footer>

      {submittedValue !== undefined && (
        <output>
          <strong>Submitted value</strong>
          <pre>{submittedValue}</pre>
        </output>
      )}
    </form>
  );
}
```

The collection commands are ordinary controller events hidden behind typed React bindings:

- `members.add()` dispatches `collection:add` and respects `max`;
- `member.remove()` targets the stable row address and respects `min`;
- `member.moveTo()` targets the stable row address, so a move does not reset field interaction state;
- the controller applies the array update immutably and emits one controlled-value proposal;
- every row and action is still placed in application-owned React markup.

An application can dispatch the corresponding collection events directly when it does not want React adapter helpers. The helpers provide typed paths, stable identity, capability flags, and narrow subscriptions; they do not add collection behavior outside the core.

### 20.1 React wizard binding

The React adapter exposes wizard metadata and commands without choosing a
layout or mounting policy:

```ts
interface ReactWizardStageBinding {
  id: string;
  path: DataPath;
  address: NodeAddress;
  active: boolean;
  disabled: boolean;
  validation: ValidationSnapshot | undefined;
}

interface ReactWizardBinding {
  activeStage: string | undefined;
  stages: readonly ReactWizardStageBinding[];
  canPrevious: boolean;
  canNext: boolean;
  canGo: boolean;
  previous(): void;
  next(): void;
  go(stage: string): void;
}
```

`useStagesWizard(controller, path)` subscribes only to the selected wizard.
Applications can render its stages as pages, tabs, accordions, a progress
overview, or any other composition. Navigation commands remain subject to the
core wizard's visibility, disabled, validation, non-linear, and guard policies.

## 21. Implementation state

Last updated: 2026-09-03

The v1 implementation is active under `packages/` and is intentionally kept
alongside the existing 0.x library while the replacement is completed. It is
currently an alpha foundation, not a release-ready v1 build.

| Phase | State | Implemented | Remaining |
| --- | --- | --- | --- |
| Phase 0 — Contract fixtures and API spike | Implemented | Strict public TypeScript contracts and a compile-tested fixture cover controlled fields, recursive groups/collections/wizards, discriminated collections, custom view tokens, dynamic schemas, transforms, validation, serialization, and batching. | Continue refining types when remaining runtime features are added; freeze the public API only after packed-artifact testing. |
| Phase 1 — Pure schema and value core | Implemented | Safe segment-array paths, immutable set/remove patches, structural sharing, recursive normalization, dynamic factories and resolvers, stable row/node addresses, incompatible-identity diagnostics and state removal, malformed-structure guards, and last-valid-tree recovery are implemented. | Broader reducer/property and fuzz coverage remains part of Phase 8 hardening. |
| Phase 2 — Controller, controlled handshake, and batching | Implemented | Per-instance controlled proposals, synchronous owner acceptance, rejected proposals, microtask transactions, explicit batching, value/context/schema updates, subscriptions, selector equality, reconciliation, reset, teardown, and a packed-consumer controlled handshake are implemented. | Finalize callback-order documentation. |
| Phase 3 — Events and transforms | Mostly implemented | Field reducers, form/field/node targeting, target-to-root transform ordering, sequential last-writer-wins patches, collection and wizard events, atomic value rejection, and reducer/transform/patch diagnostics are implemented. | Expand typed convenience APIs and migration fixtures for all documented 0.x processing patterns. |
| Phase 4 — Validation | Mostly implemented | Root, node, and registry-level field validators; `init`/event/reveal policies; disabled-node opt-in; dependencies; conditional applicability; scoped and per-stage aggregation; async cancellation; stale-result protection; runtime issue validation; and durable reveal state are implemented. | Finalize validation/system-issue customization and broaden navigation/validation matrix tests. |
| Phase 5 — Collections and nested wizards | Mostly implemented | Immutable add/remove/replace/duplicate/move/sort commands, collection- and stable-row-address targeting, min/max constraints, homogeneous and discriminated rows, controlled row-key proposals, nested snapshots, active-stage metadata, navigation guards, conditional stages, serialized identity, and React collection/wizard bindings are implemented. | Add exhaustive tests for every permitted container nesting permutation. |
| Phase 6 — Serialization | Implemented | Strict JSON encoding, precise serialization errors, envelope validation, schema/version checks, custom value codecs, ordered migrations, value/baseline recreation, touched/visited metadata, active wizard stages, row keys, revealed validation addresses, registered namespaced extension codecs, and packed-artifact recreation are implemented. | Extend the packed release-candidate matrix to migrations and custom codecs. |
| Phase 7 — Adapters and accessibility reference | Mostly implemented | A dependency-free DOM renderer provides native text/number/checkbox fields, custom view support, collision-safe IDs, accessible issue relationships, focus preservation, path-based focus, and first-visible-error navigation. React lifecycle, snapshot, selector, field, typed collection, and wizard bindings are implemented, including Strict Mode-safe teardown. Vue-style and Angular-style contract proofs use the same core API. Production-style vanilla and React wizards exercise the public packages, are continuously typechecked, and have verified production builds. | Migrate the existing demo applications to v1 and broaden adapter accessibility testing. |
| Phase 8 — Hardening and v1 release | Partial | Strict builds, compile-time fixtures, SSR-safe core boundaries, async race tests, mutation checks, controller-isolation tests, notification-count performance tests, tarball allowlist/export checks, offline packed installation, runtime import smoke tests, packed declaration consumption, and packed recreation exist. | Add property/fuzz tests, formal performance budgets, complete API and 0.x migration documentation, release packaging, and release-candidate validation. |

### Current packages

- `@stages/core`: framework-neutral schema, controller, events, validation,
  collections, paths, and serialization.
- `@stages/dom`: dependency-free DOM reference adapter and native fields.
- `@stages/react`: React controller lifecycle and selector-based field bindings.
- `@stages/test-kit`: reusable adapter contract harness, including Vue-style and
  Angular-style integration proofs.

### Current examples

- `examples/vanilla`: controlled DOM wizard with staged validation, accessible
  first-error focus, navigation, serialization output, and a verified Vite
  production build.
- `examples/react`: React 19 workspace wizard with typed custom fields, stable
  collection rows, staged validation, Strict Mode-safe lifecycle, and a
  verified Vite production build.

### Verification baseline

- `npm run check:v1` performs strict type checking for all four packages and the
  vanilla and React examples, and builds the packages' ESM declaration/output
  artifacts. It then runs `npm run verify:packages:v1`, which checks all four
  package tarballs and an isolated offline runtime/type consumer.
- `npm run test:v1` builds the packages and currently runs 69 passing executable
  tests across core, DOM, React 17, and the adapter test kit. The React example's
  own `npm test` adds a passing React 19 Strict Mode lifecycle test.
- Generated package `dist/` directories are build artifacts and are not tracked.

### Work not yet migrated

The existing root 0.x package, `demo/`, `docs/` application, and `studio/`
application still use the legacy implementation. The standalone vanilla v1
example is not yet integrated into those applications. Their migration should
follow the remaining adapter/API work so they validate the final v1 contract
rather than an intermediate alpha surface.
