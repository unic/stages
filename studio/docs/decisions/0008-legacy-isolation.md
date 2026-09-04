# ADR 0008: Legacy configuration is isolated to import

- Status: Accepted
- Date: 2026-09-04

## Context

The POC persists a 0.x-shaped array and converts it on the live preview path.
Keeping that shape in the new editor would preserve unsafe expressions and
prevent complete v1 authoring.

## Decision

Legacy templates, the old local-storage record, and both observed fieldset
encodings enter through a one-way importer. After import, Studio edits only the
new document. Frozen fixtures and migration diagnostics remain after cutover.

## Consequences

No new module imports the root historical runtime. Unsupported behavior is
reported rather than executed or silently discarded. The old editor remains
available only behind a development comparison flag until the vertical slice
passes its parity gate.
