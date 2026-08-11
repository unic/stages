# Stages v1.0 TypeScript Rewrite — Architecture and Delivery Plan

Status: proposed plan for review

Baseline: [`CURRENT_IMPLEMENTATION_API.md`](./CURRENT_IMPLEMENTATION_API.md)

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

## 3. Scope

### 3.1 Required for v1.0

- Strict TypeScript core with no runtime dependencies.
- `stages()` controller and fully typed public contracts.
- Controlled values and immutable change proposals.
- Recursive fields, groups, collections, collection variants, wizards, and stages.
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

## 4. Proposed public API

The following is an API direction, not final declaration-file syntax. The implementation should refine names through compile-tested examples before freezing them.

```ts
const form = stages<ApplicationValue, AppFieldViews>({
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

// Synchronize a value accepted or replaced by the owner.
form.update({ value });
```

The controller should expose only cohesive engine operations:

```ts
interface StagesController<TValue> {
  getSnapshot(): StagesSnapshot<TValue>;
  subscribe(listener: () => void): () => void;
  update(input: StagesUpdate<TValue>): void;
  dispatch(event: StagesEvent): void;
  batch(run: () => void): void;
  validate(options?: ValidateOptions): Promise<ValidationSnapshot>;
  serialize(): SerializedStagesState;
  destroy(): void;
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
type NodeConfig<TValue, TFields> =
  | FieldNodeConfig<TValue, TFields>
  | GroupNodeConfig<TValue, TFields>
  | CollectionNodeConfig<TValue, TFields>
  | WizardNodeConfig<TValue, TFields>;

interface FieldNodeConfig<TValue, TFields> {
  kind: "field";
  id: string;
  type: keyof TFields;
  props?: Readonly<Record<string, unknown>>;
  when?: NodePredicate<TValue>;
  disabled?: boolean | NodePredicate<TValue>;
  transforms?: readonly TransformConfig<TValue>[];
  validators?: readonly ValidatorConfig<TValue>[];
}

interface GroupNodeConfig<TValue, TFields> {
  kind: "group";
  id: string;
  nodes: readonly NodeConfig<TValue, TFields>[];
  when?: NodePredicate<TValue>;
  transforms?: readonly TransformConfig<TValue>[];
  validators?: readonly ValidatorConfig<TValue>[];
}

interface CollectionNodeConfig<TValue, TFields> {
  kind: "collection";
  id: string;
  item: CollectionItemConfig<TValue, TFields>;
  min?: number;
  max?: number;
  itemKey?: (item: Readonly<unknown>, index: number) => string;
  transforms?: readonly TransformConfig<TValue>[];
  validators?: readonly ValidatorConfig<TValue>[];
}

interface WizardNodeConfig<TValue, TFields> {
  kind: "wizard";
  id: string;
  stages: readonly StageNodeConfig<TValue, TFields>[];
  initialStage?: string;
  navigation?: WizardNavigationConfig<TValue>;
  transforms?: readonly TransformConfig<TValue>[];
  validators?: readonly ValidatorConfig<TValue>[];
}

interface StageNodeConfig<TValue, TFields> {
  id: string;
  nodes: readonly NodeConfig<TValue, TFields>[];
  when?: NodePredicate<TValue>;
}
```

Every group, collection, wizard, and stage contributes its ID to the data path. This keeps nested data deterministic and follows the current library's general model. If transparent/presentational containers are needed, they should be a later explicit node kind rather than a flag that changes path semantics.

Collection items may be a single recursive node list or a discriminated set of variants. Variant configuration replaces the current implicit `__typename` union behavior with an explicit discriminator contract.

### 5.2 Dynamic configuration

Configuration is immutable. The engine never modifies caller objects.

Dynamic behavior should normally use pure `when`, `disabled`, derived props, transforms, and validators. Applications that need to change structure supply a new schema through `update({ schema })`. Schema updates are recursively normalized and diffed by stable node identity.

A root schema factory may be considered during the API spike, but it must not be required. If included, it must be synchronous, pure, recursively normalized, and return stable IDs. Runtime `modifyConfig`, partial recursive expansion, string templates, and magic `*Fn` prop names will not return.

### 5.3 Schema validation

Normalization fails early with structured diagnostics for:

- duplicate sibling IDs or stage IDs;
- unsafe property keys;
- unknown field types;
- invalid collection constraints;
- invalid wizard targets;
- invalid event and validator definitions;
- unstable or missing identities required for state reconciliation.

Development builds may freeze normalized configuration to detect mutation. Production behavior must not depend on freezing.

## 6. Field and component registration

A field definition describes how a field participates in the engine. The view token remains opaque to core code and is interpreted by a framework adapter.

```ts
interface FieldDefinition<TValue, TProps, TView> {
  view: TView;
  initialValue?: TValue | (() => TValue);
  reduce?: FieldEventReducer<TValue>;
  validators?: readonly FieldValidator<TValue, TProps>[];
}
```

The registry is passed to `stages()`. Its keys form the allowed `type` union in field configuration, and each entry carries its own value, props, event-payload, and view-token types. Public implementation code uses `unknown` at untrusted boundaries rather than `any`.

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

