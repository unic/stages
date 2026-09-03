# Stages v1 comprehensive documentation plan

Status: proposed documentation roadmap

Last reviewed against the implementation: 2026-09-03

Primary product reference: [`V1_ARCHITECTURE_PLAN.md`](./V1_ARCHITECTURE_PLAN.md)

Implemented API summary: [`V1_API.md`](./V1_API.md)

This plan turns the current introductory v1 documentation into a complete,
task-oriented and reference-quality documentation set. It covers the public
contracts in `@stages/core`, `@stages/dom`, `@stages/react`, and
`@stages/test-kit`, as well as the behavior that emerges when those contracts
are combined in real applications.

The plan deliberately separates three kinds of documentation:

- **learning paths** that help a developer become productive in a sensible
  order;
- **feature guides and recipes** that explain decisions, trade-offs, and
  production usage;
- **exhaustive references** that document every public symbol, option, event,
  state field, diagnostic, error, default, and lifecycle guarantee.

The work is complete only when every implemented public capability is both
traceable to source/tests and discoverable from a user task or API symbol.

## 1. Outcome

The finished documentation should let a developer:

1. understand Stages' controlled, framework-neutral model before copying code;
2. build a simple form, a dynamic form, a repeated collection, and a guarded
   wizard without reading package source;
3. integrate native DOM, React, or a custom framework adapter correctly;
4. implement async validation, persistence, migration, localization, focus,
   autosave, routing, and other real application concerns at the correct layer;
5. diagnose invalid schemas, rejected events, unsafe paths, validation failures,
   serialization errors, and lifecycle mistakes;
6. find the exact signature and semantics of every public export;
7. migrate from 0.x without relying on a nonexistent compatibility layer; and
8. verify examples locally against the same packages that users install.

This is a documentation expansion, not a redesign of the v1 API. If the audit
finds an implementation/documentation contradiction, resolve the contract with
maintainers and update the implementation or documentation before teaching it.

## 2. Current-state assessment

The current Nextra application has a sound top-level feature list and seven
working demos, but most guides are only 30–70 lines. They name many capabilities
without teaching their full signatures, state transitions, edge cases, failure
modes, composition patterns, or production use.

### 2.1 What can be retained

- The v1-only Nextra/Next application and its current visual shell.
- The existing conceptual split between core, React, DOM, and custom adapters.
- The seven live demos as seeds for a larger executable example library.
- `V1_ARCHITECTURE_PLAN.md` as the rationale and acceptance-history record.
- `V1_API.md` as a compact API overview.
- `MIGRATING_TO_V1.md` and `CURRENT_IMPLEMENTATION_API.md` as migration inputs.
- Package tests and production examples as executable behavioral evidence.
- `scripts/check-v1-docs.mjs` as the starting point for documentation gates.

### 2.2 Gaps to address

- The current feature pages often compress an entire subsystem into a single
  example and a few paragraphs.
- There is no field-by-field reference for controller options, updates,
  changes, schema nodes, snapshots, validation, persistence, or adapter types.
- Runtime exports are mentioned, but most overloads, generics, parameters,
  returns, defaults, thrown errors, no-op behavior, and teardown behavior are
  not documented.
- Type-only exports are grouped by name rather than documented individually.
- Event payloads are summarized, but accepted targets, transaction effects,
  rejection conditions, diagnostics, and examples are not consistently shown.
- Diagnostics and `SerializationError` codes have no exhaustive reference.
- Existing demos do not directly prove union collections, replace/duplicate/
  sort commands, rejected or delayed controlled proposals, custom selector
  equality, reset semantics, codecs, migrations, extensions, custom DOM views,
  or custom adapter testing.
- Cross-feature behaviors—such as dynamic collection rows containing wizards
  with async validation and persistence—need dedicated composition examples.
- Accessibility guidance is split across brief adapter pages and does not yet
  provide implementation checklists for application-owned React markup.
- The feature-coverage check proves that selected words occur somewhere; it
  does not prove complete signatures, behavioral detail, working examples, or
  source/test traceability.
- The flat navigation makes beginner tutorials, conceptual explanations,
  how-to recipes, and API reference compete at the same level.

### 2.3 Contract drift to resolve before expansion

The initial audit already found examples of wording that must be reconciled
against public declarations and executable tests:

- `MIGRATING_TO_V1.md` refers to `controller.reset()`, while the implemented
  controller exposes reset through a form-targeted `"reset"` event.
- The same guide refers to validator `events`; the implemented configuration
  property is `on`.
- It refers to DOM `focusFirstVisibleIssue()` in one place; the implemented
  method is `focusFirstIssue()`.
- Several pages imply a complete reference while documenting names but not the
  contracts attached to those names.

Phase 1 must search for and resolve every similar discrepancy. Do not copy old
wording into new pages until it passes the contract audit.

## 3. Audiences and learning paths

The information architecture should support these distinct readers.

| Audience | Primary need | Recommended path |
| --- | --- | --- |
| First-time Stages user | Build a typed controlled form | Introduction → mental model → installation → first form → chosen adapter |
| React application developer | Integrate custom design-system fields and recursive structures | React quickstart → field views → validation → collections/wizards → recipes |
| Framework-free developer | Render accessible native controls and manage focus | DOM quickstart → native field props → mounting/lifecycle → focus/accessibility |
| Adapter author | Bind another UI runtime without recreating engine behavior | Architecture → snapshots/events → adapter contract → test kit |
| Schema/tooling author | Evaluate and validate dynamic schema outside a controller | Schema reference → paths/identity → `evaluateSchema()` → diagnostics |
| Platform/application architect | Decide ownership, persistence, SSR, routing, autosave, and observability boundaries | Architecture → controlled model → persistence → application integration recipes |
| 0.x maintainer | Replace legacy behavior incrementally | Migration overview → concept matrix → processing cookbook → rollout/testing |
| API maintainer/contributor | Keep docs synchronized with code and tests | API reference → diagnostics catalog → documentation contribution guide |

Every landing page should state who it is for, required prior knowledge, and
where to go next. A reader should never need to infer whether a page is a
tutorial, conceptual guide, recipe, or normative reference.

## 4. Documentation principles

### 4.1 One source of truth per kind of claim

Use the following precedence during authoring:

1. exported package declarations and package export maps for public shape;
2. executable tests for observable behavior, edge cases, and ordering;
3. production examples for recommended composition;
4. `V1_ARCHITECTURE_PLAN.md` for rationale and intended boundaries;
5. `V1_API.md` and existing feature pages as summaries to verify, not as
   unquestioned sources.

Internal controller implementation may explain behavior, but documentation must
not promise a non-exported detail unless it is deliberately made contractual and
covered by a public test.

### 4.2 Progressive disclosure

Each subsystem needs:

- a minimal working example;
- a mental model and decision guidance;
- a complete capability guide;
- realistic recipes;
- an exact API/type reference;
- failure modes and troubleshooting;
- links to related features and source-backed tests.

