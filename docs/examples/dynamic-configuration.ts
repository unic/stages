import {
  stages,
  type FieldDefinition,
  type StagesController,
  type StagesExtensionCodec,
  type StagesSchemaFactory,
} from "@stages/core";

interface AccountValue {
  plan: "personal" | "business";
  name: string;
  company: { name: string };
  notes: string;
  advancedCode: string;
  flow: {
    details: Record<string, never>;
    review: Record<string, never>;
  };
}

interface AccountContext {
  readonly canEdit: boolean;
  readonly enableNotes: boolean;
  readonly canReview: boolean;
  readonly messages: {
    readonly name: string;
    readonly company: string;
    readonly notes: string;
    readonly advancedCode: string;
  };
}

interface DraftPreferences {
  readonly showAdvanced: boolean;
}

interface TextProps {
  readonly label: string;
}

const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const fields = { text } as const;

// source:start dynamic-schema
const accountSchema = (({ context }) => ({
  id: "account",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "name",
      type: "text",
      props: { label: "Name" },
      disabled: !context.canEdit,
      deriveProps: ({ context: current }) => ({ label: current.messages.name }),
    },
    {
      kind: "group",
      id: "company",
      // `when` keeps this identity dormant while the personal plan is active.
      when: ({ value }) => value.plan === "business",
      disabled: ({ context: current }) => !current.canEdit,
      nodes: [{
        kind: "field",
        id: "name",
        type: "text",
        props: { label: "Company" },
        deriveProps: ({ context: current }) => ({ label: current.messages.company }),
      }],
    },
    // Factory removal is structural: the notes identity is absent when false.
    ...(context.enableNotes ? [{
      kind: "field" as const,
      id: "notes",
      type: "text" as const,
      props: { label: context.messages.notes },
    }] : []),
    {
      kind: "field",
      id: "advancedCode",
      type: "text",
      when: ({ meta }) =>
        (meta.extensions["draft"] as DraftPreferences | undefined)?.showAdvanced === true,
      props: { label: "Advanced code" },
      deriveProps: ({ context: current }) => ({ label: current.messages.advancedCode }),
    },
    {
      kind: "wizard",
      id: "flow",
      stages: [
        { id: "details", nodes: [] },
        { id: "review", when: ({ context: current }) => current.canReview, nodes: [] },
      ],
    },
  ],
})) satisfies StagesSchemaFactory<AccountValue, typeof fields, AccountContext>;
// source:end dynamic-schema

const draftCodec: StagesExtensionCodec = {
  encode(value) {
    return { showAdvanced: (value as DraftPreferences).showAdvanced };
  },
  decode(value) {
    const candidate = value !== null && typeof value === "object" && !Array.isArray(value)
      ? value as Readonly<Record<string, unknown>>
      : {};
    return { showAdvanced: candidate["showAdvanced"] === true } satisfies DraftPreferences;
  },
};

const english: AccountContext = {
  canEdit: true,
  enableNotes: true,
  canReview: false,
  messages: {
    name: "Name",
    company: "Company",
    notes: "Notes",
    advancedCode: "Advanced code",
  },
};

const german: AccountContext = {
  ...english,
  canReview: true,
  messages: {
    name: "Name",
    company: "Firma",
    notes: "Notizen",
    advancedCode: "Erweiterter Code",
  },
};

export function createDynamicAccountController(): StagesController<
  AccountValue,
  typeof fields,
  AccountContext
> {
  const controller = stages({
    schema: accountSchema,
    fields,
    value: {
      plan: "personal",
      name: "Ada",
      company: { name: "Analytical Engines" },
      notes: "",
      advancedCode: "",
      flow: { details: {}, review: {} },
    },
    context: english,
    extensionCodecs: { draft: draftCodec },
    extensions: { draft: { showAdvanced: false } satisfies DraftPreferences },
  });

// source:start dynamic-updates
// These replace owner inputs and schedule reevaluation; none calls onChange.
controller.update({ context: german });
controller.update({ extensions: { draft: { showAdvanced: true } } });
controller.update({ schema: accountSchema });
// source:end dynamic-updates

  return controller;
}
