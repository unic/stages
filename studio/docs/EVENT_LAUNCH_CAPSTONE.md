# Event Launch capstone

Status: S4 implementation and release verification complete. S5 and the portable
beta gate remain open.

For Studio maintainers and application hosts. The canonical code-authored
[Event Launch domain](../../examples/shared/event-launch/) remains unchanged and
independent of the optional authoring package.

## Full portable project

Import [event-launch.json](../src/document/fixtures/event-launch.json) in a Studio
host registered with the shared [descriptors and behavior bindings](../../examples/shared/event-launch/portable.mjs).
Supply `customFields.fields`, `customFields.views` and `customFields.behaviorBindings`.
The host owns components and executable callbacks; neither is recovered from JSON.
Select **Canonical Event Launch** in Test mode. The scenario includes JSON context
and values; production export uses empty defaults independently of scenarios.

The project has schema ID `portable-event-launch`, distinct from both the original
`event-launch` code-authored schema and the earlier `studio-event-launch-agenda`
subset. Runtime envelopes are not interchangeable. Optional canonical numbers use
undefined in code and null in portable JSON, through explicit host conversion.
Money retains canonical decimal major units; S2's separate money fixture uses
integer minor units. Row IDs are declared, nonempty unique string transport keys.

The full portable graph is maintained from the canonical schema by
[`scripts/event-launch-portable.mjs`](../../scripts/event-launch-portable.mjs).
Build packages/shared examples, then run it with `--update` after intentional
canonical changes. Package verification runs it in check mode. JSON is editable
in Studio; fixture regeneration is a maintainer workflow, not a runtime requirement.

## Executable ledger

The [shared journeys](../../examples/shared/event-launch/portable-journeys.mjs)
compare code-authored and portable validation, and run authoritative submissions.
The [Studio test](../src/runtime/event-launch-portable.test.ts) adds actual preview
hosts and compares the export bundle byte-equivalent JSON. The same journeys run
with only installed core/authoring packages and copied application host modules.
Four installed adapters load the full artifact with independent components; their
rendering tests cover the integration boundary while the shared journeys cover
all domain rules.

| Capability | Evidence |
| --- | --- |
| Full structure | Basics, venue, streaming, agenda, tickets, compliance and review; nested groups and all three agenda variants |
| Context and presentation | Compliance factory changes; localized help/confirmation props; custom choice/number/money props and views |
| Business validation | Required strings, slug syntax/availability, dates, HTTPS URL, recording consent, venue/workshop capacity, ticket rules and review confirmation |
| Aggregates | Original canonical normalized cross-variant duplicate-title and duplicate-tier callbacks; exact row issue code/path/message/severity and warnings |
| Applicability | Original predicates retained as explicit business validator conditions; display visibility/disabled state is independent of server acceptance |
| Controlled changes | Delayed acceptance, blur trim, conference template proposals; no automatic owner acceptance |
| Collections | Add, move and same-key variant replacement; stable row identity; strict declared transport keys |
| Wizard | Scoped validation before navigation; original wizard policy and guard bindings; dynamic compliance stage |
| Services | Original deterministic slug callback via exact domain binding; unavailable execution and cancellation cannot accept |
| Persistence | Portable values serialize/recreate under their own schema identity |
| Authoritative decoding | Wrong/extra values, duplicate row IDs and computed inconsistencies rejected; server-owned context/bindings/revision |
| Installation | Workspace and isolated packed Node journeys; installed DOM/React/Vue/Angular rendering; no Studio/framework dependency in the server consumer |

S3's strict complete-value policy still applies. All declared keys and collection
bounds are required even for inactive UI sections. A hidden empty collection below
its declared minimum can be UI-valid and still fail authoritative shape decoding.
Business conditions do exempt inactive business rules; they do not make malformed
transport acceptable. Unknown context/privilege fields are never accepted as values.

## Remaining boundaries

Computed expressions have their own runtime/type/Studio tests for dependency
ordering, row occurrences, cycles, proposal ownership and submission consistency.
They are not needed to replace any canonical Event Launch rule. Trusted scoped
validators supply the bounded fixture's aggregate behavior; no unrestricted
expression-language aggregation was introduced.

Row-dependent structural presence and fragment parameters remain reserved. S5
still owns durable fingerprints/migrations, expanded-work and synchronous resource
isolation, accessibility sessions and the complete portable beta release gate.
The original [agenda-only fixture](../src/document/fixtures/event-launch-agenda.json)
and [regressions](../src/runtime/event-launch-agenda.test.ts) remain valid evidence
for that earlier bounded slice; they are not relabeled as the complete form.

Next: record the remaining manual authoring and accessibility beta sessions.


S5 now adds a content-addressed release transition to the shared portable journeys.
A presentation-only upgrade preserves the complete serialized baseline, collection
keys, wizard position and touched state before recreation. Installed core/authoring
consumers run the same assertions. See [the S5 evidence ledger](PORTABLE_RELEASE_GATES.md)
for the remaining manual beta gates. S5 code and automated verification are complete.
