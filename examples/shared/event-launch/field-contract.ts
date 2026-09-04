import type { FieldDefinition, FieldValidationIssue } from "@stages/core";

export interface BaseFieldProps {
  readonly label: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
}

export interface TextFieldProps extends BaseFieldProps {
  readonly inputType?: string;
  readonly autocomplete?: string;
}

export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
}

export interface ChoiceFieldProps extends BaseFieldProps {
  readonly options: readonly ChoiceOption[];
}

export interface NumberFieldProps extends BaseFieldProps {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly suffix?: string;
}

export interface MoneyFieldProps extends NumberFieldProps {
  readonly currency: string;
  readonly locale: string;
}

export interface CheckboxFieldProps extends BaseFieldProps {}

export interface EventLaunchViews {
  readonly text: unknown;
  readonly textarea: unknown;
  readonly choice: unknown;
  readonly number: unknown;
  readonly money: unknown;
  readonly checkbox: unknown;
}

export type EventLaunchFields<TViews extends EventLaunchViews = EventLaunchViews> = Readonly<{
  text: FieldDefinition<string, TextFieldProps, TViews["text"]>;
  textarea: FieldDefinition<string, BaseFieldProps, TViews["textarea"]>;
  choice: FieldDefinition<string, ChoiceFieldProps, TViews["choice"]>;
  number: FieldDefinition<number | undefined, NumberFieldProps, TViews["number"]>;
  money: FieldDefinition<number | undefined, MoneyFieldProps, TViews["money"]>;
  checkbox: FieldDefinition<boolean, CheckboxFieldProps, TViews["checkbox"]>;
}>;

const requiredTextIssue = (message = "This field is required.") => ({
  id: "field.required",
  code: "required",
  message,
  severity: "error" as const,
});

function requiredString(value: string, props: BaseFieldProps): readonly FieldValidationIssue[] {
  return props.required === true && value.trim().length === 0 ? [requiredTextIssue()] : [];
}

function stringReducer({ event }: Parameters<NonNullable<FieldDefinition<string>["reduce"]>>[0]) {
  return event.name === "input" && typeof event.payload === "string" ? { value: event.payload } : undefined;
}

function numberReducer({ event }: Parameters<NonNullable<FieldDefinition<number | undefined>["reduce"]>>[0]) {
  return event.name === "input" && (typeof event.payload === "number" || event.payload === undefined)
    ? { value: event.payload }
    : undefined;
}

export function createEventLaunchFields<TViews extends EventLaunchViews>(views: TViews): EventLaunchFields<TViews> {
  return {
    text: { view: views.text, initialValue: "", reduce: stringReducer, validators: [{ id: "text.required", validate: requiredString }] },
    textarea: { view: views.textarea, initialValue: "", reduce: stringReducer, validators: [{ id: "textarea.required", validate: requiredString }] },
    choice: { view: views.choice, initialValue: "", reduce: stringReducer, validators: [{ id: "choice.required", validate: requiredString }] },
    number: { view: views.number, reduce: numberReducer },
    money: { view: views.money, reduce: numberReducer },
    checkbox: {
      view: views.checkbox,
      initialValue: false,
      reduce: ({ event }) => event.name === "input" && typeof event.payload === "boolean"
        ? { value: event.payload }
        : undefined,
    },
  };
}