The first example should stay small. Advanced behavior belongs immediately
after the reader understands the base contract, not inside an unexplained
all-in-one snippet.

### 4.3 Controlled examples are explicit

Every controller example must show who owns `value`, what `onChange` proposes,
and where `update({ value })` accepts or replaces the proposal. Examples that
intentionally delay or reject acceptance must label that behavior. Avoid the
misleading shorthand of describing `dispatch()` as directly changing canonical
value.

### 4.4 Every boundary is named

Guides must clearly identify whether behavior belongs to:

- core;
- an adapter;
- the application;
- an optional extension namespace; or
- tooling built from pure exports.

This is especially important for accessibility, layout, focus, fetching,
remote options, routing, browser storage, autosave, undo/redo, analytics, and
devtools.

### 4.5 Examples are executable and accessible

All substantial TypeScript/TSX examples should be imported from checked source
files or compiled as documentation fixtures. Interactive demos must be keyboard
operable, expose useful status, and avoid inaccessible patterns. Pseudocode is
allowed only when clearly labeled.

## 5. Proposed information architecture

Replace the flat list of broad pages with a hierarchy organized by user intent.
The exact slugs may adapt to Nextra constraints, but the conceptual structure
should remain.

```text
docs/content/
├── index.mdx
├── start/
│   ├── introduction.mdx
│   ├── mental-model.mdx
│   ├── installation.mdx
│   ├── first-controller.mdx
│   ├── react-quickstart.mdx
│   └── dom-quickstart.mdx
├── core-concepts/
│   ├── controlled-values.mdx
│   ├── controller-lifecycle.mdx
│   ├── schemas.mdx
│   ├── paths-and-addresses.mdx
│   ├── field-registry.mdx
│   ├── events-and-reducers.mdx
│   ├── transforms-and-patches.mdx
│   ├── transactions-and-batching.mdx
│   ├── snapshots-and-subscriptions.mdx
│   └── dynamic-configuration.mdx
├── structures/
│   ├── groups.mdx
│   ├── collections.mdx
│   ├── collection-identity.mdx
│   ├── discriminated-collections.mdx
│   ├── wizards.mdx
│   ├── wizard-validation-and-guards.mdx
│   └── recursive-composition.mdx
├── validation/
│   ├── overview.mdx
│   ├── validators-and-issues.mdx
│   ├── execution-and-reveal.mdx
│   ├── scopes-and-aggregation.mdx
│   ├── dependencies.mdx
│   ├── async-and-cancellation.mdx
│   ├── disabled-and-conditional.mdx
│   └── failures-and-localization.mdx
├── persistence/
│   ├── serialization.mdx
│   ├── durable-and-ephemeral-state.mdx
│   ├── value-codecs.mdx
│   ├── extension-state.mdx
│   ├── migrations.mdx
│   └── storage-and-autosave.mdx
├── adapters/
│   ├── overview.mdx
│   ├── react/
│   │   ├── lifecycle.mdx
│   │   ├── fields.mdx
│   │   ├── collections.mdx
│   │   ├── wizards.mdx
│   │   ├── accessibility.mdx
│   │   └── performance.mdx
│   ├── dom/
│   │   ├── mounting.mdx
│   │   ├── native-fields.mdx
│   │   ├── custom-views.mdx
│   │   ├── focus.mdx
│   │   └── accessibility.mdx
│   └── custom/
│       ├── contract.mdx
│       ├── framework-walkthrough.mdx
│       └── testing-with-test-kit.mdx
├── recipes/
│   ├── server-save-and-rejection.mdx
│   ├── async-options.mdx
│   ├── cross-field-calculation.mdx
│   ├── conditional-sections.mdx
│   ├── collection-crud-and-sort.mdx
│   ├── multi-step-checkout.mdx
│   ├── focus-error-summary.mdx
│   ├── localization.mdx
│   ├── persistence-and-resume.mdx
│   ├── schema-upgrades.mdx
│   ├── undo-redo.mdx
│   ├── wizard-routing.mdx
│   ├── observability.mdx
│   └── ssr-and-teardown.mdx
├── reference/
│   ├── core/
│   │   ├── exports.mdx
│   │   ├── controller.mdx
│   │   ├── schema-types.mdx
│   │   ├── event-types.mdx
│   │   ├── snapshot-types.mdx
│   │   ├── validation-types.mdx
│   │   ├── persistence-types.mdx
│   │   ├── path-utilities.mdx
│   │   ├── schema-utilities.mdx
│   │   ├── collection-utilities.mdx
│   │   └── serialization-utilities.mdx
│   ├── react.mdx
│   ├── dom.mdx
│   ├── test-kit.mdx
│   ├── standard-events.mdx
│   ├── diagnostics.mdx
│   ├── serialization-errors.mdx
│   └── package-compatibility.mdx
├── migration/
│   ├── from-0.x.mdx
│   ├── packages-and-rendering.mdx
│   ├── schemas-and-data.mdx
│   ├── processing-and-events.mdx
│   ├── validation.mdx
│   ├── collections-and-wizards.mdx
│   └── rollout-checklist.mdx
└── project/
    ├── architecture.mdx
    ├── core-boundaries.mdx
    ├── performance.mdx
    ├── release-status.mdx
    └── contributing-to-docs.mdx
```

Retain redirects or compatibility stubs for existing v1 routes so external
links do not break when the hierarchy changes.

## 6. Detailed content backlog

### 6.1 Start and orientation

#### Introduction

- Define Stages in one sentence and show the four packages.
- Explain what Stages owns and what the application owns.
- Show supported structures and adapters without implying built-in visual UI.
- State current release maturity and compatibility policy.
- Route readers to React, DOM, custom-adapter, and migration paths.

#### Mental model

- Diagram `schema + canonical value + registry → controller → snapshots/events`.
- Walk one keystroke through view emission, reduction, patches, `onChange`,
  owner acceptance, reevaluation, and subscriber publication.
- Contrast data paths with stable node addresses.
- Explain domain value, baseline, interaction metadata, validation cache, and
  adapter-local UI state.
- Include a “where does this logic belong?” decision table.

#### Installation and compatibility

- Document package combinations, ESM-only consumption, peer dependencies,
  TypeScript expectations, browser/Node boundaries, and package version
  alignment.
- Include npm, pnpm, and Yarn commands only if they are release-tested.
- Show how repository-local examples differ from registry installation.
- Explain alpha/RC caveats and link to the release-status page.

#### First controller

- Build a single text field from registry through schema and controller.
- Show accepted, rejected, and delayed controlled proposals.
- Add a subscriber and a clean teardown.
- Explain every line that participates in the handshake.
- End with tests a consumer should write for the first integration.

#### Adapter quickstarts

- Provide separate React and DOM paths using the same domain model.
- Include accessible label, input, visible issue, submit, and cleanup behavior.
- Keep advanced collections/wizards out of the quickstart and link forward.

### 6.2 Controller and controlled ownership

