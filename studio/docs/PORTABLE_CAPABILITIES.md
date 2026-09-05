# Portable-form capability status

For Studio authors and compiler maintainers. Prerequisite: the
[document format](DOCUMENT_FORMAT.md) and the
[portable-form implementation plan](../../docs/V1_PORTABLE_FORM_SUCCESS_PLAN.md).

Document acceptance means a project can be preserved, not that all its behavior
can execute. The S1 production loader is implemented in `@stages/authoring`; the S3 submission entry point now strictly decodes and validates complete values
with server-owned bindings and context. Direct code-authored core schemas remain
supported independently of this document layer.

| Capability | Stored document | Studio editing | Preview | Executable export | Authoritative server |
| --- | --- | --- | --- | --- | --- |
| Built-in fields and static structure | Accepted | Supported | Supported | Shared loader + existing static subset | Strict decoding and validation |
| Custom money, composite and nullable-number fields | Exact host references; portable descriptors | Host palette and structured props inspector | Host component map | JSON + trusted field bindings | Descriptor decoding and trusted validation |
| Custom JS validators/transforms | Portable exact references and JSON config | Host integration | Public compiler/loader bindings | Trusted behavior bindings; hybrid composition | Same exact bindings, scoped rules and strict decoding |
| Component and layout replacement | Optional neutral render plan | Host-supplied preview views | Independent of semantics | DOM, React, Vue, Angular bindings; generated App remains a scaffold | Views not required |
| Required, comparison, range, conditional validation | Accepted | Supported | Supported | Shared loader | Supported under submission policy |
| Row/item validator dependencies | Accepted | Supported | Conservative outer-collection invalidation | Shared loader | Supported under submission policy |
| Context/interface and extension validation dependencies | Accepted | Supported | Host updates invalidate results | Shared loader | Supported under submission policy |
| Interaction metadata or event references in validators | Preserved | Not offered | Compile error | Rejected | Rejected |
| Derived presentation props | Accepted | Supported | Supported | Shared loader | Not applicable |
| Persisted `computed` expression | Accepted | Expression editor | Controlled proposals | Ordered computation | Consistency validation |
| Row/item-dependent structural presence | Preserved | Not offered | Compile error | Rejected | Rejected |
| Fragment parameter names | Preserved, reserved | Not offered | No argument semantics | Rejected when parameterized | Not implemented |

## Authoring a sibling comparison

Use the comparison validator with a `row` reference to the sibling property.
In validation, `row` (and the retained `item` alias) means the immediate parent
value of the validator owner. Inside a group nested in a collection row, it is
the group's value; it does not automatically climb to an ancestor row.
Form-level validation sees the root value. `value` always names the form value.

The checked example is the `rowForm()` fixture in
[`relative-dependencies.test.ts`](../src/validation/relative-dependencies.test.ts).
It requires `rows[n].a <= rows[n].b`. After explicit validation succeeds for
`a = 5, b = 10`, accepting `b = 2` invalidates the cached result immediately;
explicit validation then reports the issue at `rows[n].a`.

## Dependency contract and cost

Core currently accepts static absolute value paths for validator dependencies.
A compiler template path contains no runtime row indexes. Compiling a relative
reference as that template path would miss accepted sibling changes. Studio
therefore infers an absolute dependency on the outermost containing collection.
Outside collections, it uses the immediate parent path. Standalone catalog
compilation without owner information conservatively depends on the root.
Explicit dependencies and inferred `value` dependencies remain absolute and are
combined with relative dependencies without duplicates. Inference inspects the
validator's condition, comparison operand, and service request expression.

This is conservative: changing any row in that outer collection invalidates
all relative-dependent validator occurrences within it, including nested rows.
It does not promise retention for unaffected rows in that collection. Unrelated
values outside the dependency retain those results. The 1,000-row regression
measures the fan-out as 1,000 service invocations per full validation: an update
outside the collection retains the collection results; a sibling update clears
them and the next full validation invokes all 1,000 services again. This is
functional cost evidence, not an end-to-end performance or concurrency budget.

Host `update({ context })` and `update({ extensions })` already invalidate
validation in core. Interaction metadata can change without that invalidation;
validator event references have no expression event scope. The compiler now
reports `compiler.unsupported-validator-scope` at the specific validator for
either scope. Existing documents remain readable, but must replace these
references with supported value/context/extension inputs before execution.
Core's direct callback contracts are unchanged.

