# Stages v1 canonical cross-adapter example plan

Status: proposed for implementation

Last reviewed against the implementation: 2026-09-04

Related material:

- [`V1_ARCHITECTURE_PLAN.md`](./V1_ARCHITECTURE_PLAN.md)
- [`V1_ACCEPTANCE_REVIEW.md`](./V1_ACCEPTANCE_REVIEW.md)
- [`content/feature-coverage.mdx`](./content/feature-coverage.mdx)
- [`LEGACY_DEMO_COVERAGE.md`](./LEGACY_DEMO_COVERAGE.md)

## 1. Decision

Replace the four small workspace examples with one canonical **Event Launch**
workflow implemented for DOM/vanilla, React, Vue, and Angular.

The four applications must share one framework-neutral domain model, schema,
validation rules, deterministic services, fixtures, visual language, and
behavioral acceptance suite. Each application owns only the field views,
framework lifecycle, composition markup, and adapter bindings appropriate to
its framework.

This is both a product demonstration and a smoke-test application. A user
should understand why each feature exists without knowing Stages, while a
maintainer should be able to exercise the important v1 contracts from one
browser flow.

## 2. Why Event Launch

An event publishing flow makes the major Stages features feel like domain
requirements instead of disconnected controls:

- choosing in-person, virtual, or hybrid delivery changes the wizard stages;
- event details, venue details, and review settings form natural nested groups;
- an agenda is naturally a heterogeneous collection of sessions, workshops,
  and breaks;
- paid registration adds a homogeneous collection of ticket tiers;
- event slugs need asynchronous availability validation;
- dates, capacity, agenda titles, and ticket tiers need cross-field and
  collection-level validation;
- a publish flow benefits from guarded, validated wizard navigation;
- a long form gives save/resume and durable row/stage identity a real purpose;
- applying an event template is a believable batched multi-field operation.

The scenario is richer than the current workspace wizard but remains familiar
enough that the UI does not need a long explanation.

## 3. Goals and boundaries

### Goals

1. Present one polished, realistic workflow with the same capabilities in all
   four public UI adapters.
2. Exercise controlled ownership, custom fields, recursive structures, dynamic
   configuration, events/transforms, collections, wizards, validation,
   persistence, accessibility, and lifecycle cleanup.
3. Make behavioral parity machine-checkable so examples cannot silently drift.
4. Keep adapter code idiomatic: hooks in React, Composition API in Vue, signals
   in Angular, and `mountStages()` plus DOM event wiring in vanilla.
5. Keep the normal user journey credible. Development-only evidence belongs in
   a collapsed inspector and deterministic test controls.
6. Make the framework-neutral nature of Stages obvious in the source layout.

### Non-goals

- Do not demonstrate every low-level path, migration, codec, diagnostic, or
  security helper in the visible form. Those remain better covered by focused
  documentation and core tests.
- Do not call a real backend, payment provider, map, or email service.
- Do not add a component library or framework-specific state library.
- Do not require pixel-identical DOM across adapters. Require equivalent
  semantics, behavior, content, and visual design.
- Do not preserve the current examples as separate simple variants. The docs
  quickstarts already cover minimal usage.

## 4. User experience

The page is a responsive two-column application at wide widths and a single
column on small screens.

- The main column contains the custom wizard header, active-stage form, status
  announcements, and navigation.
- A summary rail shows event status, visible stages, completion state, and
  save/resume controls.
- A collapsed “Stages inspector” shows controlled value, validation aggregate,
  active wizard state, last transaction, diagnostics, and the serialized
  envelope.
- The adapter name is a small badge, not a different theme. All four apps should
  look and behave like the same product.

The default fixture starts partially complete so collection and dynamic-stage
behavior is immediately visible, but the first stage still contains invalid
data that proves validation gating.

The app offers these deterministic actions:

- **Apply conference template** — dispatches one custom event whose transform
  patches several fields in a single transaction;
- **Save draft** — writes `controller.serialize()` to adapter-local
  `localStorage`;
- **Resume draft** — recreates the controller from the saved state;
- **Start over** — dispatches the standard form reset event and clears saved
  state after the controlled owner accepts it;
