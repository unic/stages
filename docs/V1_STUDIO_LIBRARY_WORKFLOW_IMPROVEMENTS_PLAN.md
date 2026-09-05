# Stages v1: Studio and library workflow improvements

Status: implementation started; the first P0 export safety slice is implemented.

Implementation progress (2026-09-05): F1 schema factories and F2 specialized
field reducers now reject executable export with
`export.executable-binding-required`; canonical project JSON remains available.
Generated built-in reducers now enforce preview's payload types and finite-number
checks. Committed export regressions cover both rejections and generated-consumer
event behavior for all six built-ins. Dynamic/custom-reducer generated execution,
packed-consumer equivalence, and F6 remain pending. See
[export behavior and evidence](../studio/docs/IMPORT_AND_EXPORT.md).

F3 progress (2026-09-05): an editor-owned compiler session now reuses equivalent
compilations, including specialized reducer definitions. Runtime regressions
cover touched state, wizard position, row keys, pending owner proposals, and
in-flight validation; an editor regression verifies that selection and panel
changes do not compile. Real-edit behavior reuse and migration policies remain
P1 work. See [preview session behavior](../studio/docs/TEST_DATA_AND_RUNTIME_PERSISTENCE.md).

F4 progress (2026-09-05): source maps retain variant-qualified candidates.
Diagnostics and validation inspection resolve actual rows from accepted values,
including nested collections and fragment instances. Reordering preserves row
addresses; ambiguous or unavailable occurrence data leaves navigation unmapped.
Runtime regressions cover resolver failures, validation, pending moves, fragment
provenance, and restoration. See [diagnostic mapping behavior](../studio/docs/PROBLEMS_INSPECTION_AND_OBSERVABILITY.md).

F5 progress (2026-09-05): ordinary node updates now safely reject runtime-ID
changes/removal with `command.runtime-id-refactor-required`, including fragment
definition edits and instance overrides. Existing IDs are read-only in the
inspector. Regressions verify atomic rejection, unchanged expression behavior,
scenario values and schema version, plus continued label editing. Full semantic
rename and structural refactor/migration transactions remain P1 work. See
[the current rename boundary](../studio/docs/decisions/0002-editor-uids-and-runtime-ids.md).

Analysis date: 2026-09-04. Baseline: `feature/version-one-point-zero`, commit `883791a`.

Audience: Stages core, adapter, tooling, and Studio maintainers.

This proposal extends the [Studio product and architecture plan](V1_STUDIO_PRODUCT_AND_ARCHITECTURE_PLAN.md). It focuses on the workflow between visual authoring and applications consuming the framework-agnostic v1 library. The existing [runtime boundaries](content/project/core-boundaries.mdx) and Studio's [document ownership decision](../studio/docs/decisions/0001-declarative-document-is-the-source.md) remain the starting point.

## 1. Recommendation

Establish a supported, portable authoring contract shared by Studio, application code, and build tooling. Extract reusable authoring capabilities into an optional Stages package, and keep the core focused on deterministic runtime behavior.

Studio already has a substantial foundation: versioned documents, immutable commands, safe expressions, a compiler, source maps, scenarios, trusted service bindings, and a controlled preview host. The largest opportunity is to make those capabilities travel reliably from the editor into production applications.

The intended workflow is:

1. Developers register field definitions, framework views, services, and codecs.
2. Authors edit a portable form definition in Studio, or developers maintain that definition through a typed authoring API.
3. A shared compiler produces executable Stages configuration, presentation artifacts, source maps, and binding requirements.
4. Studio previews that compilation through the public controller contract.
5. Build tooling produces application artifacts from the same definition and behavior implementations.
6. Shared scenarios verify equivalent behavior in preview and the generated application.
7. Schema changes carry explicit compatibility decisions and tested migrations for saved runtime state.

Package names and new API concepts in this document are proposals. They are not currently exported contracts.

## 2. Current architecture and strengths

