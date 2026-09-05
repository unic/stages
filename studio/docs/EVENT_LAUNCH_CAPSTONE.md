# Event Launch capstone

Status: Session 28 started; agenda slice checked, full capstone incomplete.

For Studio maintainers and authors testing advanced collection workflows.
The canonical behavioral design remains in
[`examples/shared/event-launch`](../../examples/shared/event-launch/).

## Try the checked project

Import [`event-launch-agenda.json`](../src/document/fixtures/event-launch-agenda.json)
through Studio's canonical project JSON import, then select the **Canonical
agenda** scenario in Test mode. The project contains a venue-capacity stage and
an agenda stage with a discriminated collection: session, workshop, and break.
Its initial agenda and venue capacity are checked against the shared example
fixture. Enter a workshop in Test mode, then change venue capacity to test the
cross-field upper bound.

This is a venue-capacity and agenda project with schema ID `studio-event-launch-agenda`.
Its envelopes are not interchangeable with the full `event-launch` schema.
The fixture is editable document v1 JSON, not generated TypeScript or an import
of executable callbacks. No application package or framework example changed.

## Executable capability ledger

[`event-launch-agenda.test.ts`](../src/runtime/event-launch-agenda.test.ts)
runs matching steps against the Studio preview and the canonical schema using
the shared field contract and agenda-item factory. It compares selected
observable semantics rather than framework view tokens or the full wizard.
The test belongs to the existing `npm --prefix studio run test:v1` gate.

| Capability | Current evidence and boundary |
| --- | --- |
| Portable authoring | Validated JSON, serialize/load round trip, compiler with no diagnostics, canonical initial agenda |
| Variant structure | All three variants; matching field order, type, label, minimum prop, value, path, and address |
| Controlled ownership | Add and field input remain proposals until acceptance; rejected movement retains accepted rows |
| Collection identity | Add, move, sort, and same-key variant replacement preserve matching row IDs and addresses |
| Validation | Positive duration rule matches canonical code, severity, and exact row path for each variant |
| Workshop capacity | Finite numeric cases match canonical code, message, severity, and row path: positive capacity bounded by the current venue capacity; equality is allowed |
| Cross-field dependencies | Accepted venue-bound changes discard obsolete capacity issues; pending venue proposals do not change the accepted validation result |
| Diagnostic navigation | Minimum-row removal is rejected in both runtimes; Studio maps `collection.min` to the collection UID |
| Persistence | Touched state and row identities survive serialize/recreate using each schema's own envelope |
| Wizard navigation | Not covered: only venue capacity and agenda are present; full navigation policies remain outstanding |
| Packed/generated consumer | Not covered: comparison consumes shared example source and public core APIs inside the repository |

## Gaps and next work

| Gap | Required follow-up |
| --- | --- |
| Extensible fields | Studio's catalog cannot bind the shared `money` definition. Establish the descriptor/binding contract from P1a before adding tickets. |
| Optional numeric drafts | Shared numbers accept `undefined`; Studio numbers require finite numeric payloads. Add explicit empty-value/codec support and equivalence evidence. |
| Field presentation | Shared numeric `suffix` and other domain props are not reproduced by this fixture; extend descriptors and view bindings. |
| Aggregate agenda validation | Canonical uniqueness normalizes title/label across variants and reports per-row paths; warnings also inspect duration/capacity. The current catalog's simple uniqueness rule is not an equivalent replacement. |
| Optional venue/workshop capacity | The checked rule covers finite numeric data. Canonical optional-number behavior still needs descriptor/codec support and equivalent missing-value handling. |
| Full wizard | Add basics, venue, streaming, tickets, compliance, and review, including dynamic stages, guards, localization, and template transforms. |
| Trusted async services | Adapt canonical deterministic service behavior through explicit Studio bindings and compare cancellation outcomes. No async behavior is claimed for the agenda fixture. |
| Production handoff | Run shared scenarios against packed generated artifacts once executable behavior export and bindings support the full document. |

These gaps keep Session 28 and Gate D open. Sessions 29–31 still require their
accessibility, performance/security, and beta-cutover work. No coverage status
for the full Event Launch capstone is marked complete.

The capacity rule uses two declarative validators: a positive-value comparison
and a venue-bound comparison applied only to positive workshop values. Their
explicit rule IDs differ from the canonical single callback ID; tests compare
the user-facing issue code, message, severity, and path, with exactly one issue
for each checked invalid input. Both rules declare the venue-capacity dependency.
No schema, compiler, or public runtime contract was extended for this slice.

Next: establish shared field descriptors and executable bindings, then expand
this checked project and its comparison journeys without weakening the ledger.

## Evidence

- [Canonical schema](../../examples/shared/event-launch/schema.ts)
- [Shared fields](../../examples/shared/event-launch/field-contract.ts)
- [Canonical behavior journeys](../../examples/shared/event-launch/test/behavior-contract.test.mjs)
- [Domain validation rules](../../examples/shared/event-launch/validators.ts)
- [Workflow improvements plan](../../docs/V1_STUDIO_LIBRARY_WORKFLOW_IMPROVEMENTS_PLAN.md)
