# ADR 0003: Shared documents contain no executable JavaScript

- Status: Accepted
- Date: 2026-09-04

## Context

The POC evaluates visibility and computed-value strings with `new Function`.
Opening an imported or shared project must not execute document-provided code.

## Decision

Common behavior is represented by a bounded, serializable expression AST.
Capabilities that require host code refer to versioned, named bindings in a
trusted registry outside the document. The normal editor never uses `eval`,
`new Function`, or project-selected module paths.

## Consequences

Legacy expressions are parsed only when they match supported syntax. Other
source is retained as inert migration metadata with an error. A future trusted
developer workspace is a separate security boundary, not a document feature.