| Layer | Existing responsibility | Relevant implementation |
| --- | --- | --- |
| Core | Recursive schemas, events, controlled proposals, validation, collection identity, wizard navigation, serialization | [Public types](../packages/core/src/types.ts), [controller](../packages/core/src/controller.ts) |
| Framework adapters | Framework lifecycle, field bindings, rendering integration | [React](../packages/react/src/index.tsx), [DOM](../packages/dom/src/index.ts), [Vue](../packages/vue/src/index.ts), [Angular](../packages/angular/src/index.ts) |
| Studio document | JSON-safe forms, stable editor UIDs, fragments, scenarios, resources | [Document types](../studio/src/document/types.ts) |
| Studio compiler | Runtime schema input, field registry, presentation plan, source maps, diagnostics | [Compiler](../studio/src/compiler/compiler.ts), [output types](../studio/src/compiler/types.ts) |
| Preview host | Canonical value ownership, proposal handling, controller lifecycle, runtime persistence | [Preview host](../studio/src/runtime/preview-host.ts) |
| Export and publication | Generated files, release snapshots, binding checks, migration and scenario gates | [Exporter](../studio/src/projects/artifacts.ts), [versioning](../studio/src/projects/versioning.ts) |

Several existing decisions should be preserved:

- Core has no runtime dependencies and does not depend on a browser or framework.
- A controlled change remains a proposal until the application owner accepts or replaces it.
- Editor UIDs are distinct from runtime data IDs and row addresses.
- Presentation blocks do not introduce fake fields into submitted values.
- The editable project document is separate from the serialized runtime envelope.
- Executable services and codecs come from trusted host bindings.
- Invalid dynamic schema revisions retain the last valid runtime tree.
- Generated TypeScript is a one-way artifact, while the portable document remains editable.

These foundations support the proposed work without requiring a replacement runtime.

## 3. Evidence and immediate defects

### 3.1 Verification performed during the analysis

Core and React were rebuilt using Node 24.15.0 before running the following focused suites:

- [Compiler tests](../studio/src/compiler/compiler.test.ts).
- [Export tests](../studio/src/projects/artifacts.test.ts).
- [Preview-host tests](../studio/src/runtime/preview-host.test.tsx).
- [Versioning tests](../studio/src/projects/versioning.test.ts).

All four suites passed: 29 tests in total. Additional temporary executable probes exercised the cases below against the implementation. Those probes were exploratory analysis, not committed regression tests. Their setups and observed outcomes are recorded here so implementation can turn them into durable tests.

This evidence covers the identified source and runtime contracts. It does not establish full browser, accessibility, performance, or release readiness.

### 3.2 F1: conditional structure can be lost during export

**Setup:** Add a field with `behavior.presentWhen` referencing `context.showTitle`. Preview with `showTitle` set to false.

**Observed:** The preview correctly omits the field. Export succeeds, but the generated static schema includes the field without its presence condition.

**Cause:** `compileStudioForm()` emits a factory through `schemaInput` for conditional structure. `generateStudioExportBundle()` checks and emits `compiled.schema`, which represents the static schema before that factory is applied.

**Impact:** Export can change application behavior while reporting success.

**Immediate correction:** Detect unsupported schema factories before producing an executable bundle. Preserve the independent canonical project export. The complete solution is compilation from a portable behavior model that supports both preview and production output.

Evidence: [compiler](../studio/src/compiler/compiler.ts), [exporter](../studio/src/projects/artifacts.ts).

### 3.3 F2: field-specific reducers can produce incomplete exports

**Setup:** Add a field-specific reducer to a text field, such as a named event that clears the current field.

**Observed:** Compilation emits a field type such as `text__studio__field_title`. Export succeeds, but the generated field registry contains only the base `text` definition.

**Cause:** The compiler adds specialized definitions to `compiled.fields`. The exporter discovers field keys from document definitions and emits base definitions. Its executable-behavior scan only traverses the schema.

The generated generic input reducer also accepts payloads without the type and finite-number checks used by Studio's built-in reducers. This is a separate source-level mismatch between preview and generated behavior.

**Impact:** Generated schemas can reference missing field definitions, and even base field behavior can differ between preview and application code.

**Immediate correction:** Validate the complete set of required runtime definitions and preserve their behavior. Until specialized reducers can be emitted, return an explicit export diagnostic. Add isolated consumer tests that exercise events as well as initial construction.

