# Portable-form capability status

For Studio authors and compiler maintainers. Prerequisite: the
[document format](DOCUMENT_FORMAT.md) and the
[portable-form implementation plan](../../docs/V1_PORTABLE_FORM_SUCCESS_PLAN.md).

Document acceptance means a project can be preserved, not that all its behavior
can execute. The production loader and authoritative server validator described
in the plan are still unimplemented. Direct code-authored core schemas remain
supported independently of this document layer.

| Capability | Stored document | Studio editing | Preview | Executable export | Authoritative server |
| --- | --- | --- | --- | --- | --- |
| Built-in fields and static structure | Accepted | Supported | Supported | Existing static subset | Not implemented |
| Required, comparison, range, conditional validation | Accepted | Supported | Supported | Rejected until shared loader exists | Not implemented |
| Row/item validator dependencies | Accepted | Supported | Conservative outer-collection invalidation | Rejected until shared loader exists | Not implemented |
| Context/interface and extension validation dependencies | Accepted | Supported | Host updates invalidate results | Rejected until shared loader exists | Not implemented |
| Interaction metadata or event references in validators | Preserved | Not offered | Compile error | Rejected | Not implemented |
| Derived presentation props | Accepted | Supported | Supported | Rejected until shared loader exists | Not applicable |
| Persisted `computed` expression | Preserved | Removal only | Compile error | Rejected | Not implemented |
| Row/item-dependent structural presence | Preserved | Not offered | Compile error | Rejected | Not implemented |
| Fragment parameter names | Preserved, reserved | Not offered | No argument semantics | No argument semantics | Not implemented |

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
Explicit validation always uses accepted data. Existing core dispatch may clear
cached results while evaluating an unaccepted proposal, even for submit-only
validators; retaining that cache across all proposal policies remains an open
S0 requirement. No proposal is silently accepted by this compiler change.

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

Next: complete the remaining S0 ownership requirement, then implement the S1
shared loader and installed contact-form consumer described in the plan.

## Evidence

- [Validator compiler](../src/validation/catalog.ts)
- [Form compiler](../src/compiler/compiler.ts)
- [Runtime regressions and checked fixtures](../src/validation/relative-dependencies.test.ts)
- [Computed design indicator test](../components/v1/StudioDesignFeatures.test.tsx)
- [Existing executable export safeguards](../src/projects/artifacts.test.ts)
