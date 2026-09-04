import { computed, createApp, defineComponent, h, ref } from "vue";
import { stages, type FieldDefinition, type StagesSchema } from "@stages/core";
import {
  StagesField,
  useStages,
  useStagesCollection,
  useStagesWizard,
  type VueFieldProps,
  type VueFieldView,
} from "@stages/vue";
import "./styles.css";

interface InputProps {
  readonly label: string;
  readonly placeholder?: string;
}

interface Member {
  id: string;
  name: string;
}

interface WorkspaceValue {
  setup: {
    account: { name: string };
    team: { members: Member[] };
  };
}

const TextField: VueFieldView<string, InputProps> = (binding: VueFieldProps<string, InputProps>) => h("div", { class: "field" }, [
  h("label", { for: binding.id }, binding.props.label),
  h("input", {
    id: binding.id,
    value: binding.field.value,
    placeholder: binding.props.placeholder,
    disabled: binding.field.state.disabled,
    onInput: (event: Event) => binding.emit("input", (event.currentTarget as HTMLInputElement).value),
    onFocus: () => binding.emit("focus"),
    onBlur: () => binding.emit("blur"),
  }),
]);

const text: FieldDefinition<string, InputProps, VueFieldView<string, InputProps>> = {
  view: TextField,
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
};
const fields = { text } as const;

const schema = {
  id: "vue-workspace",
  version: 1,
  nodes: [{
    kind: "wizard",
    id: "setup",
    stages: [
      {
        id: "account",
        nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Workspace name", placeholder: "Northwind" } }],
      },
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

const App = defineComponent({
  name: "VueStagesExample",
  setup() {
    const value = ref<WorkspaceValue>(initialValue);
    const nextId = ref(2);
    const { controller } = useStages(
      () => stages({
        schema,
        fields,
        value: value.value,
        onChange: ({ value: proposed }) => { value.value = proposed; },
      }),
      computed(() => ({ value: value.value })),
    );
    const wizard = useStagesWizard(controller, ["setup"]);
    const collection = useStagesCollection(controller, ["setup", "team", "members"] as const);

    return () => h("main", { class: "shell" }, [
      h("header", { class: "hero" }, [
        h("p", { class: "eyebrow" }, "@stages/vue"),
        h("h1", null, "Create a workspace"),
        h("p", null, "A controlled Vue wizard with application-owned markup."),
      ]),
      h("form", { onSubmit: (event: Event) => event.preventDefault() }, [
        h("ol", { class: "progress" }, wizard.value.stages.map((stage) => h("li", {
          key: stage.id,
          "aria-current": stage.active ? "step" : undefined,
        }, stage.id))),
        wizard.value.activeStage === "account"
          ? h("section", [
              h("h2", null, "Workspace details"),
              h(StagesField, { controller, path: ["setup", "account", "name"] }),
            ])
          : h("section", [
              h("div", { class: "section-heading" }, [
                h("h2", null, "Invite your team"),
                h("button", {
                  type: "button",
                  disabled: !collection.value.canAdd,
                  onClick: () => {
                    collection.value.add({ id: `member-${nextId.value}`, name: "" });
                    nextId.value += 1;
                  },
                }, "Add member"),
              ]),
              h("ol", { class: "members" }, collection.value.items.map((item) => h("li", { key: item.key }, [
                h(StagesField, { controller, path: item.fieldPath("name") }),
                h("button", { type: "button", class: "quiet", disabled: !item.canRemove, onClick: item.remove }, "Remove"),
              ]))),
            ]),
        h("div", { class: "actions" }, [
          h("button", { type: "button", disabled: !wizard.value.canPrevious, onClick: wizard.value.previous }, "Previous"),
          h("button", { type: "button", disabled: !wizard.value.canNext, onClick: wizard.value.next }, "Next"),
        ]),
      ]),
      h("details", [h("summary", null, "Controlled value"), h("pre", null, JSON.stringify(value.value, null, 2))]),
    ]);
  },
});

createApp(App).mount("#app");