Evidence: [compiler](../studio/src/compiler/compiler.ts), [registry](../studio/src/registry/index.ts), [exporter](../studio/src/projects/artifacts.ts).

### 3.4 F3: equivalent recompilation can reset the testing session

**Setup:** Compile a form containing a custom reducer, create a preview host, and blur a field so it becomes touched. Compile the unchanged document again and update the host with the new compilation and the same canonical value.

**Observed:** The controller is recreated and touched state changes from true to false.

**Cause:** Recompilation creates new specialized field-definition objects. The preview host compares field-definition references, treats them as creation-time changes, and creates a fresh controller without restoring the previous runtime envelope.

**Impact:** Routine editor activity can disrupt validation investigation and interaction state. The editor currently invokes compilation during rendering, making stable compilation identity particularly important.

**Immediate correction:** Reuse unchanged definitions and avoid recompilation for workbench-only changes. Define an explicit state-preservation policy for changes that actually require controller recreation.

Evidence: [preview host](../studio/src/runtime/preview-host.ts), [editor](../studio/components/v1/StudioV1Editor.tsx), [compiler](../studio/src/compiler/compiler.ts).

### 3.5 F4: variant diagnostics can navigate to the wrong definition

**Setup:** Create a discriminated collection with person and company variants. Both contain a field with runtime ID `name`, but each field has a different Studio UID. Trigger a derived-prop resolver failure on a person row.

**Observed:** The runtime diagnostic correctly identifies the person row's runtime path. Studio translates it to the company field UID.

**Cause:** Variant definitions do not add a data-path or node-address segment. The source map stores a single UID for each static path/address, so the second variant overwrites the first. Removing row segments during diagnostic translation cannot recover which variant supplied the definition.

**Impact:** Problems navigation and inspection can direct an author to the wrong field.

**Immediate correction:** Preserve variant-qualified source identities and resolve the actual runtime occurrence. Do not fix this by changing submitted data paths or silently changing persisted row-address semantics.

Evidence: [source-map construction](../studio/src/compiler/compiler.ts), [diagnostic translation](../studio/src/runtime/diagnostics.ts), [validation inspection](../studio/src/validation/inspection.ts).

### 3.6 F5: runtime-ID edits do not refactor expression references

**Setup:** A field at `event.title` has an expression referencing that path. Update its runtime ID to `headline` through `node.update`.

**Observed:** The command succeeds, but the expression still refers to `event.title`. The schema version remains unchanged.

**Cause:** The command updates node properties and checks graph invariants. Expression references remain independent string paths.

**Impact:** A simple editor rename can break dependent behavior or leave it reading obsolete data.

**Immediate correction:** Treat runtime-ID changes as refactors with reference analysis and a value-migration decision. Extend the same treatment to moves, wrapping, structural conversion, and fragment operations.

Evidence: [command engine](../studio/src/commands/engine.ts), [expression types](../studio/src/expressions/types.ts), [identity decision](../studio/docs/decisions/0002-editor-uids-and-runtime-ids.md).

### 3.7 F6: publication does not detect an omitted schema-version bump

**Setup:** Prepare a release for a valid form, rename a runtime field ID, and prepare another release with a newer project revision but the same schema ID and schema version. The probe used a form without named scenarios.

**Observed:** Both releases pass preparation.

**Cause:** Migration checks compare declared version numbers. They require migration evidence when the version advances, but do not independently detect a changed value shape when the version stays the same. A custom scenario runner might expose a problem, but the version gate itself does not classify the schema change.

**Impact:** An incompatible application artifact can retain the identity used by older saved runtime state.

**Immediate correction:** Compare structural contracts between releases and require an explicit compatibility decision for shape changes.

Evidence: [migration and publication checks](../studio/src/projects/versioning.ts).

## 4. Improvement 1: a portable authoring and compilation contract

**Priority:** P1, after the immediate export correctness fixes.  
**Primary owner:** optional Stages authoring/tooling package plus Studio integration.

### Intended workflow

