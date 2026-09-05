# Stages v1: portable forms from Studio to production

Status: implementation in progress (S0, S1 and S2 complete), based on a source and runtime review on
2026-09-05 at commit `5e2158e`. Package version: `1.0.0-alpha.0`.

Audience: Stages core, adapter, tooling, and Studio maintainers.

## Implementation progress

2026-09-05: S0 implementation is complete. The G5 sibling-change regression now has a
compiler fix with conservative outer-collection dependencies and fixtures for
nested rows, variants, reordering/removal, fragments, context/extension updates,
and async cancellation. A 1,000-row fixture measures conservative invalidation
fan-out. Computed values are marked unsupported in the inspector and compiler;
untracked/unavailable validator scopes now produce actionable diagnostics.
See [the capability contract](../studio/docs/PORTABLE_CAPABILITIES.md).

Core now separates proposal validation from accepted records. Delayed/rejected
proposals retain accepted results and async work; exact acceptance transfers
matching event results. Replacement, supersession, context/schema/extension
changes and teardown discard speculative work. Runtime regressions, a checked
public example, strict type contracts and a packed consumer cover this behavior.
Release verification also corrected stale Studio browser-test selectors and a
zero-width Recovery toggle caused by the palette help-button width rule.
S0 did not claim a production loader or authoritative server validator.
S1 and S2 are now complete as described below; S3–S5 and the portable beta release gate
remain open.

2026-09-05: S1 implementation is complete. The optional
[`@stages/authoring`](../packages/authoring/README.md) package now owns the shared
framework-neutral document validator, expression interpreter, catalogs and
compiler consumed by Studio. Its public loader validates a version-1 portable
envelope, verifies standard capabilities and exact service requirements, resolves
trusted host bindings, and refuses incomplete/unsupported compilation. A generated
JSON Schema describes the structural contract; semantic checks remain mandatory.

Studio exports deterministic `form.stages.json` projections with resolved
fragments, referenced localization messages and production defaults independent
of scenarios. Supported required/conditional/localized behavior, structural
conditions and reducers generate loader-based integration code. Unsupported
features and missing service bindings still fail explicitly. Core remains
unchanged and code-authored consumers do not need the optional package.

The exported contact fixture is checked against actual Studio output, strict
contracts and generated TypeScript, then loaded and validated in an isolated
installation containing only core and authoring tarballs. Its assertions cover
required rules, comparisons, conditions, German messages and controlled ownership.
Package verification now covers seven tarballs. See the
[loader guide](content/start/portable-forms.mdx) and
[normative reference](content/reference/authoring.mdx).

Verification used Node 24.15.0: static quality, documentation/API/JSON-Schema
checks, 115 package tests, 318 Studio/Vitest tests plus 10 Studio Node tests,
packed runtime/type consumers, performance checks, Studio/docs/example builds,
the React lifecycle test and all 42 browser journeys passed. The combined release
command reached an Angular/esbuild native abort inside the sandbox; Angular
passed when retried outside it. Browser listeners also required that permission,
and the browser suite used the already-running Studio server through the existing
external-server configuration. These were execution-environment retries, with no
weakened checks. Generated changes to tracked Angular caches were restored.

S2 values/custom components and hybrid composition are implemented below; S3 is next. Authoritative
submission decoding, full Event Launch portability and the portable beta gate
remain unimplemented; S1 establishes the runtime loader, not server acceptance.

2026-09-05: S2 implementation is complete. The additive authoring API separates
JSON field descriptors, exact-version trusted semantics, and opaque framework
view bindings. Descriptors support structured values and props, enum/array/object
contracts, nullable numbers, explicit empties, and draft/accessibility expectations.
Custom reducers check accepted value shape; money fixtures enforce safe integer
minor units. Blank optional-number drafts remain distinct from zero. Direct core
consumers retain their existing rich-value, codec and callback contracts.

Portable artifacts can reference custom JS behavior factories with JSON config.
The loader resolves exact bindings before configuring their root validators and
transforms; missing bindings and duplicate validator IDs fail explicitly. Public
hybrid composition appends trusted rules, preserves dynamic factories, and requires
a distinct deployment schema identity. Binding order, dependencies, cancellation,
controlled acceptance and view independence are documented and tested.

