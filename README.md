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

## Active applications and examples

- [`examples/vanilla`](examples/vanilla/README.md) — DOM adapter wizard
- [`examples/react`](examples/react/README.md) — React workspace wizard
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
