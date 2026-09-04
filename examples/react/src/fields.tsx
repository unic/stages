import type { FieldDefinition, FieldSnapshot } from "@stages/core";
import type { ReactFieldProps, ReactFieldView } from "@stages/react";
import {
  createEventLaunchFields,
  type BaseFieldProps,
  type CheckboxFieldProps,
  type ChoiceFieldProps,
  type MoneyFieldProps,
  type NumberFieldProps,
  type TextFieldProps,
} from "../../shared/event-launch/index.js";

function Issues({ id, field }: { readonly id: string; readonly field: FieldSnapshot }) {
  if (field.state.visibleIssues.length === 0) return null;
  return <ul id={`${id}-issues`} className="field-issues" role={field.state.visibleIssues.some((entry) => entry.severity === "error") ? "alert" : "status"}>
    {field.state.visibleIssues.map((entry) => <li key={entry.id}>{entry.message ?? entry.code}</li>)}
  </ul>;
}

function Description({ id, text }: { readonly id: string; readonly text: string | undefined }) {
  return text === undefined ? null : <p id={`${id}-description`} className="field-description">{text}</p>;
}

function a11y(id: string, field: FieldSnapshot, description?: string) {
  const hasErrors = field.state.visibleIssues.some((entry) => entry.severity === "error");
  const describedBy = [description === undefined ? undefined : `${id}-description`, field.state.visibleIssues.length === 0 ? undefined : `${id}-issues`].filter(Boolean).join(" ") || undefined;
  return { "aria-invalid": hasErrors || undefined, "aria-describedby": describedBy, "aria-errormessage": hasErrors ? `${id}-issues` : undefined };
}

function Label({ id, props }: { readonly id: string; readonly props: BaseFieldProps }) {
  return <label htmlFor={id}>{props.label}{props.required === true && <span className="required" aria-hidden="true"> *</span>}</label>;
}

const TextField: ReactFieldView<string, TextFieldProps> = ({ id, field, props, emit }: ReactFieldProps<string, TextFieldProps>) => <div className="field">
  <Label id={id} props={props} />
  <input id={id} type={props.inputType ?? "text"} value={field.value} placeholder={props.placeholder} autoComplete={props.autocomplete} required={props.required} disabled={field.state.disabled} {...a11y(id, field, props.description)} onChange={(event) => emit("input", event.currentTarget.value)} onFocus={() => emit("focus")} onBlur={() => emit("blur")} />
  <Description id={id} text={props.description} /><Issues id={id} field={field} />
</div>;

const TextareaField: ReactFieldView<string, BaseFieldProps> = ({ id, field, props, emit }) => <div className="field span-2">
  <Label id={id} props={props} />
  <textarea id={id} value={field.value} placeholder={props.placeholder} required={props.required} disabled={field.state.disabled} {...a11y(id, field, props.description)} onChange={(event) => emit("input", event.currentTarget.value)} onFocus={() => emit("focus")} onBlur={() => emit("blur")} />
  <Description id={id} text={props.description} /><Issues id={id} field={field} />
</div>;

const ChoiceField: ReactFieldView<string, ChoiceFieldProps> = ({ id, field, props, emit }) => <div className="field">
  <fieldset id={id} className="choice-field" disabled={field.state.disabled} aria-describedby={props.description === undefined ? undefined : `${id}-description`}>
    <legend>{props.label}{props.required === true && <span className="required" aria-hidden="true"> *</span>}</legend>
    <div className="choice-options">{props.options.map((option) => <label key={option.value}>
      <input type="radio" name={id} value={option.value} checked={field.value === option.value} onChange={() => emit("input", option.value)} onFocus={() => emit("focus")} onBlur={() => emit("blur")} />{option.label}
    </label>)}</div>
  </fieldset>
  <Description id={id} text={props.description} /><Issues id={id} field={field} />
</div>;

function NumberInput({ id, field, props, emit }: ReactFieldProps<number | undefined, NumberFieldProps | MoneyFieldProps>) {
  return <div className="field">
    <Label id={id} props={props} />
    <div className="number-wrap"><input id={id} type="number" value={field.value ?? ""} min={props.min} max={props.max} step={props.step} disabled={field.state.disabled} {...a11y(id, field, props.description)} onChange={(event) => emit("input", event.currentTarget.value === "" ? undefined : event.currentTarget.valueAsNumber)} onFocus={() => emit("focus")} onBlur={() => emit("blur")} />
      <span>{"currency" in props ? props.currency : props.suffix}</span></div>
    <Description id={id} text={props.description} /><Issues id={id} field={field} />
  </div>;
}

const NumberField: ReactFieldView<number | undefined, NumberFieldProps> = NumberInput;
const MoneyField: ReactFieldView<number | undefined, MoneyFieldProps> = NumberInput;
const CheckboxField: ReactFieldView<boolean, CheckboxFieldProps> = ({ id, field, props, emit }) => <div className="field span-2">
  <label className="checkbox-label" htmlFor={id}><input id={id} type="checkbox" checked={field.value} disabled={field.state.disabled} onChange={(event) => emit("input", event.currentTarget.checked)} onFocus={() => emit("focus")} onBlur={() => emit("blur")} />{props.label}{props.required === true && <span className="required" aria-hidden="true"> *</span>}</label>
  <Description id={id} text={props.description} /><Issues id={id} field={field} />
</div>;

export const eventLaunchReactFields = createEventLaunchFields({
  text: TextField,
  textarea: TextareaField,
  choice: ChoiceField,
  number: NumberField,
  money: MoneyField,
  checkbox: CheckboxField,
} satisfies Readonly<Record<string, FieldDefinition<unknown, unknown, unknown>["view"]>>);
