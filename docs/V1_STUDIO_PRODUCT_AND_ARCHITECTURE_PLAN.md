# Stages Studio v1 product and architecture plan

Status: proposed multi-session implementation roadmap

Last reviewed against the implementation: 2026-09-04

Workflow continuation (2026-09-05): the companion workflow improvements plan
now includes compiler-session reuse of unchanged specialized reducers across
presentation edits, with runtime evidence for retained interaction state and
pending owner proposals. This advances the preview-continuity prerequisite;
Wave 5 Sessions 28–31 remain unimplemented and their beta gates remain open.

Execution status:

- Session 01 completed: [`../studio/LEGACY_POC_BASELINE.md`](../studio/LEGACY_POC_BASELINE.md)
- Session 02 completed: [`../studio/docs/decisions/README.md`](../studio/docs/decisions/README.md)
  and [`../studio/docs/PRODUCT_GATES.md`](../studio/docs/PRODUCT_GATES.md)
- Session 03 completed: strict Studio TypeScript and dependency boundaries are
  enforced by `npm --prefix studio run check`
- Session 04 completed: [`../studio/src/document/index.ts`](../studio/src/document/index.ts)
  defines document v1, validation, migrations, and deterministic serialization
- Session 05 completed: [`../studio/src/legacy/importer.ts`](../studio/src/legacy/importer.ts)
  imports frozen POC inputs without executing imported text
- Session 06 completed: [`../studio/src/commands/index.ts`](../studio/src/commands/index.ts)
  provides the browser-free immutable command engine and checkpoint history
- Session 07 completed: [`../studio/src/compiler/index.ts`](../studio/src/compiler/index.ts)
  compiles the minimal text-and-group slice to public Stages v1 artifacts
- Session 08 completed: [`../studio/src/runtime/index.ts`](../studio/src/runtime/index.ts)
  owns the controlled preview handshake and long-lived controller lifecycle
- Session 09 completed: [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx)
  connects document load, commands, preview, inspector, and local draft save
- Session 10 completed: [`../studio/components/v1/StudioOutline.tsx`](../studio/components/v1/StudioOutline.tsx)
  and [`../studio/src/editor/index.ts`](../studio/src/editor/index.ts) coordinate
  keyboard navigation, UID-based selection and expansion, compatible bulk edits,
  and Problems navigation
- Session 11 completed: [`../studio/src/commands/engine.ts`](../studio/src/commands/engine.ts)
  and [`../studio/src/commands/clipboard.ts`](../studio/src/commands/clipboard.ts)
  provide structural compatibility, wrap/unwrap, conversion, cross-container
  movement, and clipboard commands shared by pointer and keyboard authoring
- Session 12 completed: [`../studio/src/registry/index.ts`](../studio/src/registry/index.ts)
  defines the typed authoring contract for text, textarea, number, choice,
  checkbox, and date fields; the compiler, palette, inspector, and preview now
  consume that shared metadata
- Session 13 completed: [`../studio/src/registry/presentation.ts`](../studio/src/registry/presentation.ts)
  and [`../studio/src/compiler/types.ts`](../studio/src/compiler/types.ts)
  keep content blocks, explicit responsive layout, and theme tokens in the
  presentation render plan without adding domain-value fields
- Session 14 completed: [`../studio/src/document/types.ts`](../studio/src/document/types.ts),
  [`../studio/src/compiler/compiler.ts`](../studio/src/compiler/compiler.ts), and
  [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx)
  author, compile, initialize, and preview groups, homogeneous and discriminated
  collections, variants, wizards, and ordered stages through public v1 contracts
- Session 15 completed: [`../studio/src/compiler/compiler.ts`](../studio/src/compiler/compiler.ts),
  [`../studio/src/commands/engine.ts`](../studio/src/commands/engine.ts), and
  [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx)
  provide explicit reusable definitions, linked instances, declared overrides,
  provenance-aware compilation, legacy-fieldset migration, and detachment
- Session 16 completed: [`../studio/src/expressions/index.ts`](../studio/src/expressions/index.ts)
  provides the bounded safe AST evaluator, canonical serializer, dependency
  analysis, and readable projection; the v1 inspector provides visual logic
  authoring and value, row, context, extension, and metadata reference pickers
- Session 17 completed: [`../studio/src/compiler/compiler.ts`](../studio/src/compiler/compiler.ts),
  [`../studio/src/runtime/preview-host.ts`](../studio/src/runtime/preview-host.ts),
  and [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx)
  compile dynamic visibility, disabled state, derived props, optional factory
  structure, and stages; named context/feature scenarios drive a state-aware
  preview with last-valid recovery
- Session 18 completed: [`../studio/src/validation/catalog.ts`](../studio/src/validation/catalog.ts),
  [`../studio/src/validation/inspection.ts`](../studio/src/validation/inspection.ts),
  and [`../studio/components/v1/StudioValidationEditor.tsx`](../studio/components/v1/StudioValidationEditor.tsx)
  author and compile field, node, and form synchronous validators with event,
  reveal, severity, conditional, disabled, scope, dependency, localization,
  issue-inspection, and focus-first-error support
- Session 19 completed: [`../studio/src/registry/services.ts`](../studio/src/registry/services.ts),
  [`../studio/src/validation/catalog.ts`](../studio/src/validation/catalog.ts),
  and [`../studio/docs/ASYNC_SERVICES.md`](../studio/docs/ASYNC_SERVICES.md)
  define exact-version trusted async-service ports, environment bindings, and
  transport-free deterministic pending/success/failure/stale/cancelled preview
  scenarios with cancellation and stale-result evidence
- Session 20 completed: [`../studio/src/logic/compiler.ts`](../studio/src/logic/compiler.ts),
  [`../studio/components/v1/StudioLogicEditor.tsx`](../studio/components/v1/StudioLogicEditor.tsx),
  and [`../studio/docs/EVENTS_AND_TRANSFORMS.md`](../studio/docs/EVENTS_AND_TRANSFORMS.md)
  author named events, field reducers, target-to-root transforms, safe
  predicates, and ordered set/remove patches with compile-time target checks,
  controlled proposal inspection, and exact transaction evidence
- Session 21 completed: [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx),
  [`../studio/src/compiler/compiler.ts`](../studio/src/compiler/compiler.ts), and
  [`../studio/docs/ADVANCED_COLLECTION_AND_WIZARD_POLICIES.md`](../studio/docs/ADVANCED_COLLECTION_AND_WIZARD_POLICIES.md)
  expose every collection command, stable-key guidance and collision evidence,
  safe wizard guards, validate-then-navigate behavior, dynamic scoped summaries,
  route simulation, and recursive collection/wizard interaction tests
