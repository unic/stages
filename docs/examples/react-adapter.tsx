import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  stages,
  type DeepReadonly,
  type FieldDefinition,
  type StagesController,
  type StagesSchema,
  type ValidationIssue,
} from "@stages/core";
import {
  StagesField,
  useStages,
  useStagesCollection,
  useStagesController,
  useStagesField,
  useStagesWizard,
  type ReactFieldProps,
  type ReactFieldView,
} from "@stages/react";

interface LabelProps {
  readonly label: string;
  readonly description?: string;
}

interface SelectProps extends LabelProps {
  readonly options: readonly Readonly<{ value: Plan; label: string }>[];
}

type Plan = "starter" | "team";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Contact {
  id: string;
  email: string;
}

interface ReactFormValue {
  name: string;
  age: number;
  subscribed: boolean;
  plan: Plan;
  location: Coordinates;
  contacts: Contact[];
  checkout: {
    details: { deliveryNote: string };
    review: Record<string, never>;
  };
}

interface ReactContext {
  readonly locale: "en" | "de";
}

function IssueList({ id, issues }: { id: string; issues: readonly ValidationIssue[] }) {
  if (issues.length === 0) return null;
  const hasError = issues.some(issue => issue.severity === "error");
  return <ul id={id} role={hasError ? "alert" : "status"}>
    {issues.map((issue, index) =>
      <li key={`${issue.id}:${index}`}>{issue.message ?? issue.code}</li>)}
  </ul>;
}

function describedBy(id: string, props: LabelProps, issueCount: number) {
  return [props.description ? `${id}-description` : undefined, issueCount ? `${id}-issues` : undefined]
    .filter((item): item is string => item !== undefined)
    .join(" ") || undefined;
}

// source:start react-field-views
export function TextView({ id, field, props, emit }: ReactFieldProps<string, LabelProps>) {
  const hasError = field.state.visibleIssues.some(issue => issue.severity === "error");
  return <div>
    <label htmlFor={id}>{props.label}</label>
    {props.description && <p id={`${id}-description`}>{props.description}</p>}
    <input
      id={id}
      value={field.value}
      disabled={field.state.disabled}
      aria-invalid={hasError || undefined}
      aria-errormessage={hasError ? `${id}-issues` : undefined}
      aria-describedby={describedBy(id, props, field.state.visibleIssues.length)}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", event.currentTarget.value)}
    />
    <IssueList id={`${id}-issues`} issues={field.state.visibleIssues} />
  </div>;
}

export function NumberView({ id, field, props, emit }: ReactFieldProps<number, LabelProps>) {
  return <label htmlFor={id}>
    {props.label}
    <input
      id={id}
      type="number"
      value={field.value}
      disabled={field.state.disabled}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", event.currentTarget.valueAsNumber)}
    />
  </label>;
}

export function CheckboxView({ id, field, props, emit }: ReactFieldProps<boolean, LabelProps>) {
  return <label htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      checked={field.value}
      disabled={field.state.disabled}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", event.currentTarget.checked)}
    />
    {props.label}
  </label>;
}

export function SelectView({ id, field, props, emit }: ReactFieldProps<Plan, SelectProps>) {
  return <label htmlFor={id}>
    {props.label}
    <select
      id={id}
      value={field.value}
      disabled={field.state.disabled}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", event.currentTarget.value)}
    >
      {props.options.map(option =>
        <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

export function CoordinatesView({ id, field, props, emit }: ReactFieldProps<Coordinates, LabelProps>) {
  return <fieldset disabled={field.state.disabled}>
    <legend>{props.label}</legend>
    <label htmlFor={`${id}-latitude`}>Latitude</label>
    <input
      id={`${id}-latitude`}
      type="number"
      value={field.value.latitude}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", {
        ...field.value,
        latitude: event.currentTarget.valueAsNumber,
      })}
    />
    <label htmlFor={`${id}-longitude`}>Longitude</label>
    <input
      id={`${id}-longitude`}
      type="number"
      value={field.value.longitude}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", {
        ...field.value,
        longitude: event.currentTarget.valueAsNumber,
      })}
    />
  </fieldset>;
}
// source:end react-field-views

