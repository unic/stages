# Portable release evidence

The S5 code and complete automated release gate passed on 2026-09-05 (Node 24.15.0).
Manual product gates remain open; this ledger does not declare portable beta complete.

## Automated evidence

- `packages/authoring/test/releases.test.mjs`: deterministic artifact/compiler/binding/
  policy identity, tampering and mismatch rejection, explicit conservative compatibility,
  ordered complete-state transitions, dirty baseline, extensions, rejected proposals,
  failure recovery, and submission revision pinning. The same tests run in the isolated
  core/authoring tarball installation.
- `examples/shared/event-launch/portable-journeys.mjs`: the complete complex artifact
  runs through a durable presentation release transition, preserving baseline,
  collection keys, wizard position and touched state before controller recreation.
  Studio and installed server consumers share this journey.
- `packages/authoring/test/portable.test.mjs`: nested fragment reuse is refused before
  exponential expansion in preview. Total expanded form budget: 1,000 nodes.
- `scripts/check-portable-performance.mjs`: import/projection plus load, headless
  snapshot creation, validation and submission for contact, full Event Launch and
  1,000 fields. Per-workflow budget: 3 seconds; total including projection: 6 seconds.
  Actual measurements print from `npm run performance:v1`; these are headless timings,
  not browser paint or human task completion timings.
- `packages/authoring/test/resources.test.mjs`: a pathological native regex is killed
  by the application-owned worker host deadline. Later requests succeed; input and
  concurrency limits reject oversized/busy work. Worker limits: 1 MB serialized input,
  four concurrent requests, 64 MiB old-generation heap and 16 MiB young generation,
  four MiB stack, default one-second deadline including startup. V8 limits are not a
  whole-process RSS limit. Worker code imports only a host-selected local module.
- Existing packed four-adapter rendering and browser journeys remain release gates.

Bindings are trusted executable code. Exact named versions plus immutable host build
IDs identify their deployment, but do not prove their purity or sandbox them. Native
regex semantics remain compatible; hard deadlines require an isolation boundary.
The owner-created LRU cache reuses standard compiled definitions by exact release
identity with detached results. Forms containing executable host bindings compile
freshly; their closures are not shared between requests. Mutation, context,
controller and custom-factory isolation are executable packed-consumer regressions.

Studio publication now integrates these releases, exact installed-artifact report
ports and full-envelope migration/recreation. Its existing append-only snapshot
repository retains the release identities and reports. Exported `release.ts` uses
the same public release API. Production hosts require the portable gate explicitly;
a portable lineage cannot silently downgrade to the local scenario-only gate.

The extended performance matrix includes 1,000 rows, 40 nested groups, 780 nested
rows and eight simultaneous service requests with distinct acceptance contexts.
All workflows share a six-second aggregate and 256 MiB live-heap ceiling, in addition
to the three-second per-workflow limit. The browser gate imports, renders, edits
and exports 1,000 real controls within ten seconds; its timing is attached to the
Playwright result. Existing core selector/render-count budgets and all four adapter
browser contracts remain active. These are declared supported workload bounds,
not claims about arbitrary unbounded graphs or whole-process RSS isolation.

## Remaining manual beta gates

- Run timed authoring sessions for a new author creating/exporting contact and an
  experienced author changing the full Event Launch cross-row rule. Record task time,
  stumbling points, exact diagnostics and remedies; do not substitute test runtime.
- Run the manual keyboard, focus, 200% zoom/reflow and screen-reader sessions required
  by [PRODUCT_GATES.md](PRODUCT_GATES.md): macOS/Safari/VoiceOver and
  Windows/Edge/NVDA. Record actual versions, steps and observations. Automated DOM
  assertions or Chromium journeys do not establish these passes.

Preserve the original runtime envelope until migration and target controller recreation
both succeed. A release declaring reset starts fresh while retaining the recoverable
old save. Local preview, scenario migration and a release hash alone never authorize
server acceptance or complete the portable beta gate.


## Manual session record

Keep each row pending until a person runs and records the session. Record operator,
date, OS/browser/assistive-technology versions, elapsed time, task completion,
observed problems and report location. Retain failures and fixes with the rerun.

| Session | Required journey | Status |
| --- | --- | --- |
| New author | Create contact visually; edit label/options/required and conditional rules; preview, export, reload and submit | Pending |
| Experienced author | Change the complete Event Launch cross-row rule; preview variants/rows, export and verify server parity | Pending |
| macOS/Safari/VoiceOver | Keyboard authoring; focus restoration; names/help/errors; async announcements; collection add/move/remove; wizard navigation; 200% zoom/reflow | Pending |
| Windows/Edge/NVDA | Repeat the same contact and full Event Launch authoring/preview workflows with screen-reader observation | Pending |

The final `npm run verify:changed -- change` completed the full release command,
including all 43 browser journeys. No manual session is represented by that result.
