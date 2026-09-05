import type { FieldDefinition } from "@stages/core";
import type { JsonObject, JsonValue, StudioDefinitionRef, StudioFieldNode } from "../document/index.js";

export * from "./presentation.js";
export * from "./services.js";
export * from "./codecs.js";

export type StudioFieldKey = "checkbox" | "choice" | "date" | "number" | "text" | "textarea" | "email" | "tel" | "url" | "password" | "time" | "range";
export type StudioFieldValueKind = "boolean" | "number" | "string";
export type StudioInspectorControlKind = "checkbox" | "number" | "select" | "text" | "textarea";

export interface StudioSelectOption {
  readonly label: string;
  readonly value: string;
}

export interface StudioPropControl {
  readonly key: string;
  readonly label: string;
  readonly control: StudioInspectorControlKind;
  readonly defaultValue?: JsonValue;
  readonly required?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly options?: readonly StudioSelectOption[];
}

export interface StudioPropIssue {
  readonly key: string;
  readonly message: string;
}

export interface StudioFieldAccessibilityContract {
  readonly controlRole: "checkbox" | "combobox" | "spinbutton" | "textbox" | "slider";
  readonly labelProp: "label";
  readonly descriptionProp: "helpText";
  readonly keyboard: readonly string[];
}

export interface StudioDefinitionMigration {
  readonly from: StudioDefinitionRef;
  readonly migrateProps: (props: JsonObject) => JsonObject;
}

export interface StudioAuthoringFieldDefinition<
  TKey extends StudioFieldKey = StudioFieldKey,
  TValue extends boolean | number | string = boolean | number | string,
> {
  readonly key: TKey;
  readonly version: 1;
  readonly displayName: string;
  readonly category: "Choice" | "Date and time" | "Text";
  readonly icon: string;
  readonly keywords: readonly string[];
  readonly documentation: string;
  readonly value: {
    readonly kind: StudioFieldValueKind;
    readonly emptyValue: TValue;
  };
  readonly props: readonly StudioPropControl[];
  readonly runtime: FieldDefinition<TValue, JsonObject, TKey>;
  readonly preview: { readonly control: "checkbox" | "date" | "number" | "select" | "text" | "textarea" | "email" | "tel" | "url" | "password" | "time" | "range" };
  readonly accessibility: StudioFieldAccessibilityContract;
  readonly export: { readonly importName: string; readonly module: "@stages/react" };
  readonly legacyTypes: readonly string[];
  readonly migrations: readonly StudioDefinitionMigration[];
}

export type AnyStudioAuthoringFieldDefinition =
  | StudioAuthoringFieldDefinition<StudioFieldKey, boolean>
  | StudioAuthoringFieldDefinition<StudioFieldKey, number>
  | StudioAuthoringFieldDefinition<StudioFieldKey, string>;

const labelControl = Object.freeze({
  key: "label", label: "Label", control: "text", defaultValue: "", required: true,
} satisfies StudioPropControl);
const helpControl = Object.freeze({
  key: "helpText", label: "Help text", control: "textarea", defaultValue: "",
} satisfies StudioPropControl);
const placeholderControl = Object.freeze({
  key: "placeholder", label: "Placeholder", control: "text", defaultValue: "",
} satisfies StudioPropControl);

function inputReducer<TValue extends boolean | number | string>(kind: StudioFieldValueKind) {
  return ({ event }: Parameters<NonNullable<FieldDefinition<TValue>["reduce"]>>[0]) => {
    if (event.name !== "input" || typeof event.payload !== kind) return undefined;
    if (kind === "number" && !Number.isFinite(event.payload)) return undefined;
    return { value: event.payload as TValue };
  };
}

function aliasMigration(key: string): StudioDefinitionMigration {
  return Object.freeze({
    from: Object.freeze({ key, version: 1 }),
    migrateProps: (props: JsonObject) => props,
  });
}

function define<TKey extends StudioFieldKey, TValue extends boolean | number | string>(
  definition: StudioAuthoringFieldDefinition<TKey, TValue>,
): StudioAuthoringFieldDefinition<TKey, TValue> {
  return Object.freeze({
    ...definition,
    keywords: Object.freeze(definition.keywords),
    props: Object.freeze(definition.props),
    runtime: Object.freeze(definition.runtime),
    accessibility: Object.freeze({
      ...definition.accessibility,
      keyboard: Object.freeze(definition.accessibility.keyboard),
    }),
    export: Object.freeze(definition.export),
    legacyTypes: Object.freeze(definition.legacyTypes),
    migrations: Object.freeze(definition.migrations),
  });
}

const text = define({
  key: "text", version: 1, displayName: "Text field", category: "Text", icon: "text-cursor-input",
  keywords: ["input", "short answer", "string"], documentation: "fields/text",
  value: { kind: "string", emptyValue: "" }, props: [labelControl, helpControl, placeholderControl],
  runtime: { view: "text", initialValue: "", reduce: inputReducer<string>("string") },
  preview: { control: "text" },
  accessibility: { controlRole: "textbox", labelProp: "label", descriptionProp: "helpText", keyboard: ["text entry"] },
  export: { module: "@stages/react", importName: "StagesField" }, legacyTypes: ["text"], migrations: [],
});