- **Load smoke-test data** — visible only in development/test mode and fills a
  stable fixture without bypassing normal controller events.

No action should suggest that storage, routing, submission, or server checks
are owned by core. The copy and source comments must identify those as
application policies composed around Stages.

## 5. Canonical value and context

The final names can change during the compiler spike, but all adapters must use
one exported model with this shape:

```ts
type DeliveryMode = "in-person" | "virtual" | "hybrid";
type AccessModel = "free" | "paid";

type AgendaItem =
  | {
      id: string;
      kind: "session";
      title: string;
      speaker: string;
      durationMinutes: number | undefined;
    }
  | {
      id: string;
      kind: "workshop";
      title: string;
      facilitator: string;
      durationMinutes: number | undefined;
      capacity: number | undefined;
    }
  | {
      id: string;
      kind: "break";
      label: string;
      durationMinutes: number | undefined;
    };

interface TicketTier {
  id: string;
  name: string;
  price: number | undefined;
  quantity: number | undefined;
}

interface EventLaunchValue {
  launch: {
    basics: {
      identity: {
        title: string;
        slug: string;
        description: string;
      };
      schedule: {
        startsAt: string;
        endsAt: string;
        timezone: string;
      };
      deliveryMode: DeliveryMode;
      accessModel: AccessModel;
    };
    venue: {
      name: string;
      address: {
        street: string;
        city: string;
        country: string;
      };
      capacity: number | undefined;
      accessibilityNotes: string;
    };
    streaming: {
      platform: string;
      url: string;
      recordEvent: boolean;
      recordingConsent: boolean;
    };
    agenda: {
      items: AgendaItem[];
    };
    tickets: {
      currency: string;
      tiers: TicketTier[];
    };
    compliance: {
      dataProcessingAccepted: boolean;
    };
    review: {
      termsAccepted: boolean;
      confirmation: string;
    };
  };
}

interface EventLaunchContext {
  locale: string;
  currency: string;
  requiresDataProcessingAgreement: boolean;
  reservedSlugs: ReadonlySet<string>;
  validationDelayMs: number;
  messages: EventLaunchMessages;
}
```

`reservedSlugs` is converted to JSON-safe data only if context persistence is
later added; it is not part of the controller envelope. The saved value itself
remains JSON-native, so this example does not need a value codec.

## 6. Wizard and schema design

The root contains one `launch` wizard with `validateCurrent: true` and
`nonLinear: true`. Application navigation explicitly validates the active
stage before dispatching `wizard:next` or `wizard:go`.

| Stage | Visibility | Structure and behavior | Primary proof |
| --- | --- | --- | --- |
| Basics | Always | `identity` and `schedule` groups; title, slug, description, dates, timezone, delivery mode, and access model | Nested groups, intrinsic reducers, derived props, sync/async/dependent validation, custom event transform |
| Venue | In-person or hybrid | Venue name, nested address group, capacity, accessibility notes | Dynamic stage, nested group, conditional validation, disabled inheritance |
| Streaming | Virtual or hybrid | Platform, URL, recording toggle, conditional consent | Dynamic stage, conditional field, dynamic props, conditional validation |
| Agenda | Always | Discriminated `items` collection with session, workshop, and break variants | Union rows, stable identity, add/replace/duplicate/remove/move/sort, recursive rendering |
| Tickets | Paid only | Currency plus homogeneous `tiers` collection | Dynamic stage, min/max, add/remove/reorder, computed summary, cross-row validation |
| Compliance | Context requires it | Data-processing acknowledgement; stage is inserted by the schema factory | Factory-driven structural change and wizard reconciliation on context update |
| Review | Always | Read-only summary, terms, exact-title confirmation, publish action | Non-linear guard, full-form validation, focus/error summary, final payload |

### Dynamic rules

- `venue.when` is true for in-person and hybrid events.
- `streaming.when` is true for virtual and hybrid events.
- `tickets.when` is true only for paid events.
- The schema factory includes `compliance` only when external organization
  context requires it. A development inspector toggle updates that context so
  factory reconciliation can be tested without a backend.