const text = {
  view: TextView as ReactFieldView<string, LabelProps>,
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, LabelProps, ReactFieldView<string, LabelProps>>;

const number = {
  view: NumberView as ReactFieldView<number, LabelProps>,
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    && Number.isFinite(event.payload)
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<number, LabelProps, ReactFieldView<number, LabelProps>>;

const checkbox = {
  view: CheckboxView as ReactFieldView<boolean, LabelProps>,
  initialValue: false,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "boolean"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<boolean, LabelProps, ReactFieldView<boolean, LabelProps>>;

const select = {
  view: SelectView as ReactFieldView<Plan, SelectProps>,
  initialValue: "starter" as Plan,
  reduce: ({ event }) => event.name === "input"
    && (event.payload === "starter" || event.payload === "team")
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<Plan, SelectProps, ReactFieldView<Plan, SelectProps>>;

const coordinates = {
  view: CoordinatesView as ReactFieldView<Coordinates, LabelProps>,
  initialValue: { latitude: 0, longitude: 0 },
  reduce: ({ event }) => {
    const value = event.payload as Partial<Coordinates> | undefined;
    return event.name === "input" && typeof value?.latitude === "number"
      && typeof value.longitude === "number"
      && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
      ? { value: value as Coordinates }
      : undefined;
  },
} satisfies FieldDefinition<Coordinates, LabelProps, ReactFieldView<Coordinates, LabelProps>>;

export const reactFields = { text, number, checkbox, select, coordinates } as const;

export const reactSchema = {
  id: "react-adapter",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "name",
      type: "text",
      props: { label: "Name", description: "Shown on your account." },
      validators: [{
        id: "required",
        on: "submit",
        revealOn: "submit",
        validate: ({ fieldValue, path }) => typeof fieldValue === "string" && fieldValue.trim()
          ? []
          : [{ id: "required", code: "required", path, severity: "error", message: "Enter a name." }],
      }],
    },
    { kind: "field", id: "age", type: "number", props: { label: "Age" } },
    { kind: "field", id: "subscribed", type: "checkbox", props: { label: "Product updates" } },
    {
      kind: "field",
      id: "plan",
      type: "select",
      props: {
        label: "Plan",
        options: [
          { value: "starter", label: "Starter" },
          { value: "team", label: "Team" },
        ],
      },
    },
    { kind: "field", id: "location", type: "coordinates", props: { label: "Location" } },
    {
      kind: "collection",
      id: "contacts",
      itemKey: item => (item as Contact).id,
      nodes: [{ kind: "field", id: "email", type: "text", props: { label: "Email" } }],
    },
    {
      kind: "wizard",
      id: "checkout",
      navigation: { nonLinear: true },
      stages: [
        {
          id: "details",
          nodes: [{ kind: "field", id: "deliveryNote", type: "text", props: { label: "Delivery note" } }],
        },
        { id: "review", nodes: [] },
      ],
    },
  ],
} as const satisfies StagesSchema<ReactFormValue, typeof reactFields, ReactContext>;

export const initialReactValue: ReactFormValue = {
  name: "",
  age: 18,
  subscribed: false,
  plan: "starter",
  location: { latitude: 47.3769, longitude: 8.5417 },
  contacts: [{ id: "primary", email: "ada@example.test" }],
  checkout: { details: { deliveryNote: "" }, review: {} },
};

// source:start react-lifecycle
export function ReactControllerOwner({
  value,
  locale,
  onAccept,
}: {
  value: ReactFormValue;
  locale: ReactContext["locale"];
  onAccept: (value: ReactFormValue) => void;
}) {
  const onAcceptRef = useRef(onAccept);
  onAcceptRef.current = onAccept;
  const context = useMemo<ReactContext>(() => ({ locale }), [locale]);

  const { controller, snapshot } = useStages(
    () => stages({
      schema: reactSchema,
      fields: reactFields,
      value,
      context,
      onChange: change => onAcceptRef.current(change.value),
    }),
    { value, context, schema: reactSchema },
  );

  return <section data-revision={snapshot.revision}>
    <StagesField controller={controller} path={["name"]} id="account-name" />
  </section>;
}
// source:end react-lifecycle

// source:start react-collection
export function ContactList({
  controller,
}: {
  controller: StagesController<ReactFormValue, typeof reactFields, ReactContext>;
}) {
  const collection = useStagesCollection(controller, ["contacts"] as const);
  const nextId = useRef(1);

  return <fieldset>
    <legend>Contacts</legend>
    {collection.items.map(item => <div key={item.key}>
      <StagesField
        controller={controller}
        path={item.fieldPath("email")}
        id={`contact-${item.key}-email`}
      />
      <button type="button" disabled={!item.canMovePrevious} onClick={() => item.moveTo(item.index - 1)}>
        Move up
      </button>
      <button type="button" disabled={!item.canMoveNext} onClick={() => item.moveTo(item.index + 1)}>
        Move down
      </button>
      <button type="button" disabled={!item.canRemove} onClick={item.remove}>Remove</button>
    </div>)}
    <button
      type="button"
      disabled={!collection.canAdd}
      onClick={() => collection.add({ id: `draft-${nextId.current++}`, email: "" })}
    >
      Add contact
    </button>
  </fieldset>;
}
// source:end react-collection

// source:start react-wizard
export function CheckoutWizard({
  controller,
}: {
  controller: StagesController<ReactFormValue, typeof reactFields, ReactContext>;
}) {
  const wizard = useStagesWizard(controller, ["checkout"]);
  const activeIndex = wizard.stages.findIndex(stage => stage.active);
  const activeStage = wizard.stages[activeIndex];

  return <section aria-labelledby="checkout-heading">
    <h2 id="checkout-heading">Checkout</h2>
    <p>Step {activeIndex + 1} of {wizard.stages.length}</p>
    <ol>
      {wizard.stages.map(stage => <li key={stage.id}>
        <button
          type="button"
          aria-current={stage.active ? "step" : undefined}
          disabled={!wizard.canGo || stage.disabled}
          onClick={() => wizard.go(stage.id)}
        >
          {stage.id}
        </button>
      </li>)}
    </ol>

    {activeStage?.id === "details" && <div role="group" aria-labelledby="details-heading">
      <h3 id="details-heading">Delivery details</h3>
      <StagesField controller={controller} path={["checkout", "details", "deliveryNote"]} />
    </div>}
    {activeStage?.id === "review" && <div role="group" aria-labelledby="review-heading">
      <h3 id="review-heading">Review</h3>
    </div>}

    <button type="button" disabled={!wizard.canPrevious} onClick={wizard.previous}>Previous</button>
    <button type="button" disabled={!wizard.canNext} onClick={wizard.next}>Next</button>
  </section>;
}
// source:end react-wizard

function controlId(issue: ValidationIssue): string | undefined {
  return issue.path.length === 1 && issue.path[0] === "name" ? "account-name" : undefined;
}

// source:start react-accessibility
export function AccessibleForm({
  controller,
  save,
}: {
  controller: StagesController<ReactFormValue, typeof reactFields, ReactContext>;
  save: (value: DeepReadonly<ReactFormValue>) => Promise<void>;
}) {
  const [submitted, setSubmitted] = useState(false);
  const snapshot = useStagesController(controller);
  const visibleIssues = snapshot.validation.visibleIssues;
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (submitted && visibleIssues.length > 0) summaryRef.current?.focus();
  }, [submitted, visibleIssues]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await controller.validate({ event: "submit", reveal: true });
    setSubmitted(true);
    if (result.isValid) await save(controller.getSnapshot().value);
  }

  return <form noValidate onSubmit={submit}>
    {submitted && visibleIssues.length > 0 && <section
      ref={summaryRef}
      tabIndex={-1}
      aria-labelledby="error-summary-heading"
    >
      <h2 id="error-summary-heading">Check the form</h2>
      <ul>{visibleIssues.map(issue => {
        const id = controlId(issue);
        return <li key={`${JSON.stringify(issue.path)}:${issue.id}`}>
          {id
            ? <a href={`#${id}`} onClick={() => document.getElementById(id)?.focus()}>
                {issue.message ?? issue.code}
              </a>
            : issue.message ?? issue.code}
        </li>;
      })}</ul>
    </section>}
    <StagesField controller={controller} path={["name"]} id="account-name" />
    <button type="submit" disabled={snapshot.validation.status === "pending"}>Save</button>
  </form>;
}
// source:end react-accessibility

// source:start react-performance
export const MeasuredNameField = memo(function MeasuredNameField({
  controller,
  onCommit,
}: {
  controller: StagesController<ReactFormValue, typeof reactFields, ReactContext>;
  onCommit: (value: string) => void;
}) {
  const field = useStagesField(controller, ["name"]);

  useEffect(() => {
    onCommit(field.value as string);
  }, [field, onCommit]);

  return <output>{String(field.value)}</output>;
});
// source:end react-performance
