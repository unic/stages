# Studio project document v1

Status: implemented through Session 19

Date: 2026-09-04

The Studio project document is the versioned, JSON-safe editable source. It is
not a Stages controller serialization envelope and contains no executable code.
The declarations and executable contract live in `studio/src/document/`.

## Minimal v1 shape

The envelope identifies itself with `format: "stages-studio"` and
`formatVersion: 1`. It contains project metadata, normalized forms, reusable
fragment storage, and JSON-safe resources.

Each form has a stable UID, runtime schema identity/version, an ordered root UID
list, a normalized node map, named scenarios, and settings. The node union
contains fields, presentation blocks, groups, collections, wizards, stages,
variants, and linked fragment instances.
References keep every recursive structure normalized. Fields and blocks carry
exact trusted-definition key/version requirements. Safe behavior is stored as
a declarative expression AST; executable functions never enter the document.
Scenarios keep preview value, context, and extensions separate from the project
and controller runtime state.

Expressions use a closed set of literal, reference, unary, binary, and
conditional nodes. References can read form value, current-row value, context,
extensions, and runtime metadata through safe own-property paths. Evaluation is
synchronous and bounded by node, depth, path, string, and step budgets. Missing
references, operand type mismatches, non-finite arithmetic, and limit failures
return typed failures rather than throwing. The evaluator never calls document
code, accessors, network APIs, or mutation APIs. Canonical expression JSON,
stable dependency lists, and a readable text projection are available from
`studio/src/expressions/`.

Node behavior distinguishes `when`, which retains an ordinary node as dormant,
from `presentWhen`, which conditionally omits the node from schema-factory
output. `disabled` accepts a static boolean or expression and inherits through
the runtime tree. Fields may map individual `derivedProps` keys to expressions;
the compiler evaluates them through the same bounded expression contract.

Named scenarios own their value, context, and JSON-safe extension/feature state.
They may also own transport-free deterministic async-service outcomes for local
preview. Async validators store only exact-version named service references and
safe request expressions. Executable bindings, endpoints, credentials, retry
policy, and caches remain environment-owned and outside this document.
Scenario insertion and editing use document commands and therefore participate
in undo, redo, dirty tracking, and local persistence. Studio registers only
local JSON identity codecs for scenario extension namespaces; generated
applications remain responsible for their trusted production extension codecs.

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
50 forms, 100 fragments, 1,000 nodes per form or fragment, 10,000 nodes per
project, 50 scenarios per form, and graph depth 50. Callers may lower limits for constrained contexts;
raising product limits requires review against the product gates.

Arbitrary JSON resources and scenario values also have a defensive nesting
limit of 100 so valid input can always be cloned and canonically serialized
without recursive-parser exhaustion.

`supportedDefinitions` is supplied by the trusted registry boundary. A field or
presentation block requiring an absent key or version is rejected; omitting the
catalog means no definitions are supported. The document never silently
upgrades a definition.

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

## Reusable fragments

`fragments` is a UID-keyed map of explicit resources. A definition owns a
title, positive version, declared parameter names, ordered root UIDs, and a
normalized node graph. Definition and node UIDs remain globally unique across
the project. A node with `kind: "fragment"` stores its local runtime ID, the
definition UID, and optional overrides keyed by definition-node UID.

Validation rejects unresolved references, unsafe IDs, malformed definitions,
unreachable definition nodes, and direct or indirect fragment cycles. A
fragment instance is a leaf in the editable form graph; it never makes the
same definition node acquire multiple document parents.

Compilation expands each instance purely and deterministically into an
ordinary group and ordinary supported descendants. The local instance runtime
ID scopes its values, so the same definition can be used more than once in a
form without runtime-path collisions. Ephemeral descendant UIDs are stable per
instance and are not persisted. Source-map entries and compiler diagnostics
retain the definition UID, source node UID, and instance chain.

Definition edits update every linked instance. Declared instance overrides are
applied without mutating the resource. Detach replaces the selected instance
with a local group and newly allocated local copies while preserving its
runtime shape and overrides; the resource itself remains unchanged. Nested
fragment instances, when present in a detached definition, keep their own
independent links.

## Evidence

- `studio/src/document/document.test.ts`
- `studio/src/document/fixtures/project-v0.json`
- `studio/src/document/fixtures/project-v1.json`
- ADR 0001 (declarative source) and ADR 0002 (UID/runtime identity)
- ADR 0004 (compiler source maps and fragment provenance)
- `studio/docs/PRODUCT_GATES.md`