- Session 22 completed: [`../studio/src/localization/index.ts`](../studio/src/localization/index.ts),
  [`../studio/src/document/types.ts`](../studio/src/document/types.ts), and
  [`../studio/docs/EXTENSIONS_STATE_AND_LOCALIZATION.md`](../studio/docs/EXTENSIONS_STATE_AND_LOCALIZATION.md)
  separate domain, context, registered durable extensions, runtime, and adapter
  state; author codec/locale metadata and scenario values; resolve localized
  props and validator messages with fallback diagnostics; format canonical
  field values for display; and migrate POC `interfaceState`
- Session 23 completed: [`../studio/src/runtime/observability.ts`](../studio/src/runtime/observability.ts),
  [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx),
  and [`../studio/docs/PROBLEMS_INSPECTION_AND_OBSERVABILITY.md`](../studio/docs/PROBLEMS_INSPECTION_AND_OBSERVABILITY.md)
  combine navigable compiler/runtime problems, stale and accepted revisions,
  transaction/validation/stage/row inspection, redacted support reports, and
  metadata-only telemetry ports
- Session 24 completed: [`../studio/src/registry/codecs.ts`](../studio/src/registry/codecs.ts),
  [`../studio/src/runtime/preview-host.ts`](../studio/src/runtime/preview-host.ts),
  and [`../studio/docs/TEST_DATA_AND_RUNTIME_PERSISTENCE.md`](../studio/docs/TEST_DATA_AND_RUNTIME_PERSISTENCE.md)
  provide editable named value/context/extension scenarios, form/stage/path
  validation actions, fresh reset, accepted-state serialization, controller
  recreation, and exact-version trusted value/extension codec bindings with
  contract evidence for durable runtime metadata and excluded application state
- Session 25 completed: [`../studio/src/projects/artifacts.ts`](../studio/src/projects/artifacts.ts),
  [`../studio/components/v1/StudioV1Editor.tsx`](../studio/components/v1/StudioV1Editor.tsx),
  and [`../studio/docs/IMPORT_AND_EXPORT.md`](../studio/docs/IMPORT_AND_EXPORT.md)
  import canonical Studio JSON with migration/validation reports and generate
  deterministic project, schema, registry, initial-value, scenario, migration,
  and React artifacts through public v1 package entry points, backed by exact
  golden output and an isolated compile/run consumer
- Session 26 completed: [`../studio/src/platform/indexeddb-project-repository.ts`](../studio/src/platform/indexeddb-project-repository.ts),
  [`../studio/src/projects/autosave.ts`](../studio/src/projects/autosave.ts), and
  [`../studio/docs/LOCAL_PROJECTS_AND_RECOVERY.md`](../studio/docs/LOCAL_PROJECTS_AND_RECOVERY.md)
  provide revision-checked project list/create/duplicate/rename/delete,
  debounced and lifecycle autosave, three-revision backup rotation, recoverable
  deletion, corruption quarantine and restore controls, explicit legacy-storage
  confirmation, and separate project/preview dirty state
- Session 27 completed: [`../studio/src/projects/versioning.ts`](../studio/src/projects/versioning.ts)
  and [`../studio/docs/VERSIONING_AND_PUBLICATION.md`](../studio/docs/VERSIONING_AND_PUBLICATION.md)
  distinguish mutable drafts, immutable release snapshots, explicit contiguous
  schema migrations, review records, and published channel records; publication
  gates compiler/binding/migration and contract-scenario evidence

Primary references:

- [`V1_ARCHITECTURE_PLAN.md`](./V1_ARCHITECTURE_PLAN.md)
- [`content/project/architecture.mdx`](./content/project/architecture.mdx)
- [`content/project/core-boundaries.mdx`](./content/project/core-boundaries.mdx)
- [`V1_CANONICAL_EXAMPLE_PLAN.md`](./V1_CANONICAL_EXAMPLE_PLAN.md)
- [`../studio/AGENTS.md`](../studio/AGENTS.md)

## 1. Outcome

Turn Stages Studio from a legacy-shaped proof of concept into a dependable,
v1-native visual form-development environment.

The first product milestone is a local-first editor that can author, test,
save, import, and export the full public Stages v1 form model without requiring
a backend. Its architecture must also provide clean seams for accounts,
organizations, remote storage, review, publishing, deployment, submissions,
and collaboration later.

Studio should serve two purposes at the same time:

1. give form authors a coherent visual model for advanced Stages features; and
2. act as a demanding external-style consumer of the v1 alpha packages.

The second purpose is important. Studio must use public `@stages/core` and
`@stages/react` contracts rather than internal shortcuts. If a Studio workflow
exposes a genuine missing v1 capability, that gap should be handled as a
separate public-contract decision with compatibility evidence, not hidden in
Studio-specific access to core internals.

## 2. Recommended product boundary

“Fully capable editor” and “fully hosted form-management product” are separate
milestones.

### 2.1 Local-first editor beta

The beta is complete when a user can:

- create and organize one or more forms in a project;
- visually author fields, groups, collections, discriminated collections,
  wizards, stages, reusable fragments, content blocks, and responsive layout;
- author dynamic visibility, disabled state, derived props, validation,
  transforms, custom events, navigation rules, context, and extensions through
  safe declarative tools;
- test controlled data, dynamic scenarios, validation states, collections,
  wizard navigation, serialization, and recovery in an accurate v1 preview;
- understand document, compiler, and runtime diagnostics in one Problems view;
- save locally with crash recovery, undo and redo every document edit, and
  maintain named test datasets;
- import the current POC format with diagnostics;
- export a portable Studio project and readable TypeScript/React artifacts; and
- reproduce the Event Launch example from a checked Studio project.

This milestone does not require accounts, a production database, hosted form
endpoints, response collection, or real-time collaboration.

### 2.2 Hosted product horizon

After the local beta validates the model, the same application can add:

- accounts, organizations, roles, and project permissions;
- remote project repositories and optimistic concurrency;
- immutable versions, branches, review, approval, and publication channels;
- build/deployment artifacts, hosted form URLs, and environment configuration;
- submission storage, retention, export, webhooks, and audit records;
- reusable organization libraries and controlled plugin installation; and
- presence, comments, and eventually real-time collaborative editing.

These are application and platform concerns. They must not leak into the core
form document, compiler, or Stages runtime.

## 3. Current POC assessment

The current POC is useful and its test baseline is green, but it should be
treated as migration input rather than the target architecture.

On 2026-09-04, `npm --prefix studio run test:v1` passed:

- 7 Node converter tests; and
- 19 Vitest tests across 5 files.

### 3.1 Capabilities worth retaining

- Direct edit and preview modes.
- A nested canvas for fields, groups, collections, wizards, and stages.
- Drag-and-drop insertion and movement.
- Cut, copy, paste, group, ungroup, and container conversion concepts.
- Multiple selection and an inspector-driven property model.
- Responsive mobile, tablet, and desktop preview widths.
- Undo/redo, data snapshots, reusable-fieldset, and JSON-export intent.
- A component registry broad enough to make the editor immediately useful.
- A pure, immutable legacy-to-v1 converter with compatibility diagnostics.
- A v1 preview that already exercises controlled values, validation,
  collections, wizards, computed transforms, and stable row addresses.

