# Advanced collection and wizard policies

Status: implemented for Session 21

Date: 2026-09-04

Studio Test mode exposes every public collection command without bypassing the
controlled-value handshake. A row can be replaced from JSON, duplicated,
moved, or removed through its stable row address; a collection can be reversed
through `collection:sort`; and discriminated collections retain one add control
per visible variant. Collection summaries show the live scope, size,
capabilities, current indexes, and stable row keys.

The collection inspector explains the tradeoff between engine-owned row keys
and property keys. Property keys must be present, unique, stable, and
non-sensitive. Runtime diagnostics are visible in Test mode, including
`schema.item-key-failed` and `schema.duplicate-row-key`; invalid row branches
remain omitted according to the core snapshot contract.

Wizard guards are stored as safe expression ASTs. The compiler turns the AST
into the public synchronous guard callback and exposes the transition as
`event.from` and `event.to`; it rejects missing references, non-boolean results,
and all ordinary guard failures through core's navigation diagnostic behavior.
No executable function is persisted in the Studio document.

For `validateCurrent`, Test mode validates and reveals the active stage scope
before dispatching navigation. It only dispatches after a `valid` result, while
core still rechecks cached validation and the guard in the command transaction.
Each wizard occurrence shows its active stage, dynamic visible stages, scoped
validation status, and an adapter-only route selector. Applying a simulated
route dispatches the same `wizard:go` event and never writes routing state into
domain data or the project document.

## Evidence

- `studio/src/document/types.ts` and `studio/src/document/validation.ts`
- `studio/src/compiler/compiler.ts` and `studio/src/compiler/compiler.test.ts`
- `studio/components/v1/StudioV1Editor.tsx`
- `studio/components/v1/StudioV1Editor.test.tsx`
- `packages/core/src/controller.ts` and `packages/core/src/schema.ts`