- `recordingConsent.when` follows `recordEvent`.
- The nested venue address group is disabled until the sibling venue name is
  entered. This visibly proves disabled inheritance without making the happy
  path obscure.
- `deriveProps` supplies localized labels/help, the expected review
  confirmation text, stream URL guidance for the chosen platform, and currency
  details for ticket prices.
- Switching delivery or access modes while a conditional stage is active must
  reconcile to a valid visible stage and retain dormant values.

### Navigation policy

- Previous is metadata-only and never revalidates.
- Next validates the current stage with `event: "submit"` and `reveal: true`,
  waits for pending work, focuses the first visible error, then dispatches.
- Clicking a step uses the same validation path for forward movement. Backward
  movement remains available.
- A wizard guard rejects entry to Review for a paid event with no ticket tier.
  The application translates that domain rule into user-facing guidance; core
  diagnostics stay in the inspector.
- Buttons are disabled while the submitted scope is pending, but handlers must
  still tolerate a navigation rejection caused by a concurrent owner/context
  update.

## 7. Shared field contract

Every adapter registers the same field names and value/props contracts:

| Field | Value | Events and behavior | Visible purpose |
| --- | --- | --- | --- |
| `text` | `string` | `input`, `focus`, `blur`; optional intrinsic required rule | Titles, slug, addresses, URLs, confirmation |
| `textarea` | `string` | Same interaction events; application-owned custom view | Description and accessibility notes |
| `choice` | string union | Typed radio/segmented-choice reducer and custom view | Delivery mode, access model, platform, timezone/country where appropriate |
| `number` | `number \| undefined` | Empty-value handling and numeric parsing in the reducer | Duration, capacity, quantity |
| `money` | `number \| undefined` | Decimal parsing; locale/currency presentation in the view | Ticket prices and derived-props proof |
| `checkbox` | `boolean` | Boolean reducer | Recording, consent, and terms |

All views must render label, description, required state, disabled state,
pending state, visible warnings/errors, and stable accessible IDs from the
adapter binding. The DOM example should extend `createDomFields()` with custom
`textarea`, `choice`, and `money` views; the framework examples should use
application-owned views for the whole registry so opaque view typing is
visible.

Field definitions own parsing and reusable intrinsic rules. Node validators own
domain rules that need paths, context, event policy, dependencies, or async
cancellation.

## 8. Validation and processing plan

The example needs deliberately different validator kinds, not many copies of
the same required check.

| Rule | Location/policy | Contract exercised |
| --- | --- | --- |
| Required text | Registry validator, revealed by explicit scoped/form validation | Intrinsic field validation and issue composition |
| Slug syntax | Slug node, input/submit | Sync node validator |
| Slug availability | Slug node, input/submit, blur/submit reveal | Async validator, pending state, cancellation, stale-result suppression, context |
| End after start | Schedule group or root, date dependencies | Cross-field dependency invalidation and exact issue path |
| Streaming URL required/valid | Streaming node, conditional on delivery | Conditional validation and hidden-stage exclusion |
| Recording consent | Consent field, conditional on recording | Conditional field and validator |
| Unique agenda titles | Agenda collection, input/submit | Collection validator producing row-specific paths |
| Workshop capacity | Workshop capacity field, depends on venue capacity | Row validation with an external dependency |
| Long/high-capacity session | Agenda row, input/submit | Non-blocking warning severity |
| Ticket tier uniqueness and positive values | Tickets collection/row | Homogeneous collection aggregation |
| Exact publish confirmation | Review field, submit with derived label | Cross-field validation and submit-only reveal |

The async slug service is an in-memory promise with a short configurable delay.
It must register `signal.onCancel`, clean up its timer, and produce stable
results for a known reserved set. No example test may depend on network access.

Validation failures use the library's deterministic fallback by default. A
single `validationFailureIssue` presentation function supplies a friendly
message and safe metadata, and a test-only service-failure slug proves that
hook without adding a broken state to the normal journey.

### Events, transforms, and batching

- The `apply-template` form event is handled by a root transform that returns
  ordered patches for title, description, schedule, delivery, and initial
  agenda. One click must emit one controlled proposal/transaction.
- Title `blur` normalizes surrounding whitespace through a node transform.
- Slug text remains user-owned; the template action may seed it, but ordinary
  title edits do not unexpectedly overwrite it.