- Fully document `stages(options)`, including the mutually exclusive `value`
  and `state` initialization branches.
- Explain `schema`, `fields`, `context`, `onChange`, `onDiagnostic`,
  `validationFailureIssue`, `codec`, `migrations`, `extensionCodecs`, and
  `extensions`, including when each is read or reevaluated.
- Document `getSnapshot`, `subscribe`, `subscribeSelector`, `update`,
  `dispatch`, `batch`, `validate`, `serialize`, and `destroy` separately.
- Show synchronous acceptance, replacement, delay, and rejection timelines.
- Specify `StagesChange`: `value`, `previousValue`, ordered `patches`, `events`,
  `source`, and `transactionId`.
- Explain callback order: change callback, general subscribers, then changed
  selector subscribers.
- Explain controller isolation, behavior after destruction, and cancellation.
- Document form reset using the actual public event contract, baseline effects,
  transaction source, and cleared interaction/validation metadata.
- Provide recipes for server authorization, optimistic UI, external value
  replacement, and multiple independent forms.

### 6.3 Schemas, fields, paths, and identity

#### Schema fundamentals

- Document `id`, positive safe-integer `version`, root `nodes`, root
  `transforms`, and root `validators`.
- Give complete tables for field, group, collection, wizard, stage, and row
  runtime branches.
- Show how each structural ID contributes to the domain data path.
- Document recursive nesting at arbitrary depth, including the tested
  group/collection/wizard permutations.
- Explain initial field values versus owner-provided structural containers.
- Document sibling uniqueness, safe identifiers, stable identity, compatible
  dynamic reuse, and incompatible identity recovery.

#### Paths and addresses

- Define `DataPath`, `NodeAddressSegment`, and `NodeAddress` field by field.
- Show equivalent locations before and after a collection row move.
- Give a decision table for field target, value scope, node target, row target,
  wizard target, persistence identity, and UI keys.
- Document unsafe string segments, invalid numeric segments, root paths, array
  removal semantics, and errors thrown by path helpers.

#### Field registry

- Document `FieldDefinition` view tokens, `initialValue` values/factories,
  reducers, and intrinsic validators.
- Explain how registry keys constrain schema field `type` and how props/view
  generics flow into adapters.
- Show primitive, object-valued, nullable, and custom-editor definitions.
- Explain fresh default factories for mutable-looking object/array values.
- Contrast reusable intrinsic field validators with node/root validators.

### 6.4 Events, reducers, transforms, and transactions

#### Events

- Document the open event-name vocabulary and the standard conventions.
- Cover field, node, and form targets, sources, optional payloads, and typed
  constructors.
- Explain why event constructors preserve payload inference but do not validate
  application-specific payloads.
- Include invalid/missing target behavior and disabled/hidden structural target
  behavior.
- Provide an event target/payload/effect/rejection matrix for every standard
  collection and wizard event plus `input`, `focus`, `blur`, `reset`, `init`,
  `validate`, and application-chosen submission events.

#### Field reducers

- Explain `{ value }`, `{ patches }`, and `undefined` results.
- Show parsing, filtering, empty-number semantics, blur cleanup, custom editor
  events, and multi-path reducers.
- Document thrown reducer, malformed patch, unsafe path, and atomic rejection
  behavior.

#### Transforms and patches

- Document `on`, `when`, `apply`, context fields, set/remove patches, and safe
  path constraints.
- Visualize target-to-root ordering and show that each later transform sees
  prior patches.
- Explain last-writer-wins overlap and entire-transaction rejection.
- Provide real examples for slugs, totals, clearing dependent fields, copying
  addresses, and normalization on blur.

#### Transactions and batching

- Explain automatic microtask batching versus explicit `batch()`.
- Define what is grouped: events, patches, change callback, dynamic evaluation,
  general notification, and selector notifications.
- Show nested batches, dispatches without value patches, validation side
  effects, and controller independence if tests support those guarantees.
- Include performance guidance derived from the formal work-count budgets.

### 6.5 Dynamic configuration

- Document schema factories and their `value`, `context`, and `meta` inputs.
- Document `when`, `disabled`, stage resolvers, and field `deriveProps`.
- List every `NodeResolverContext` field with examples.
- Compare `when` with structurally adding/removing a node in a factory.
- Explain disabled inheritance, hidden-node validation exclusion, and state
  retention for dormant versus removed nodes.
- Explain context/schema/extension updates that reevaluate without proposing a
  value.
- Document deterministic, pure, side-effect-free resolver requirements.
- Show dynamic permission control, plan-dependent sections, localized props,
  option derivation, dynamic stages, and extension-driven configuration.
- Explain last-valid-tree recovery for thrown factories, malformed outputs,
  unstable root identity, failed resolvers, failed `itemKey`, and incompatible
  node reuse.

### 6.6 Snapshots, subscriptions, and interaction metadata

- Document every `StagesSnapshot`, `FieldSnapshot`, `ContainerSnapshot`,
  `ValidationSnapshot`, `SnapshotState`, and `DynamicMetaSnapshot` field.
- Provide annotated JSON-like snapshots for a field, group, collection row,
  wizard, and stage.
- Explain canonical value, revision changes, diagnostics, and recursive nodes.
- Explain visible, disabled, focused, touched, visited, dirty, validating,
  issues, and visible issues, including which are durable.
- Document structural sharing guarantees and narrow selection patterns.
- Show primitive and object selection, custom equality, unsubscribe behavior,
  and subscriber ordering.
- Explain why snapshots are readonly and why adapters must not cache paths as
  collection identity.

### 6.7 Groups and recursive composition

- Give groups their own page instead of treating them only as a schema row.
- Explain object scope, inherited visibility/disabled state, transforms,
  validators, and nested path/address construction.
- Show groups inside rows/stages and collections/wizards inside groups.
- Provide a deeply nested worked example with an annotated value, schema,
  render tree, paths, and addresses.
- Explain that there is no special subform node and show scoped validation as
  the replacement for subform validation bridging.

### 6.8 Collections

#### Base model

- Explain homogeneous `nodes`, array value requirements, row snapshots,
  constraints, capabilities, and row-address targeting.
- Document collection-level transforms/validators and disabled behavior.
- Show empty, minimum-sized, maximum-sized, and externally replaced arrays.

#### Commands

Document each command independently with controller event shape, pure-helper
shape, accepted forms, rejected forms, diagnostics, capability effects,
identity effects, controlled acceptance effects, and a runnable example:

| Command | Required coverage |
| --- | --- |
| `collection:add` | append/insert, supplied value, union variant defaults, max rejection |
| `collection:remove` | collection index and row target, min rejection, metadata cleanup |
| `collection:replace` | collection index and row target, unchanged rejection, row-key reconciliation |
| `collection:duplicate` | default/explicit destination, row target, max rejection, shallow identity implications |
| `collection:move` | collection and row forms, invalid/no-op move, proposed versus accepted key movement |
| `collection:sort` | complete permutation, duplicate/missing indexes, unchanged order, stable row metadata |

