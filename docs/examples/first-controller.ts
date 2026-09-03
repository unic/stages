import {
  fieldEvent,
  stages,
  type FieldDefinition,
  type StagesController,
  type StagesSchema,
} from "@stages/core";

interface Profile {
  displayName: string;
}

interface TextProps {
  readonly label: string;
}

const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const fields = { text } as const;

const schema = {
  id: "profile",
  version: 1,
  nodes: [{
    kind: "field",
    id: "displayName",
    type: "text",
    props: { label: "Display name" },
  }],
} as const satisfies StagesSchema<Profile, typeof fields>;

// source:start first-controller
let value: Profile = { displayName: "" };
let controller!: StagesController<Profile, typeof fields>;

controller = stages({
  schema,
  fields,
  value,
  onChange(change) {
    // This owner accepts the proposal synchronously.
    value = change.value;
    controller.update({ value });
  },
});

const unsubscribe = controller.subscribe(() => {
  console.log(controller.getSnapshot().value);
});

controller.dispatch(fieldEvent("input", ["displayName"], { payload: "Ada" }));

// Call this when the application owner is removed.
export function disposeFirstController() {
  unsubscribe();
  controller.destroy();
}
// source:end first-controller

export function rejectChanges(initialValue: Profile) {
  return stages({
    schema,
    fields,
    value: initialValue,
    onChange() {
      // No update: the canonical value remains unchanged.
    },
  });
}

export function replaceChanges(initialValue: Profile) {
  let replaced!: StagesController<Profile, typeof fields>;
  replaced = stages({
    schema,
    fields,
    value: initialValue,
    onChange(change) {
      replaced.update({
        value: { displayName: change.value.displayName.trim() },
      });
    },
  });
  return replaced;
}

export function delayChanges(
  initialValue: Profile,
  save: (proposal: Profile) => Promise<Profile>,
) {
  let delayed!: StagesController<Profile, typeof fields>;
  delayed = stages({
    schema,
    fields,
    value: initialValue,
    onChange(change) {
      void save(change.value).then((accepted) => {
        delayed.update({ value: accepted });
      });
    },
  });
  return delayed;
}