### 3.2 Structural weaknesses to replace

| Current shape | Consequence | Target replacement |
| --- | --- | --- |
| A legacy array config is the persisted source of truth | v1 functions and advanced policies cannot be represented safely or completely | A versioned, JSON-safe Studio document compiled to v1 artifacts |
| `Workspace.jsx` owns most editor commands and UI in about 1,100 lines | Editing behavior is difficult to test or evolve independently | Pure domain commands plus feature-oriented UI modules |
| `fieldProps.jsx` is a large hand-built inspector form | Field metadata, defaults, editor UI, and runtime behavior can drift | One typed authoring registry per field/block type |
| Dotted data paths identify selection and edits | Rename, reorder, repeated rows, and references make identity fragile | Stable editor UIDs distinct from runtime data IDs and addresses |
| Scattered `cloneDeep`, `_.set`, and `_.unset` mutations implement commands | Undo coverage and invariants differ by edit path | One immutable command dispatcher with transactions and inverses/checkpoints |
| One Zustand store persists document, preview data, workbench state, snapshots, and history | Ephemeral UI state and durable project state have unclear lifecycles | Explicit document, workbench, preview, runtime, and platform stores |
| Some inline edits bypass `updateCurrentConfig` | Not every visible edit participates in the same history policy | All document changes flow through commands |
| History covers only part of the config and is capped at 25 array snapshots | Fieldsets, metadata, selection effects, and coalescing are inconsistent | Transactional history with labels, coalescing, and bounded checkpoints |
| Persistence uses one unversioned local-storage key | No migration, corruption recovery, project list, or conflict detection | Repository abstraction plus versioned IndexedDB implementation |
| Legacy expressions execute with `new Function` | Imported or shared documents can execute arbitrary JavaScript | A safe expression AST and named trusted integration bindings |
| The live preview converts legacy config on every render path | Legacy semantics remain coupled to the editor runtime | One-time legacy import, then a v1-native compiler |
| Presentation fields and runtime fields share one loose registry | Decorative blocks can pollute domain data and layout rules drift | Separate render plan/presentation metadata from runtime schema nodes |
| Export only downloads legacy JSON | Users cannot consume a native v1 result or round-trip a Studio project | Project JSON, compiled schema, React starter, fixtures, and migration exports |
| Tests focus on a few happy paths and loop regressions | Complex edit commands and advanced v1 behavior can regress silently | Layered unit, contract, integration, property, accessibility, and E2E tests |

There is also a concrete compatibility mismatch to resolve during import work:
the POC creates fieldset instances whose `type` is the fieldset ID, while the
current converter's explicit reusable-node branch recognizes
`type: "fieldset"` with a `fieldset` property. Existing converter tests cover
the latter representation. The migration must accept the POC representation
without making either encoding part of the new document model.

## 4. Architecture decisions

The following decisions are recommended defaults. Record them as short ADRs in
the first implementation wave so later sessions do not reopen foundational
questions accidentally.

### 4.1 Studio owns a declarative document, not an executable schema

A Stages schema contains functions for factories, predicates, derived props,
reducers, transforms, validators, keys, and guards. Those functions do not
belong in JSON storage, undo history, collaboration messages, or untrusted
imports.

Studio therefore persists a declarative `StudioProjectDocument`. A pure
compiler converts one form from that document into executable artifacts for a
trusted runtime environment.

```text
Studio project document
  -> migrate and validate document
  -> resolve fields, fragments, expressions, validators, and services
  -> compile
  -> StagesSchema + field registry + render plan + source map + diagnostics
  -> public @stages/core / @stages/react runtime
```

The document is the editable source. Generated TypeScript is an output, not a
second editable source that Studio attempts to round-trip.

### 4.2 Editor identity and runtime identity are different

Every editable entity gets an immutable Studio UID. Fields and containers also
have a user-editable runtime ID that becomes a Stages data-path segment.

- Selection, history, comments, drag state, references, and diagnostics use the
  Studio UID.
- Compilation emits runtime IDs, data paths, and node addresses.
- A compiler source map connects UIDs to emitted paths and addresses.
- Renaming a runtime ID is a semantic refactor, not a plain text edit. It must
  identify affected expressions, fixtures, fragments, and saved data, then
  offer an explicit migration.

### 4.3 Runtime schema and presentation compile separately

The Stages schema owns form semantics. Studio also needs layout, labels for
containers, content blocks, responsive widths, editor affordances, and
theme/component choices.

Compilation should produce:

```ts
interface CompiledStudioForm {
  readonly schema: StagesSchema<unknown, FieldRegistry, unknown>;
  readonly fields: FieldRegistry;
  readonly renderPlan: StudioRenderPlan;
  readonly sourceMap: StudioSourceMap;
  readonly diagnostics: readonly StudioDiagnostic[];
}
```

`renderPlan` may interleave schema-backed nodes with adapter-owned headings,
messages, dividers, sections, and layout slots. Decorative blocks should not
create domain-value properties merely to become visible.

### 4.4 All document edits are commands

UI components request commands; they never reach into a nested project object.

```ts
type StudioCommand =
  | { type: "node.insert"; parentUid: Uid; index: number; node: StudioNode }
  | { type: "node.move"; uid: Uid; parentUid: Uid; index: number }
  | { type: "node.update"; uid: Uid; changes: Readonly<Record<string, unknown>> }
  | { type: "node.rename-runtime-id"; uid: Uid; nextId: string; migration: DataMigrationPolicy }
  | { type: "fragment.extract"; uid: Uid; fragmentUid: Uid }
  | { type: "transaction"; label: string; commands: readonly StudioCommand[] };
```

The pure command engine must:

- validate preconditions and return typed failures;
- preserve unaffected object identity;
- report affected UIDs;
- support atomic multi-command transactions;
- generate an inverse or a reliable before/after checkpoint;
- coalesce inspector typing without coalescing distinct semantic edits; and
- never update preview data or workbench state implicitly.

### 4.5 The runtime remains controlled

The preview host owns its canonical test value. A controller proposal becomes
visible only after the preview owner accepts it through `update({ value })`.
Document edits may update the compiled schema, while test-data edits update the
controlled value. The two histories remain distinct.

Studio must test immediate acceptance, delayed acceptance, replacement, and
rejection in headless contracts even if its default preview accepts ordinary
field input immediately.

### 4.6 Safe declarative behavior first, trusted code by reference

The main editor never evaluates document-provided JavaScript.

The behavior system should support:

- literals and value/context/extension/meta references;
- boolean, comparison, arithmetic, null, collection, and string operations;
- templates and localized messages;
- conditional expressions;
- declarative patches and event payloads;
- validator catalog entries and dependencies; and
- named service, validator, transform, resolver, or component bindings.

A named binding refers to trusted host code registered outside the document.
The local editor can use deterministic mocks. Generated applications can import
the real integration. Arbitrary code editing may be offered later only in an
explicit trusted developer workspace; it must never be required to open a
shared Studio document.