Studio hosts inject resolved fields and a separate component map. The palette,
structured props inspector, production projection, preview and compilation cache
support custom fields. Preview controls have occurrence-specific accessible IDs;
view replacement and presentation-only updates retain semantic identity. Generated
`App.tsx` output is explicitly described as integration scaffolding. Custom JSON
and host bindings can use public adapters or independent layout renderers.

The shared money/person/optional-number artifact loads and validates headlessly.
Contact and custom fields render through DOM, React, Vue and Angular; native and
existing application component systems are exercised without changing values or
rules. The same rendering tests run against installed Stages tarballs (external
framework/test peers reuse the repository installation); the separate Node
consumer installs only core and authoring with no framework peers or workspace
symlinks. S1's contact JSON is preserved byte for byte. Runtime/type contracts,
checked examples, the generated JSON Schema, API reports and coverage records
cover the new additive surface. See the [extension guide](content/start/portable-forms.mdx)
and [capability ledger](../studio/docs/PORTABLE_CAPABILITIES.md).

Verification used Node 24.15.0. `npm run verify:changed -- change` selected
`npm run release:check:v1` and passed: static quality, documentation/API/JSON-Schema
checks, 133 package tests, 323 Studio/Vitest tests plus 10 Studio Node tests,
packed semantic/type and four-adapter rendering consumers, performance checks,
Studio/docs/all-example builds, the React lifecycle test, and all 42 browser
journeys. The final run used the outside-sandbox environment required by Angular's
native build and browser listeners, and the existing Studio server through the
external-server configuration. The existing 1,000-row regression timed out once
under full-suite load; it passed focused and full retries without changing its
5-second limit. Generated Angular cache changes were restored.

S2 does not claim authoritative submission decoding, full Event Launch parity,
custom bulk-property editing, or automatic deployment fingerprints. S3–S5 and
the portable beta release gate remain open.

## 1. Assessment and success criterion

Stages has a strong framework-neutral runtime, but the alpha does not yet offer
a complete portable-form product. Studio can save a substantial declarative JSON
document and preview its behavior. Production consumers cannot yet load that
document through a published compiler, ordinary validation prevents executable
export, and Studio cannot register arbitrary field contracts. Server-side
submission validation also needs a contract beyond the existing UI-oriented
validation API.

The release criterion should be: **author a form once in Studio, export a
versioned definition, and use the same behavior and value contract in multiple
frontend frameworks, independently chosen component systems, and authoritative
server validation.** Both a small contact form and the complete Event Launch
form must demonstrate this workflow through installed package artifacts.

Preserve the current engine. Concentrate implementation on the shared portable
definition, field/value contracts, production loading, and evidence that these
layers work together.

### Developer extensibility is a release requirement

The portable format is an optional authoring and distribution layer. Developers
must retain the full JavaScript/TypeScript development path: custom synchronous
and asynchronous validators, transforms, reducers, schema factories, fields,
codecs, adapters, components, and layout renderers through public APIs.

Support three complementary workflows:

- **Code-authored:** construct schemas and pass callbacks/closures directly to
  core, with custom fields and rendering. Studio, the portable compiler, a JSON
  representation, and named binding registration are not prerequisites.
- **Portable:** load a declarative definition using standard capabilities and
  application-supplied bindings where needed.
- **Hybrid:** load a portable definition and compose it with custom JavaScript/TypeScript
  behavior, fields, adapters, and rendering through documented public extension
  points. Define ordering, conflicts, identity, and dependency handling for that
  composition; do not require patching compiler internals or generated files.

The declarative language must not become the ceiling on runtime capabilities.
Custom layout renderers may consume the headless snapshots and events directly;
the portable presentation model and default renderers remain optional. Rich
code-authored values remain supported under the existing core/codec contracts;
portable JSON transport requirements must not narrow the core value model.

For custom behavior that must travel with a portable definition, JSON records a
versioned reference and serializable configuration; the consuming application
supplies the actual JavaScript/TypeScript implementation. This applies to validators and
transforms as well as fields, services, and codecs. A custom implementation does
not have to be rewritten as an expression AST. Arbitrary closures need not be
recoverable from JSON or visually editable in Studio. Missing bindings limit
execution of the affected portable artifact in that environment; they must
never prohibit the code-authored workflow or silently drop custom behavior.

