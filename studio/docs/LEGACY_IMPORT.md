# Legacy Studio import

Status: implemented through Session 15

Date: 2026-09-04

The POC configuration is accepted only through the one-way importer in
`studio/src/legacy/`. The importer produces a validated, deeply frozen Studio
project document and structured migration diagnostics. It does not import the
historical root runtime or call the frozen live-preview converter.

## Imported behavior

The importer converts all five fingerprinted templates and both observed
fieldset encodings. It preserves:

- form title, slug, locale, status, date, and other JSON-safe metadata;
- field and presentation-block definition keys plus component props;
- groups, collections, wizard stages, root/child ordering, layout, labels, and
  secondary text;
- required rules, disabled state, initial collection rows, and min/max values;
- supported visibility and computed-value expressions as a declarative AST;
- current preview data as a named scenario, separately from form structure;
  and
- fieldset provenance as migration metadata on linked fragment instances.

The explicit fieldset form uses `{ type: "fieldset", fieldset: "address" }`.
The POC form uses `{ type: "address" }`, where the type names a fieldset. Both
create one explicit fragment definition per legacy fieldset, remove the
duplicated wrapper group found in frozen definitions, and create linked
instances for every use. Multiple legacy uses therefore share one imported
definition while retaining their local runtime IDs and observed encoding as
migration provenance.

## Expression safety

The restricted parser accepts literals, `data`, `itemData`, and
`interfaceState` property references, unary not/negation, arithmetic,
comparisons, strict equality, boolean operators, parentheses, and conditional
expressions. Property paths reject prototype-related keys.

Calls, assignment, computed access, arbitrary identifiers, and all other
JavaScript syntax are rejected. Unsupported strings and function source are
stored only under `legacy.unsupportedExpressions` and produce a
`legacy.expression.unsupported` error. Import never evaluates that source.

Other non-JSON values are dropped with diagnostics. Dates normalize to ISO
strings, non-finite numbers are rejected, and unsafe object keys are discarded.
Import does not silently turn executable component props into trusted bindings.

## Live migration flag

Set `NEXT_PUBLIC_STUDIO_DOCUMENT_V1=1` to make the live editor import its
current config, fieldsets, metadata, and preview data during startup. The
result is exposed through `StudioDocumentStartup`, with
`data-studio-startup="document-v1"` on the provider boundary.

The existing preview continues to use the frozen `legacyConfig.mjs` adapter
until the document compiler lands. That file remains comparison evidence and
was not changed by this slice. The flag therefore proves safe document startup
without prematurely removing the working editor or executing imported text.

## Diagnostics

Importer diagnostics have stable codes, severity, source paths, and entity
UIDs where available. Errors identify unsupported behavior or missing
definitions; warnings identify deterministic lossy normalization. A valid
document may accompany migration errors so the Problems surface can guide a
user without executing or silently discarding the retained source.

## Evidence

- `studio/src/legacy/importer.test.ts`
- `studio/src/expressions/legacy-parser.test.ts`
- `studio/components/configTemplates/legacyFixtures.test.js`
- `studio/components/v1/legacyConfig.test.mjs`
- ADR 0008 (legacy configuration is isolated to import)