#### Identity

- Explain engine-owned keys and application `itemKey` side by side.
- Show reorder, delayed acceptance, rejected proposal, serialization, and
  recreation timelines.
- Explain duplicate/invalid keys and `itemKey` exceptions.
- Show React `key`, node address, and data-path index as three related but
  different values.

#### Discriminated collections

- Document `discriminator`, `variants`, variant nodes, default construction,
  and explicit value insertion.
- Show heterogeneous rows in both core events and React rendering.
- Explain unknown variants, unsafe discriminators/variant names, and malformed
  row values.

### 6.9 Wizards

- Document wizard and stage value shapes, paths, addresses, snapshots, and
  metadata.
- Explain `initialStage`, visible-stage resolution, active-stage recreation,
  and fallback when the active stage becomes hidden.
- Document `wizard:previous`, `wizard:next`, and `wizard:go` targets/payloads.
- Explain `nonLinear`, `validateCurrent`, and `guard` evaluation order.
- Provide the full navigation state matrix: unknown, pending, invalid,
  warning-only, valid, hidden, disabled, first stage, last stage, and invalid
  target.
- Clarify that navigation changes metadata and does not propose domain value.
- Show linear onboarding, optional dynamic stages, non-linear checkout review,
  nested wizards, and wizard-in-collection scenarios.
- Show router integration as an application subscriber rather than a core
  feature.

### 6.10 Validation

#### Validator kinds and context

- Compare registry field validators, node validators, and root validators.
- Document every `ValidatorConfig`, `FieldValidator`, `ValidationContext`,
  `FieldInteractionState`, and `ValidationIssue` field.
- Explain stable validator and issue identity and exact issue paths.
- Show error and warning semantics, optional messages/meta, declaration order,
  and malformed-result handling.

#### Execution and reveal policies

- Explain `on` separately from `revealOn` with event timelines.
- Cover `init`, input, blur, submit/custom events, explicit `validate()`, and
  repeated runs.
- Show validate-without-reveal and reveal-after-prior-validation behavior.
- Explain durable revealed-address state and what recreation does not restore.

#### Status and aggregation

- Define `unknown`, `pending`, `invalid`, and `valid` precisely.
- Explain error precedence over pending while preserving counts.
- Explain warnings that do not invalidate.
- Show form, data-path, node-address, and wizard-stage scopes.
- Document `issues`, `visibleIssues`, `pendingCount`, `unknownCount`, and
  `isValid` without reducing unknown to a Boolean success.

#### Dependencies and applicability

- Explain explicit dependency paths, selective invalidation, target-only
  execution, and caches.
- Show password confirmation, uniqueness within a collection, and price totals.
- Explain validator `when`, structurally removed validators, hidden nodes, and
  `includeDisabled`.

#### Async validation and cancellation

- Document the framework-neutral cancellation signal, `aborted`, and
  `onCancel()` unsubscribe contract.
- Show integration with `fetch`/`AbortController` through application glue.
- Demonstrate superseding input, dependency updates, structural removal,
  external value updates, and controller teardown.
- Explain stale-result suppression even when underlying work cannot cancel.

#### Failures and localization

- Document thrown `when`, thrown/rejected `validate`, malformed issues, and the
  deterministic engine issue policy.
- Fully document `validationFailureIssue`, customizable fields, engine-owned
  fields, hook failure fallback, and its diagnostic.
- Show localized field props, validation messages, formatted issue metadata,
  and switching locale through context.

### 6.11 Persistence and recreation

- Annotate the complete `SerializedStagesState` envelope.
- Define format version separately from schema version.
- List durable state: value, baseline, touched/visited addresses, revealed
  addresses, wizard stages, collection row keys, and registered extensions.
- List excluded state: focus, listeners, validation results, pending work,
  browser handles, and unregistered adapter state.
- Explain serialize/destroy/recreate rather than mutating an obsolete
  controller.
- Document schema ID/version mismatch and migration requirements during
  recreation.

#### JSON boundary and value codecs

- Document accepted JSON primitives, arrays, and plain objects.
- Demonstrate rejection of undefined, functions, symbols, bigint, non-finite
  numbers, cycles, non-plain objects, and unsafe keys with exact paths.
- Show a production-ready `Date` codec and one compound domain codec.
- Explain codec symmetry, validation, error handling, and baseline encoding.

#### Extension state

- Explain namespaces, update semantics, dynamic-config visibility, codec
  registration, and persistence.
- Document unsafe, unknown, missing, decode-failing, and encode-failing
  namespaces.
- Show a UI workflow draft or feature state that belongs in an extension and a
  focus/modal state that should remain adapter-local.

#### Migrations

- Document schema ID, from/to versions, strict increases, chains, and updates
  to both value and baseline.
- Show add/rename/split-field migrations and migration tests.
- Explain ambiguity, cycles, thrown migrations, invalid envelopes, and wrong
  output identity/version.
- Give deployment guidance for retaining all required historic steps.

#### Storage and autosave

- Show local storage and remote storage adapters as application recipes.
- Address debouncing, storage keys, quota/network errors, concurrent tabs,
  server conflict policy, encryption/privacy, and version rollout without
  implying these are core features.

### 6.12 Diagnostics and recovery

- Explain `Diagnostic` fields, `onDiagnostic`, snapshot accumulation, and the
  difference from user-facing validation.
- Create an exhaustive generated or source-checked catalog of all diagnostic
  codes, severity, trigger, affected path/address, controller effect, and
  recovery action.
- Organize codes by schema normalization, dynamic evaluation, identity,
  targets/events, collections, reducers/transforms/patches, validation failure
  presentation, and extensions.
- Explain last-valid-tree behavior and when invalid state is discarded.
- Provide observability integration guidance that avoids leaking sensitive form
  values.
- Include a troubleshooting flow from code → path/address → responsible schema
  node → repair/recovery.

### 6.13 React adapter

- Fully document `useStages`, `useStagesController`, `useStagesField`,
  `StagesField`, `useStagesCollection`, and `useStagesWizard`.
- Document every exported React type and binding field.
- Explain factory lifetime, controlled inputs, referential stability,
  subscription granularity, and actual unmount destruction.
- Explain React Strict Mode effect replay and the guarantee covered by tests.
- Show typed custom views for text, number, checkbox, select, and complex object
  values.
- Cover generated collision-safe IDs and explicit ID overrides.
- Show collection item value/path/address/key and every provided command or
  capability.
- Show wizard stage bindings, navigation, custom stage layout, and form submit.
- Provide application-owned accessibility guidance for labels, descriptions,
  issues, alerts/status, fieldsets, stage headings, progress, focus, and error
  summaries.
- Show selective rerender measurement and stable input/schema/context objects.
- Document thrown behavior for missing paths, wrong container kinds, and missing
  views.

### 6.14 DOM adapter

- Fully document `createDomFields()` definitions and parsing behavior for text,
  number, and checkbox.
