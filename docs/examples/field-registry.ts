import type {
  FieldDefinition,
  FieldRegistry,
} from "@stages/core";

interface TextProps {
  readonly label: string;
  readonly maxLength?: number;
}

interface NumberProps {
  readonly label: string;
  readonly minimum?: number;
}

export interface Money {
  readonly amount: number;
  readonly currency: "CHF" | "EUR";
}

interface MoneyProps {
  readonly label: string;
  readonly currencies: readonly Money["currency"][];
}

function isMoney(value: unknown): value is Money {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Readonly<Record<string, unknown>>;
  return typeof candidate["amount"] === "number"
    && (candidate["currency"] === "CHF" || candidate["currency"] === "EUR");
}

// source:start field-registry
const text = {
  view: "text-input",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
  validators: [{
    id: "text.max-length",
    validate: (value, props) =>
      props.maxLength === undefined || value.length <= props.maxLength
        ? []
        : [{ id: "text.max-length", code: "max-length", severity: "error" }],
  }],
} satisfies FieldDefinition<string, TextProps, "text-input">;

const optionalNumber = {
  view: "number-input",
  initialValue: null,
  reduce: ({ event }) => event.name === "input"
    && (typeof event.payload === "number" || event.payload === null)
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<number | null, NumberProps, "number-input">;

const money = {
  view: "money-editor",
  // Factories return a fresh default for every constructed collection row.
  initialValue: (): Money => ({ amount: 0, currency: "CHF" }),
  reduce: ({ event }) => event.name === "money:commit" && isMoney(event.payload)
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<Money, MoneyProps, "money-editor">;

export const fields = { text, optionalNumber, money } as const;
// source:end field-registry

// `FieldRegistry` is useful for framework-agnostic APIs, but retaining the
// concrete `typeof fields` preserves each definition's value/props/view types.
const genericRegistry: FieldRegistry = fields as unknown as FieldRegistry;
void genericRegistry;
