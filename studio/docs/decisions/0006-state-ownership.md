# ADR 0006: State lifecycles have separate owners

- Status: Accepted
- Date: 2026-09-04

## Context

The POC persists document input, selection, panels, clipboard, preview value,
snapshots, fieldsets, and history in one Zustand record.

## Decision

Project documents, session workbench state, document history, preview
scenarios, controller runtime state, and platform state have explicit separate
owners. Only the project repository owns durable documents. The preview owner
retains canonical controlled values and explicitly accepts controller proposals.

## Consequences

Selection never enters domain data. Controller serialization is limited to a
preview/test session. Document and preview histories remain independent, and
project persistence is not coupled to Zustand or React.