A form authored visually should retain its conditions, validators, reducers, transforms, collection policies, localization, and service requirements when used in an application. A developer should also be able to maintain the same portable definition through a typed API.

### Proposed design

Extract a reusable package, provisionally `@stages/authoring`, from the existing document and compiler modules. Start with a narrow package surface and stable internal modules; separate packages are only justified when consumer needs or dependency boundaries require them.

The public authoring contract should cover:

- Portable form structure and explicit definition references.
- Bounded expression trees with specified evaluation semantics.
- Declarative validation and patch rules.
- Versioned references to trusted executable behavior.
- Compilation diagnostics, source mapping, and binding requirements.
- A presentation artifact separate from the runtime schema.

The full Studio project remains responsible for editor-specific concerns such as project organization and scenarios. A portable form projection can omit workbench data without creating a second editable source of truth.

Use one semantic compilation pipeline with two consumers:

| Consumer | Output |
| --- | --- |
| Studio preview | Executable schema input, runtime field bindings, render plan, source map, diagnostics |
| Application build | Equivalent executable modules, named imports, presentation artifacts, type declarations, requirements manifest |

Build-time compilation should be the initial production path. Applications can consume generated modules without installing the Studio application. A runtime loader may be offered separately if there is a concrete need for loading definitions without rebuilding an application.

### Binding and failure semantics

Resolve executable bindings by explicit key and version. Separate portable binding references from trusted module/export configuration. Compilation must identify unresolved or incompatible requirements before an artifact is declared usable.

Classify features by whether they can be emitted directly, require a supplied binding, or are unsupported. Do not infer complete exportability by scanning only the final static schema. Do not serialize closures or depend on function source text.

The existing executable `StagesSchema` API remains valid. Arbitrary application callbacks do not become automatically editable in Studio. A typed portable builder is an opt-in path to visual editing.

### Deliverables and acceptance criteria

- A versioned portable contract and deterministic compiler result.
- A documented binding-resolution protocol shared by preview and build tooling.
- Equivalent export coverage for visibility, factory presence, derived props, validation, transforms, reducers, guards, item keys, and localization.
- Explicit diagnostics for every unsupported capability.
- A consumer package can compile and run generated artifacts through public Stages entry points.
- A condition-only form and a custom-reducer form pass behavioral equivalence tests.
- Existing Studio document fixtures continue to load, or an ordered document migration is provided.

## 5. Improvement 2: shared, extensible field descriptors

**Priority:** P1.  
**Primary owner:** authoring package, field-definition providers, framework adapters.

### Current gap

Core's `FieldDefinition` describes runtime behavior. Studio adds its own authoring metadata, but fixes the field keys to six built-ins and value kinds to boolean, number, and string. Its export metadata names the React adapter.

The canonical Event Launch example already demonstrates requirements beyond that catalog: a money field and optional numeric values. These are useful compatibility fixtures, not hypothetical extension cases.

Evidence: [Studio registry](../studio/src/registry/index.ts), [Event Launch field contract](../examples/shared/event-launch/field-contract.ts), [example value codec](../examples/shared/event-launch/persistence.ts).

### Proposed design

Define a descriptor that connects a field's runtime contract to its authoring capabilities. It should include identity and version, typed prop/value information, inspector controls, empty-value policy, validation capabilities, codec references where needed, documentation, and definition migrations.

Keep framework views in framework-specific bindings. A shared descriptor can identify a view requirement; React components, Vue components, Angular bindings, or DOM view factories satisfy it in the consuming environment.

Pass a supplied registry through Studio's compiler, palette, inspectors, and preview. Avoid compiler logic that assumes built-in keys or synthesizes different reducers during export.

The value contract must distinguish empty, missing, null, and zero where a field requires it. Rich runtime values can use trusted codecs at JSON boundaries. A descriptor must not imply that every runtime value is directly JSON-safe.

Prop validation and editor controls should derive from one declared contract where practical. TypeScript inference should preserve custom field value and prop types in generated consumer declarations. Dependencies for a schema-description format should be evaluated deliberately rather than added as an incidental part of extraction.

### Deliverables and acceptance criteria