- Collection buttons use standard node events. Bindings provide add/remove/move
  where available; direct `nodeEvent()` dispatch demonstrates duplicate,
  replace-variant, and sort.
- The development fixture action uses `controller.batch()` with ordinary field
  and node events so the inspector can prove one notification and transaction.

## 9. Collections in the UI

### Agenda: discriminated collection

The Add menu offers Session, Workshop, and Break. Each explicit item receives a
deterministic domain ID before dispatch, and `itemKey` uses that ID.

Every row displays its variant, fields, stable key in the inspector, and these
actions where allowed:

- move up/down;
- duplicate;
- convert Session to Workshop (a row-level `collection:replace` retaining the
  domain ID and common values);
- remove; and
- “Sort breaks last” for the entire collection.

The visible UI does not expose raw row addresses, but tests assert that touched
state, issues, and rendered control identity follow the stable address across
move/sort and save/resume.

### Ticket tiers: homogeneous collection

Paid events start with one General tier. Users can add, move, and remove tiers
within documented min/max limits. The view displays remaining capacity and
gross potential as application-derived summaries; it does not write computed
presentation data into the controlled form value.

## 10. Persistence, reset, and observability

The owner subscribes to accepted changes and debounces application-owned draft
saves. A manual Save button remains available so persistence is obvious.

Recreation from `controller.serialize()` must preserve:

- the accepted value and baseline;
- dirty/touched/visited and revealed-validation metadata;
- the active wizard stage;
- collection row keys through reorder/duplicate; and
- registered example extension state if the implementation uses it for the
  inspector.

It must not pretend to persist pending validation, focus, services, or context.
After resume, the application supplies fresh context and async validation runs
again when required.

The collapsed inspector has stable sections for:

1. current controlled value;
2. overall and active-stage validation status;
3. visible stages and active stage;
4. last `StagesChange` including source, event names, patch count, and
   transaction ID;
5. diagnostics; and
6. serialized state.

The inspector is a developer aid, not a second way to mutate controller state.
Its only mutable controls are the clearly labeled context and smoke-fixture
toggles.

## 11. Cross-adapter source architecture

Use a shared source directory rather than maintaining four copies of domain
behavior:

```text
examples/
  shared/
    event-launch/
      model.ts
      field-contract.ts
      schema.ts
      validators.ts
      services.ts
      fixtures.ts
      persistence.ts
      behavior-contract.test.mjs
      styles.css
  vanilla/src/
    main.ts
    fields.ts
    render-chrome.ts
  react/src/
    main.tsx
    fields.tsx
    EventLaunchApp.tsx
  vue/src/
    main.ts
    fields.ts
    EventLaunchApp.ts
  angular/src/
    main.ts
    fields.ts
    event-launch-app.ts
  e2e/
    event-launch.spec.ts
    package.json
    playwright.config.ts
```

Before building the full UI, add a small strict TypeScript compiler spike that
proves a schema typed against the shared field contract can be passed to each
adapter-specific field registry without casts or `any`. If that does not type
cleanly, export a generic `createEventLaunchSchema<TFields>()` builder. Do not
solve it by weakening the public example types.

Shared code may import `@stages/core`; it must never import a UI adapter. Adapter
applications may import shared code and exactly one matching UI adapter.

Shared CSS owns tokens, layout, field states, cards, collection rows, progress,
inspector, and responsive behavior. Adapter styles may contain only genuine
framework host fixes. The rendered semantic contract uses common roles,
accessible names, status text, and `data-testid` values, not identical wrapper
trees.

### Adapter-specific responsibilities

| Adapter | Required implementation proof |
| --- | --- |
| DOM | Merge native and custom DOM fields; mount with `mountStages()`; preserve focus across rerenders; create application-owned collection/wizard controls from snapshots; destroy mount, subscriptions, and controller on page hide |
| React | Controlled `useStages()` under Strict Mode; `StagesField`; selector-based collection/wizard hooks; component keys from row identity; real unmount cleanup |
| Vue | Controlled `useStages()` with a computed update source; `StagesField`; collection/wizard composables; scope disposal; no React-shaped composition copied into render functions |
| Angular | `injectStages()` with controlled signals; `StagesFieldComponent`; collection/wizard signals; strict templates; component/controller teardown |

