# @stages/test-kit

Framework adapter contract harness for Stages v1.

```ts
import { bindAdapter } from "@stages/test-kit";

const adapter = bindAdapter(controller, (snapshot) => render(snapshot));
adapter.emit({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Ada" });
adapter.destroy();
```

`bindAdapter` proves that adapters need only immutable snapshots,
subscriptions, and events. The repository uses it for Vue-style and
Angular-style integration fixtures.

See the [v1 API guide](https://github.com/unic/stages/blob/master/docs/V1_API.md).
