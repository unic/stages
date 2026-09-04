# @stages/angular

Angular v22 signal and lifecycle bindings for Stages v1. `@angular/core` v22
is a peer dependency.

```ts
import { Component, computed, signal } from "@angular/core";
import { stages } from "@stages/core";
import { injectStages, StagesFieldComponent } from "@stages/angular";

@Component({
  selector: "profile-form",
  imports: [StagesFieldComponent],
  template: `<stages-field [controller]="controller" [path]="['name']" />`,
})
export class ProfileForm {
  readonly value = signal({ name: "" });
  readonly binding = injectStages(
    () => stages({ schema, fields, value: this.value(), onChange: ({ value }) => this.value.set(value) }),
    computed(() => ({ value: this.value() })),
  );
  readonly controller = this.binding.controller;
}
```

Exports include `injectStages`, `stagesSignal`, `fieldSignal`,
`collectionSignal`, `wizardSignal`, and `StagesFieldComponent`. Signals and
controllers created by the adapter are cleaned up through Angular's
`DestroyRef`. Field components and all markup remain application-owned.

See the [v1 API guide](https://github.com/unic/stages/blob/master/docs/V1_API.md),
[0.x migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md),
and the repository's `examples/angular` application.
