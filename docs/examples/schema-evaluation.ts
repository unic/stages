import {
  evaluateSchema,
  type DynamicMetaSnapshot,
  type StagesSchema,
} from "@stages/core";
import { fields, type Money } from "./field-registry.js";

interface Account {
  profile: {
    displayName: string;
    budget: Money;
  };
  contacts: Array<{ id: string; label: string }>;
  flow: {
    details: { note: string };
    review: Record<string, never>;
  };
}

interface AccountContext {
  readonly locale: "de-CH" | "en-GB";
  readonly canReview: boolean;
}

// source:start recursive-schema
const schema = {
  id: "account-editor",
  version: 1,
  nodes: [
    {
      kind: "group",
      id: "profile",
      nodes: [
        {
          kind: "field",
          id: "displayName",
          type: "text",
          props: { label: "Display name", maxLength: 80 },
        },
        {
          kind: "field",
          id: "budget",
          type: "money",
          props: { label: "Budget", currencies: ["CHF", "EUR"] },
        },
      ],
    },
    {
      kind: "collection",
      id: "contacts",
      itemKey: item => (item as Account["contacts"][number]).id,
      nodes: [{
        kind: "field",
        id: "label",
        type: "text",
        props: { label: "Contact", maxLength: 100 },
      }],
    },
    {
      kind: "wizard",
      id: "flow",
      stages: [
        {
          id: "details",
          nodes: [{
            kind: "field",
            id: "note",
            type: "text",
            props: { label: "Note", maxLength: 500 },
          }],
        },
        { id: "review", when: ({ context }) => context.canReview, nodes: [] },
      ],
    },
  ],
} as const satisfies StagesSchema<Account, typeof fields, AccountContext>;
// source:end recursive-schema

const value: Account = {
  profile: {
    displayName: "Ada",
    budget: { amount: 500, currency: "CHF" },
  },
  contacts: [{ id: "contact-7", label: "Grace" }],
  flow: { details: { note: "Hello" }, review: {} },
};

const meta: DynamicMetaSnapshot = {
  revision: 0,
  isDirty: false,
  touched: [],
  visited: [],
  activeWizards: new Map(),
  extensions: {},
};

// source:start evaluate-schema
const evaluated = evaluateSchema({
  schema,
  fields,
  value,
  context: { locale: "de-CH", canReview: true },
  meta,
});

const contactLabel = evaluated.nodes[1]?.branches[0]?.children[0];
// contactLabel.path:
// ["contacts", 0, "label"]
// contactLabel.address:
// [{ kind: "node", id: "contacts" },
//  { kind: "row", id: "contact-7" },
//  { kind: "node", id: "label" }]
// source:end evaluate-schema

void contactLabel;
