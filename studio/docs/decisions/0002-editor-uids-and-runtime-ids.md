# ADR 0002: Editor UIDs and runtime IDs are separate

- Status: Accepted
- Date: 2026-09-04

## Context

Dotted runtime paths are unstable under rename, reorder, repeated collection
rows, fragment expansion, and cross-document references.

## Decision

Every editable entity receives an immutable Studio UID. User-editable runtime
IDs continue to define Stages data-path segments. Selection, history, drag
state, diagnostics, references, and future comments use UIDs.

## Consequences

Runtime-ID changes are semantic refactors with dependency analysis and an
explicit data-migration policy. The compiler maps UIDs to emitted runtime paths
and addresses. Copy, detach, and duplicate operations allocate new UIDs.