const textarea = define({
  key: "textarea", version: 1, displayName: "Text area", category: "Text", icon: "align-left",
  keywords: ["long answer", "multiline", "string"], documentation: "fields/textarea",
  value: { kind: "string", emptyValue: "" },
  props: [labelControl, helpControl, placeholderControl, { key: "rows", label: "Rows", control: "number", defaultValue: 4, min: 2, max: 20 }],
  runtime: { view: "textarea", initialValue: "", reduce: inputReducer<string>("string") },
  preview: { control: "textarea" },
  accessibility: { controlRole: "textbox", labelProp: "label", descriptionProp: "helpText", keyboard: ["text entry", "Enter inserts a line"] },
  export: { module: "@stages/react", importName: "StagesField" }, legacyTypes: ["textarea"], migrations: [],
});

const number = define({
  key: "number", version: 1, displayName: "Number", category: "Text", icon: "hash",
  keywords: ["numeric", "amount", "quantity"], documentation: "fields/number",
  value: { kind: "number", emptyValue: 0 },
  props: [labelControl, helpControl, placeholderControl,
    { key: "min", label: "Minimum", control: "number" },
    { key: "max", label: "Maximum", control: "number" },
    { key: "step", label: "Step", control: "number", min: 0 },
  ],
  runtime: { view: "number", initialValue: 0, reduce: inputReducer<number>("number") },
  preview: { control: "number" },
  accessibility: { controlRole: "spinbutton", labelProp: "label", descriptionProp: "helpText", keyboard: ["numeric entry", "Arrow keys adjust value"] },
  export: { module: "@stages/react", importName: "StagesField" }, legacyTypes: ["number"], migrations: [],
});

const choice = define({
  key: "choice", version: 1, displayName: "Choice", category: "Choice", icon: "list-checks",
  keywords: ["select", "dropdown", "option"], documentation: "fields/choice",
  value: { kind: "string", emptyValue: "" },
  props: [labelControl, helpControl, placeholderControl,
    { key: "options", label: "Options", control: "textarea", defaultValue: "" },
  ],
  runtime: { view: "choice", initialValue: "", reduce: inputReducer<string>("string") },
  preview: { control: "select" },
  accessibility: { controlRole: "combobox", labelProp: "label", descriptionProp: "helpText", keyboard: ["Arrow keys choose an option"] },
  export: { module: "@stages/react", importName: "StagesField" }, legacyTypes: ["select"], migrations: [aliasMigration("select")],
});

const checkbox = define({
  key: "checkbox", version: 1, displayName: "Checkbox", category: "Choice", icon: "square-check",
  keywords: ["boolean", "confirm", "toggle"], documentation: "fields/checkbox",
  value: { kind: "boolean", emptyValue: false }, props: [labelControl, helpControl],
  runtime: { view: "checkbox", initialValue: false, reduce: inputReducer<boolean>("boolean") },
  preview: { control: "checkbox" },
  accessibility: { controlRole: "checkbox", labelProp: "label", descriptionProp: "helpText", keyboard: ["Space toggles the value"] },
  export: { module: "@stages/react", importName: "StagesField" }, legacyTypes: ["checkbox"], migrations: [],
});

const date = define({
  key: "date", version: 1, displayName: "Date", category: "Date and time", icon: "calendar-days",
  keywords: ["calendar", "day", "ISO date"], documentation: "fields/date",
  value: { kind: "string", emptyValue: "" }, props: [labelControl, helpControl,
    { key: "min", label: "Earliest date", control: "text" },
    { key: "max", label: "Latest date", control: "text" },
  ],
  runtime: { view: "date", initialValue: "", reduce: inputReducer<string>("string") },
  preview: { control: "date" },
  accessibility: { controlRole: "textbox", labelProp: "label", descriptionProp: "helpText", keyboard: ["Enter a date with the browser date control"] },
  export: { module: "@stages/react", importName: "StagesField" }, legacyTypes: ["calendar"], migrations: [aliasMigration("calendar")],
});

// Native input variants share the same controlled string contract as text.
function textInput<TKey extends "email" | "tel" | "url" | "password" | "time">(key: TKey, displayName: string, icon: string) {
  return define({
    ...text, key, displayName, icon, category: key === "time" ? "Date and time" : "Text",
    keywords: [key, displayName.toLowerCase()], documentation: `fields/${key}`,
    runtime: { view: key, initialValue: "", reduce: inputReducer<string>("string") },
    preview: { control: key }, legacyTypes: [], migrations: [],
  });
}
const email = textInput("email", "Email", "mail");
const tel = textInput("tel", "Phone", "phone");
const url = textInput("url", "Website", "link");
const password = textInput("password", "Password", "lock-keyhole");
const time = textInput("time", "Time", "clock");
const range = define({
  ...number, key: "range", displayName: "Slider", icon: "sliders-horizontal",
  keywords: ["range", "slider", "scale"], documentation: "fields/range",
  props: [labelControl, helpControl,
    { key: "min", label: "Minimum", control: "number", defaultValue: 0 },
    { key: "max", label: "Maximum", control: "number", defaultValue: 100 },
    { key: "step", label: "Step", control: "number", defaultValue: 1, min: 0.01 },
  ],
  runtime: { view: "range", initialValue: 0, reduce: inputReducer<number>("number") },
  preview: { control: "range" },
  accessibility: { ...number.accessibility, controlRole: "slider", keyboard: ["Arrow keys adjust value", "Home and End select bounds"] },
  legacyTypes: [], migrations: [],
});