### 4.7 Persistence is behind repositories

The document domain sees interfaces, not browser storage or HTTP:

```ts
interface ProjectRepository {
  list(): Promise<readonly ProjectSummary[]>;
  load(projectId: string): Promise<StoredProject | undefined>;
  save(project: StoredProject, expectedRevision?: string): Promise<StoredProject>;
  delete(projectId: string, expectedRevision?: string): Promise<void>;
}
```

The first implementation uses IndexedDB with autosave, backups, and conflict
checks. A future remote implementation uses the same boundary. Browser
storage, network retries, authentication, and conflict UI stay out of the form
compiler and Stages core.

### 4.8 Migrate incrementally around a vertical slice

Do not rewrite the entire POC before proving the new path. Build one text field
through document -> command -> compiler -> preview -> inspector -> persistence,
then expand capability by capability. Keep the legacy editor available behind
a development flag until the replacement reaches explicit parity gates.

Do not combine a Pages Router/App Router decision, a visual redesign, and the
document/compiler rewrite in one session. Routing is not a prerequisite for
the domain architecture.

## 5. Proposed bounded modules

Keep the first implementation inside `studio/`. Promote a module to a public
package only after a real second consumer appears.

```text
studio/
  src/
    document/       JSON-safe types, validation, migrations, fixtures
    commands/       immutable edits, transactions, history, clipboard
    compiler/       document-to-v1 compilation, source maps, diagnostics
    expressions/    safe AST, evaluator, dependency analysis
    registry/       fields, blocks, validators, services, themes
    runtime/        controlled preview host, scenarios, controller lifecycle
    editor/         shell, tree, canvas, inspector, problems, shortcuts
    projects/       project list, import/export, autosave orchestration
    platform/       repository, clock, IDs, clipboard, download, telemetry ports
    legacy/         isolated POC importer and frozen migration fixtures
    testing/        builders, golden projects, contract harnesses
```

Current files can move into these boundaries gradually. Avoid a mechanical
move-only rewrite before the new APIs exist.

### 5.1 State ownership

| State | Examples | Lifetime | Owner |
| --- | --- | --- | --- |
| Project document | forms, nodes, fragments, behavior specs, metadata | durable and versioned | document repository |
| Workbench | selection UIDs, open panels, zoom, active tool, drag state | session-local | editor store |
| Document history | commands/checkpoints and save cursor | current edit session | command/history store |
| Preview scenario | accepted value, context, extensions, chosen dataset | named test scenario or ephemeral | preview host |
| Controller runtime | touched/visited, active stage, row keys, revealed issues | preview session; optionally serialized | Stages controller |
| Platform state | account, permissions, remote revision, publish state | backend/local repository | application services |

Never store editor selection in form domain data. Never use
`controller.serialize()` as the Studio project format. The controller envelope
is appropriate for a preview/test session; the project document describes how
to build the form.

## 6. Studio document model

The exact declarations should be compiler-spiked before freezing, but the
document needs these concepts from the beginning.

```ts
interface StudioProjectDocument {
  readonly format: "stages-studio";
  readonly formatVersion: number;
  readonly project: {
    readonly uid: Uid;
    readonly title: string;
    readonly defaultLocale: string;
  };
  readonly forms: Readonly<Record<Uid, StudioFormDocument>>;
  readonly fragments: Readonly<Record<Uid, StudioFragmentDocument>>;
  readonly resources: StudioResourceCatalog;
}

interface StudioFormDocument {
  readonly uid: Uid;
  readonly title: string;
  readonly runtime: { readonly schemaId: string; readonly schemaVersion: number };
  readonly rootNodeUids: readonly Uid[];
  readonly nodes: Readonly<Record<Uid, StudioNode>>;
  readonly scenarios: readonly StudioScenario[];
  readonly settings: StudioFormSettings;
}
```

Use normalized UID maps for editability and references, with explicit ordered
UID arrays for roots, children, stages, and variants. The compiler emits the
recursive Stages shape.

Each node stores only JSON-safe declarations:

- immutable `uid` and editable `runtimeId`;
- discriminated node/block kind;
- child, stage, or variant references as appropriate;
- field type and serializable props;
- behavior specifications (`when`, `disabled`, transforms, validators);
- derived-property bindings;
- layout and presentation metadata; and
- optional fragment-instance information.

### 6.1 Three independent versions

Do not overload one number:

| Version | Purpose | Migration owner |
| --- | --- | --- |
| `formatVersion` | Shape of the Studio project JSON | Studio document migrations |
| `schemaVersion` | Shape/meaning of a compiled form's submitted data | Generated application migration plus Stages state migrations |
| project revision/version ID | Edit, review, save, conflict, and publish history | project repository/platform |

A layout-only edit changes the project revision but need not change the runtime
schema version. A runtime-ID rename or incompatible value change normally needs
a schema-version decision and a data migration.

### 6.2 Reusable fragments

Replace the POC's implicit fieldset encoding with explicit fragment resources.

- A fragment has its own UID, parameters, node graph, and version.
- An instance has a local runtime ID and optional declared overrides.
- Compilation expands an instance into ordinary supported Stages nodes.
- The source map retains both fragment-definition and instance provenance.
- Cycles and unsafe IDs are rejected.
- Editing a linked definition updates every instance; “detach” creates a local
  copy with new UIDs.
- Copy/paste either carries required local resources or reports unresolved
  dependencies before committing.

This preserves reuse without asking core to add a runtime fieldset registry,
which is a deliberate non-feature of v1.

## 7. Compiler architecture

Compilation must be pure, deterministic, side-effect free, and independently
testable without React or a browser.

### 7.1 Pipeline

1. Validate the project envelope and migrate its `formatVersion`.
2. Select one form and validate normalized graph integrity.
3. Resolve field/block/validator/service registry references and versions.
4. Expand fragment instances with cycle and override checks.
5. Validate sibling runtime IDs, unsafe segments, variants, stages, and value
   shape requirements.
6. Type-check props and behavior specs against registry metadata.
7. Compile expressions into synchronous deterministic functions.
8. Compile validators, transforms, derived props, predicates, item keys, and
   guards.
9. Emit the recursive Stages schema and trusted field registry.
10. Emit the adapter-owned render plan and presentation index.
11. Emit a bidirectional UID/path/address source map.
12. Return stable, structured diagnostics without mutating input.

### 7.2 Diagnostic model

One Studio diagnostic shape should normalize all layers:

```ts
interface StudioDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning" | "info";
  readonly source: "document" | "compiler" | "runtime" | "preview" | "publish";
  readonly message: string;
  readonly formUid?: Uid;
  readonly entityUid?: Uid;
  readonly propertyPath?: readonly (string | number)[];
  readonly runtimePath?: DataPath;
  readonly runtimeAddress?: NodeAddress;
  readonly helpId?: string;
}
```