The DOM renderer may decorate row containers produced by `mountStages()` with
application controls in `onRender`, but it must target row snapshots/addresses
rather than infer identity from array indexes or labels.

## 12. Smoke-test contract

There are two complementary suites.

### Framework-neutral behavior contract

Instantiate the shared schema with opaque test field views and drive the public
controller API. This fast suite proves the scenario itself before UI adapters
are involved:

1. controlled proposals remain proposals until accepted with `update()`;
2. template patches are ordered and emitted as one transaction;
3. delivery/access changes alter visible stages and reconcile the active stage;
4. the context-driven compliance stage appears/disappears without a value
   proposal;
5. async slug runs enter pending, cancel, and ignore stale results;
6. scoped validation gates wizard navigation;
7. agenda variants expose the correct recursive fields;
8. add/replace/duplicate/move/sort/remove preserve stable row identity;
9. ticket min/max rejections leave the accepted value untouched;
10. serialization/recreation preserves durable metadata, row keys, and active
    stage; and
11. full-form validation returns the exact expected warning/error paths.

### Parameterized browser conformance suite

Run one Playwright behavior suite against built vanilla, React, Vue, and Angular
applications. The suite uses accessible roles/names for user interactions and
stable test IDs only for otherwise invisible state or deterministic setup.

Required journeys:

1. **Dynamic flow:** switch in-person → virtual → hybrid and assert stage list,
   active-stage recovery, dormant values, and conditional fields.
2. **Validation UX:** attempt Next with empty/invalid basics, assert error
   summary, field association, first-error focus, pending state, and eventual
   success.
3. **Async cancellation:** type reserved then available slugs quickly and prove
   the final result wins.
4. **Agenda identity:** add all variants, edit, blur, move, duplicate, convert,
   sort, remove, and assert values/issues stay with domain row keys.
5. **Paid tickets:** reveal Tickets, exercise min/max and row validation, then
   switch to free and prove hidden validation no longer blocks the form.
6. **Non-linear wizard:** use the progress navigation, prove forward validation
   and Review guard behavior, then navigate backward.
7. **Save/resume:** save on a non-initial stage with moved rows and revealed
   errors, reload, resume, and assert durable versus ephemeral state.
8. **Publish:** complete a valid form, submit, and compare the displayed payload
   with the canonical fixture.
9. **Accessibility smoke:** run axe if adopted, plus explicit keyboard, label,
   `aria-current`, live-region, error-summary, and disabled-state assertions.
10. **Lifecycle:** navigate/unmount or destroy and assert no later service result
    changes the UI and no duplicate subscriptions are visible.

Avoid screenshots as the primary oracle. A small screenshot set may cover the
wide, narrow, invalid, and collection-heavy states, but behavior and semantics
are the parity contract.

### Stable test surface

Use shared names for:

- `event-launch-form`;
- `wizard-progress` and `wizard-stage-<id>`;
- `agenda-row-<domain-id>` and `ticket-row-<domain-id>`;
- `validation-summary` and `form-status`;
- `save-draft`, `resume-draft`, `start-over`, and `apply-template`;
- `stages-inspector`; and
- `published-payload`.

Do not add test IDs to every field when a label and role are sufficient.

## 13. Delivery phases

### Phase 1 — Freeze the shared contract

- Add the model, field-prop contracts, context, fixtures, schema, validators,
  deterministic slug service, and persistence helpers.
- Add the compiler spike across all four field registries.
- Add the framework-neutral behavior contract test.
- Decide exact issue IDs, event names, stable row IDs, and accessible copy before
  adapter replication.

Exit: the shared controller scenario type-checks strictly and all headless
behavior tests pass without a UI adapter.

### Phase 2 — Build the golden React application

- Replace the React workspace example with the complete workflow.
- Create the shared semantic markup contract and polished responsive CSS.
- Extend the existing Strict Mode test for the new controller/service lifecycle.
- Validate the interaction density and remove any feature that only exists to
  tick a box.

