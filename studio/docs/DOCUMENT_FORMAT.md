# Studio project document v1

Status: implemented initial contract for Session 04

Date: 2026-09-04

The Studio project document is the versioned, JSON-safe editable source. It is
not a Stages controller serialization envelope and contains no executable code.
The declarations and executable contract live in `studio/src/document/`.

## Minimal v1 shape

The envelope identifies itself with `format: "stages-studio"` and
`formatVersion: 1`. It contains project metadata, normalized forms, reserved
fragment storage, and JSON-safe resources.

Each form has a stable UID, runtime schema identity/version, an ordered root UID
list, a normalized node map, named scenarios, and settings. The initial node
union contains groups with ordered child UID references and fields with an
exact trusted-definition key/version requirement. Scenarios keep preview value,
context, and extensions separate from the project and controller runtime state.

Every editable entity UID is globally unique in a project. Map keys must equal
the entity UID. Runtime IDs remain separately editable and reject the unsafe
object keys `__proto__`, `prototype`, and `constructor`.

## Opening and validation

`openStudioProject()` is the only import pipeline:

1. enforce the encoded size limit before parsing text;
2. parse JSON and reject non-JSON values, object cycles, non-plain objects,
   non-finite numbers, and unsafe keys before copying input;
3. apply every ordered format migration to v1;
4. validate the v1 envelope, normalized maps, UID uniqueness, node references,
   graph ownership/cycles/depth, scenarios, and exact supported definition
   versions; and
5. return a detached, deeply frozen document or path-addressed diagnostics.

The default defensive budgets match the accepted local-beta targets: 5 MiB,
50 forms, 1,000 nodes per form, 10,000 nodes per project, 50 scenarios per
form, and graph depth 50. Callers may lower limits for constrained contexts;
raising product limits requires review against the product gates.

Arbitrary JSON resources and scenario values also have a defensive nesting
limit of 100 so valid input can always be cloned and canonically serialized
without recursive-parser exhaustion.

`supportedDefinitions` is supplied by the trusted registry boundary. A field
requiring an absent key or version is rejected; omitting the catalog means no
field definitions are supported. The document never silently upgrades a field
definition.

## Migration policy

Format migrations are pure, ordered, one-version steps. Each step has a stable
ID, never mutates its input, and must have a historic input fixture plus an
exact current-format golden fixture. Opening fails when any version in the
chain is unknown; skipping directly to the current version is forbidden.

The initial `studio-project-0-to-1` migration records the pre-v1 spike as
migration evidence. It renames project `locale` to `defaultLocale` and adds the
empty scenarios, settings, fragments, and resources containers required by v1.
It does not infer fields, change runtime IDs, or change form schema versions.

A future format change must:

- add the new declaration without weakening the prior decoder;
- append exactly one migration step and retain all historic steps;
- add golden direct and full-chain round trips;
- preserve the sole recoverable project copy before repository replacement;
- report lossy behavior rather than silently discarding data; and
- keep `formatVersion`, form `schemaVersion`, and repository revision separate.

`serializeStudioProject()` recursively sorts object keys, preserves array order,
uses stable indentation, and ends with one newline. Therefore opening a valid
document and repeatedly serializing it is deterministic.

## Diagnostic responsibilities

Document diagnostics have stable codes, error severity, source `document`, and
an exact property path. Form/entity UIDs are included when available. Import,
recovery, compiler, and Problems-panel code should branch on codes and paths,
not message text.

Fragments remain an empty reserved object in this minimal contract. Their
graph, parameters, instances, and version rules require an explicit later
format migration rather than accepting an underspecified shape now.

## Evidence

- `studio/src/document/document.test.ts`
- `studio/src/document/fixtures/project-v0.json`
- `studio/src/document/fixtures/project-v1.json`
- ADR 0001 (declarative source) and ADR 0002 (UID/runtime identity)
- `studio/docs/PRODUCT_GATES.md`