Errors block publication and may block preview when no valid artifact exists.
Warnings and information remain visible. During invalid edits, the preview may
retain the last successfully compiled artifact, clearly marked as stale. This
mirrors v1's last-valid-tree philosophy without pretending a failed Studio
compile was accepted by core.

### 7.3 Capability boundary with v1

The compiler should only emit exported v1 types and call public controller
methods. It must not inspect core internal state.

For every suspected gap:

1. reduce it to a framework-neutral failing fixture;
2. confirm it is not expressible through public schema/events/snapshots;
3. record the Studio use case and compatibility impact;
4. use the public API change workflow if a core change is justified; and
5. keep Studio compilation compatible with the prior accepted v1 contract
   until the package change lands with tests and documentation.

## 8. Registry architecture

The current view and inspector catalogs should converge into typed, declarative
registries.

### 8.1 Field definitions

An authoring field definition should provide:

- stable type key and definition version;
- display name, icon, category, keywords, and documentation;
- value kind and empty/default-value policy;
- a JSON-safe prop schema with editor controls, defaults, and conditions;
- the trusted Stages `FieldDefinition` factory;
- the React preview view;
- accessibility expectations and test harness entries;
- optional intrinsic validator catalog entries;
- export imports/code generation metadata; and
- migration hooks for old definition versions.

The registry is statically trusted for the beta. A later plugin system may load
signed/approved definitions through a separate host boundary; project JSON
must never contain executable component code.

### 8.2 Presentation blocks and themes

Headings, messages, dividers, help text, summaries, and layout-only containers
belong to a block registry and render plan. Theme tokens belong to a theme
registry. Neither should masquerade as domain-value fields.

### 8.3 Validators and services

Validator definitions describe configuration UI, dependencies, event/reveal
defaults, localization, and a trusted compiler factory. Async definitions refer
to named service bindings. Service credentials and environment endpoints stay
outside the project document; scenarios can supply deterministic preview
responses.

## 9. Editor experience

The target desktop workbench should have four coordinated surfaces:

- a left outline/resources panel for forms, fragments, and the node tree;
- a central design or test canvas driven by the compiled render plan;
- a right inspector generated from registry metadata; and
- a collapsible Problems/data/runtime panel.

Recommended modes:

| Mode | Primary purpose |
| --- | --- |
| Design | Structure, content, responsive layout, direct selection, drag/drop |
| Logic | Conditions, derived props, validators, events, transforms, dependencies |
| Test | Real v1 interaction using selected value/context/extension scenario |
| Data | Scenario values, submitted shape, serialization envelope, last transaction |

The outline is the accessibility and precision counterpart to the visual
canvas. Every drag operation must have keyboard move actions, announcements,
and deterministic command semantics. Canvas selection is by UID; collection
preview rows map back to their schema source UID plus runtime row address.

Inspector edits should use explicit Apply semantics for semantic refactors and
immediate coalesced commands for simple properties. Invalid intermediate text
may live in control-local draft state; it must not corrupt the project document
or generate dozens of undo entries.

## 10. v1 capability validation matrix

Studio should maintain this as an executable ledger. “Authorable” is not enough;
each row needs compile evidence and preview behavior evidence.

| v1 capability | Studio authoring surface | Required evidence |
| --- | --- | --- |
| Controlled accept/replace/reject/delay | Preview scenario owner and headless harness | Callback/order contract tests |
| Fields and typed props | Field palette and generated inspector | Registry type tests and component contracts |
| Groups and recursive composition | Tree/canvas structural commands | Nested compiler and edit-command tests |
| Homogeneous collections | Collection inspector and row test controls | Add/remove/replace/duplicate/move/sort journeys |
| Discriminated collections | Variant editor and preview row picker | Variant/default/source-map tests |
| Stable row identity | Item-key strategy and runtime panel | Reorder plus serialize/recreate tests |
| Wizards and dynamic stages | Stage outline and navigation inspector | Linear/nonlinear/guard/reconciliation journeys |
| Dynamic `when`/`disabled` | Expression builder | Scenario transition tests |
| Derived props and localization | Prop binding and locale scenarios | Exact resolved-prop tests |
| Context | Scenario environment editor | Replace-not-merge update tests |
| Extensions | Registered namespace/scenario editor | Codec and recreation tests |
| Events and reducers | Field behavior metadata and event tools | Named-event/type contract tests |
| Transforms and patches | Logic rule editor | Ordering, batching, and rejection tests |
| Sync validation | Validator builder | Scope/event/reveal/issue tests |
| Async validation | Trusted service binding and mock scenarios | Cancellation and stale-result tests |
| Validation dependencies | Dependency picker | Selective invalidation tests |
| Diagnostics/recovery | Problems panel and stale-preview state | Invalid/recovered revision tests |
| Serialization/codecs/migrations | Data mode and export artifacts | JSON round-trip and historic fixtures |
| Subscriptions/selectors | Preview/editor component boundaries | Render-count and fan-out tests |
| Accessibility | Registry contracts, outline, canvas, error focus | Automated and manual keyboard/screen-reader gate |

The checked Event Launch project is the capstone because it combines dynamic
stages, nested groups, homogeneous and discriminated collections, stable keys,
derived props, sync and async validation, transforms, wizard guards, context,
serialization, and application-owned persistence in one coherent workflow.

## 11. Multi-session implementation plan

Treat each session as one reviewable change set with focused tests and a usable
repository state. A session may take more than one working day; split it when
its acceptance criteria cannot remain understandable in one review.

### Wave 0 — Baseline and decisions

#### Session 01 — Characterize and freeze the POC

Deliverables:

- Inventory every visible editor command and persisted field.
- Add characterization tests for inserts, moves, conversions, fieldsets,
  selection, history, export, and hydration.
- Add frozen legacy fixtures for every shipped template and both fieldset
  encodings.
- Record current bundle/build/test timings and representative large-form render
  behavior.
- Classify each POC behavior as retain, redesign, importer-only, or retire.

Exit: the migration can distinguish intentional changes from accidental loss.

#### Session 02 — Ratify ADRs and product gates

Deliverables:

- ADRs for document-vs-schema, UID identity, safe expressions, source maps,
  commands/history, state ownership, repository boundary, and legacy isolation.
- Confirm the local-beta boundary and name the hosted-product backlog.
- Define supported browsers, initial accessibility target, data-loss policy,
  project size target, and what “publish” means before a backend exists.
- Decide whether the existing router remains during the rewrite; default to
  keeping it until the new vertical slice works.

Exit: unresolved decisions are explicit blockers, not implicit implementation
choices.

#### Session 03 — Establish TypeScript and module boundaries

Deliverables:

- Add strict Studio TypeScript configuration and typed test setup.
- Create empty `document`, `commands`, `compiler`, `registry`, `runtime`, and
  `platform` public module boundaries.
- Add dependency-boundary checks so domain/compiler modules cannot import
  React, Next.js, browser globals, Zustand, or storage.
