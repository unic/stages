# @stages/react

React lifecycle and selector bindings for Stages v1. React 17 or newer is a
peer dependency.

```tsx
import { stages } from "@stages/core";
import { StagesField, useStages } from "@stages/react";

function Form({ value, setValue }) {
  const { controller } = useStages(
    () => stages({ schema, fields, value, onChange: ({ value }) => setValue(value) }),
    { value },
  );
  return <StagesField controller={controller} path={["name"]} />;
}
```

Exports include `useStages`, `useStagesController`, `useStagesField`,
`StagesField`, `useStagesCollection`, and `useStagesWizard`. Field views and all
markup remain application-owned. Controller teardown is safe across React
Strict Mode effect replay.

See the [v1 API guide](https://github.com/unic/stages/blob/master/docs/V1_API.md)
and [0.x migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md).