- Document every `DomFieldProps` property and clarify that `required` is native
  semantics, not a core validator.
- Fully document `mountStages()`, `MountStagesOptions`, and `MountedStages`.
- Explain render recursion, inactive-stage behavior, subscription, `onRender`,
  manual render, and idempotent teardown.
- Document label/control IDs, descriptions, error/warning announcement,
  `aria-invalid`, `aria-errormessage`, and `aria-describedby` composition.
- Document focus preservation, `focus(path)`, `focusFirstIssue()`, focus options,
  Boolean return, and hidden/disabled/inactive exclusions.
- Build custom `DomFieldView` examples for select and date inputs.
- State the accessibility responsibilities custom views inherit.

### 6.15 Custom adapters and test kit

- Specify the minimum adapter loop: read snapshot, render, emit event,
  subscribe, unsubscribe, and coordinate controller ownership/destruction.
- Explain opaque view tokens and show concrete mappings for Vue-style and
  Angular-style adapters without suggesting first-party packages exist.
- Explain path versus address use, recursive rendering, visibility, disabled
  state, issue presentation, stable row identity, and wizard/collection
  capabilities.
- Fully document `bindAdapter`, `AdapterHarness`, immediate first render,
  `getSnapshot`, `emit`, and idempotent `destroy`.
- Publish a reusable adapter conformance checklist covering controlled
  acceptance, recursive nodes, stable rows, async teardown, narrow updates,
  diagnostics, and accessibility.

### 6.16 Pure utilities and tooling APIs

Each function needs a signature, parameter table, return behavior, mutation/
identity guarantees, thrown/rejected cases, and at least one focused example.

- Paths: `getAtPath`, `setAtPath`, `removeAtPath`, `applyPatches`,
  `pathsEqual`, `isSafePathSegment`, `assertSafePath`.
- Schema: `evaluateSchema`, `initialFieldValue`, normalized/evaluated result
  types, diagnostics, supplied collection keys, and tooling use cases.
- Collections: `reduceCollectionCommand`, every `CollectionCommand` member,
  `CollectionCommandResult`, constraints, and no-op/rejection codes.
- Serialization: `encodeJson`, `decodeJson`, `validateSerializedState`,
  `migrateSerializedState`, and `SerializationError`.
- Events: `fieldEvent`, `nodeEvent`, `formEvent`, and `StagesEventInit` generic
  inference.

### 6.17 Architecture, limits, and performance

- Preserve the core/adapters/application responsibility diagram.
- Explain pure core versus imperative controller shell.
- Document zero runtime dependencies in core and absence of DOM/framework
  globals.
- Explain recursive normalization, reconciliation, immutable updates,
  structural sharing, and per-controller state at a conceptual level.
- State deliberate non-features and the supported composition alternative for
  each: built-in UI, routing, storage, autosave, undo, remote option cache,
  subform, fieldset/template registry, arbitrary interface-state channel, and
  Lodash-style string paths.
- Publish the measured initialization, batching, and selector budgets with
  scale, what is asserted, and how consumers should interpret them.
- Avoid promising performance outside measured scenarios.

### 6.18 Migration from 0.x

- Keep the exhaustive export/concept disposition matrix, but split it into
  navigable task pages.
- Give before/after examples for package imports, controlled ownership,
  schemas, field registries, paths, processing, validation, collections,
  wizards, rendering, persistence, and application-owned concerns.
- Make **Replace**, **Move**, and **Remove** visually distinct and consistent.
- Add complete recipes for filter/cast, blur cleanup, precision, computed
  values/options, clear fields, custom actions, collection sorting, dynamic
  options, fieldsets/subforms, outer wizards, routing, autosave, and undo.
- Include an incremental rollout and coexistence test checklist.
- Link every legacy concept to its exact v1 guide or state explicitly that no
  core equivalent exists.

## 7. Exhaustive API reference inventory

The reference is not complete until it covers the package export maps rather
than a hand-selected list.

### 7.1 `@stages/core` runtime exports

- `stages`
- `fieldEvent`, `nodeEvent`, `formEvent`
- `getAtPath`, `setAtPath`, `removeAtPath`, `applyPatches`, `pathsEqual`,
  `isSafePathSegment`, `assertSafePath`
- `evaluateSchema`, `initialFieldValue`
- `reduceCollectionCommand`
- `encodeJson`, `decodeJson`, `validateSerializedState`,
  `migrateSerializedState`, `SerializationError`

### 7.2 `@stages/core` public type exports

Document each type/interface independently and link cross-references:

- identity and JSON: `DataPath`, `NodeAddressSegment`, `NodeAddress`,
  `JsonPrimitive`, `JsonValue`, `DeepReadonly`;
- diagnostics/dynamics: `Diagnostic`, `DynamicMetaSnapshot`,
  `DynamicConfigContext`, `NodeResolverContext`, `NodePredicate`,
  `DerivedProps`;
- events/reduction/transforms: `StagesEventSource`, `StagesEvent`,
  `StagesEventTarget`, `StagesEventInit`, `StagesPatch`, `FieldReduceContext`,
  `FieldReduceResult`, `FieldEventReducer`, `TransformContext`,
  `TransformConfig`;
- fields: `FieldDefinition`, `FieldRegistry`, `FieldValidator`,
  `FieldValidationIssue`;
- validation: `FieldInteractionState`, `ValidationContext`,
  `ValidationCancellationSignal`, `ValidationIssue`,
  `ValidationFailureContext`, `ValidationFailureIssuePresentation`,
  `ValidationFailureIssueFactory`, `ValidatorConfig`, `ValidationSnapshot`,
  `ValidateOptions`;
- schema: `FieldNodeConfig`, `GroupNodeConfig`, `CollectionVariantConfig`,
  `CollectionNodeConfig`, `StageNodeConfig`, `WizardNavigationConfig`,
  `WizardNodeConfig`, `NodeConfig`, `StagesSchema`, `StagesSchemaFactory`,
  `StagesSchemaInput`, `NormalizedNode`, `NormalizedBranch`, `EvaluatedSchema`,
  `EvaluateSchemaOptions`;
- snapshots/controller: `FieldSnapshot`, `ContainerSnapshot`,
  `RenderNodeSnapshot`, `StagesSnapshot`, `StagesChange`, `StagesOptions`,
  `StagesUpdate`, `StagesController`;
- collections: `CollectionCommand`, `CollectionCommandResult`;
- persistence: `SerializedStagesState`, `StagesValueCodec`,
  `StagesExtensionCodec`, `StagesStateMigration`.

If an exported type is primarily intended for tooling rather than ordinary
applications, say so instead of omitting it.

### 7.3 `@stages/react`

- Runtime: `useStages`, `useStagesController`, `useStagesField`,
  `useStagesCollection`, `useStagesWizard`, `StagesField`.
- Types: `ReactFieldProps`, `ReactFieldView`, `UseStagesResult`,
  `ReactCollectionItemBinding`, `ReactCollectionBinding`,
  `ReactWizardStageBinding`, `ReactWizardBinding`, `StagesFieldProps`.

