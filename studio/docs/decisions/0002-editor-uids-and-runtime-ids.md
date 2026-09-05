# ADR 0002: Editor UIDs and runtime IDs are separate

- Status: Accepted
- Date: 2026-09-04

## Context

Dotted runtime paths are unstable under rename, reorder, repeated collection
rows, fragment expansion, and cross-document references.

## Decision

Every editable entity receives an immutable Studio UID. Runtime IDs define
Stages data-path segments and are assigned when nodes are created. Selection,
history, drag state, and diagnostics use UIDs. Expression references currently
retain their explicit paths; semantic references remain planned work.

## Consequences

Runtime-ID changes are semantic refactors with dependency analysis and an
explicit data-migration policy. The compiler maps UIDs to emitted runtime paths
and addresses. Copy, detach, and duplicate operations allocate new UIDs.

## Current rename boundary

The P0 implementation rejects changes to existing runtime IDs through
`node.update` and `fragment.node.update` with
`command.runtime-id-refactor-required`. Removing an ID is also rejected. For
fragment instances, adding, replacing, or removing an override that changes the
effective runtime ID receives the same failure. Supplying an unchanged ID and
editing labels or other presentation properties remains supported.

Rejection is atomic: the project, expressions, scenario values, schema version,
and history remain unchanged, including when a rename is nested in a transaction.
The inspector displays existing runtime IDs and fragment definition IDs as
read-only with an explanation. Absence of local references is not proof that
external consumers or saved values are compatible with a rename.

This is a safe rejection, not the full refactor transaction. Creating nodes,
importing documents, moving/wrapping/converting structure, and fragment creation
retain their existing semantics. Reference-aware structural edits and migration
decisions remain P1 work; publication compatibility checks are a separate gate.

Evidence: `studio/src/commands/commands.test.ts` and
`studio/components/StudioEditorPage.test.jsx`.
