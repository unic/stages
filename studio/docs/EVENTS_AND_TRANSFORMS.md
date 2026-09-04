# Events, reducers, transforms, and patches

Status: implemented for Session 20

Date: 2026-09-04

Studio persists behavior as inert JSON. Named event definitions describe an
event name, a form or node target, optional source metadata, and an optional
safe payload expression. Field reducers and node/form transforms use ordered
rules with a non-empty event policy, an optional safe predicate, and ordered
`set` or `remove` patch actions. No project value contains executable code.

Patch targets are either the current event target or a Studio node UID. The
compiler resolves UIDs to runtime paths and reports
`compiler.invalid-patch-target` before preview when a target is missing or is
not a data-bearing runtime node. A named event has the same compile-time target
check. When a target is inside a collection, the compiler rehydrates the live
row indexes from the dispatched event path so a picked sibling remains in the
same row.

Authored field reducer metadata compiles to an instance-specific public
`FieldDefinition`. It runs before the registry field's normal reducer and
falls back to that reducer when no authored rule matches. Node and form rules
compile to public `TransformConfig` entries. Core therefore retains ownership
of atomic application, target-to-root transform ordering, sequential
last-writer-wins behavior, batching, diagnostics, and `StagesChange` records.

## Preview workflow

The form inspector authors named events and root transforms. Eligible node
inspectors author transforms, and field inspectors additionally author field
reducers. Target controls use node references rather than freehand runtime
paths; set values and predicates use the bounded expression editor, including
read-only event name, source, and payload references.

Test mode can dispatch a named event once or twice in one batch. Its transaction
panel shows the pipeline and exact ordered patch list. The proposal owner can
accept or reject proposals, preserving the controlled-value boundary while
authors inspect the transaction.

## Evidence

- `studio/src/document/types.ts` and `studio/src/document/validation.ts`
- `studio/src/logic/compiler.ts` and `studio/src/logic/logic.test.ts`
- `studio/src/compiler/compiler.ts`
- `studio/components/v1/StudioLogicEditor.tsx`
- `studio/components/v1/StudioV1Editor.tsx`