### 7.4 `@stages/dom`

- Runtime: `createDomFields`, `mountStages`.
- Types: `DomFieldBinding`, `DomFieldView`, `DomFieldProps`,
  `MountStagesOptions`, `MountedStages`, and the re-exported
  `ContainerSnapshot`.

### 7.5 `@stages/test-kit`

- Runtime: `bindAdapter`.
- Types: `AdapterHarness`.

### 7.6 Standard event reference

For each engine-recognized event, document target, payload, metadata/value
effect, batching, validation interaction, failure/no-op behavior, and source
tests:

- interaction: `focus`, `blur`;
- lifecycle/policy conventions: `init`, `validate`, application-selected
  `input` and `submit` events;
- form: `reset`;
- collections: `collection:add`, `collection:remove`,
  `collection:replace`, `collection:duplicate`, `collection:move`,
  `collection:sort`;
- wizards: `wizard:previous`, `wizard:next`, `wizard:go`.

Clearly distinguish events interpreted directly by core from open event names
that only reducers, transforms, or validators interpret.

### 7.7 Error and rejection references

- Build a complete `SerializationError` table including all current `json.*`,
  `state.*`, and `migration.*` codes.
- Build a complete collection pure-helper rejection table including min, max,
  index, order, and unchanged cases.
- Build a complete runtime diagnostic table from source, including schema,
  event, collection, transform/patch, validation-presentation, and extension
  codes.
- State whether each condition throws, returns a rejected result, appends a
  diagnostic, calls `onDiagnostic`, suppresses `onChange`, retains the last
  valid tree, or falls back to a deterministic issue.

## 8. Real-world scenario coverage

Feature snippets explain mechanics; end-to-end scenarios prove composition.
Create a small set of coherent applications rather than unrelated toy fields.

| Scenario | Capabilities demonstrated | Deliverable |
| --- | --- | --- |
| Account profile | controlled value, registry, reducers, derived props, conditional group, sync validation | Beginner tutorial + live React/DOM variants |
| Server-approved settings | delayed acceptance, proposal replacement/rejection, external updates, diagnostics | Core recipe with transaction timeline |
| Team editor | homogeneous collection, stable keys, add/remove/replace/duplicate/move/sort, min/max | Live React demo + core event tests |
| Travel expense rows | discriminated variants, nested groups/wizards, union defaults, dynamic props | Advanced collection guide |
| Checkout wizard | stage validation, warnings, async validation, guards, optional stages, non-linear review | Live full tutorial |
| Username availability | dependencies, cancellation, stale result suppression, failure localization | Validation lab/demo |
| Resume later | serialization, baseline/reset, row keys, wizard stage, reveal state, value codec | Persistence tutorial |
| Schema upgrade | multiple migration steps, value/baseline changes, failure handling | Checked migration fixture |
| Localized onboarding | context updates, `deriveProps`, localized issues, number/date view formatting | i18n recipe |
| Design-system integration | typed custom field views, accessible errors, focus summary, selector subscriptions | React integration guide |
| Custom framework adapter | opaque tokens, recursive renderer, stable row identity, test-kit contract | Adapter walkthrough |
| Autosaved routed wizard | application storage, debounce, URL synchronization, conflict/error policy | Architecture recipe clearly outside core |

At least one scenario must combine every recursive container pairing and link to
the exhaustive nesting tests for the larger permutation matrix.

## 9. Example and demo architecture

### 9.1 Checked source, not duplicated prose

- Move reusable example schemas, field definitions, and helpers into typed
  source modules.
- Render documentation snippets from marked regions in those modules.
- Typecheck core-only snippets against `@stages/core`, React snippets as TSX,
  and DOM snippets with DOM library types.
- Run executable examples where observable behavior matters.
- Keep displayed source identical to the code used by a live demo.

### 9.2 Example levels

- **Snippet:** one API or rule, fewer than roughly 30 relevant lines.
- **Focused demo:** one subsystem with visible state/diagnostics.
- **Recipe:** a realistic task spanning two or more capabilities.
- **Example application:** production-style composition with build and tests.

Label the level so users know whether code is minimal pedagogy or a recommended
production structure.

### 9.3 Required additions to the live demo library

- controlled proposal accept/replace/reject/delay;
- selector notification and structural sharing inspector;
- form reset and baseline behavior;
- union collection and all six commands;
- row identity through delayed acceptance and recreation;
- dynamic schema failure and incompatible identity recovery;
- validation execution/reveal timeline;
- scoped/warning/disabled validation states;
- codec + extension + migration recreation;
- custom DOM field with focus behavior;
- custom adapter/test-kit proof.

Pure utilities and exhaustive failure catalogs can use compiled examples and
tests instead of artificial browser controls.

### 9.4 Standard example anatomy

Every substantial example should include:

1. the user problem;
2. why the chosen layer/API is appropriate;
3. complete domain, context, field, and schema types;
4. runnable implementation;
5. expected value/snapshot/change or rendered result;
6. failure and edge-case behavior;
7. accessibility notes where UI is involved;
8. testing guidance;
9. links to the exact API reference and next advanced recipe.

## 10. Page-level definition of complete

Use this template for every feature/reference page as applicable.

- **Purpose:** what problem the capability solves.
- **Prerequisites:** concepts the reader should already know.
- **Minimal example:** smallest valid use.
- **Mental model:** state ownership and event/data flow.
- **Complete contract:** all properties, generics, defaults, targets, payloads,
  return values, callbacks, ordering, and lifecycle behavior.
- **State effects:** canonical value, baseline, metadata, validation, snapshot,
  subscriptions, and serialization.
- **Composition:** how it behaves inside groups, collections, wizards, dynamic
  schemas, and each adapter.
- **Edge cases:** empty/missing/malformed inputs, hidden/disabled/destroyed
  state, no-op and rejected operations, async races, and identity changes.
- **Failure behavior:** returned rejection, thrown error, diagnostic, fallback,
  last-valid-tree retention, or transaction rollback.
- **Real-world recipe:** at least one meaningful application example.
- **Accessibility/security/performance:** relevant responsibilities and limits.
- **Testing:** concrete assertions a consumer should make.
- **Related APIs:** guide/reference cross-links.
- **Evidence:** source file and one or more executable tests used to verify the
  claims.

No page is complete if it only contains a definition and happy-path snippet.

## 11. Traceability system

Create a machine-readable manifest, for example
`docs/content/coverage-manifest.json`, with one record per public contract:

```json
{
  "symbol": "StagesController.subscribeSelector",
  "package": "@stages/core",
  "kind": "method",
  "guide": "/core-concepts/snapshots-and-subscriptions",
  "reference": "/reference/core/controller#subscribeselector",
  "examples": ["selector-notifications"],
  "tests": ["packages/core/test/controller.test.mjs"],
  "status": "complete"
}
```

