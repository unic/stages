import { Component, Input, computed, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { stages, type FieldDefinition, type FieldSnapshot, type StagesSchema } from "@stages/core";
import {
  StagesFieldComponent,
  collectionSignal,
  injectStages,
  wizardSignal,
  type AngularFieldView,
} from "@stages/angular";

interface InputProps {
  readonly label: string;
  readonly placeholder?: string;
}

interface Member { id: string; name: string; }
interface WorkspaceValue {
  setup: {
    account: { name: string };
    team: { members: Member[] };
  };
}

@Component({
  selector: "stages-text-field",
  standalone: true,
  template: `
    <div class="field">
      <label [for]="id">{{ props.label }}</label>
      <input
        [id]="id"
        [value]="field.value"
        [placeholder]="props.placeholder ?? ''"
        [disabled]="field.state.disabled"
        (input)="emit('input', $any($event.target).value)"
        (focus)="emit('focus')"
        (blur)="emit('blur')"
      />
    </div>
  `,
})
class TextFieldComponent implements AngularFieldView<string, InputProps> {
  @Input({ required: true }) id!: string;
  @Input({ required: true }) field!: FieldSnapshot<string, unknown>;
  @Input({ required: true }) props!: InputProps;
  @Input({ required: true }) emit!: (name: string, payload?: unknown) => void;
}

const text: FieldDefinition<string, InputProps, typeof TextFieldComponent> = {
  view: TextFieldComponent,
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
};
const fields = { text } as const;

const schema = {
  id: "angular-workspace",
  version: 1,
  nodes: [{
    kind: "wizard",
    id: "setup",
    stages: [
      { id: "account", nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Workspace name", placeholder: "Northwind" } }] },
      {
        id: "team",
        nodes: [{
          kind: "collection",
          id: "members",
          min: 1,
          max: 5,
          itemKey: (item) => typeof item === "object" && item !== null && "id" in item ? String(item.id) : "invalid",
          nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Member name", placeholder: "Ada Lovelace" } }],
        }],
      },
    ],
  }],
} as const satisfies StagesSchema<WorkspaceValue, typeof fields>;

const initialValue: WorkspaceValue = {
  setup: { account: { name: "" }, team: { members: [{ id: "member-1", name: "" }] } },
};

@Component({
  selector: "stages-example",
  standalone: true,
  imports: [StagesFieldComponent],
  template: `
    <main class="shell">
      <header class="hero">
        <p class="eyebrow">&#64;stages/angular</p>
        <h1>Create a workspace</h1>
        <p>A controlled Angular v22 wizard with application-owned components.</p>
      </header>
      <form (submit)="$event.preventDefault()">
        <ol class="progress">
          @for (stage of wizard().stages; track stage.id) {
            <li [attr.aria-current]="stage.active ? 'step' : null">{{ stage.id }}</li>
          }
        </ol>
        @if (wizard().activeStage === 'account') {
          <section>
            <h2>Workspace details</h2>
            <stages-field [controller]="controller" [path]="accountNamePath" />
          </section>
        } @else {
          <section>
            <div class="section-heading">
              <h2>Invite your team</h2>
              <button type="button" [disabled]="!collection().canAdd" (click)="addMember()">Add member</button>
            </div>
            <ol class="members">
              @for (item of collection().items; track item.key) {
                <li>
                  <stages-field [controller]="controller" [path]="item.fieldPath('name')" />
                  <button type="button" class="quiet" [disabled]="!item.canRemove" (click)="item.remove()">Remove</button>
                </li>
              }
            </ol>
          </section>
        }
        <div class="actions">
          <button type="button" [disabled]="!wizard().canPrevious" (click)="wizard().previous()">Previous</button>
          <button type="button" [disabled]="!wizard().canNext" (click)="wizard().next()">Next</button>
        </div>
      </form>
      <details><summary>Controlled value</summary><pre>{{ formattedValue() }}</pre></details>
    </main>
  `,
})
class AppComponent {
  readonly value = signal<WorkspaceValue>(initialValue);
  readonly binding = injectStages(
    () => stages({ schema, fields, value: this.value(), onChange: ({ value }) => this.value.set(value) }),
    computed(() => ({ value: this.value() })),
  );
  readonly controller = this.binding.controller;
  readonly wizard = wizardSignal(this.controller, ["setup"]);
  readonly collection = collectionSignal(this.controller, ["setup", "team", "members"] as const);
  readonly formattedValue = computed(() => JSON.stringify(this.value(), null, 2));
  readonly accountNamePath = ["setup", "account", "name"] as const;
  private nextId = 2;

  addMember(): void {
    this.collection().add({ id: `member-${this.nextId}`, name: "" });
    this.nextId += 1;
  }
}

bootstrapApplication(AppComponent).catch((error: unknown) => console.error(error));
