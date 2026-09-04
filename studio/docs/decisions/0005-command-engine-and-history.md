# ADR 0005: Every document edit is an immutable command

- Status: Accepted
- Date: 2026-09-04

## Context

POC handlers mutate cloned nested objects through multiple paths. History omits
some visible edits and has no uniform validation or transaction boundary.

## Decision

UI surfaces dispatch typed commands to one browser-free immutable engine. The
engine checks preconditions and graph invariants, reports affected UIDs and
typed failures, and commits transactions atomically. History stores labeled,
bounded checkpoints or reliable inverses and supports deliberate coalescing.

## Consequences

Components never mutate the project object. Workbench selection and preview
data are not changed implicitly by document commands. Pointer, keyboard, menu,
and shortcut actions converge on the same command semantics.
