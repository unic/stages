import { useState, type FormEvent } from "react";
import {
  stages,
  type FieldDefinition,
  type StagesSchema,
} from "@stages/core";
import {
  StagesField,
  useStages,
  type ReactFieldProps,
  type ReactFieldView,
} from "@stages/react";

interface Profile {
  displayName: string;
}

interface TextProps {
  readonly label: string;
}

// source:start react-field
function TextField({ id, field, props, emit }: ReactFieldProps<string, TextProps>) {
  const issuesId = `${id}-issues`;
  const hasErrors = field.state.visibleIssues.some(issue => issue.severity === "error");

  return <div>
    <label htmlFor={id}>{props.label}</label>
    <input
      id={id}
      value={field.value}
      disabled={field.state.disabled}
      aria-invalid={hasErrors || undefined}
      aria-errormessage={hasErrors ? issuesId : undefined}
      aria-describedby={field.state.visibleIssues.length ? issuesId : undefined}
      onFocus={() => emit("focus")}
      onBlur={() => emit("blur")}
      onChange={event => emit("input", event.currentTarget.value)}
    />
    {field.state.visibleIssues.length > 0 &&
      <ul id={issuesId} role={hasErrors ? "alert" : "status"}>
        {field.state.visibleIssues.map(issue =>
          <li key={issue.id}>{issue.message ?? issue.code}</li>)}
      </ul>}
  </div>;
}
// source:end react-field

const text = {
  view: TextField as ReactFieldView<string, TextProps>,
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, ReactFieldView<string, TextProps>>;

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

declare function save(value: Profile): Promise<void>;

// source:start react-owner
export function ProfileForm() {
  const [value, setValue] = useState<Profile>({ displayName: "" });
  const { controller, snapshot } = useStages(
    () => stages({
      schema,
      fields,
      value,
      onChange: change => setValue(change.value),
    }),
    { value, schema },
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await controller.validate({ event: "submit", reveal: true });
    if (result.isValid) await save({ ...snapshot.value });
  }

  return <form onSubmit={submit} noValidate>
    <StagesField controller={controller} path={["displayName"]} />
    <button type="submit">Save profile</button>
  </form>;
}
// source:end react-owner
