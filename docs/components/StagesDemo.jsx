"use client";

import { useMemo, useState } from "react";
import { fieldEvent, formEvent, stages } from "@stages/core";
import {
  StagesField,
  useStages,
  useStagesCollection,
  useStagesWizard,
} from "@stages/react";
import styles from "./stages-demo.module.css";

function DemoField({ id, field, props, emit }) {
  const issues = field.state.visibleIssues;
  const describedBy = issues.length ? `${id}-issues` : undefined;
  const common = {
    id,
    disabled: field.state.disabled,
    "aria-describedby": describedBy,
    "aria-invalid": issues.some((issue) => issue.severity === "error") || undefined,
    onBlur: () => emit("blur"),
    onFocus: () => emit("focus"),
  };
  return (
    <div className={styles.field} data-disabled={field.state.disabled || undefined}>
      <label htmlFor={id}>{props.label ?? field.id}</label>
      {props.description && <small>{props.description}</small>}
      {props.control === "checkbox" ? (
        <input {...common} type="checkbox" checked={field.value === true} onChange={(event) => emit("input", event.target.checked)} />
      ) : props.options ? (
        <select {...common} value={field.value ?? ""} onChange={(event) => emit("input", event.target.value)}>
          {props.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input {...common} type={props.control ?? "text"} value={field.value ?? ""} placeholder={props.placeholder} onChange={(event) => emit("input", props.control === "number" ? event.target.valueAsNumber : event.target.value)} />
      )}
      {issues.length > 0 && <ul id={describedBy} className={styles.issues}>{issues.map((issue) => <li key={issue.id}>{issue.message ?? issue.code}</li>)}</ul>}
    </div>
  );
}

const text = {
  view: DemoField,
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string" ? { value: event.payload } : undefined,
};
const choice = { ...text };
const checkbox = {
  view: DemoField,
  initialValue: false,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "boolean" ? { value: event.payload } : undefined,
};
const fields = { text, choice, checkbox };

function Frame({ title, description, value, snapshot, children }) {
  return (
    <section className={styles.demo} aria-label={`${title} interactive example`}>
      <div className={styles.heading}><div><strong>{title}</strong><p>{description}</p></div><span className={styles.live}>Live</span></div>
      <div className={styles.surface}>{children}</div>
      <details className={styles.inspector}>
        <summary>Inspect current state</summary>
        <pre>{JSON.stringify({ value, revision: snapshot.revision, validation: snapshot.validation, diagnostics: snapshot.diagnostics }, null, 2)}</pre>
      </details>
    </section>
  );
}

const profileSchema = {
  id: "profile-demo",
  version: 1,
  nodes: [
    { kind: "field", id: "name", type: "text", props: { label: "Display name", description: "Blur an empty field to reveal validation." },
      validators: [{ id: "name.required", on: ["input", "submit"], revealOn: ["blur", "submit"], validate: ({ fieldValue, path }) => fieldValue?.trim() ? [] : [{ id: "name.required", code: "required", message: "Enter a display name.", path, severity: "error" }] }],
      transforms: [{ on: "input", apply: ({ fieldValue }) => [{ op: "set", path: ["slug"], value: String(fieldValue ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") }] }],
    },
    { kind: "field", id: "slug", type: "text", disabled: true, props: { label: "Generated slug", description: "A deterministic transform updates this field." } },
    { kind: "field", id: "plan", type: "choice", props: { label: "Plan", options: [{ value: "personal", label: "Personal" }, { value: "business", label: "Business" }] } },
    { kind: "group", id: "business", when: ({ value }) => value.plan === "business", nodes: [
      { kind: "field", id: "company", type: "text", props: { label: "Company", placeholder: "Unic" } },
    ] },
    { kind: "field", id: "newsletter", type: "checkbox", props: { label: "Product updates", control: "checkbox" } },
  ],
};

function ControlledDemo() {
  const [value, setValue] = useState({ name: "", slug: "", plan: "personal", business: { company: "" }, newsletter: false });
  const { controller, snapshot } = useStages(() => stages({ schema: profileSchema, fields, value, onChange: ({ value: proposal }) => setValue(proposal) }), { value });
  return <Frame title="Controlled profile" description="Reducers, transforms, conditional groups, disabled state, and reveal-on-blur validation." value={value} snapshot={snapshot}>
    <StagesField controller={controller} path={["name"]} />
    <StagesField controller={controller} path={["slug"]} />
    <StagesField controller={controller} path={["plan"]} />
    {snapshot.value.plan === "business" && <StagesField controller={controller} path={["business", "company"]} />}
    <StagesField controller={controller} path={["newsletter"]} />
    <button onClick={() => controller.dispatch(formEvent("submit"))}>Validate form</button>
  </Frame>;
}

const collectionSchema = { id: "collection-demo", version: 1, nodes: [{ kind: "collection", id: "people", min: 1, max: 4, itemKey: (item) => item.id, nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }] }] };
function CollectionDemo() {
  const [value, setValue] = useState({ people: [{ id: "ada", name: "Ada" }, { id: "grace", name: "Grace" }] });
  const { controller, snapshot } = useStages(() => stages({ schema: collectionSchema, fields, value, onChange: ({ value: proposal }) => setValue(proposal) }), { value });
  const collection = useStagesCollection(controller, ["people"]);
  return <Frame title="Stable collection rows" description="Add, remove, and reorder rows while their engine identity follows them." value={value} snapshot={snapshot}>
    {collection.items.map((item) => <div className={styles.row} key={item.key}><StagesField controller={controller} path={item.fieldPath("name")} /><div className={styles.actions}><button disabled={!item.canMovePrevious} onClick={() => item.moveTo(item.index - 1)}>↑</button><button disabled={!item.canMoveNext} onClick={() => item.moveTo(item.index + 1)}>↓</button><button disabled={!item.canRemove} onClick={() => item.remove()}>Remove</button></div><code>{item.key}</code></div>)}
    <button disabled={!collection.canAdd} onClick={() => collection.add({ id: crypto.randomUUID(), name: "New person" })}>Add person</button>
  </Frame>;
}

const wizardSchema = { id: "wizard-demo", version: 1, nodes: [{ kind: "wizard", id: "signup", navigation: { validateCurrent: true, nonLinear: true, guard: (_value, from, to) => !(from === "account" && to === "review") }, stages: [
  { id: "account", nodes: [{ kind: "field", id: "email", type: "text", props: { label: "Email", placeholder: "ada@example.com" }, validators: [{ id: "email.required", on: ["input", "wizard:next", "wizard:go"], revealOn: ["wizard:next", "wizard:go"], validate: ({ fieldValue, path }) => /.+@.+/.test(String(fieldValue)) ? [] : [{ id: "email.required", code: "email", message: "Enter an email address.", path, severity: "error" }] }] }] },
  { id: "profile", nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }] },
  { id: "review", nodes: [{ kind: "field", id: "accepted", type: "checkbox", props: { label: "I accept", control: "checkbox" } }] },
] }] };
function WizardDemo() {
  const [value, setValue] = useState({ signup: { account: { email: "" }, profile: { name: "" }, review: { accepted: false } } });
  const { controller, snapshot } = useStages(() => stages({ schema: wizardSchema, fields, value, onChange: ({ value: proposal }) => setValue(proposal) }), { value });
  const wizard = useStagesWizard(controller, ["signup"]);
  const active = wizard.activeStage;
  return <Frame title="Guarded wizard" description="The current stage validates before navigation; the guard prevents skipping account → review." value={value} snapshot={snapshot}>
    <ol className={styles.steps}>{wizard.stages.map((stage) => <li key={stage.id} data-active={stage.active || undefined}><button disabled={!wizard.canGo || stage.disabled} onClick={() => wizard.go(stage.id)}>{stage.id} · {stage.validation?.status ?? "unknown"}</button></li>)}</ol>
    {active === "account" && <StagesField controller={controller} path={["signup", "account", "email"]} />}
    {active === "profile" && <StagesField controller={controller} path={["signup", "profile", "name"]} />}
    {active === "review" && <StagesField controller={controller} path={["signup", "review", "accepted"]} />}
    <div className={styles.actions}><button disabled={!wizard.canPrevious} onClick={wizard.previous}>Previous</button><button disabled={!wizard.canNext} onClick={wizard.next}>Next</button></div>
  </Frame>;
}

function TransactionDemo() {
  const [value, setValue] = useState({ first: "", last: "" });
  const [changes, setChanges] = useState([]);
  const schema = useMemo(() => ({ id: "batch-demo", version: 1, nodes: [{ kind: "field", id: "first", type: "text", props: { label: "First name" } }, { kind: "field", id: "last", type: "text", props: { label: "Last name" } }] }), []);
  const { controller, snapshot } = useStages(() => stages({ schema, fields, value, onChange: (change) => { setValue(change.value); setChanges((items) => [...items.slice(-3), { transactionId: change.transactionId, events: change.events.map((event) => event.name), patches: change.patches.length }]); } }), { value, schema });
  const fill = () => controller.batch(() => { controller.dispatch(fieldEvent("input", ["first"], { payload: "Ada" })); controller.dispatch(fieldEvent("input", ["last"], { payload: "Lovelace" })); });
  return <Frame title="One batch, one proposal" description="Two events become one controlled transaction and one onChange call." value={value} snapshot={snapshot}><StagesField controller={controller} path={["first"]} /><StagesField controller={controller} path={["last"]} /><button onClick={fill}>Fill in one batch</button><pre>{JSON.stringify(changes, null, 2)}</pre></Frame>;
}

function PersistenceDemo() {
  const [value, setValue] = useState({ note: "Remember me" });
  const [serialized, setSerialized] = useState(null);
  const schema = useMemo(() => ({ id: "persistence-demo", version: 1, nodes: [{ kind: "field", id: "note", type: "text", props: { label: "Durable note" } }] }), []);
  const extensions = useMemo(() => ({ session: { tab: "docs" } }), []);
  const { controller, snapshot } = useStages(() => stages({ schema, fields, value, onChange: ({ value: proposal }) => setValue(proposal), extensions, extensionCodecs: { session: { encode: (item) => item, decode: (item) => item } } }), { value, schema, extensions });
  return <Frame title="Serializable state" description="The envelope contains canonical value, baseline, durable interaction metadata, and registered extensions." value={value} snapshot={snapshot}><StagesField controller={controller} path={["note"]} /><button onClick={() => setSerialized(controller.serialize())}>Serialize state</button>{serialized && <pre>{JSON.stringify(serialized, null, 2)}</pre>}</Frame>;
}

const asyncSchema = {
  id: "async-validation-demo",
  version: 1,
  nodes: [{
    kind: "field",
    id: "username",
    type: "text",
    props: { label: "Username", description: "Try ‘admin’, then type again before the check finishes." },
    validators: [{
      id: "username.available",
      on: "input",
      revealOn: "input",
      validate: ({ fieldValue, path, signal }) => new Promise((resolve) => {
        const timer = setTimeout(() => resolve(fieldValue === "admin" ? [{
          id: "username.available",
          code: "taken",
          message: "That username is taken.",
          path,
          severity: "error",
        }] : []), 650);
        signal.onCancel(() => {
          clearTimeout(timer);
          resolve([]);
        });
      }),
    }],
  }],
};
function AsyncValidationDemo() {
  const [value, setValue] = useState({ username: "" });
  const { controller, snapshot } = useStages(() => stages({ schema: asyncSchema, fields, value, onChange: ({ value: proposal }) => setValue(proposal) }), { value });
  return <Frame title="Cancellable async validation" description="Only the newest value can publish a result; superseded work is cancelled." value={value} snapshot={snapshot}><StagesField controller={controller} path={["username"]} /><output className={styles.status}>Status: {snapshot.validation.status} · pending: {snapshot.validation.pendingCount}</output></Frame>;
}

const diagnosticSchema = ({ context }) => {
  if (context.breakSchema) throw new Error("Simulated remote schema failure");
  return { id: "diagnostic-demo", version: 1, nodes: [{ kind: "field", id: "safe", type: "text", props: { label: "Last valid field" } }] };
};
function DiagnosticDemo() {
  const [value, setValue] = useState({ safe: "Still usable" });
  const [breakSchema, setBreakSchema] = useState(false);
  const context = useMemo(() => ({ breakSchema }), [breakSchema]);
  const { controller, snapshot } = useStages(() => stages({ schema: diagnosticSchema, context, fields, value, onChange: ({ value: proposal }) => setValue(proposal) }), { value, context, schema: diagnosticSchema });
  return <Frame title="Last-valid-tree recovery" description="Break the schema factory: the field stays mounted and the failure becomes a diagnostic." value={value} snapshot={snapshot}><StagesField controller={controller} path={["safe"]} /><button onClick={() => setBreakSchema((current) => !current)}>{breakSchema ? "Recover schema" : "Break schema"}</button></Frame>;
}

const examples = { controlled: ControlledDemo, collection: CollectionDemo, wizard: WizardDemo, transaction: TransactionDemo, persistence: PersistenceDemo, asyncValidation: AsyncValidationDemo, diagnostics: DiagnosticDemo };

export function StagesDemo({ example = "controlled" }) {
  const Example = examples[example];
  if (!Example) return <p>Unknown Stages demo: <code>{example}</code>.</p>;
  return <Example />;
}
