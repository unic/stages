# @stages/core

Framework-neutral controlled form and wizard engine for Stages v1.

```ts
import { stages, type StagesSchema } from "@stages/core";

const fields = {
  text: {
    view: "text",
    initialValue: "",
    reduce: ({ event }) => event.name === "input"
      ? { value: event.payload }
      : undefined,
  },
} as const;

const schema = {
  id: "profile",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text" }],
} as const satisfies StagesSchema<{ name: string }, typeof fields>;

let controller;
controller = stages({
  schema,
  fields,
  value: { name: "" },
  onChange: ({ value }) => controller.update({ value }),
});
```

The package has no runtime dependencies and contains no DOM or framework code.
It exports the controller, schema/event/validation/serialization types, safe
immutable path helpers, collection reduction, and serialization utilities.

This is an alpha API and is not compatible with `react-stages` 0.x. See the
[v1 API guide](https://github.com/unic/stages/blob/master/docs/V1_API.md) and
[0.x migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md).