Exit: the full happy path and failure path work in React; the source remains
readable enough to serve as the reference implementation.

### Phase 3 — Replicate adapter composition

- Implement DOM first to pressure-test the framework-neutral snapshot/event
  contract and application-owned chrome.
- Implement Vue with Composition API bindings.
- Implement Angular with signals and strict templates.
- Keep copy, validation messages, fixtures, visual CSS, event names, and test
  surface shared.

Exit: all four applications pass typecheck/build and manual parity review.

### Phase 4 — Add browser conformance

- Add the parameterized Playwright project and per-adapter web-server config.
- Implement the required journeys once, using only the shared semantic/test
  contract.
- Add an adapter filter for local iteration and a four-adapter CI command.
- Retain focused adapter unit tests for lifecycle edge cases that are clearer
  below the browser level.

Exit: one command builds and smoke-tests all four examples with the same suite.

### Phase 5 — Documentation and release integration

- Rewrite each example README with the common scenario plus an
  adapter-specific architecture map.
- Update the root README example descriptions and adapter guide links.
- Update `LEGACY_DEMO_COVERAGE.md` and the feature coverage page to name the
  canonical example as integrated evidence.
- Extend `scripts/check-v1-apps.mjs` to include shared example sources.
- Add example behavior/e2e commands to `check:v1` or `release:check:v1` based on
  runtime cost; the full browser suite must be a release gate.
- Keep all four package-lock files and the e2e lockfile deterministic.

Exit: documentation, CI, and the release checklist treat the example as a
maintained cross-adapter contract rather than four illustrative snippets.

## 14. Planned repository commands

Exact names may be adjusted to match the final test runner, but the intended
developer workflow is:

```sh
npm run build:v1
npm run test:example-contract:v1
npm run build:examples:v1
npm run test:examples:v1
npm run test:examples:v1 -- --adapter react
npm run release:check:v1
```

`check:v1` should retain fast type/contract checks. The full four-browser suite
belongs in `release:check:v1`; it may also run in regular CI when the runtime is
acceptable.

## 15. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| The example becomes too large to teach from | Keep minimal quickstarts in docs; split adapter apps by field views, stages, and chrome; annotate feature boundaries; keep one normal happy path |
| Shared code hides how Stages works | Share domain behavior intentionally, but keep adapter controller creation and rendering explicit; README links directly to shared schema and local bindings |
| Schema typing is weakened to make sharing convenient | Make the cross-registry compiler spike the first task; require strict types and zero `any`/suppression in active sources |
| DOM cannot place rich collection controls as naturally as component adapters | Drive controls from row snapshots and stable addresses; use `onRender` decoration only where needed; add DOM-focused tests for rerender/focus |
| Async tests become flaky | Use an in-memory cancellable service, fake/stable delay controls, and no network |
| Four UIs drift | Share content/CSS/fixtures, define a semantic contract, and run one parameterized suite against all adapters |
| Dynamic stages strand the active wizard location | Make active-stage reconciliation a named headless and browser assertion |
| Persistence is mistaken for a core feature | Keep storage code in shared application helpers and explicitly document ownership boundaries |
| A kitchen-sink inspector overwhelms the product demo | Collapse it by default and keep developer-only mutation controls behind test/development mode |

## 16. Definition of done

The canonical example is complete when:

- vanilla, React, Vue, and Angular show the same Event Launch workflow and
  produce the same final value;
- shared behavior contains no adapter imports and each UI imports only its own
  adapter;
- all sources pass the repository's strict type and no-escape-hatch checks;
- the ordinary user path visibly demonstrates dynamic stages, groups, custom
  fields, both collection kinds, custom validation, guarded wizard navigation,
  async state, batching, and save/resume;
- the cross-adapter browser suite passes every required journey;
- focus, labels, errors, warnings, pending state, progress, and live status are
  keyboard- and screen-reader-usable;
- serialization resumes the active stage and stable collection identity without
  claiming to persist ephemeral state;
- controller/mount/subscription/async cleanup is verified for every adapter;
- all four production builds pass from clean installs; and
- root/example documentation and the release gate point to this workflow as the
  canonical integrated Stages v1 proof.
