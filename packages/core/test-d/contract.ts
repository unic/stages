import {
  fieldEvent,
  formEvent,
  nodeEvent,
  stages,
  type FieldDefinition,
  type StagesExtensionCodec,
  type StagesSchema,
  type StagesSchemaFactory,
  type TransformConfig,
} from "../src/index.js";

interface Value {
  name: string;
  count: number;
  profile: { email: string };
  journeys: Array<{
    kind: "business" | "leisure";
    destination: string;
    approval: { accepted: boolean };
  }>;
  nestedWizard: { inner: { note: string } };
}

interface AppContext {
  readonly canApprove: boolean;
  readonly showProfile: boolean;
}

interface TextProps { readonly label: string; readonly required?: boolean }
interface NumberProps { readonly label: string; readonly min?: number }
interface ToggleProps { readonly label: string }
interface EditorToken { readonly component: "rich-editor" }

const text: FieldDefinition<string, TextProps, string> = {
  view: "input",
  initialValue: "",
  validators: [{
    id: "text.non-empty",
    validate: (value) => value.length === 0
      ? [{ id: "text.non-empty", code: "required", severity: "error" }]
      : [],
  }],
  reduce({ event }) {
    return event.name === "input" && typeof event.payload === "string"
      ? { value: event.payload }
      : undefined;
  },
};

const number: FieldDefinition<number, NumberProps, string> = {
  view: "number-input",
  initialValue: 0,
  reduce({ event }) {
    return event.name === "input" && typeof event.payload === "number"
      ? { value: event.payload }
      : undefined;
  },
};

const toggle: FieldDefinition<boolean, ToggleProps, string> = {
  view: "checkbox",
  initialValue: false,
};

const richText: FieldDefinition<string, { readonly label: string }, EditorToken> = {
  view: { component: "rich-editor" },
  initialValue: "",
};

const fields = { text, number, toggle, richText } as const;

const trim = {
  on: "blur",
  apply({ path, fieldValue }) {
    return typeof fieldValue === "string"
      ? [{ op: "set", path, value: fieldValue.trim() }]
      : [];
  },
} satisfies TransformConfig<Value, AppContext>;

const schema = {
  id: "contract-fixture",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "name",
      type: "text",
      props: { label: "Name" },
      deriveProps: ({ value }) => ({ required: value.count > 0 }),
      disabled: ({ value }) => value.count < 0,
      transforms: [trim],
      validators: [{
        id: "name.required",
        on: ["input", "submit"],
        when: ({ value }) => value.count > 0,
        validate: ({ fieldValue, path }) => fieldValue === ""
          ? [{ id: "name.required", code: "required", path, severity: "error" }]
          : [],
      }, {
        id: "name.available",
        on: "submit",
        dependencies: [["name"]],
        async validate({ fieldValue, path }) {
          await Promise.resolve();
          return fieldValue === "reserved"
            ? [{ id: "name.available", code: "unavailable", path, severity: "error" }]
            : [];
        },
      }],
    },
    { kind: "field", id: "count", type: "number", props: { label: "Count", min: 0 } },
    {
      kind: "group",
      id: "profile",
      when: ({ context }) => context.showProfile,
      nodes: [{ kind: "field", id: "email", type: "text", props: { label: "Email" } }],
    },
    {
      kind: "wizard",
      id: "journeys",
      initialStage: "details",
      stages: [
        {
          id: "details",
          nodes: [{
            kind: "collection",
            id: "items",
            discriminator: "kind",
            variants: {
              business: {
                nodes: [
                  { kind: "field", id: "destination", type: "text", props: { label: "Destination" } },
                  {
                    kind: "wizard",
                    id: "approval",
                    stages: [{
                      id: "decision",
                      nodes: [{ kind: "field", id: "accepted", type: "toggle", props: { label: "Approved" } }],
                    }],
                  },
                ],
              },
              leisure: {
                nodes: [{ kind: "field", id: "destination", type: "richText", props: { label: "Destination notes" } }],
              },
            },
          }],
        },
      ],
    },
    {
      kind: "collection",
      id: "nestedWizard",
      nodes: [{
        kind: "wizard",
        id: "inner",
        stages: [{ id: "note", nodes: [{ kind: "field", id: "note", type: "text", props: { label: "Note" } }] }],
      }],
    },
  ],
} as const satisfies StagesSchema<Value, typeof fields, AppContext>;

const invalidFieldType = {
  id: "invalid-field-type",
  version: 1,
  nodes: [
    { kind: "field", id: "bad", type: "not-registered" },
  ],
} as const;
// @ts-expect-error registry keys are the complete field type vocabulary
const checkedInvalidFieldType: StagesSchema<Value, typeof fields, AppContext> = invalidFieldType;

const invalidFieldProps = {
  id: "invalid-field-props",
  version: 1,
  nodes: [
    { kind: "field", id: "bad", type: "text", props: { min: 2 } },
  ],
} as const;
// @ts-expect-error text props require a label and reject number-only props
const checkedInvalidFieldProps: StagesSchema<Value, typeof fields, AppContext> = invalidFieldProps;
void checkedInvalidFieldType;
void checkedInvalidFieldProps;

const factory: StagesSchemaFactory<Value, typeof fields, AppContext> = ({ context }) => ({
  ...schema,
  nodes: context.canApprove
    ? schema.nodes
    : schema.nodes.filter((node) => node.id !== "nestedWizard"),
});

let accepted: Value = {
  name: "",
  count: 0,
  profile: { email: "" },
  journeys: [],
  nestedWizard: { inner: { note: "" } },
};

const draftExtension: StagesExtensionCodec = {
  encode(value) {
    return typeof value === "string" ? value : "";
  },
  decode(value) {
    return typeof value === "string" ? value : "";
  },
};

const controller = stages({
  schema: factory,
  fields,
  value: accepted,
  context: { canApprove: true, showProfile: true },
  extensionCodecs: { draft: draftExtension },
  extensions: { draft: "local" },
  validationFailureIssue({ kind, validatorId, event, path, address, error }) {
    return {
      code: `validation.${kind}`,
      message: error instanceof Error ? error.message : `Validator ${validatorId} failed on ${event}`,
      meta: { path, address },
    };
  },
  onChange(change) {
    accepted = { ...change.value, name: change.value.name.trimStart() };
    controller.update({ value: accepted });
  },
});
controller.update({ extensions: { draft: "saved" } });

controller.batch(() => {
  for (let index = 0; index < 100; index += 1) {
    controller.dispatch(fieldEvent("input", ["count"], { payload: index, source: "adapter" }));
  }
});
controller.dispatch(formEvent("submit", { source: "user" }));
controller.dispatch(nodeEvent("wizard:next", [{ kind: "node", id: "journeys" }]));

void controller.validate({ scope: "form", event: "submit", reveal: true });
const serialized = controller.serialize();
const recreated = stages({
  schema,
  fields,
  state: serialized,
  context: { canApprove: true, showProfile: true },
  extensionCodecs: { draft: draftExtension },
});
const status: string = controller.getSnapshot().validation.status;
recreated.destroy();
void serialized;
void status;