Accepted sibling changes cancel pending dependent services. Services that ignore
cancellation cannot publish late issues. Reordering, removal, variants, nested
collections, and linked fragment instances are covered by the runtime fixtures.
Snapshots and explicit validation use accepted data. Core now isolates event
validation for proposals, retaining accepted results and async requests during
delayed/rejected proposals. Exact acceptance transfers matching event results;
replacement/context/schema/extension updates and supersession discard proposal
work. No proposal is silently accepted. See the
[ownership regressions](../../packages/core/test/validation-ownership.test.mjs)
and [public contract](../../docs/content/validation/dependencies.mdx).

## Unsupported behavior

Computed values now support value/current-parent-row/trusted-context expressions,
ordered dependencies, cycle diagnostics, controlled proposals and authoritative
consistency validation. Owner/context updates require an explicit recompute event
when persisted derived values should change. Derived props remain presentation-only.
See the [normative computed contract](../../docs/content/reference/authoring.mdx).

Fragment parameter names remain inert reserved data with no instance argument
contract. Use ordinary linked fragments without parameters. Do not claim
parameter substitution or production parity based on successful preview.

Next: implement the S1
shared loader and installed contact-form consumer described in the plan.

## Evidence

- [Validator compiler](../src/validation/catalog.ts)
- [Form compiler](../src/compiler/compiler.ts)
- [Runtime regressions and checked fixtures](../src/validation/relative-dependencies.test.ts)
- [Computed design indicator test](../components/v1/StudioDesignFeatures.test.tsx)
- [Existing executable export safeguards](../src/projects/artifacts.test.ts)

## S2 custom fields and composition

`@stages/authoring` now separates serializable descriptors, trusted field and
behavior bindings, and opaque framework view tokens. Studio hosts resolve fields
with `resolvePortableFields` and inject them with `StudioV1Editor.customFields`.
Custom props use a validated JSON inspector that commits on blur. Missing preview
components are visible errors; missing production bindings prevent loading.
The export bundle retains portable JSON even when executable integration still
needs host bindings. Built-in workflows and the S1 contact artifact are unchanged.

The [custom field fixtures](../../packages/authoring/test/fixtures/custom-form-v1.json)
cover structured money/person values, nullable numbers, async JS validation and
transforms. [Adapter tests](../../packages/authoring/test/adapters.test.mjs) render
contact and custom fields with all four adapters, native and React Bootstrap
components, and custom layouts. These also run against installed Stages tarballs;
framework/test peers in that frontend check reuse the repository installation.
The Node semantic consumer installs only core and authoring without those peers.
[Studio tests](../components/v1/StudioCustomFields.test.tsx) cover insertion,
export, props, native/application previews and compilation identity.

S3 now adds authoritative server decoding. This does not implement custom bulk-property
editing, full Event Launch parity, or automatic deployment fingerprints. Host-only
composition requires a distinct schema ID/version and a recorded deployment
contract; referenced behavior changes also require an explicit compatibility
choice. See the [public reference](../../docs/content/reference/authoring.mdx).

## S3 submission policy

The same exported contact/custom artifacts run through the installed Node
submission matrix. All declared values are required and validated regardless of
UI visibility, disabled state or structural presence. Use validator conditions
for conditional business applicability. Missing/extra/malformed values fail
decoding; failed/unavailable services, pending work and cancellation never accept.
The host supplies an approved revision and exact semantic bindings. Full Event
Launch parity is covered by S4 below; durable fingerprints/resource isolation remain S5 work.

## S4 full Event Launch

[The full capstone ledger](EVENT_LAUNCH_CAPSTONE.md) now covers all canonical stages,
scoped rules, aggregate issues, custom number/money contracts, context-driven
compliance, transforms, service failures and persistence. The exported artifact
is checked against actual Studio output, then loaded by installed Node and four
adapter consumers. Host behavior and view registrations are explicit requirements.
The complete-value submission policy remains stricter than permissive UI values.
S5 accessibility, resource and durable-release gates remain open.


## S5 durable releases

The optional authoring API now supplies immutable content-addressed release wrappers,
explicit compatibility decisions and exact-release full-envelope state migration.
Contact and full Event Launch exercise them in workspace/Studio and installed Node
consumers. Preview and export both bound the fully expanded graph to 1,000 nodes.
A tested application-owned worker recipe supplies hard synchronous server deadlines.
Studio production publication, generated release scaffolding, exact-identity
standard compilation caching and full scale/resource/browser gates are implemented
and release-verified. Custom executable bindings still compile per request. Only
manual authoring and accessibility sessions remain before portable beta; see
[PORTABLE_RELEASE_GATES.md](PORTABLE_RELEASE_GATES.md).
