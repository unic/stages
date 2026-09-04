# ADR 0001: The declarative document is the editable source

- Status: Accepted
- Date: 2026-09-04

## Context

A Stages schema may contain executable factories, predicates, validators,
reducers, transforms, guards, and key functions. Executable values are unsafe
and unsuitable for JSON storage, undo history, imports, or future collaboration.

## Decision

Studio persists a versioned, JSON-safe project document. A pure compiler turns
one form into a public v1 schema, field registry, render plan, source map, and
diagnostics. Generated TypeScript and React are one-way exports, never a second
editable source.

## Consequences

The document format needs its own migrations and validation. Runtime functions
come only from trusted registries or compiled declarative behavior. Studio must
not persist a controller serialization envelope as a project document.
