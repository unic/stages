import {
  stages,
  type FieldDefinition,
  type StagesController,
  type StagesSchema,
  type ValidationIssue,
} from "@stages/core";
import {
  createDomFields,
  mountStages,
  type DomFieldBinding,
  type DomFieldProps,
  type DomFieldView,
  type MountedStages,
} from "@stages/dom";

interface DomProfile {
  name: string;
  age: number | undefined;
  subscribed: boolean;
}

// source:start dom-native-fields
export const domFields = createDomFields();

export const domProfileSchema = {
  id: "dom-profile",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "name",
      type: "text",
      props: {
        label: "Full name",
        description: "Use the name shown on official documents.",
        placeholder: "Ada Lovelace",
        inputType: "text",
        required: true,
        autocomplete: "name",
      },
      validators: [{
        id: "name.required",
        on: "submit",
        revealOn: "submit",
        validate: ({ fieldValue, path }) =>
          typeof fieldValue === "string" && fieldValue.trim().length > 0
            ? []
            : [{
                id: "name.required",
                code: "required",
                path,
                severity: "error",
                message: "Enter your full name.",
              }],
      }],
    },
    {
      kind: "field",
      id: "age",
      type: "number",
      props: { label: "Age", description: "Leave blank if you prefer not to say." },
    },
    {
      kind: "field",
      id: "subscribed",
      type: "checkbox",
      props: { label: "Send product updates" },
    },
  ],
} as const satisfies StagesSchema<DomProfile, typeof domFields>;
// source:end dom-native-fields

// source:start dom-mount-lifecycle
export function mountDomProfile(root: Element, initialValue: DomProfile) {
  let value = initialValue;
  let controller!: StagesController<DomProfile, typeof domFields>;
  controller = stages({
    schema: domProfileSchema,
    fields: domFields,
    value,
    onChange(change) {
      // The DOM adapter proposes events; this owner accepts the next value.
      value = change.value;
      controller.update({ value });
    },
  });

  const mounted = mountStages(root, controller, {
    renderInactiveStages: false,
    onRender(snapshot) {
      root.setAttribute("data-revision", String(snapshot.revision));
      root.setAttribute("data-validation", snapshot.validation.status);
    },
  });

  return {
    controller,
    mounted,
    render: () => mounted.render(),
    destroy() {
      // mountStages borrows the controller, so this owner tears down both.
      mounted.destroy();
      controller.destroy();
    },
  };
}
// source:end dom-mount-lifecycle

// source:start dom-custom-views
interface LabeledProps extends DomFieldProps {
  readonly label: string;
}

interface SelectProps extends LabeledProps {
  readonly options: readonly Readonly<{ value: string; label: string }>[];
}

function issueList(binding: DomFieldBinding): HTMLUListElement | undefined {
  const { document, id, field } = binding;
  if (field.state.visibleIssues.length === 0) return undefined;
  const list = document.createElement("ul");
  list.id = `${id}-issues`;
  list.setAttribute("role", field.state.visibleIssues.some(issue => issue.severity === "error")
    ? "alert"
    : "status");
  for (const issue of field.state.visibleIssues) {
    const item = document.createElement("li");
    item.textContent = issue.message ?? issue.code;
    list.append(item);
  }
  return list;
}

function finishCustomControl(
  binding: DomFieldBinding,
  control: HTMLInputElement | HTMLSelectElement,
  props: LabeledProps,
) {
  const { document, id, field, emit } = binding;
  const wrapper = document.createElement("div");
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = props.label;
  wrapper.append(label, control);

  const describedBy: string[] = [];
  if (props.description !== undefined) {
    const description = document.createElement("p");
    description.id = `${id}-description`;
    description.textContent = props.description;
    describedBy.push(description.id);
    wrapper.append(description);
  }
  const issues = issueList(binding);
  if (issues !== undefined) {
    describedBy.push(issues.id);
    wrapper.append(issues);
  }
  const hasError = field.state.visibleIssues.some(issue => issue.severity === "error");
  if (hasError) {
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-errormessage", `${id}-issues`);
  }
  if (describedBy.length > 0) control.setAttribute("aria-describedby", describedBy.join(" "));
  control.addEventListener("focus", () => emit("focus"));
  control.addEventListener("blur", () => emit("blur"));
  return wrapper;
}

export const selectView: DomFieldView = {
  render(binding) {
    const { document, id, field, emit } = binding;
    const props = field.props as unknown as SelectProps;
    const select = document.createElement("select");
    // mountStages focus helpers look for this exact generated ID.
    select.id = id;
    select.disabled = field.state.disabled;
    for (const option of props.options) {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      select.append(element);
    }
    select.value = typeof field.value === "string" ? field.value : "";
    select.addEventListener("change", () => emit("input", select.value));
    return finishCustomControl(binding, select, props);
  },
};

export const dateView: DomFieldView = {
  render(binding) {
    const { document, id, field, emit } = binding;
    const props = field.props as unknown as LabeledProps;
    const input = document.createElement("input");
    input.id = id;
    input.type = "date";
    input.disabled = field.state.disabled;
    input.value = typeof field.value === "string" ? field.value : "";
    input.addEventListener("input", () => emit("input", input.value));
    return finishCustomControl(binding, input, props);
  },
};

const stringReducer = ({ event }: Parameters<NonNullable<FieldDefinition<string>["reduce"]>>[0]) =>
  event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined;

export const customDomFields = {
  ...createDomFields(),
  select: {
    view: selectView,
    initialValue: "",
    reduce: stringReducer,
  } satisfies FieldDefinition<string, SelectProps, DomFieldView>,
  date: {
    view: dateView,
    initialValue: "",
    reduce: stringReducer,
  } satisfies FieldDefinition<string, LabeledProps, DomFieldView>,
} as const;
// source:end dom-custom-views

// source:start dom-focus
export async function focusDomErrors(
  controller: StagesController<DomProfile, typeof domFields>,
  mounted: MountedStages,
) {
  const result = await controller.validate({ event: "submit", reveal: true });
  if (!result.isValid) return mounted.focusFirstIssue({ preventScroll: false });
  return mounted.focus(["name"], { preventScroll: true });
}
// source:end dom-focus

// source:start dom-accessible-submit
export async function announceDomValidation(
  controller: StagesController<DomProfile, typeof domFields>,
  mounted: MountedStages,
  status: HTMLElement,
) {
  const result = await controller.validate({ event: "submit", reveal: true });
  const errors = result.visibleIssues.filter(
    (issue: ValidationIssue) => issue.severity === "error",
  );
  status.textContent = errors.length === 0
    ? "Ready to submit."
    : `${errors.length} ${errors.length === 1 ? "error" : "errors"} to fix.`;
  if (errors.length > 0) mounted.focusFirstIssue();
  return result;
}
// source:end dom-accessible-submit
