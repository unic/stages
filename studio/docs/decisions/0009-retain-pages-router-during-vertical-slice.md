# ADR 0009: Retain the Pages Router during the vertical slice

- Status: Accepted
- Date: 2026-09-04

## Context

The Studio POC uses the Next.js Pages Router. Changing routers does not prove
the new document, command, compiler, preview, or repository boundaries and
would broaden the migration risk.

## Decision

Keep the existing Pages Router through Sessions 03–09. New domain modules must
remain router-independent. Reassess routing only after the new end-to-end text
field slice passes its browser journey.

## Consequences

Session 09 integrates through existing routes. This decision does not promise
that Pages Router is permanent; any later migration is a separate change with
current Next.js documentation and build evidence.
