# @stages/dom

Dependency-free reference DOM adapter for Stages v1.

```ts
import { stages } from "@stages/core";
import { createDomFields, mountStages } from "@stages/dom";

const fields = createDomFields();
let controller;
controller = stages({
  schema: {
    id: "profile",
    version: 1,
    nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
  },
  fields,
  value: { name: "" },
  onChange: ({ value }) => controller.update({ value }),
});

const mounted = mountStages(document.querySelector("#form")!, controller);
```

The adapter includes native text, number, and checkbox views; associated labels
and descriptions; severity-aware issue relationships; collision-safe collection
row IDs; focus preservation; path-based and first-visible-error focus that skips
hidden/disabled controls; and custom `DomFieldView` support.

See the [v1 API guide](https://github.com/unic/stages/blob/master/docs/V1_API.md)
and [0.x migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md).