- Type one small existing UI seam without rewriting the application.

Exit: a pure TypeScript module can build and test independently of Next.js.

### Wave 1 — New vertical slice

#### Session 04 — Document v1 and migrations

Deliverables:

- Define the minimal project/form/node/scenario declarations and UID utilities.
- Implement structural validation with precise diagnostics.
- Implement ordered project-format migrations and golden round trips.
- Reject unsafe keys, duplicate UIDs, missing references, cycles, excessive
  depth/size, and unknown required definition versions.

Exit: JSON parse -> validate/migrate -> stable serialize is deterministic and
immutable.

#### Session 05 — Legacy importer

Deliverables:

- Convert the POC templates, form metadata, layout, fieldsets, visibility,
  computed values, required rules, and component props into document v1.
- Accept both observed fieldset encodings and report lossy/unsupported behavior.
- Parse supported old expressions into the safe AST; retain unsupported source
  only as inert migration metadata with an error.
- Keep `legacyConfig.mjs` frozen as compatibility evidence while moving live
  editor startup to the new importer behind a feature flag.

Exit: every frozen POC fixture imports without mutation, and no imported text
is executed.

#### Session 06 — Pure command engine and history

Deliverables:

- Implement insert, delete, update, move, duplicate, and transaction commands.
- Add graph and sibling-ID invariant checks.
- Implement labeled undo/redo, save cursor, dirty state, typing coalescence, and
  bounded checkpoints.
- Add randomized command-sequence tests and exact inverse/round-trip assertions.

Exit: every minimal document edit, including undo and redo, is browser-free and
deterministic.

#### Session 07 — Minimal compiler

Deliverables:

- Compile text fields and groups to a typed v1 schema.
- Emit field registry entries, render plan, source map, and diagnostics.
- Prove sibling IDs, path/address mapping, default policy, and input immutability.
- Add a compile-only TypeScript consumer fixture.

Exit: one document fixture evaluates successfully through public
`@stages/core` APIs.

#### Session 08 — Controlled preview host

Deliverables:

- Add a long-lived preview controller lifecycle around compiled artifacts.
- Keep canonical scenario value in the owner and explicitly accept proposals.
- Update schema/context/extensions through public `update()` and recreate only
  when creation-time options change.
- Translate runtime diagnostics through the source map.
- Test Strict Mode, no update loop, callback freshness, rejection, delayed
  acceptance, and teardown.

Exit: a text edit in preview follows the v1 controlled handshake and maps back
to its Studio UID.

#### Session 09 — Replace one end-to-end editor slice

Deliverables:

- Build project load, one field palette action, canvas rendering, selection,
  label inspector, undo/redo, preview input, and local draft save on the new
  modules.
- Keep old and new slices switchable for comparison.
- Add one browser-level journey covering the entire flow.

Exit: the new architecture is proven vertically before broad feature work.

### Wave 2 — Structural authoring

#### Session 10 — Outline, selection, and navigation

Deliverables:

- Create a keyboard-operable tree for forms, nodes, stages, variants, and
  fragments.
- Store selection and expansion by UID.
- Synchronize outline, canvas, inspector, and Problems navigation.
- Support single/multiple selection with explicit compatible bulk edits.

Exit: rename/reorder does not lose selection, and all nodes are reachable
without the pointer.

#### Session 11 — Complete structural commands and drag/drop

Deliverables:

- Add wrap/unwrap, group/ungroup, convert, copy/cut/paste, and cross-container
  move commands with a compatibility matrix.
- Use one command for pointer drag, keyboard move, context menu, and shortcuts.
- Prevent self-nesting, illegal stage/variant placement, duplicate IDs, and
  unresolved clipboard dependencies.
- Announce keyboard and pointer results accessibly.

Exit: every retained POC structural action has command tests and a keyboard
equivalent.

#### Session 12 — Typed field registry and inspector

Deliverables:

- Define authoring metadata for the current field set.
- Generate palette entries and inspector controls from that metadata.
- Separate local invalid control drafts from committed command state.
- Add per-definition runtime, prop, accessibility, and migration contracts.
- Remove the first migrated types from `fieldProps.jsx` and
  `shadcnFields.jsx` without changing their remaining legacy behavior.

Exit: at least text, textarea, number, choice, checkbox, and date fields share
one source of authoring truth.

#### Session 13 — Presentation, content blocks, and responsive layout

Deliverables:

- Compile headings, messages, dividers, and help content into the render plan,
  not domain data.
- Add responsive width/grid/alignment controls with explicit breakpoints.
- Add theme tokens and a default preview theme boundary.
- Test render ordering around hidden nodes, collections, stages, and fragments.

Exit: decorative content exports and previews without fake submitted values.

#### Session 14 — Groups, collections, wizards, stages, and variants

Deliverables:

- Complete document types, commands, inspectors, and compilation for every v1
  structural node.
- Support collection min/max, homogeneous rows, discriminators/variants, item
  key strategies, wizard initial stage, nonlinear navigation, and stage order.
- Generate structurally valid empty scenario containers without claiming that
  schema defaults seize canonical ownership.
- Cover representative nesting and the existing deep/permutation core fixtures.

Exit: arbitrary supported recursive structures compile and render accurately.

#### Session 15 — Reusable fragments

Deliverables:

- Add create, insert, edit definition, override, rename, and detach workflows.
- Compile instances to ordinary groups/nodes with instance-safe runtime IDs.
- Detect cycles and expose definition/instance provenance in diagnostics.
- Migrate POC fieldsets and add multi-instance regression tests.

Exit: editing a fragment updates all linked instances while detach preserves a
standalone equivalent.

### Wave 3 — Logic authoring

#### Session 16 — Expression AST and editor

Deliverables:

- Implement the safe typed AST, evaluator, serializer, dependency analysis,
  and limits.
- Add value, current-row, context, extension, and metadata reference pickers.
- Add a basic visual expression builder plus readable text projection.
- Prove there is no `eval`/`new Function`, prototype traversal, implicit network
  work, or mutation.

Exit: POC visibility and computed-value examples have safe equivalents.

#### Session 17 — Dynamic configuration and scenarios

Deliverables:

- Compile `when`, `disabled`, derived props, and factory-level optional
  structure where the document explicitly requests it.
- Add context and feature-flag scenario editors.
- Visualize dormant versus structurally absent nodes and inherited disabled
  state.
- Test scenario switching, dynamic stages, incompatible identity, and
  last-valid recovery.

Exit: permissions, localization, feature flags, and conditional sections can be
authored and tested without custom JavaScript.

#### Session 18 — Synchronous validation

Deliverables:

- Add field/node/form validator catalog UI.
- Support events, reveal events, severity, messages, conditional applicability,
  disabled policy, scopes, and dependencies.
- Build required, length, range, pattern, comparison, and collection aggregate
  definitions.
- Add validation state/issue inspection and focus-first-visible-error behavior.

Exit: validation authoring covers the public synchronous model and localized
issues.

