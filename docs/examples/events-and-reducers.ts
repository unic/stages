import {
  fieldEvent,
  formEvent,
  nodeEvent,
  type FieldDefinition,
  type StagesEvent,
} from "@stages/core";

interface InputProps {
  readonly label: string;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

// source:start event-constructors
const quantityInput = fieldEvent("input", ["quantity"], {
  payload: "12",
  source: "adapter",
});

const nextStage = nodeEvent("wizard:next", [
  { kind: "node", id: "checkout" },
]);

const submit = formEvent("submit", { source: "user" });

// Direct event objects use the same public shape.
const custom: StagesEvent<{ readonly tags: readonly string[] }> = {
  name: "tags:commit",
  target: { kind: "field", path: ["tags"] },
  payload: { tags: ["docs", "v1"] },
  source: "user",
};
// source:end event-constructors

// source:start reducer-patterns
const numericText = {
  view: "numeric-text",
  initialValue: null,
  reduce: ({ event }) => {
    if (event.name !== "input" || typeof event.payload !== "string") return;
    const input = event.payload.trim();
    if (input === "") return { value: null };
    const parsed = Number(input);
    return Number.isFinite(parsed) ? { value: parsed } : undefined;
  },
} satisfies FieldDefinition<number | null, InputProps, "numeric-text">;

const identifier = {
  view: "text",
  initialValue: "",
  reduce: ({ value, event }) => {
    if (event.name === "input" && typeof event.payload === "string") {
      return { value: event.payload.replace(/[^a-z0-9-]/gi, "") };
    }
    return event.name === "blur" ? { value: value.trim() } : undefined;
  },
} satisfies FieldDefinition<string, InputProps, "text">;

const tags = {
  view: "tag-editor",
  initialValue: (): readonly string[] => [],
  reduce: ({ event }) => event.name === "tags:commit"
    && isStringArray(event.payload)
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<readonly string[], InputProps, "tag-editor">;

const country = {
  view: "country-select",
  initialValue: "",
  reduce: ({ event, path }) => event.name === "country:select"
    && typeof event.payload === "string"
    ? {
        patches: [
          { op: "set", path, value: event.payload },
          { op: "remove", path: ["region"] },
        ],
      }
    : undefined,
} satisfies FieldDefinition<string, InputProps, "country-select">;

export const reducerFields = { numericText, identifier, tags, country } as const;
// source:end reducer-patterns

void quantityInput;
void nextStage;
void submit;
void custom;
