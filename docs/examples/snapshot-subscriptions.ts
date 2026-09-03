import {
  fieldEvent,
  stages,
  type FieldDefinition,
  type StagesController,
  type StagesSchema,
  type StagesSnapshot,
} from "@stages/core";

interface DashboardValue {
  profile: { name: string };
  count: number;
}

interface LabelProps {
  readonly label: string;
}

const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, LabelProps, "text">;

const number = {
  view: "number",
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<number, LabelProps, "number">;

const fields = { text, number } as const;

const schema = {
  id: "dashboard",
  version: 1,
  nodes: [
    {
      kind: "group",
      id: "profile",
      nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
    },
    { kind: "field", id: "count", type: "number", props: { label: "Count" } },
  ],
} as const satisfies StagesSchema<DashboardValue, typeof fields>;

let value: DashboardValue = { profile: { name: "Ada" }, count: 0 };
let controller!: StagesController<DashboardValue, typeof fields>;

controller = stages({
  schema,
  fields,
  value,
  onChange(change) {
    value = change.value;
    controller.update({ value });
  },
});

interface ValidationSummary {
  readonly status: string;
  readonly visibleIssueCount: number;
}

const selectValidationSummary = (
  snapshot: StagesSnapshot<DashboardValue>,
): ValidationSummary => ({
  status: snapshot.validation.status,
  visibleIssueCount: snapshot.validation.visibleIssues.length,
});

// source:start selector-subscriptions
// Read once for an immediate render; subscribe() does not call immediately.
render(controller.getSnapshot());

const unsubscribeAll = controller.subscribe(() => {
  render(controller.getSnapshot());
});

const unsubscribeName = controller.subscribeSelector(
  snapshot => snapshot.value.profile.name,
  (name, previousName) => {
    console.log(`name changed from ${previousName} to ${name}`);
  },
);

const unsubscribeValidation = controller.subscribeSelector(
  selectValidationSummary,
  summary => renderValidationSummary(summary),
  (left, right) => left.status === right.status
    && left.visibleIssueCount === right.visibleIssueCount,
);

controller.dispatch(fieldEvent("input", ["profile", "name"], {
  payload: "Grace",
}));

export function disposeSnapshotExample() {
  unsubscribeAll();
  unsubscribeName();
  unsubscribeValidation();
  controller.destroy();
}
// source:end selector-subscriptions

function render(_snapshot: StagesSnapshot<DashboardValue>) {}
function renderValidationSummary(_summary: ValidationSummary) {}