- Public descriptor and registry-extension contracts.
- Built-in fields migrated onto the same extension mechanism offered to consumers.
- One custom money-field example with editor controls, typed props, value semantics, and codec behavior.
- Missing views and unsupported definition versions produce actionable diagnostics.
- Preview and generated consumers reject the same invalid input payloads.
- The shared descriptor imports no framework runtime.
- The same portable definition can bind to at least React and DOM, with Vue and Angular included in the eventual adapter compatibility gate.

## 6. Improvement 3: semantic references and safe structural refactors

**Priority:** P1.  
**Primary owner:** authoring reference utilities and Studio command engine.

### Proposed reference model

Distinguish the source definition being referenced from the occurrence used at runtime. An editor reference should express its target and scope, including form-level targets, the current collection row, relevant ancestor rows, and fragment-instance context.

References should retain stable definition identity across a runtime-ID rename. Compilation resolves them to the paths needed by core. External context and extension references remain explicit, separately described inputs.

Build a dependency index covering conditions, derived props, validator dependencies and issue targets, transform actions, named events, and fragment references. Reuse that index for expression pickers, impact previews, generated path helpers, and refactoring.

Trusted opaque callbacks need declared dependency metadata or an explicit unknown-dependency classification. Static analysis cannot prove the dependencies of arbitrary executable bindings.

### Refactor transaction

A rename or structural edit should:

1. Identify the affected source definitions, occurrences, and dependent references.
2. Classify changes to submitted value paths and saved runtime addresses.
3. Prepare updated references, scenarios, and any required migration proposal.
4. Apply the document edits atomically through the command engine.
5. Report unresolved external dependencies instead of silently retaining invalid paths.

Copy, duplicate, and fragment detach operations need an explicit policy for internal versus external references. Internal references should follow the new copies; external references should preserve their target or require resolution.

Preserve existing runtime data-path and row-address contracts. Stable authoring references are an additional abstraction, not a reason to change domain values.

### Deliverables and acceptance criteria

- A versioned reference representation and migration from existing path-based expressions where resolvable.
- One dependency index used by commands, inspectors, and compilation.
- Nested fields appear with correct paths in reference pickers.
- Rename and move tests retain behavior across nested groups, collections, wizards, and fragments.
- Undo/redo restores both structure and references in one step.
- Ambiguous legacy references remain visible diagnostics until resolved.
- Copy and detach tests cover internal references, external references, and nested fragment instances.

Evidence: [expression serialization and dependency extraction](../studio/src/expressions/serialization.ts), [logic path resolution](../studio/src/logic/compiler.ts), [clipboard](../studio/src/commands/clipboard.ts), [editor reference picker](../studio/components/v1/StudioV1Editor.tsx).

## 7. Improvement 4: precise provenance and runtime inspection

**Priority:** P2, with the variant source-map defect fixed in P0.  
**Primary owner:** narrowly scoped core contract additions and authoring diagnostics.

### Proposed core capability

Introduce optional opaque source identity for schema definitions and structured origin information for diagnostics. Core should propagate supplied identifiers without understanding Studio UIDs, fragments, documents, or editor panels.

A runtime failure should be attributable to a definition and, where applicable, a particular predicate, derived prop, validator, or rule. Authoring tooling can then join that identifier to a property path and fragment/variant provenance.

Keep definition identity separate from occurrence identity. A reused fragment field may have many runtime occurrences, and two variants may share a data path while representing different definitions.

### Inspection contract

Design an opt-in read-only inspection result that distinguishes:

- The accepted schema revision and the most recent attempted schema revision.
- The current value/snapshot revision and any pending owner proposal.
- The evaluated occurrence's definition identity and runtime address.
- Visible, dormant, disabled, or structurally absent status where the engine can establish it.
- Runtime validation and failure origin information appropriate for debugging.

The inspection API should expose information from the existing evaluation rather than invoke factories or predicates again. If absence requires knowledge of an authoring definition that core never received, the compiler should supply that part of the explanation; core must not claim knowledge it lacks.

Inspection must remain separate from the rendering snapshot where including it would increase normal rendering cost. Trace retention, value capture, and report redaction need explicit opt-in policies.

