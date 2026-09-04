# Stages v1

Stages is a framework-neutral, controlled engine for forms, collections, and
wizards. It owns schema evaluation, immutable value proposals, validation,
navigation, and serializable interaction state while applications retain
control of accepted values, markup, field components, and styling.

The v1 implementation is currently an alpha release candidate and is not API
compatible with the historical `react-stages` 0.x package.

## Packages

- `@stages/core` — dependency-free controller and schema runtime
- `@stages/dom` — accessible native-DOM reference adapter
- `@stages/react` — React lifecycle, field, collection, and wizard bindings
- `@stages/vue` — Vue Composition API lifecycle, field, collection, and wizard bindings
- `@stages/angular` — Angular v22 signal lifecycle, field, collection, and wizard bindings
- `@stages/test-kit` — reusable adapter contract harness

## Quick start

```ts
import { stages } from "@stages/core";

const fields = {
  text: {
    view: "text",
    initialValue: "",
    reduce: ({ event }) => event.name === "input"
      ? { value: event.payload }
      : undefined,
  },
};

let value = { name: "" };
let controller;
controller = stages({
  schema: {
    id: "profile",
    version: 1,
    nodes: [{ kind: "field", id: "name", type: "text" }],
  },
  fields,
  value,
  onChange: ({ value: proposed }) => {
    value = proposed;
    controller.update({ value });
  },
});
```

## Canonical Event Launch example

One shared Event Launch domain/schema is implemented in every public UI
adapter and checked by a framework-neutral contract plus a parameterized
browser suite:

- [`examples/shared/event-launch`](examples/shared/event-launch) — model, field contract, schema factory, validation, fixtures, persistence, CSS, and behavior tests
- [`examples/vanilla`](examples/vanilla/README.md) — `mountStages()` and application-owned DOM chrome
- [`examples/react`](examples/react/README.md) — controlled hooks under Strict Mode
- [`examples/vue`](examples/vue/README.md) — Vue Composition API bindings
- [`examples/angular`](examples/angular/README.md) — Angular v22 signals and strict templates
- [`examples/e2e`](examples/e2e) — one Playwright conformance suite for all adapters

Other active applications:

- [`studio`](studio) — v1-backed visual form editor
- [`docs`](docs) — v1 documentation application

## Documentation

- [v1 API](docs/V1_API.md)
- [Architecture plan and implementation state](docs/V1_ARCHITECTURE_PLAN.md)
- [v1 acceptance review](docs/V1_ACCEPTANCE_REVIEW.md)
- [Migrating from 0.x](docs/MIGRATING_TO_V1.md)
- [Release-candidate checklist](docs/V1_RELEASE_CHECKLIST.md)
- [Historical 0.x API inventory](docs/CURRENT_IMPLEMENTATION_API.md)

Run the complete local candidate gate with:

```sh
npm run release:check:v1
```

For focused example work, use `npm run test:example-contract:v1`,
`npm run build:examples:v1`, or `npm run test:examples:v1 -- --adapter react`.