The manifest should cover:

- every runtime and type export in all four package entry points;
- every public interface property and discriminated-union branch;
- every controller method and option;
- every snapshot and metadata field;
- every engine-recognized event and payload variant;
- every collection command/rejection;
- every diagnostic and serialization error code;
- every deliberate non-feature with its application-level alternative;
- every 0.x root export and migration concept.

Generate or validate the export portion from TypeScript/package entry points so
new exports fail CI until they receive a guide/reference assignment.

## 12. Documentation quality gates

Expand `scripts/check-v1-docs.mjs` or split it into focused checks.

### 12.1 Structural checks

- All navigation entries resolve to a page.
- Internal links and anchors resolve.
- Old route redirects remain valid.
- Every guide has purpose, prerequisites, next steps, and evidence metadata.
- Every registered demo is embedded and every embedded demo is registered.

### 12.2 API coverage checks

- Derive public runtime/type exports from package entry points or generated
  declarations rather than maintaining only a selected hard-coded list.
- Validate all coverage-manifest records and reject duplicate/orphan symbols.
- Require every public method/property/union member to appear in reference
  metadata, not merely somewhere in the prose corpus.
- Extract standard diagnostic/error/rejection codes or compare them to a
  checked catalog.

### 12.3 Code checks

- Typecheck every snippet using the package's strict settings.
- Execute examples that promise runtime output, callback order, errors,
  diagnostics, or identity behavior.
- Assert displayed source regions match live demo source.
- Build the documentation application in the release gate.
- Test examples against packed artifacts at least once in the release flow so
  workspace resolution cannot conceal missing exports.

### 12.4 Content checks

- Use terminology consistently: canonical value, proposal, acceptance, path,
  address, visible, disabled, issue, diagnostic, serialization error.
- Flag obsolete API names such as `controller.reset()` and
  `focusFirstVisibleIssue()` unless shown in explicitly labeled migration
  input.
- Flag claims such as “changes the value” when the operation only proposes a
  value or changes metadata.
- Run spelling, prose linting, and inclusive-language checks with a small
  project dictionary for Stages terms.

### 12.5 Accessibility checks

- Automate basic axe-style checks for every live UI example if the chosen
  tooling can run reliably in CI.
- Add keyboard and focus tests for collection controls, wizard navigation,
  validation summaries, and custom views.
- Retain DOM adapter contract tests as normative evidence rather than relying
  only on rendered screenshots.

## 13. Delivery phases

### Phase 0 — Freeze the inventory

- [ ] Enumerate package export maps, runtime exports, type exports, public
  members, standard events, diagnostics, errors, and rejections.
- [ ] Map each item to source, tests, current docs, and missing coverage.
- [ ] Add the coverage manifest and an initial validator.
- [ ] Label current pages as overview, guide, recipe, or reference.

Exit criterion: every public contract has a unique inventory record, even when
its documentation status is `missing`.

### Phase 1 — Correct contract drift

- [ ] Audit every current v1 page, package README, and migration statement
  against declarations and executable tests.
- [ ] Resolve the known reset, validator policy, and focus method naming drift.
- [ ] Identify architecture-plan proposals that never became public API and
  keep them out of normative pages.
- [ ] Add regression checks for removed/incorrect public names.

Exit criterion: the retained docs contain no known contradiction with the
implemented alpha contract.

### Phase 2 — Build the information architecture and authoring system

- [ ] Create nested navigation, page templates, redirects, evidence metadata,
  and reusable callouts/tables.
- [ ] Create typed snippet/example directories and source-region tooling.
- [ ] Add link, snippet, and manifest checks.
- [ ] Establish terminology and style guidance.

Exit criterion: authors can add one checked page/example/reference entry using
a documented repeatable workflow.

### Phase 3 — Rewrite the getting-started journey

- [ ] Publish introduction, mental model, installation, first controller,
  React quickstart, and DOM quickstart.
- [ ] Teach the controlled handshake with accept/reject/replace/delay examples.
- [ ] Add copyable accessible starter examples and tests.

Exit criterion: a new user can build and validate a one-field form in their
chosen adapter without consulting source or advanced pages.

### Phase 4 — Complete core concepts

- [ ] Publish detailed controller, lifecycle, schema, path/address, registry,
  event/reducer, transform/patch, transaction/batching, snapshot/subscription,
  and dynamic-configuration guides.
- [ ] Add annotated event timelines and snapshot examples.
- [ ] Document reset and teardown behavior accurately.

Exit criterion: every core controller and schema capability has a guide, a
reference entry, a checked example, and failure behavior.

### Phase 5 — Complete structures and validation

- [ ] Publish groups, all collection modes/commands, row identity,
  discriminated collections, wizards, navigation policy, and recursive
  composition.
- [ ] Publish the full validation series, including all states, scopes,
  policies, dependencies, cancellation, disabled behavior, and failure hooks.
- [ ] Add the collection CRUD, travel rows, checkout, and username scenarios.

Exit criterion: all structural commands and validation state transitions are
documented and executable, including rejected and async cases.

### Phase 6 — Complete persistence, recovery, and diagnostics

- [ ] Publish serialization envelope, durable-state, codec, extension,
  migration, storage, and autosave pages.
- [ ] Publish exhaustive diagnostics, serialization errors, and collection
  rejection catalogs.
- [ ] Add resume-later and multi-step schema-upgrade fixtures.

Exit criterion: users can safely persist, inspect, migrate, recover, and report
all supported failure conditions without reading controller source.

### Phase 7 — Complete adapter documentation

- [ ] Publish every React hook/component/type contract and real design-system
  examples.
- [ ] Publish every DOM field/mount/focus/custom-view contract.
- [ ] Publish custom-adapter architecture, walkthrough, and test-kit
  conformance checklist.
- [ ] Add accessibility and selective-rendering guidance/tests.

Exit criterion: the public surface of all three adapter-facing packages is
fully referenced and each integration path has a production-style tutorial.

### Phase 8 — Complete recipes, architecture, and migration

- [x] Publish the real-world recipe set.
- [x] Publish deliberate non-feature alternatives and operational boundaries.
- [x] Split and cross-link the 0.x migration guide while preserving exhaustive
  concept coverage.
- [x] Document verified performance budgets and release maturity.

Exit criterion: every major “how do I use this in a real application?” task has
an indexed answer or an explicit boundary statement.

### Phase 9 — Complete and lock the reference

- [ ] Publish every runtime export, type export, public member, event, code, and
  compatibility statement in reference pages.
- [ ] Make the coverage gate derive exports and fail on omissions.
- [ ] Add version/review metadata to normative pages.
- [ ] Review cross-links from guides to reference and reference to examples.

Exit criterion: the coverage manifest is 100% complete and the CI check can
prove that no exported or recognized public contract is undocumented.

### Phase 10 — Editorial and external-user validation

- [ ] Run technical review against source/test owners.
- [ ] Run accessibility review of all interactive examples.
- [ ] Have a developer unfamiliar with v1 complete the React and DOM learning
  paths and record confusion points.