### Deliverables and acceptance criteria

- A reviewed additive provenance/inspection contract with compile-time and runtime evidence.
- Person/company variants with identical child IDs map to the correct definition.
- Nested fragment failures identify both the reusable definition and the relevant instance.
- A rejected dynamic schema revision is distinguishable from an accepted one.
- Reading inspection data does not reevaluate user code or change proposal semantics.
- Core remains free of framework/browser imports and module-global controller state.
- Existing serialization fixtures remain valid; any persisted change receives an explicit migration.
- Existing evaluation-count and selector-fan-out budgets continue to pass.

Evidence: [core diagnostics and snapshots](../packages/core/src/types.ts), [last-valid evaluation](../packages/core/src/controller.ts), [Studio runtime inspection](../studio/src/runtime/observability.ts), [dynamic structure panel](../studio/components/v1/StudioV1Editor.tsx).

## 8. Improvement 5: stable compilation and continuous preview sessions

**Priority:** P1 for stable identities; any new core reconfiguration API is deferred.  
**Primary owner:** authoring compiler and Studio preview host.

### Proposed update policy

| Change | Intended handling |
| --- | --- |
| Selection, panel state, drag state | Update workbench state without runtime recompilation |
| Layout, theme, decorative content | Update the presentation artifact; preserve runtime state when semantics are unchanged |
| Field label or derived presentation props | Update relevant schema/props while retaining compatible occurrence state |
| Validator or transform behavior | Replace affected behavior and invalidate affected results without resetting unrelated interaction state |
| Incompatible field type, root schema version, or creation-time binding | Use an explicit compatibility and recreation/migration path |
| Scenario reset | Create the intentionally fresh session requested by the author |

Cache compilation at the form and behavior-definition level. Include trusted binding versions and localization inputs in cache identity. Retain references for unchanged runtime definitions and avoid unnecessary controller updates.

Scope caches to an explicit compiler session or owner so projects and binding environments cannot accidentally share mutable state. Establish deterministic work-count measurements before pursuing fine-grained incremental compilation.

When recreation is required, define which accepted runtime state can be serialized and restored, which validation must restart, and which interaction state is incompatible. Pending proposals must remain under owner control and must not be implicitly accepted to make recreation easier.

Consider a core reconfiguration API only after this compiler/host work demonstrates a remaining public-contract limitation. Such an API would need explicit rules for binding replacement, validation cancellation, identity reconciliation, and failures.

### Deliverables and acceptance criteria

- Stable registry identity for equivalent compilation.
- Regression coverage for touched state, active wizard stage, row keys, and pending validation during compatible edits.
- Workbench-only updates do not create a controller or compile a schema.
- A real behavior edit invalidates the appropriate validation results.
- Stale async results remain suppressed after edits and recreation.
- Reset and scenario-switch behavior remains intentionally fresh.
- Performance measurements cover compilation counts and controller recreation counts in representative large forms.

## 9. Improvement 6: schema compatibility and complete state migrations

**Priority:** P1 for detecting omitted version bumps; P2 for shared migration tooling.  
**Primary owner:** authoring/build tooling, Studio publication, core persistence utilities where justified.

### Change classification

Compare the portable structural contract and binding requirements between releases. Distinguish presentation-only changes, behavioral changes, compatible additions, and incompatible data/state changes.

A runtime-ID rename, a scalar-to-collection conversion, a changed discriminator, or incompatible field value contract should trigger an explicit decision. The tool should explain the affected paths and saved-state identities. Behavioral changes may require scenario evidence even when the serialized value shape is unchanged.

The analyzer must report uncertainty for opaque callbacks and external contracts. It should not claim to prove arbitrary application compatibility from schema structure alone.

### Migration scope

Studio currently migrates scenario values through `StudioSchemaMigrationBinding`. Core's `StagesStateMigration` receives the complete serialized envelope. Build shared migration tooling around that full runtime boundary, with a value-only projection where Studio scenarios need one.

Migration helpers should account for accepted values, baseline values, touched/visited addresses, revealed validation state, wizard location, collection keys, and extension namespaces. Each affected metadata category needs a preserve, translate, or discard policy.