export const STUDIO_FIELD_DEFINITIONS = Object.freeze({ text, textarea, number, choice, checkbox, date, email, tel, url, password, time, range });
export type StudioRuntimeFieldDefinition =
  | FieldDefinition<boolean, JsonObject, StudioFieldKey>
  | FieldDefinition<number, JsonObject, StudioFieldKey>
  | FieldDefinition<string, JsonObject, StudioFieldKey>
  | FieldDefinition<unknown, JsonObject, string>;

export interface StudioFieldRegistry extends Readonly<Record<string, StudioRuntimeFieldDefinition>> {
  readonly text: (typeof text)["runtime"];
  readonly textarea: (typeof textarea)["runtime"];
  readonly number: (typeof number)["runtime"];
  readonly choice: (typeof choice)["runtime"];
  readonly checkbox: (typeof checkbox)["runtime"];
  readonly date: (typeof date)["runtime"];
  readonly email: (typeof email)["runtime"];
  readonly tel: (typeof tel)["runtime"];
  readonly url: (typeof url)["runtime"];
  readonly password: (typeof password)["runtime"];
  readonly time: (typeof time)["runtime"];
  readonly range: (typeof range)["runtime"];

}

export const STUDIO_RUNTIME_FIELDS: StudioFieldRegistry = Object.freeze(Object.fromEntries(
  Object.values(STUDIO_FIELD_DEFINITIONS).map((definition) => [definition.key, definition.runtime]),
) as unknown as StudioFieldRegistry);

export const STUDIO_SUPPORTED_DEFINITIONS: Readonly<Record<string, readonly number[]>> = Object.freeze(Object.fromEntries(
  Object.values(STUDIO_FIELD_DEFINITIONS).map(({ key, version }) => [key, Object.freeze([version])]),
));

export function studioFieldDefinition(reference: StudioDefinitionRef): AnyStudioAuthoringFieldDefinition | undefined {
  const definition = STUDIO_FIELD_DEFINITIONS[reference.key as StudioFieldKey];
  return definition?.version === reference.version ? definition : undefined;
}

export function migrateStudioFieldReference(
  reference: StudioDefinitionRef,
  props: JsonObject,
): { readonly definition: StudioDefinitionRef; readonly props: JsonObject } | undefined {
  const current = studioFieldDefinition(reference);
  if (current) return { definition: reference, props };
  for (const definition of Object.values(STUDIO_FIELD_DEFINITIONS)) {
    const migration = definition.migrations.find(({ from }) => from.key === reference.key && from.version === reference.version);
    if (migration) return {
      definition: { key: definition.key, version: definition.version },
      props: migration.migrateProps(props),
    };
  }
  return undefined;
}

export function validateStudioFieldProps(
  definition: AnyStudioAuthoringFieldDefinition,
  props: JsonObject,
): readonly StudioPropIssue[] {
  const issues: StudioPropIssue[] = [];
  for (const control of definition.props) {
    const value = props[control.key];
    if (control.required && (typeof value !== "string" || value.trim().length === 0)) {
      issues.push({ key: control.key, message: `${control.label} is required.` });
      continue;
    }
    if (value === undefined) continue;
    if (control.control === "checkbox" && typeof value !== "boolean") issues.push({ key: control.key, message: `${control.label} must be true or false.` });
    if (control.control === "number" && (typeof value !== "number" || !Number.isFinite(value))) issues.push({ key: control.key, message: `${control.label} must be a finite number.` });
    if ((control.control === "text" || control.control === "textarea" || control.control === "select") && typeof value !== "string") issues.push({ key: control.key, message: `${control.label} must be text.` });
    if (typeof value === "number" && control.min !== undefined && value < control.min) issues.push({ key: control.key, message: `${control.label} must be at least ${control.min}.` });
    if (typeof value === "number" && control.max !== undefined && value > control.max) issues.push({ key: control.key, message: `${control.label} must be at most ${control.max}.` });
  }
  const min = props["min"];
  const max = props["max"];
  if (typeof min === "number" && typeof max === "number" && min > max) issues.push({ key: "max", message: "Maximum must be greater than or equal to minimum." });
  return issues;
}

export function createStudioFieldNode(
  definition: AnyStudioAuthoringFieldDefinition,
  identity: Pick<StudioFieldNode, "runtimeId" | "uid">,
): StudioFieldNode {
  return {
    ...identity,
    kind: "field",
    definition: { key: definition.key, version: definition.version },
    props: Object.fromEntries(definition.props.flatMap((control) => (
      control.defaultValue === undefined ? [] : [[control.key, control.defaultValue]]
    ))) as JsonObject,
  };
}