Adapters receive the snapshot plus a typed `emit(name, payload)` function. User configuration cannot overwrite engine event handlers, values, validity, or identity as it can in 0.x.

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
6. Reconcile conditional nodes, collection addresses, and wizard state.
7. Recompute or invalidate validation results affected by the patches.
8. Queue asynchronous effects with per-instance cancellation tokens.
9. Commit controller metadata and emit at most one value change and one subscriber notification at flush.

Transforms are synchronous and pure in v1. They receive readonly context and return patches; they never receive setters or mutate data.

```ts
interface TransformConfig<TValue> {
  on: string | readonly string[];
  when?: (context: TransformContext<TValue>) => boolean;
  apply(context: TransformContext<TValue>): readonly StagesPatch[];
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

## 8. Validation model

Validation execution and issue presentation are separate concerns.

Each validator has a stable ID, dependencies, event policy, optional presentation policy, and a synchronous or asynchronous function. It returns zero or more structured issues rather than React nodes or copies of field configuration.

```ts
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
- Event policy determines when a validator runs. Presentation policy determines when its issue becomes visible.
- A validator that has not run for the current dependencies makes aggregate status `unknown`, not valid.
- Pending work makes aggregate status `pending` unless a current error already makes it `invalid`; counts remain available in either case.
- `validate()` runs all applicable validators for a scope, regardless of their normal event policy, and resolves only when the result for that revision is definitive.
- `isValid` is true only for a complete, current, error-free result. Consumers never need to inspect error-object shapes.

Full-form validity includes every currently applicable node, including inactive stages of a wizard. A node excluded by `when` does not participate. Disabled-field participation must be explicit in validator configuration; it must not vary by adapter. Per-stage and per-subtree validity are derived from the same index for navigation and progress.

## 9. Groups, collections, and wizards

All containers are handled by the same recursive walker and reducer. There are no top-level-only expansion rules.

### 9.1 Collections

Collections provide typed commands for add, remove, replace, duplicate, move, and sort. Constraint failures such as `min` and `max` produce a rejected command result or issue; they never report a change when nothing changed.

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

It excludes focus, rendered views, callbacks, configuration, subscriptions, pending requests, abort controllers, option data, and cached validation results. Validation is recomputed on recreation. Dirty state is derived by comparing value with the serialized baseline.

`stages()` accepts either a controlled initial `value` or a serialized `state`, not both. Recreation requires the same schema ID and a compatible version. Applications can register explicit schema migrations and value codecs. The default codec rejects unsupported values such as `Date`, `File`, class instances, functions, symbols, cycles, `NaN`, and infinities with a precise path instead of silently losing them through `JSON.stringify`.

Extension metadata is serialized only through a registered namespaced codec. This keeps framework state and application secrets out of persistence by default.

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
configuration -> normalize -> immutable schema
                                  |
event queue -> pure reduce -> state + patches + effects
                                  |
                         derive snapshot/validity
                                  |
controller -> schedule effects, flush changes, notify subscribers
```

Suggested internal modules:

- `types`: public and internal discriminated unions.
- `path`: safe immutable get/set/remove and path comparison.
- `schema`: recursive normalization, indexing, diagnostics, and schema diff.
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
| config arrays/functions | Keep config-first design; normalize recursively and never mutate input. |
| string templates / fieldsets | Use normal typed config-composition functions outside runtime. |
| magic `*Fn` props | Replace with explicit derived props/predicates. |
| groups | Keep as recursive structural nodes. |
| collections/unions | Keep with immutable commands, explicit variants, and stable row keys. |
| subforms | Remove; recursive nodes cover the use case. |
| embedded and outer wizards | Unify as the same nestable wizard node. |
| filter/cast/cleanup/precision | Replace with field reducers and event transforms. |
| computed values / clear fields | Replace with event transforms returning patches. |
| dynamic options / async form data | Application/field-adapter resource concern, not form core. |
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
- sync and async event validation;
- serialization and recreation;
- external value rejection/normalization;
- 100 events in one explicit batch.

Exit when the proposed config, registry, controller, event, snapshot, and serialization types can express all fixtures without `any` or framework imports.

### Phase 1 — Pure schema and value core

Implement safe paths, patches, structural sharing, recursive normalization, diagnostics, node indexes, and pure state reduction. Add mutation/freeze tests and multiple-controller isolation tests.

Exit when arbitrary recursive schemas and immutable value updates work without collections/wizards receiving special top-level treatment.

### Phase 2 — Controller, controlled handshake, and batching

Implement `stages()`, transactions, controlled proposals, subscriptions, selectors, default microtask batching, explicit batches, update reconciliation, and teardown.

Exit when one batch produces exactly one change callback and one notification, rejected proposals do not become canonical, and separate controllers cannot affect each other.

### Phase 3 — Events and transforms

Implement typed field reducers, event targeting, transform ordering, patch conflict rules, standard collection events, and transform diagnostics.

Exit when every old value-processing use case in the migration table is represented by deterministic event fixtures.

### Phase 4 — Validation

Implement issues, dependency invalidation, event/presentation policies, aggregate status, scoped/full validation, async cancellation, stale-result protection, and stage validity.

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
      item: {
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