Test saved envelopes from supported older versions, including nontrivial interaction state. A migration that merely produces deterministic JSON is insufficient evidence that the restored controller behaves correctly.

Project-format migrations, field-definition migrations, and runtime schema-state migrations remain distinct version axes. A Studio document update must not automatically change the meaning of persisted application data.

### Publication manifest

Record the document revision and digest, form schema identities, portable format version, compiler/exporter versions, definition and binding requirements, target adapter/package versions, actual artifact hashes, migration identifiers, and scenario results.

The current form artifact digest is derived from a serialized project projection. Future manifests should distinguish that input digest from hashes of the generated files, so a compiler or binding change is visible even when the document is unchanged.

Publishability must include successful artifact generation and validation. Passing compiler checks alone must not imply that the resulting application bundle is complete.

### Deliverables and acceptance criteria

- A same-version field rename is identified before release preparation succeeds.
- Label/layout edits do not require a value migration solely because presentation changed.
- Saved envelopes migrate and recreate with the intended value, baseline, row identity, and wizard position.
- Missing migration steps and unsupported binding versions produce specific diagnostics.
- A release manifest distinguishes source identity from generated artifact identity.
- Rollback and unsupported downgrade behavior are documented explicitly.

Evidence: [publication and migration binding](../studio/src/projects/versioning.ts), [core persistence contracts](../packages/core/src/types.ts), [serialization implementation](../packages/core/src/serialization.ts), [historic state fixtures](../packages/core/test/fixtures/serialized/format-v1-interaction.json).

## 10. Improvement 7: executable scenarios and usable application exports

**Priority:** P1 for regression/equivalence infrastructure; P2 for complete adapter starters.  
**Primary owner:** `@stages/test-kit`, authoring build tooling, framework adapters.

### Shared scenario runner

Extend the current adapter harness with portable scenario steps and assertions. Scenarios should be able to set initial value/context/extensions, dispatch events, accept/reject/replace proposals, validate a scope, navigate, reorder rows, serialize, and recreate.

Specify deterministic async-service scheduling and cancellation outcomes. Prefer controlled completion points over timing assumptions. Assertions should distinguish canonical value, pending proposal, visible issues, active stages, row identity, and diagnostics.

Run the same scenario against the preview compilation and an isolated generated consumer. Compare observable semantics, allowing documented representation differences such as framework view tokens.

The generated consumer gate must use packed public packages without source aliases or workspace symlinks. The existing export consumer test compiles generated files but links Studio's `node_modules`; it is useful baseline coverage, not a complete packed-package distribution check.

Evidence: [test-kit harness](../packages/test-kit/src/index.ts), [scenario types](../studio/src/document/types.ts), [publication runner port](../studio/src/projects/versioning.ts), [existing export test](../studio/src/projects/artifacts.test.ts).

### Application and presentation output

The current generated React application displays the value as JSON and provides a validation button. It does not render the form authored in Studio. Export the existing separate presentation plan, theme data, content blocks, and view-binding requirements, then supply usable framework-specific starters.

Start with React and DOM to prove the framework-neutral boundary. Extend the same contract to Vue and Angular. Keep design-system markup and accessibility mechanics in adapters or view providers.

Generated applications should include actual controls, collection actions, wizard navigation, validation display, and a controlled-value integration. Product-specific submission services remain application bindings.

Support regeneration with clearly separated generated files and developer-owned binding modules. Deterministic output should produce reviewable diffs without overwriting application-owned behavior. Generated source remains one-way; import/edit round trips use the portable definition.

### Deliverables and acceptance criteria

- Exported scenarios run in CI through the public test-kit contract.
- F1 and F2 fail equivalence tests before their fixes and pass afterward.
- Tests cover rejected proposals, owner replacement, stale async results, nested collection moves, and serialize/recreate.
- A representative Event Launch form passes the same semantic assertions in Studio and generated consumers.
- Generated controls and presentation are exercised by adapter/browser tests, including keyboard and accessible-name checks.
- Regeneration preserves developer-owned bindings and produces stable output.
- No generated application depends on the Studio application package.