Server equivalence requires the applicable custom validation/transform bindings
and configuration to be available on the server too. Client-only adapters and
layout renderers are not server requirements. Hybrid behavior that changes
submission semantics must be included in the deployed contract's identity and
equivalence tests before that deployment claims client/server parity.

This plan sets the delivery order for that outcome. It builds on the
[Studio product plan](V1_STUDIO_PRODUCT_AND_ARCHITECTURE_PLAN.md) and
[Studio/library workflow plan](V1_STUDIO_LIBRARY_WORKFLOW_IMPROVEMENTS_PLAN.md).
Their detailed work remains useful; their completed safeguards must not be
treated as open defects. In particular, workflow findings F1–F6 now have
safeguards for unsupported exports, compilation identity, variant mapping,
unsafe renames, and structural version changes. The missing production
capabilities behind those safeguards are still open.

## 2. What the alpha already establishes

| Area | Current evidence | Boundary of that evidence |
| --- | --- | --- |
| Headless runtime | [Public types](../packages/core/src/types.ts), [controller tests](../packages/core/test/controller.test.mjs) | Controlled proposals, acceptance, events, immutable updates, subscriptions, and diagnostics exist. Core should remain free of framework/browser/runtime dependencies. |
| Complex structures | [Nesting matrix](../packages/core/test/nesting.test.mjs), [collection tests](../packages/core/test/collections.test.mjs) | Groups, homogeneous/discriminated collections, nested wizards, stable row identity, and deep composition work in the engine. This does not establish that Studio can author and export every combination. |
| Validation | [Validation tests](../packages/core/test/validation.test.mjs) | Scoped/full validation, async cancellation, stale-result suppression, conditional applicability, warning/error aggregation, and reveal policies exist. These are not an untrusted submission decoder. |
| Runtime persistence | [Serialization tests](../packages/core/test/serialization.test.mjs) and `SerializedStagesState` | The envelope contains a schema reference, value, baseline, and durable metadata. It does not carry executable schema definitions or field bindings. |
| Framework/component separation | [React](../packages/react/src/index.tsx), [DOM](../packages/dom/src/index.ts), [Vue](../packages/vue/src/index.ts), [Angular](../packages/angular/src/index.ts), [shared field contract](../examples/shared/event-launch/field-contract.ts) | Public adapters and custom view bindings exist. The four framework examples consume shared TypeScript configuration, not a Studio-exported portable form. |
| Portable authoring foundation | [Document types](../studio/src/document/types.ts), [document tests](../studio/src/document/document.test.ts), [compiler](../studio/src/compiler/compiler.ts) | JSON documents, bounded expressions, migrations, fragments, source maps, localization, and trusted service/codec registries exist inside Studio. |
| Initial equivalence evidence | [Agenda capstone tests](../studio/src/runtime/event-launch-agenda.test.ts), [capability ledger](../studio/docs/EVENT_LAUNCH_CAPSTONE.md) | A bounded Studio agenda slice matches selected canonical behaviors, including finite capacity comparisons. Full Event Launch, custom money/optional-number fields, and packed production export remain incomplete. |

### Review verification

The working tree was clean at the start of this review. Under Node 24.15.0:

- `npm run build:v1` rebuilt all packages before runtime tests.
- All core, DOM, React, Vue, Angular, and test-kit `.test.mjs` suites passed:
  **101 tests**.
- Focused Studio document, compiler, compiler-session, registry, validation,
  artifact, versioning, preview-host, logic, and agenda suites passed:
  **108 tests in 10 files**.
- Four temporary Vitest probes confirmed the observations in G2, G4, and G5
  below. The probes were removed after analysis; converting the relevant
  reproductions into durable regressions is implementation work.
- The documentation handoff passed `npm run verify:changed -- change`, which
  selected `npm run check:v1` and `npm run test:v1`. This includes the existing
  static quality, docs, application/type, package-consumer, and performance
  checks. All 28 local evidence links in this plan resolve.

These checks establish the reviewed baseline, not complete browser,
accessibility, security, or production portability readiness. This document
proposes behavior; it does not add public contracts or mark coverage complete.

## 3. Gaps that directly obstruct the goal

### G1 — The portable definition has no supported production consumer