#### Session 19 — Async validation and service bindings

Deliverables:

- Define trusted named async-service ports and environment-specific bindings.
- Add deterministic pending/success/failure/stale/cancelled preview scenarios.
- Keep endpoints, credentials, retries, and caches outside resolver execution
  and outside the project document.
- Test cancellation, dependency invalidation, stale-result suppression, and
  teardown.

Exit: async validation can be designed safely and proven without real network
dependence.

#### Session 20 — Events, reducers, transforms, and patches

Deliverables:

- Add named event definitions, field reducer metadata, transform rules,
  predicates, and set/remove patch actions.
- Add path/reference pickers and compile-time target validation.
- Visualize event -> reducer -> target-to-root transforms -> proposal ordering.
- Test batching, sequential last-writer-wins behavior, rejection, and exact
  emitted `StagesChange` records.

Exit: cross-field calculations and multi-field actions no longer depend on
legacy computed strings.

#### Session 21 — Advanced collection and wizard policies

Deliverables:

- Expose all collection commands in Test mode, including replace, duplicate,
  move, sort, and variant add.
- Add key-strategy guidance and collision diagnostics.
- Add wizard guards, validated navigation, dynamic stages, scoped summaries,
  and route-simulation controls.
- Test nested wizards in collection rows and collections in stages.

Exit: the hardest recursive v1 interactions are usable and observable.

#### Session 22 — Extensions, transient state, and localization

Deliverables:

- Distinguish adapter-only workbench state, context, domain data, and registered
  durable extension namespaces in the UI.
- Add extension definition/codec metadata and scenario values.
- Add locale resources, fallback diagnostics, derived labels/help, localized
  validator messages, and locale-sensitive field formatting.
- Migrate the POC interface-state concept to the correct owner per use case.

Exit: a user can tell why state belongs in value, context, extension, or the
adapter, and durable extensions survive recreation.

### Wave 4 — Product workflows

#### Session 23 — Problems, inspection, and observability

Deliverables:

- Add filterable Problems UI grouped by source/severity/form/entity.
- Navigate diagnostics to the outline, canvas, inspector property, and runtime
  path/address.
- Show stale-preview state, last transaction, patches/events, validation
  aggregate, active stages, row keys, and accepted revision.
- Add copyable redacted support reports and optional telemetry ports.

Exit: invalid documents and rejected runtime actions are explainable without
opening developer tools.

#### Session 24 — Test data, reset, serialize, and recreate

Deliverables:

- Replace anonymous snapshots with named value/context/extension scenarios.
- Add form/stage/path validation actions, reset, save runtime envelope, and
  recreate preview.
- Add value and extension codec hooks through trusted registry bindings.
- Test that serialization captures accepted state, durable metadata, stages,
  and row keys but not application/browser concerns.

Exit: persistence behavior can be validated from the Studio UI and contract
suite.

#### Session 25 — Import and export

Deliverables:

- Import/export canonical Studio JSON with validation and migration reports.
- Export formatted v1 TypeScript schema, field-registry bindings, initial value,
  scenarios/fixtures, and migration skeletons.
- Export a minimal React application integration without making generated code
  the editor's source of truth.
- Add deterministic golden output and an isolated compile/run consumer test.

Exit: exported artifacts use public package entry points and work outside the
monorepo.

#### Session 26 — Local project repository and recovery

Deliverables:

- Implement project list/create/duplicate/rename/delete over IndexedDB.
- Add debounced autosave, flush on lifecycle boundaries, expected revisions,
  backup rotation, corruption quarantine, and recovery UI.
- Migrate the old local-storage key only after explicit preview/confirmation.
- Separate saved-project dirty state from runtime preview dirty state.

Exit: forced reload, quota/storage failure, corrupted data, and concurrent-tab
conflict do not silently lose the last recoverable project.

#### Session 27 — Versioning and publication model

Deliverables:

- Create immutable local release snapshots with project revision, compiled
  artifact manifest, schema identity/version, and diagnostics gate.
- Add explicit schema-version bump and migration workflow for breaking value
  changes.
- Define repository/service interfaces for review and publication without
  implementing a production backend.
- Prevent publication with compiler errors, unresolved bindings, failing
  contract scenarios, or incompatible migrations.

Exit: “draft,” “version,” “schema migration,” and “published artifact” have
distinct tested meanings.

### Wave 5 — Validation and beta hardening

#### Session 28 — Event Launch capstone

Deliverables:

- Author a checked Event Launch Studio project rather than hand-maintaining a
  second behavioral design.
- Compile it against the shared domain field contract and deterministic
  services where practical.
- Reuse/parameterize the headless behavior journeys and compare important
  paths, diagnostics, validation, navigation, collection identity, and
  serialization outcomes.
- Record every discovered v1 or Studio model gap in the capability ledger.

Exit: the canonical advanced example is reproducible from Studio and its
behavior remains cross-adapter compatible.

#### Session 29 — Accessibility and interaction hardening

Deliverables:

- Audit shell, tree, canvas, inspector, dialogs, menus, drag/drop, status,
  Problems, preview fields, wizard navigation, collection controls, and error
  focus.
- Add keyboard journeys, accessible names/relationships, focus restoration,
  live announcements, reduced motion, contrast, and zoom/reflow checks.
- Run automated checks and complete a documented manual screen-reader pass.

Exit: no essential authoring or testing action requires a pointer or visual-only
cue.

#### Session 30 — Performance, security, and robustness

Deliverables:

- Benchmark load, compile, single-property edit, large-tree selection, drag,
  undo, scenario update, and preview field input at agreed project sizes.
- Add selector/render-count budgets and optimize measured hot paths.
- Fuzz document parsing, migrations, commands, expressions, and compiler graph
  traversal; cap input size/depth/work.
- Apply a restrictive CSP, remove all legacy dynamic evaluation, sanitize rich
  content, protect export/import boundaries, and review dependency footprint.

Exit: budgets and security invariants are executable gates rather than prose.

#### Session 31 — Cut over to the v1-native editor beta

Deliverables:

- Remove the live legacy-conversion path while retaining import fixtures and
  migration tests.
- Remove superseded monolithic handlers/registries in small reviewable commits.
- Update Studio help, architecture notes, contributor guidance, and the v1
  capability ledger.
- Add Studio build/E2E/accessibility/performance/import/export checks to the
  appropriate repository gates.
- Run the full Stages release gate when Studio findings changed a public v1
  contract.

Exit: normal Studio startup loads only the new document/compiler architecture,
and all beta gates pass from a clean checkout.

## 12. Release gates

### Gate A — Architecture-ready

- ADRs accepted.
- POC characterization and legacy fixtures are complete.
- Strict module boundaries run in CI.
- Document v1 and its migration policy are reviewed.

### Gate B — v1-native structural alpha

- The new vertical slice is the default development path.
- All structural nodes, field registry, render plan, inspector, commands,
  history, and legacy import work.