- [ ] Have an adapter author complete the custom-adapter walkthrough.
- [ ] Have a 0.x user perform one representative migration.
- [ ] Fix all blocking findings and rerun the release documentation gate.

Exit criterion: representative users can complete the primary tasks without
maintainer intervention, and all automated checks pass.

## 14. Suggested work slicing

Prefer vertical slices that finish a capability across guide, reference,
example, test, and coverage manifest. A useful pull-request sequence is:

1. inventory/gates and known drift corrections;
2. controlled controller + first-form journey;
3. schemas + paths/addresses + field registry;
4. events/reducers + transforms + batching;
5. snapshots/subscriptions + dynamic configuration;
6. groups + recursive composition;
7. homogeneous collections + all commands;
8. collection identity + discriminated variants;
9. validation fundamentals + policies/scopes;
10. validation async/dependencies/failures/localization;
11. wizards + navigation matrix;
12. serialization + codecs + extensions;
13. migrations + storage recipes + diagnostics catalogs;
14. React adapter complete surface;
15. DOM adapter complete surface;
16. custom adapters + test kit;
17. pure utilities and type reference;
18. migration, architecture, recipes, and external-user review.

Avoid a long-lived branch that rewrites every MDX page before any slice is
reviewable. Each slice should improve the live docs and tighten its CI coverage.

## 15. Global definition of done

The comprehensive v1 documentation is complete when all of the following are
true:

- Every public runtime and type export from every v1 package has a normative
  reference entry.
- Every public option, method, callback field, snapshot field, schema branch,
  event variant, command, diagnostic, error code, and rejection behavior is
  documented.
- Every capability has at least one guide or recipe explaining why and when to
  use it, not only a type signature.
- Happy paths, rejected/no-op paths, malformed inputs, dynamic recovery,
  asynchronous races, teardown, and serialization behavior are covered where
  relevant.
- All substantial examples compile; behavioral examples execute; live examples
  display the exact checked source they run.
- React, DOM, and custom-adapter readers each have a complete learning path.
- Accessibility responsibilities are explicit and tested for all UI examples.
- Real-world recipes cover server ownership, collections, wizards, async work,
  localization, persistence, schema migration, routing, autosave, undo/redo,
  observability, SSR, and teardown at the correct architectural layer.
- The 0.x migration matrix remains exhaustive and links to detailed v1
  replacements or explicit removal/move decisions.
- A generated/validated coverage manifest reports 100% coverage and fails CI
  when the public API or recognized codes/events change without docs.
- `npm run check:docs:v1`, the documentation production build, package tests,
  and all new snippet/example/accessibility checks pass.
- At least one new user, one adapter-focused user, and one 0.x user have tested
  the relevant journeys and blocking feedback has been resolved.

## 16. Implementation evidence map

The initial source audit produced the following map. Authors should start with
these files, then cite the most focused individual test for each behavioral
claim in the coverage manifest.

| Documentation area | Public/source contract | Primary executable evidence |
| --- | --- | --- |
| Complete core export and type inventory | `packages/core/src/index.ts`, `packages/core/src/types.ts`, `packages/core/test-d/contract.ts` | strict package typecheck and packed declaration consumer |
| Controlled ownership, controller lifecycle, callback order, reset, batching, selectors | `packages/core/src/controller.ts` | `packages/core/test/controller.test.mjs`, `packages/core/test/controller-property.test.mjs` |
| Schema nodes, resolvers, paths/addresses, normalization diagnostics | `packages/core/src/schema.ts`, schema types in `packages/core/src/types.ts` | `packages/core/test/schema.test.mjs`, `schema-property.test.mjs`, `nesting.test.mjs` |
| Immutable paths and patches | `packages/core/src/path.ts` | `packages/core/test/path.test.mjs`, path properties in `property.test.mjs` |
| Event constructors and payload inference | `packages/core/src/events.ts` | `packages/core/test-d/contract.ts`, controller event tests |
| Reducers and transforms | reducer/transform types plus `packages/core/src/controller.ts` | transform/failure tests in `controller.test.mjs`, `processing-migration.test.mjs` |
| Collection commands and pure reduction | `packages/core/src/collections.ts`, collection config/snapshot types | `packages/core/test/collections.test.mjs`, collection controller/property tests |
| Wizard metadata and navigation | wizard config/snapshot types plus `packages/core/src/controller.ts` | wizard controller tests and the navigation matrix in `validation.test.mjs` |
| Validation policies, scopes, dependencies, cancellation, failure presentation | validation types plus `packages/core/src/controller.ts` | `packages/core/test/validation.test.mjs` |
| Serialization, JSON boundary, codecs, extensions, migrations | `packages/core/src/serialization.ts`, persistence types, controller recreation code | `packages/core/test/serialization.test.mjs`, packed consumer verification |
| React hooks, bindings, IDs, and lifecycle | `packages/react/src/index.tsx` | `packages/react/test/react.test.mjs`, `examples/react/test/strict-mode.test.mjs` |
| DOM native fields, rendering, accessibility, and focus | `packages/dom/src/index.ts` | `packages/dom/test/dom.test.mjs` |
| Adapter harness and framework-neutral proofs | `packages/test-kit/src/index.ts` | `packages/test-kit/test/adapter-contract.test.mjs` |
| Production composition | `examples/vanilla/src/main.ts`, `examples/react/src/main.tsx` | strict example typechecks, builds, and React lifecycle test |
| Current documentation demos and gates | `docs/components/StagesDemo.jsx`, `docs/components/StagesExample.jsx`, `scripts/check-v1-docs.mjs` | `npm run check:docs:v1`, documentation production build |
| Architecture, scope, acceptance, and performance intent | `docs/V1_ARCHITECTURE_PLAN.md`, `docs/V1_ACCEPTANCE_REVIEW.md` | acceptance and performance scripts referenced by the root package scripts |
| 0.x behavior and migration decisions | `docs/CURRENT_IMPLEMENTATION_API.md`, `docs/MIGRATING_TO_V1.md` | migration inventory in `scripts/check-v1-docs.mjs`, `processing-migration.test.mjs` |

When a page makes a stronger promise than these tests prove, add or strengthen
the executable contract first. Documentation must not turn an incidental
implementation detail into an accidental compatibility guarantee.

## 17. Maintenance after completion

- Require a coverage-manifest and documentation change for every public API,
  standard event, diagnostic, or serialized-format change.
- Generate a docs diff report from declarations/codes during CI.
- Review normative pages on each prerelease and stamp the reviewed version.
- Keep compact package READMEs as installation entry points that link into the
  canonical docs; do not duplicate full guides there.
- Treat tests cited by a page as behavioral contracts and update both together.
- Add new recipes only when they clarify a recurring user task; keep API detail
  centralized in reference pages.
- Run periodic broken-link, accessibility, snippet, and external-consumer
  checks as part of the release-candidate process.