**Priority: release blocker.** `StudioProjectDocument` is a real JSON-safe
authoring format. However, its document validator, expression interpreter,
compiler, and catalogs live under `studio/src/`; the six published-package
manifests do not expose a portable-document loader/compiler. Applications can
use hand-authored `StagesSchema` objects, which may contain closures, or the
limited generated artifacts. Copying Studio internals is not a stable contract.

**Work:** extract an optional framework-neutral package, provisionally
`@stages/authoring`, with a versioned portable form projection and a supported
validate/resolve/compile pipeline. Keep Studio project organization, recovery,
history, scenarios, and workbench state outside the production projection.
Resolve fragment/resource dependencies into that projection without maintaining
a second editable source. Publish a machine-readable document schema plus
semantic validation for references, cycles, versions, and capability support.

**Done when:** an isolated installed consumer can load exported JSON and
instantiate a form using public entry points, with no Studio, React, Next.js,
repository-source imports, or browser globals.

### G2 — Even a required field cannot complete executable export

**Priority: release blocker, including simple forms.**
[The exporter](../studio/src/projects/artifacts.ts) rejects factories,
specialized field definitions, and executable members of `compiled.schema`.
[Catalog validation](../studio/src/validation/catalog.ts) compiles ordinary
required/range rules to callbacks. A temporary probe added a single `required`
rule to a text field: compilation succeeded, but executable export returned
`export.executable-binding-required`. Dynamic conditions, transforms,
localization resolvers, and other callback-based features encounter the same
production boundary. Canonical project JSON remains available; the current
rejection correctly prevents silent behavior loss.

**Work:** make production execute the shared compiler's semantics. Start with
loading a portable definition through the extracted compiler. Add build-time
generation using the same implementation and explicit trusted imports; do not
serialize closures or independently reimplement every rule in code templates.
Compute complete binding requirements before producing runnable artifacts.

**Done when:** a contact form with required fields, a comparison, a conditional
field, and localized messages runs equivalently in Studio and an installed
consumer. Unknown capabilities/bindings produce actionable errors, and the
existing rejection tests remain until corresponding support is proven.

### G3 — Studio's field catalog limits component and value portability

