# ADR 0004: Compilation emits bidirectional source maps

- Status: Accepted
- Date: 2026-09-04

## Context

Compiler and runtime diagnostics identify emitted paths and node addresses,
while editor interactions identify normalized document entities and fragment
provenance.

## Decision

Every successful compile emits an immutable source map between Studio UIDs and
runtime paths/addresses. Fragment expansion records definition and instance
provenance. Lookups are indexed in both directions. Reverse indexes retain
multiple candidates when variants share a static path or address. Entries carry
all enclosing variant conditions; resolving an occurrence uses its accepted row
value. The single-UID convenience indexes omit qualified or ambiguous entries.
Missing discriminator evidence must not select an arbitrary definition.

## Consequences

Problems can navigate to document entities and runtime rows can select their
schema source. Source-map entries are compilation artifacts, not persisted
document identity, and do not require core internals.