Evidence: [exporter](../studio/src/projects/artifacts.ts), [render-plan types](../studio/src/compiler/types.ts), [presentation registry](../studio/src/registry/presentation.ts), [canonical example](../examples/shared/event-launch/schema.ts).

## 11. Implementation sequence

| Phase | Scope | Completion gate |
| --- | --- | --- |
| P0: restore trust in current workflows | Add regressions for F1–F6; block incomplete executable exports; correct variant mapping; prevent equivalent recompilation resets; detect unsafe rename/version cases | Each recorded reproduction has a committed regression test and an explicit corrected or safely rejected outcome |
| P1a: establish portable contracts | Extract authoring compiler, define binding requirements, introduce extensible field descriptors | Studio and an isolated consumer compile the same portable form and custom field |
| P1b: preserve editing semantics | Introduce semantic references, refactor transactions, stable compilation, schema-change classification | Rename, move, duplicate, and compatible edits preserve references and intended preview state |
| P1c: prove equivalent execution | Extend test kit and generated-consumer scenarios | Dynamic behavior, custom reducers, proposal policies, and persistence match across preview and export |
| P2: complete runtime tooling | Add reviewed provenance/inspection contracts and complete-state migration helpers | Correct occurrence-level diagnosis and historic envelope migration without performance regressions |
| P2: complete application handoff | Export presentation and usable starters across adapters; integrate artifact manifests | Representative forms render and behave correctly from packed packages across supported adapters |

The phases describe dependencies and deliverables, not fixed-duration estimates. Regression infrastructure should grow with the first fixes rather than wait until the end of the roadmap. The final package split should follow the proven consumer boundary.

## 12. Compatibility and verification requirements

Implementation must preserve the repository's controlled-value, immutability, dependency, and serialization invariants. In particular, exporting, inspecting, migrating, or recreating a preview must never implicitly accept an outstanding controlled proposal.

For each public contract change, deliver runtime tests, compile-time contracts, a task guide, normative reference, checked example, updated coverage metadata, and packed-package consumer verification. Public core changes should follow the [API-change skill](../.agents/skills/stages-change-api/SKILL.md).

Rebuild affected dependency closures before package tests, since those tests import generated output. Use the [verification workflow](../.agents/skills/stages-verify-change/SKILL.md) to select checks. Run `npm run check:quality` for JavaScript/TypeScript implementation work and `npm run release:check:v1` for public API, persistence, manifest, package, adapter-contract, and release changes.

Studio component/store/compiler integration changes need `npm --prefix studio run test:v1`. Routing, Next.js integration, or configuration changes also need the Studio build. Documentation implementation needs `npm run check:docs:v1`, with a docs build for MDX, component, navigation, or configuration changes.

This Markdown file records proposed work and existing evidence. It does not add public exports, declare those proposed capabilities complete in the coverage manifest, or replace the current normative references.

## 13. Decisions to resolve during implementation

| Decision | Recommended starting point | Evidence needed before expanding it |
| --- | --- | --- |
| Authoring package surface | One optional package with internal modules and a narrow public contract | Independent consumers that justify separate packages |
| Production compilation mode | Build-time generation using shared semantics and named imports | A concrete requirement for runtime loading of portable definitions |
| Field prop description format | Reuse and generalize the existing descriptor model | Expressiveness, type inference, package cost, and interoperability comparison |
| Runtime source identity | Optional opaque definition provenance separate from occurrence addresses | Variant/fragment regressions and persistence compatibility tests |
| Controller reconfiguration | Stable compilation plus explicit recreation policy | A remaining lifecycle limitation that cannot be handled cleanly through public APIs |
| Migration policy | Structural analysis with explicit decisions and complete-state fixtures | Application-specific rules for additions, removals, and opaque bindings |
| Adapter rollout | React and DOM first, then Vue and Angular against the same scenarios | Packed-package and browser evidence for each adapter |

The first implementation slice should turn F1 and F2 into durable export regressions, make unsupported executable bundles fail explicitly, and prove one conditional form plus one custom-reducer form through a generated consumer. That slice establishes the correctness standard for the shared authoring contract.