**Priority: release blocker.** Core's `FieldDefinition` permits arbitrary value,
prop, and view contracts. In contrast,
[Studio's registry](../studio/src/registry/index.ts) fixes field keys to twelve
built-ins, values to boolean/number/string, definition versions to `1`, and
export metadata to `@stages/react`. The compiler resolves through the built-in
lookup rather than an injected authoring registry. The canonical `money`
definition and optional numbers cannot be faithfully authored there today.

**Work:** separate three registrations: a serializable field descriptor for
Studio, a trusted semantic binding for reducers/validation/codecs, and a
framework-specific view binding. Use namespaced exact-version references.
Descriptors must support structured props, enum/array/object values, explicit
empty values, parsing/formatting expectations, accessibility requirements, and
inspector controls. A host can expose custom definitions without forking Studio.

**Done when:** one custom money field and one composite field are authored in
Studio, exported, validated without a renderer, and rendered with two component
systems. Changing a view binding must not change values, rules, or schema
identity. Optional numeric input must distinguish an empty draft from zero.

### G4 — There is no authoritative submission contract

**Priority: release blocker.** The current `validate()` explicitly forces
validation irrespective of normal event schedules, but still excludes invisible
nodes and disabled nodes unless their validators opt in. That is intentional
UI behavior. It is not sufficient to validate arbitrary submitted JSON.

Two temporary probes demonstrated the boundary:

1. A required text field accepted `{ a: { unexpected: true }, extra: true }` as
   valid. The required rule checks presence, not the declared field value type
   or unknown keys. UI reducer payload checks do not protect externally supplied
   controller values.
2. A hidden required field containing an empty string returned `valid` from
   explicit full-form submit validation.

These are reasons to add a submission contract, not to silently change existing
UI validation or imply that the core claims to be a payload schema validator.

**Work:** derive an authoritative value contract and submission policy from the
portable definition. Decode and check input shape before business validation;
define canonical types, missing/null/empty semantics, allowed options, object
keys, collection bounds/variants, and unknown-field policy. Separate display
visibility, editability, validation applicability, and submission inclusion.
Conditions governing server acceptance must use submitted data and trusted
server context, not client interaction metadata or client-asserted privileges.

Provide a small server validation entry point in an optional package/subpath.
It must resolve the approved definition and exact bindings, validate a fresh
request value, await required asynchronous work, return structured issues and
canonical output, and clean up on completion, timeout, or request cancellation.
`pending`, `unknown`, missing bindings, and rule failures cannot yield acceptance.
Preserve the existing controller contract and reuse validation semantics where
applicable rather than creating a divergent server rule engine.

**Done when:** a plain Node consumer validates the same portable artifact with
no rendering dependencies. Tests cover malformed values, extra keys, forged
hidden/disabled values, missing branches, wrong variants, service rejection,
timeout, cancellation, and request isolation. The response identifies the exact
definition revision and distinguishes input rejection from unavailable execution.

### G5 — Row-relative validation dependencies can remain stale

**Priority: immediate correctness fix.**
[Dependency inference](../studio/src/validation/catalog.ts) includes expression
references in the `value` scope but omits `row` references. Core tracks the
validator owner's path plus explicitly declared dependencies in
[`validatorPaths`](../packages/core/src/controller.ts). A sibling value can
therefore change without invalidating the result.

**Reproduction confirmed by a temporary probe:** a collection row contains
`a = 5`, `b = 10`; `a` has a comparison rule `a <= row.b`. Explicit validation
returns `valid`. Accepting `{ rows: [{ a: 5, b: 2 }] }` through `update()` leaves
the validation snapshot `valid`. Calling `validate()` again returns `invalid`.
The compiler reports no diagnostic for this definition.

**Work:** represent and resolve relative dependencies against each runtime
occurrence. Choose the smallest compatible extension after proving that the
current static absolute-path contract cannot express the needed behavior.
A conservative compiler dependency on the containing collection may be an
interim correctness fix, with its broader invalidation cost documented and
measured. Audit row/context/extension/metadata dependencies and execution-site
scope availability together; do not merely add string paths to the existing
array.

**Done when:** accepted sibling changes invalidate or recompute the result;
pending/rejected proposals retain validation for accepted values. Regressions
cover nested rows, move/sort, variants, fragment instances, and async requests
that depend on siblings. Unaffected rows retain results where promised by the
chosen dependency granularity, and cancellation still suppresses late results.

### G6 — Advanced authoring exposes capabilities with incomplete semantics

**Priority: complex-form blocker.** The document and
[logic inspector](../studio/components/v1/StudioV1Editor.tsx) expose `computed`,
but the compiler emits `compiler.unsupported-computed`. Row-dependent
`presentWhen` is explicitly rejected. Expressions have a small operator set;
the validator catalog cannot express the canonical agenda's normalized
cross-variant uniqueness with multiple row-specific issues. Fragment parameter
names exist in the document type without an instance argument contract.

**Work:** publish a capability matrix for document acceptance, Studio editing,
preview, production execution, and server execution. Implement computed values
with explicit dependency/order/cycle rules and controlled proposal ownership;
distinguish derived presentation from persisted computed data. Define scopes
for nested rows, ancestors, fragments, validators, reducers, and guards.
Keep unsupported row-dependent structural presence explicit; use supported
visibility/variant patterns where appropriate. Add bounded aggregate operations
and/or trusted named validators with declared dependencies and multiple issues.
Either implement fragment parameters coherently or mark them reserved and keep
them out of supported authoring workflows.

**Done when:** the complete canonical Event Launch behavior is expressible
without weakening its existing rules, dropping optional values, or substituting
a smaller form. Every supported expression feature has compatible evaluation,
dependency, failure, and production/server behavior.

### G7 — Exported UI integration is a scaffold, not the authored form

**Priority: production handoff blocker.** The generated `App.tsx` currently
renders a value dump and a Validate button. It does not consume the compiler's
render plan or render the authored fields, blocks, layout, and navigation.
The generated initial value is taken from the first scenario when available.
Framework adapters themselves are more capable than this handoff.

**Work:** define an optional neutral presentation contract and framework binding
recipes for fields, blocks, containers, wizard navigation, actions, labels,
help, issues, focus, and layout. Respect existing component systems rather than
requiring Studio's CSS or components. Package production defaults separately
from test scenarios; loading a form must not implicitly deploy sample answers.
Make generated output either a complete usable example for its advertised
target or clearly labeled integration scaffolding.

**Done when:** the same portable form renders in React, Vue, Angular, and DOM
examples; at least one framework demonstrates two independently chosen component
systems. A custom-adapter contract shows how another framework can participate.
Presentation-only changes leave behavior unchanged. Keyboard, focus, error
relationships, and collection identity work through each supported binding.

### G8 — Compatibility evidence stops short of full portable releases

**Priority: required before portable beta.**
[Publication checks](../studio/src/projects/versioning.ts) now reject structural
changes without a schema-version bump.
[Their structural inventory](../studio/src/projects/structural-contract.ts)
does not classify validator, reducer, or other behavioral changes. Studio's
migration binding migrates scenario values, while core persistence also includes
baseline, row identities, wizard position, interaction state, and extensions.
The generated-consumer test uses a repository `node_modules` symlink; it is
useful evidence but not a packed production installation test for this workflow.

**Work:** track document format, semantic language/compiler compatibility,
schema/value version, definition release identity, and binding versions as
distinct concerns. Every production definition must have an immutable revision
or content identity. Classify shape, behavior, presentation, and binding changes;
require an explicit compatibility decision. Behavioral changes need a new
release identity even when no value migration is necessary. Extend migration
evidence to full envelopes and explicit preserve/reset rules for metadata.
Pin runtime states and submissions to the right deployed contract.

**Done when:** old fixtures recreate through supported ordered migrations;
baseline/dirty state, row keys, wizard state, and extensions follow declared
policies. A release cannot claim production readiness merely because local
preview compilation or a value-only scenario passed. Packed portable consumers
exercise the produced artifact and bindings.

### G9 — Large-form guarantees and authoring ease need end-to-end evidence

**Priority: portable beta gate.** Existing parser/expression limits and
[core performance budgets](../scripts/check-v1-performance.mjs) are useful.
They do not measure the complete import → fragment expansion → compilation →
render → submission path. Fragment expansion needs an explicit total expanded
node/work budget, not only limits on each stored fragment. Pattern validators
use native regular expressions; expression-step limits do not bound regex work.

**Work:** measure the simple and complex user journeys, expanded graph sizes,
dependency fan-out, view rerenders, async concurrency, and server resource use.
Specify bounded regex/input policies, expansion limits, and total validation
budgets; a timer alone cannot interrupt synchronous regex evaluation. Cache
immutable compiled definitions by exact artifact/binding identity while keeping
controller/request state isolated. Run Studio's outstanding accessibility and
performance/security sessions against portable workflows.

**Done when:** declared limits cover expanded/runtime data as well as stored
documents; oversized workloads fail with useful diagnostics. Published budgets
include the existing 1,000-node active-form target and deep/large collection
fixtures. A small form remains straightforward to author and integrate.

## 4. Target architecture and decisions

All names below are proposed, not currently exported APIs.

| Layer | Responsibility | Dependency rule |
| --- | --- | --- |
| Studio project | Editable forms, fragments, localization/resources, scenarios, recovery/version history | Consumes the shared definition/compiler; contains no credentials or executable code |
| Portable form artifact | Versioned deployable structure, declarative behavior, value contract, optional presentation, exact binding requirements, provenance | JSON data; excludes workbench state and test answers by default |
| Optional authoring/compiler package | Validate document semantics, resolve trusted bindings, compile runtime and submission behavior, produce diagnostics/source maps | Framework/browser independent; imports public core contracts |
| Core | Controlled runtime, normalization, events, validation machinery, identity and state persistence | Preserve zero runtime dependencies and existing proposal/acceptance semantics |
| Framework/view bindings | Adapt snapshots/events to chosen components, labels/issues/focus/layout | Depend on the relevant framework; do not own business-rule semantics |
| Server submission entry point | Decode authoritative inputs, enforce acceptance policies, invoke server services, return structured results | No renderer or Studio dependency; fresh state per request |

Recommended decisions for the first implementation slice:

1. **Support runtime JSON loading first.** Build-time generation is an
   optimization/integration path over the same semantics, not a prerequisite
   for portability. This advances the earlier workflow plan's build-time-first
   recommendation in response to the overarching portable-format goal.
2. **Keep the Studio document as the editing source for Studio-authored forms.**
   Define a deterministic production projection with resolved dependencies.
   Code-authored forms remain maintained in application source; neither workflow
   must round-trip through the other. Preserve old project-v1 fixtures through
   explicit migrations when the model evolves.
3. **Use a declarative standard library plus trusted bindings.** Standard fields
   and common rules should work without application callbacks. Advanced behavior
   can name exact-version host bindings; report these requirements before export
   or loading. Never evaluate arbitrary source or fetch executable modules merely
   because an imported document names them. These restrictions concern executing
   imported document content; application-owned JavaScript/TypeScript callbacks and imports
   remain supported through the code-authored and hybrid workflows.
4. **Specify values independently of controls.** Distinguish draft UI input,
   accepted application values, JSON transport, and canonical submission values.
   Define number/decimal precision, dates/time zones, empty strings, null/missing,
   boolean consent, arrays, and custom object values explicitly. Model uploaded
   files as host-managed references/metadata rather than assuming `File` objects
   are portable JSON.
5. **Keep UI and submission policies explicit.** Default to rejecting unexpected
   submission properties; allow deliberate pass-through or projection only when
   declared. Define exclusion/validation policies for inactive values without
   altering the current headless controller's UI contract implicitly.
6. **Target JavaScript/TypeScript frontends and Node server execution first.** JSON syntax
   alone does not establish cross-language execution. Publish semantic fixtures
   and capability requirements so another backend implementation can prove
   conformance. Custom JavaScript/TypeScript bindings require equivalents before claiming
   portability to non-JavaScript servers.
7. **Resolve deployment identity on the server.** A request identifies an
   approved form revision; the server loads that artifact and supplies trusted
   context/services. A client-supplied definition, visibility result, validation
   result, or serialized interaction state is not authoritative acceptance data.

## 5. Ordered implementation work

Each slice should produce a reviewable vertical change with tests and usage
documentation. Owners below identify repository areas, not assigned people.

| Slice | Scope and owner | Dependencies | Exit gate |
| --- | --- | --- | --- |
| S0 — Correctness and honest capabilities | G5 dependency regression/fix; G6 computed/unsupported capability messaging; retain F1–F6 safeguards. Studio compiler/validation/editor. | None | The row-sibling reproduction is a committed regression; unsupported authoring features cannot look production-ready. |
| S1 — Public portable loader | G1 extraction, format/version/requirements contract, built-in rules, runtime loading, G2 required-field export; preserve direct code-authored consumption. Optional authoring package + Studio. | S0; design decisions above | A required/conditional/localized contact form loads and validates from exported JSON in an isolated packed Node consumer; a code-authored consumer still needs only core and its chosen bindings. |
| S2 — Values and custom components | G3 descriptors, injected semantic/view registries, draft/transport/value contracts, G7 presentation bindings, and public hybrid composition for custom JavaScript/TypeScript behavior/rendering. Authoring + adapters + Studio. | S1 | Custom validators/transforms, money/composite fields, and a custom layout renderer work through public extension points; standard form works across the four existing frameworks and two component systems. |
| S3 — Authoritative submissions | G4 decoder, policy separation, server entry point, trusted services, cancellation/result contract. Authoring/server + core only where needed. | S1 and S2 value contracts; may proceed while S2 view work continues | The exact same artifact accepts/rejects the server fixture matrix, with malformed/forged payloads rejected and service failures never accepted. |
| S4 — Complex parity | G6 computed/aggregate/scoped behavior, full Event Launch authoring, shared behavioral journeys. Studio + authoring + example owners. | S2, S3 | Full canonical Event Launch runs through Studio, installed frontend consumers, and server validation without weakened rules. |
| S5 — Durable portable releases | G8 full-envelope migrations, revision/binding identity, packed artifact gates; G9 performance/resource/accessibility evidence. Tooling + Studio + all consumers. | Start fixture work at S1; complete after S4 | Old artifacts/states migrate as declared; simple and complex workflows pass release and portability gates. |

Start by turning the G5 reproduction into a focused durable test and correcting
its dependency handling. The first product milestone after that is S1's contact
form: JSON exported from Studio must instantiate and validate outside the
repository. Do not wait for hosted accounts, marketplaces, submission storage,
or more field presets to prove this central workflow.

## 6. Acceptance matrix

Use one fixture corpus for Studio preview, runtime JSON compilation, generated
output where offered, framework consumers, and server validation. Compare
semantic results; view tokens, localization presentation, and UI-only metadata
need not be byte-identical across environments.

| Fixture/journey | Required assertions |
| --- | --- |
| Simple contact form | Create visually, edit labels/options/rules, preview, export, reload, render actual controls, submit. Required/type/choice/email policies agree; explicit production defaults replace scenario ordering. |
| Developer-authored and hybrid extensions | Installed consumers exercise custom JS sync/async validation, transforms/reducers, schema factories, fields/codecs, a custom adapter, and custom layout rendering. The direct workflow requires no portable package or binding registry. The hybrid workflow composes public outputs/extensions without editing generated files; portable references resolve the custom implementations with declared ordering and conflicts. Missing bindings fail explicitly; server-relevant custom behavior participates in parity tests. |
| Component replacement | Same artifact with native controls and an existing application component system; custom money/composite field. Values, event payloads, rules, and transport remain compatible. |
| Full Event Launch | All stages, guards, variants, collections, money/optional numbers, cross-row aggregate issues, localization, transforms, services, and persistence. Match the canonical behavior ledger rather than relabeling the current agenda subset as complete. |
| Controlled ownership | Accept, delay, replace, and reject proposals. Validation/export/serialization observe accepted values; no compiler or adapter silently accepts outstanding proposals. |
| Dependency and identity changes | Sibling/ancestor/context changes, nested rows, move/sort/remove, variant replacement, fragments, and invalid dynamic revisions. Issues and source locations identify the correct occurrence; stale work is suppressed. |
| Server payloads | Missing/wrong-type/extra values, invalid enum/discriminator, oversized collections, forged derived values and inactive fields, unavailable services, timeout/cancellation, simultaneous requests. Authoritative policy determines acceptance. |
| Persistence and upgrades | Old document and runtime-envelope fixtures, schema/binding/version mismatch, migrated baseline/value/row/wizard/extensions. Explicit failures preserve recoverable data. |
| Installation and framework independence | Pack/install into isolated consumers without workspace symlinks or internal source imports. Run Node with no DOM; exercise React, Vue, Angular, and DOM bindings plus a custom-adapter contract. |
| Authoring usability | Record time and stumbling points for a new author completing the small form and an experienced author changing a cross-row rule in the complex form. Export problems identify the exact feature/binding and a concrete remedy. No source editing is needed for standard capabilities. |
| Scale and accessibility | Measure import/compile/edit/validate/render under declared limits; enforce expanded-work budgets. Verify keyboard authoring, focus/error relationships, and supported screen-reader/browser workflows. |

Extend [test-kit](../packages/test-kit/src/index.ts), currently a small
framework-neutral controller bridge, into reusable semantic scenario assertions
where that avoids duplicated framework test logic. Include expected validation
outcomes and acceptance steps: saved sample values alone do not constitute a
behavioral test.

## 7. Compatibility, verification, and completion rules

- Rebuild affected package dependency closures before `.mjs` tests. Use the
  repository change-verification workflow and Node 24.15.0.
- Any public format, dependency, field, validation, adapter, serialization, or
  package-contract change needs runtime tests, strict compile-time contracts,
  documentation, coverage metadata, old-format fixtures/migrations as relevant,
  and packed-package consumer verification. Run `npm run release:check:v1` for
  the corresponding public/release changes.
- Apply the Stages quality checks for JavaScript/TypeScript implementation;
  preserve `npm run check:quality`, core's dependency boundary, controlled
  semantics, structural sharing, and existing evaluation/selector budgets.
- Each shipped capability updates its task guide, normative reference, checked
  example, capability matrix, and applicable coverage records together. Run
  `npm run check:docs:v1`; build docs for MDX/navigation/component changes.
- Mark the portable beta complete only after both the simple and full complex
  fixtures pass the installed frontend and server paths. Local compilation,
  lossless JSON saving, existing package tests, or a successful static export
  alone cannot satisfy that gate.
- Treat any change that forces code-authored users into Studio, JSON, the
  expression AST, a fixed field catalog, or a prescribed renderer as a design
  regression. The developer-authored and hybrid extension fixtures are release
  gates alongside portable-form parity.

Deferred beyond this plan: hosted Studio infrastructure, marketplace execution,
collaboration, form-response storage, and claims of arbitrary backend-language
compatibility. None is necessary to prove the requested portable-form workflow.
