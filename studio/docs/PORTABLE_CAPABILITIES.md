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
| Built-in fields and static structure | Accepted | Supported | Supported | Shared loader + existing static subset | Not implemented |
| Custom money, composite and nullable-number fields | Exact host references; portable descriptors | Host palette and structured props inspector | Host component map | JSON + trusted field bindings | Decoder not implemented |
| Custom JS validators/transforms | Portable exact references and JSON config | Host integration | Public compiler/loader bindings | Trusted behavior bindings; hybrid composition | Same bindings required; decoder not implemented |
| Component and layout replacement | Optional neutral render plan | Host-supplied preview views | Independent of semantics | DOM, React, Vue, Angular bindings; generated App remains a scaffold | Views not required |
| Required, comparison, range, conditional validation | Accepted | Supported | Supported | Shared loader | Not implemented |
| Row/item validator dependencies | Accepted | Supported | Conservative outer-collection invalidation | Shared loader | Not implemented |
| Context/interface and extension validation dependencies | Accepted | Supported | Host updates invalidate results | Shared loader | Not implemented |
| Interaction metadata or event references in validators | Preserved | Not offered | Compile error | Rejected | Not implemented |
| Derived presentation props | Accepted | Supported | Supported | Shared loader | Not applicable |
| Persisted `computed` expression | Preserved | Removal only | Compile error | Rejected | Not implemented |
| Row/item-dependent structural presence | Preserved | Not offered | Compile error | Rejected | Not implemented |
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

Computed values remain reserved. The inspector does not offer an enable switch;
imported expressions show an unsupported indicator and can be removed. The
compiler preserves `compiler.unsupported-computed` and identifies the property,
with guidance to use explicit event transforms for persisted changes or derived
props for presentation. These are alternatives with different semantics, not
automatic computed-expression migrations.

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
Launch parity and durable fingerprints/resource isolation remain S4/S5 work.