- No edit path bypasses the command engine.
- Preview uses only public v1 APIs.

### Gate C — advanced-capability alpha

- Dynamic config, expressions, validation, async services, transforms,
  collections, wizards, extensions, and localization are authorable.
- The capability ledger has executable evidence for each supported feature.
- Runtime and compiler diagnostics have source navigation.

### Gate D — local-first beta

- Project persistence/recovery, named scenarios, import/export, versioning, and
  publication snapshots work.
- Event Launch compiles from a checked Studio project and passes shared
  behavior evidence.
- Accessibility, performance, security, and clean-build gates pass.

### Gate E — hosted beta readiness

- The local repository is replaceable without document/compiler changes.
- Remote revision/conflict, permissions, environment binding, audit, and
  publication interfaces have contract tests.
- Threat model, privacy/retention policy, operational ownership, and product
  decisions for submissions are approved before backend implementation.

## 13. Verification strategy

### 13.1 Test pyramid

| Layer | Main evidence |
| --- | --- |
| Document | JSON fixtures, migration chains, malformed/corrupt input, immutability |
| Commands | Table tests, randomized sequences, inverses/checkpoints, invariants |
| Expressions | AST round trips, type/dependency checks, evaluation limits, safety |
| Compiler | Golden artifacts, diagnostics, source maps, pure evaluation, type fixtures |
| Registry | Prop schemas, runtime definitions, view contracts, export metadata |
| Runtime | Controlled handshake, lifecycle, validation, diagnostics, serialization |
| Editor integration | User-event tests for tree/canvas/inspector/history/problems |
| Browser E2E | Critical authoring, test, save/reload, import/export, recovery journeys |
| External consumer | Generated artifact installed, compiled, and run in isolation |
| Quality | React doctor, dependency/dead-code checks, accessibility, performance, CSP |

### 13.2 Per-session minimum

Every implementation session should:

1. read the nearest `AGENTS.md` and locate authoritative v1 context;
2. add failing evidence before or with the behavior change;
3. run the narrowest affected tests during development;
4. run `npm --prefix studio run test:v1` for component, store, importer, or
   compiler changes;
5. run `npm run doctor` for React changes and resolve new errors;
6. run `npm --prefix studio run build` for routing, Next.js integration, or
   configuration changes;
7. run `npm run check:quality` after JavaScript/TypeScript changes; and
8. use the v1 public-API and release verification workflow if package contracts,
   serialization, diagnostics, or adapters change.

Generated `dist`, `.next`, `out`, coverage, and report artifacts remain
untracked and must never be edited directly.

## 14. Initial performance targets

Measure the POC in Session 01 and ratify exact time ceilings in Session 02.
Start with structural expectations that are less hardware-sensitive:

- A simple property edit changes one document branch and creates one history
  entry after coalescing.
- Preview field input does not rerender the whole editor shell or recompile an
  unchanged document.
- Selection, panel, zoom, and drag-hover state do not compile the form.
- One accepted document transaction schedules at most one compile/publication.
- Diagnostics and source-map lookup are indexed by UID/address, not repeated
  full-tree scans during render.
- A 1,000-field static project remains loadable, compilable, navigable, and
  previewable within explicit CI budgets aligned with core's existing
  1,000-field performance scenarios.

Record reference hardware and separate elapsed ceilings from deterministic
work-count/render-count assertions.

## 15. Security and data-safety invariants

- Never execute imported expressions or components as JavaScript.
- Treat imported project JSON and serialized runtime state as untrusted input.
- Reject prototype-related keys and bound depth, node count, string length,
  expression cost, and decoded payload size.
- Keep secrets, credentials, service endpoints, account IDs, and permissions
  outside portable project documents.
- Sanitize rich presentation content and prefer structured rich-text data over
  raw HTML.
- Require confirmation and recovery support for project deletion, destructive
  refactors, incompatible type conversion, and runtime-ID migration.
- Never overwrite the only recoverable project copy during migration or import.
- Make remote preview calls opt-in, environment-labelled, cancellable, and
  redacted from exported support reports.
- Validate generated filenames, imports, and archives; do not allow project
  content to choose arbitrary filesystem or module paths.

## 16. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Designing a generic low-code language instead of a Stages editor | Drive every construct from a public v1 capability or a named application integration |
| Serializability makes advanced behavior too weak | Safe AST for common behavior plus trusted named bindings and code export escape hatches |
| v1 alpha changes invalidate compiler assumptions | Maintain the capability ledger and compile only against exported contracts |
| A rewrite stalls before replacing the POC | Vertical slice first, feature flag, parity gates, incremental strangling |
| Runtime-ID edits silently lose scenario or saved data | Treat rename/type changes as refactors with dependency analysis and migrations |
| Fragments create ambiguous paths or recursive graphs | Separate definition/instance UIDs, explicit expansion, cycle checks, source provenance |
| Editor history and runtime state become coupled | Maintain separate owners and histories; commands never mutate preview data |
| Large forms make full recompilation/rendering unusable | Establish budgets early, preserve identity, use selectors, then add incremental compile caching only when measured |
| Drag-and-drop becomes inaccessible | One command model for pointer, keyboard, menu, and outline operations |
| Hosted ambitions overwhelm editor delivery | Ship local-first gates before auth, submissions, collaboration, or marketplace work |
| Generated code becomes an unmaintainable second source | One-way deterministic export with golden external-consumer tests |
| Imported legacy functions or HTML create security exposure | Parse known syntax, quarantine unsupported text, structured content, strict CSP |

## 17. Hosted-product follow-on sessions

Do not schedule these onto the critical path until Gate D passes.

1. Remote repository adapter, API contract, optimistic concurrency, and offline
   queue.
2. Authentication, organizations, roles, invitations, and authorization tests.
3. Immutable server versions, branching, review comments, approvals, audit
   records, and publication channels.
4. Build workers and deployment artifacts that consume the same compiler
   contract in an isolated environment.
5. Hosted runtime environments, secret/service binding, domains, rollback, and
   health reporting.
6. Submission API, encryption, retention/deletion, export, webhooks, spam/rate
   controls, and data-residency decisions.
7. Presence/comments first; real-time document commands and conflict resolution
   only after single-user command semantics are stable.
8. Organization fragment/theme libraries and a signed, permissioned plugin
   lifecycle.

Each follow-on is a separate product/security design effort. None requires
changing the core Studio project/compiler separation.

## 18. First execution slice

Start with Sessions 01–09 and resist parallel feature expansion until the new
vertical slice passes Gate A. The most valuable first visible result is small:

1. import the current demo form into document v1;
2. render one text field and one group through the new compiler;
3. select by UID and edit the label through a command-generated inspector;
4. undo and redo the edit;
5. enter preview data through the controlled v1 runtime;
6. see compiler/runtime diagnostics mapped back to the source field; and
7. reload the project from the repository boundary.

That slice proves the architecture. The remaining sessions then expand a
working system instead of building disconnected foundations.
