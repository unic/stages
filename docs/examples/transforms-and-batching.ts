import {
  fieldEvent,
  stages,
  type FieldDefinition,
  type StagesChange,
  type StagesController,
  type StagesSchema,
  type TransformConfig,
} from "@stages/core";

interface Address {
  readonly line1: string;
  readonly city: string;
}

interface Order {
  profile: { name: string; slug: string };
  quantity: number;
  unitPrice: number;
  total: number;
  country: string;
  region?: string;
  billing: Address;
  shipping: Address;
}

interface LabelProps {
  readonly label: string;
}

const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, LabelProps, "text">;

const number = {
  view: "number",
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<number, LabelProps, "number">;

const address = {
  view: "address",
  initialValue: (): Address => ({ line1: "", city: "" }),
  reduce: ({ event }) => event.name === "address:commit"
    && event.payload !== null
    && typeof event.payload === "object"
    ? { value: event.payload as Address }
    : undefined,
} satisfies FieldDefinition<Address, LabelProps, "address">;

const fields = { text, number, address } as const;

// source:start transform-pipeline
const slugify = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const trimName = {
  on: "blur",
  apply: ({ path, fieldValue }) => [{
    op: "set",
    path,
    value: typeof fieldValue === "string" ? fieldValue.trim() : fieldValue,
  }],
} satisfies TransformConfig<Order>;

const updateSlug = {
  on: "blur",
  when: ({ path }) => path[path.length - 1] === "name",
  // This group transform sees the name after `trimName` ran.
  apply: ({ value }) => [{
    op: "set",
    path: ["profile", "slug"],
    value: slugify(value.profile.name),
  }],
} satisfies TransformConfig<Order>;

const recalculateTotal = {
  on: "input",
  when: ({ path }) => path[0] === "quantity" || path[0] === "unitPrice",
  apply: ({ value }) => [{
    op: "set",
    path: ["total"],
    value: value.quantity * value.unitPrice,
  }],
} satisfies TransformConfig<Order>;

const clearRegion = {
  on: "input",
  apply: () => [{ op: "remove", path: ["region"] }],
} satisfies TransformConfig<Order>;

const copyBillingAddress = {
  on: "address:copy-billing",
  apply: ({ value }) => [{
    op: "set",
    path: ["shipping"],
    value: value.billing,
  }],
} satisfies TransformConfig<Order>;

const schema = {
  id: "order",
  version: 1,
  transforms: [recalculateTotal, copyBillingAddress],
  nodes: [
    {
      kind: "group",
      id: "profile",
      transforms: [updateSlug],
      nodes: [
        { kind: "field", id: "name", type: "text", props: { label: "Name" }, transforms: [trimName] },
        { kind: "field", id: "slug", type: "text", props: { label: "Slug" }, disabled: true },
      ],
    },
    { kind: "field", id: "quantity", type: "number", props: { label: "Quantity" } },
    { kind: "field", id: "unitPrice", type: "number", props: { label: "Unit price" } },
    { kind: "field", id: "total", type: "number", props: { label: "Total" }, disabled: true },
    { kind: "field", id: "country", type: "text", props: { label: "Country" }, transforms: [clearRegion] },
    { kind: "field", id: "region", type: "text", props: { label: "Region" } },
    { kind: "field", id: "billing", type: "address", props: { label: "Billing" } },
    { kind: "field", id: "shipping", type: "address", props: { label: "Shipping" } },
  ],
} as const satisfies StagesSchema<Order, typeof fields>;
// source:end transform-pipeline

const initialOrder: Order = {
  profile: { name: " Ada Lovelace ", slug: "" },
  quantity: 1,
  unitPrice: 10,
  total: 10,
  country: "CH",
  region: "Bern",
  billing: { line1: "Main Street 1", city: "Bern" },
  shipping: { line1: "", city: "" },
};

// source:start explicit-batch
let value = initialOrder;
const changes: StagesChange<Order>[] = [];
let controller!: StagesController<Order, typeof fields>;

controller = stages({
  schema,
  fields,
  value,
  onChange(change) {
    changes.push(change);
    value = change.value;
    controller.update({ value });
  },
});

controller.batch(() => {
  controller.dispatch(fieldEvent("input", ["quantity"], { payload: 3 }));
  controller.dispatch(fieldEvent("input", ["unitPrice"], { payload: 12 }));
});

// After the queued microtask flush, one change contains both events and
// proposes `{ quantity: 3, unitPrice: 12, total: 36, ... }`.
// source:end explicit-batch

export function disposeProcessingExample() {
  controller.destroy();
}

void changes;
