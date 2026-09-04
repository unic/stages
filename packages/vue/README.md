# @stages/vue

Vue 3 Composition API lifecycle and selector bindings for Stages v1. Vue 3.3
or newer is a peer dependency.

```ts
import { computed, ref } from "vue";
import { stages } from "@stages/core";
import { StagesField, useStages } from "@stages/vue";

const value = ref({ name: "" });
const { controller } = useStages(
  () => stages({
    schema,
    fields,
    value: value.value,
    onChange: ({ value: proposed }) => { value.value = proposed; },
  }),
  computed(() => ({ value: value.value })),
);
```

Render `StagesField` with `h(StagesField, { controller, path: ["name"] })` or
use it directly in a template. Exports include `useStages`,
`useStagesController`, `useStagesField`, `StagesField`,
`useStagesCollection`, and `useStagesWizard`. Snapshot and structural bindings
are Vue computed refs, while field views and all markup remain
application-owned.

See the [v1 API guide](https://github.com/unic/stages/blob/master/docs/V1_API.md)
and [0.x migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md),
plus the repository's `examples/vue` application.
