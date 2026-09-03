import { StrictMode, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  stages,
  type FieldDefinition,
  type StagesController,
  type StagesSchema,
  type ValidationIssue,
  type ValidatorConfig,
} from "@stages/core";
import {
  StagesField,
  useStages,
  useStagesCollection,
  useStagesWizard,
  type ReactFieldProps,
  type ReactFieldView,
} from "@stages/react";
import "./styles.css";

interface InputProps {
  readonly label: string;
  readonly placeholder?: string;
  readonly inputType?: string;
}

interface Member {
  id: string;
  name: string;
}

interface WorkspaceValue {
  setup: {
    account: {
      name: string;
      email: string;
    };
    team: {
      members: Member[];
    };
    review: {
      confirmation: string;
    };
  };
}

function TextField({ id, field, props, emit }: ReactFieldProps<string, InputProps>) {
  const issueId = `${id}-issues`;
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        type={props.inputType ?? "text"}
        value={field.value}
        placeholder={props.placeholder}
        disabled={field.state.disabled}
        aria-invalid={field.state.visibleIssues.length > 0 || undefined}
        aria-describedby={field.state.visibleIssues.length > 0 ? issueId : undefined}
        onChange={(event) => emit("input", event.currentTarget.value)}
        onFocus={() => emit("focus")}
        onBlur={() => emit("blur")}
      />
      {field.state.visibleIssues.length > 0 && (
        <ul id={issueId} role="alert">
          {field.state.visibleIssues.map((issue) => (
            <li key={issue.id}>{issue.message ?? issue.code}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const text: FieldDefinition<string, InputProps, ReactFieldView<string, InputProps>> = {
  view: TextField,
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
};
const fields = { text } as const;

function required(id: string, message: string): ValidatorConfig<WorkspaceValue> {
  return {
    id,
    on: ["input", "submit"],
    revealOn: ["blur", "submit"],
    validate({ fieldValue, path }): readonly ValidationIssue[] {
      return typeof fieldValue === "string" && fieldValue.trim().length > 0
        ? []
        : [{ id, code: "required", message, path, severity: "error" }];
    },
  };
}

const schema = {
  id: "react-workspace",
  version: 1,
  nodes: [{
    kind: "wizard",
    id: "setup",
    initialStage: "account",
    navigation: { validateCurrent: true },
    stages: [
      {
        id: "account",
        nodes: [
          {
            kind: "field",
            id: "name",
            type: "text",
            props: { label: "Workspace name", placeholder: "Northwind" },
            validators: [required("workspace-name.required", "Enter a workspace name.")],
          },
          {
            kind: "field",
            id: "email",
            type: "text",
            props: { label: "Contact email", inputType: "email", placeholder: "you@example.com" },
            validators: [required("email.required", "Enter a contact email.")],
          },
        ],
      },
      {
        id: "team",
        nodes: [{
          kind: "collection",
          id: "members",
          min: 1,
          max: 5,
          itemKey: (item) => typeof item === "object" && item !== null && "id" in item
            ? String(item.id)
            : "invalid",
          nodes: [{
            kind: "field",
            id: "name",
            type: "text",
            props: { label: "Member name", placeholder: "Ada Lovelace" },
            validators: [required("member-name.required", "Enter the member's name.")],
          }],
        }],
      },
      {
        id: "review",
        nodes: [{
          kind: "field",
          id: "confirmation",
          type: "text",
          props: { label: "Type CREATE to confirm", placeholder: "CREATE" },
          validators: [{
            id: "confirmation.matches",
            on: ["input", "submit"],
            revealOn: ["blur", "submit"],
            validate({ fieldValue, path }) {
              return fieldValue === "CREATE"
                ? []
                : [{
                    id: "confirmation.matches",
                    code: "confirmation",
                    message: "Type CREATE exactly to finish.",
                    path,
                    severity: "error",
                  }];
            },
          }],
        }],
      },
    ],
  }],
} as const satisfies StagesSchema<WorkspaceValue, typeof fields>;

const initialValue: WorkspaceValue = {
  setup: {
    account: { name: "", email: "" },
    team: { members: [{ id: "member-1", name: "" }] },
    review: { confirmation: "" },
  },
};

type WorkspaceController = StagesController<WorkspaceValue, typeof fields, unknown>;

function AccountStage({ controller }: { readonly controller: WorkspaceController }) {
  return (
    <section aria-labelledby="account-heading">
      <h2 id="account-heading">Workspace details</h2>
      <StagesField controller={controller} path={["setup", "account", "name"]} />
      <StagesField controller={controller} path={["setup", "account", "email"]} />
    </section>
  );
}

function TeamStage({ controller }: { readonly controller: WorkspaceController }) {
  const collection = useStagesCollection(controller, ["setup", "team", "members"] as const);
  const nextId = useRef(collection.items.length + 1);

  return (
    <section aria-labelledby="team-heading">
      <div className="section-heading">
        <div>
          <h2 id="team-heading">Invite your team</h2>
          <p>Add up to five people. Row identity survives moves.</p>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={!collection.canAdd}
          onClick={() => {
            collection.add({ id: `member-${nextId.current}`, name: "" });
            nextId.current += 1;
          }}
        >
          Add member
        </button>
      </div>
      <ol className="members">
        {collection.items.map((item) => (
          <li key={item.key}>
            <StagesField controller={controller} path={item.fieldPath("name")} />
            <div className="row-actions">
              <button type="button" className="quiet" disabled={!item.canMovePrevious} onClick={() => item.moveTo(item.index - 1)}>
                Move up
              </button>
              <button type="button" className="quiet" disabled={!item.canMoveNext} onClick={() => item.moveTo(item.index + 1)}>
                Move down
              </button>
              <button type="button" className="quiet danger" disabled={!item.canRemove} onClick={() => item.remove()}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReviewStage({ controller, value }: {
  readonly controller: WorkspaceController;
  readonly value: WorkspaceValue;
}) {
  return (
    <section aria-labelledby="review-heading">
      <h2 id="review-heading">Review and confirm</h2>
      <dl className="summary">
        <div><dt>Workspace</dt><dd>{value.setup.account.name || "Not provided"}</dd></div>
        <div><dt>Contact</dt><dd>{value.setup.account.email || "Not provided"}</dd></div>
        <div><dt>Team members</dt><dd>{value.setup.team.members.length}</dd></div>
      </dl>
      <StagesField controller={controller} path={["setup", "review", "confirmation"]} />
    </section>
  );
}

function focusFirstError(form: HTMLFormElement | null): void {
  requestAnimationFrame(() => form?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
}

function WorkspaceWizard() {
  const [value, setValue] = useState(initialValue);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const { controller, snapshot } = useStages(
    () => stages({ schema, fields, value: initialValue, onChange: ({ value: proposed }) => setValue(proposed) }),
    { value },
  );
  const wizard = useStagesWizard(controller, ["setup"]);
  const active = wizard.stages.find((stage) => stage.active);

  const next = async () => {
    if (active === undefined) return;
    const validation = await controller.validate({ scope: { address: active.address }, event: "submit", reveal: true });
    if (validation.isValid) {
      setMessage("");
      wizard.next();
    } else {
      setMessage("Please fix the highlighted fields before continuing.");
      focusFirstError(formRef.current);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = await controller.validate({ scope: "form", event: "submit", reveal: true });
    setMessage(validation.isValid
      ? `Workspace “${value.setup.account.name}” is ready to create.`
      : "Please fix the highlighted fields before finishing.");
    if (!validation.isValid) focusFirstError(formRef.current);
  };

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Stages v1 React adapter</p>
        <h1>Build your workspace</h1>
        <p>Typed fields, stable collections, and wizard navigation composed in React.</p>
      </header>

      <form ref={formRef} onSubmit={submit} noValidate>
        <ol className="progress" aria-label="Setup progress">
          {wizard.stages.map((stage) => (
            <li key={stage.id} aria-current={stage.active ? "step" : undefined}>{stage.id}</li>
          ))}
        </ol>

        {wizard.activeStage === "account" && <AccountStage controller={controller} />}
        {wizard.activeStage === "team" && <TeamStage controller={controller} />}
        {wizard.activeStage === "review" && <ReviewStage controller={controller} value={value} />}

        <p className="status" role="status" aria-live="polite">{message}</p>
        <div className="actions">
          <button type="button" className="secondary" disabled={!wizard.canPrevious} onClick={() => wizard.previous()}>
            Previous
          </button>
          {wizard.canNext
            ? <button type="button" onClick={next}>Next</button>
            : <button type="submit">Finish setup</button>}
        </div>
      </form>

      <details>
        <summary>Controlled value and form status</summary>
        <pre>{JSON.stringify({ value: snapshot.value, validation: snapshot.validation }, null, 2)}</pre>
      </details>
    </main>
  );
}

const root = document.querySelector("#root");
if (root === null) throw new Error("Missing React root element.");
createRoot(root).render(<StrictMode><WorkspaceWizard /></StrictMode>);
