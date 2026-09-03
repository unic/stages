import {
  fieldEvent,
  formEvent,
  nodeEvent,
  stages,
  type DataPath,
  type FieldDefinition,
  type NodeAddress,
  type NodeConfig,
  type SerializedStagesState,
  type StagesController,
  type StagesSchema,
  type StagesSchemaFactory,
  type StagesSnapshot,
  type TransformConfig,
  type ValidatorConfig,
} from "@stages/core";

// source:start migration-controlled
interface V1Profile {
  name: string;
}

interface MigrationTextProps {
  readonly label: string;
}

export const migrationText = {
  view: "text-input",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, MigrationTextProps, "text-input">;

export const migrationFields = { text: migrationText } as const;

export const migrationProfileSchema = {
  id: "profile",
  version: 1,
  nodes: [{
    kind: "field",
    id: "name",
    type: "text",
    props: { label: "Name" },
  }],
} as const satisfies StagesSchema<V1Profile, typeof migrationFields>;

export function createMigratedProfile(
  initialValue: V1Profile,
  onAccepted: (value: V1Profile) => void,
) {
  let value = initialValue;
  let controller!: StagesController<V1Profile, typeof migrationFields>;
  controller = stages({
    schema: migrationProfileSchema,
    fields: migrationFields,
    value,
    onChange(change) {
      value = change.value;
      onAccepted(value);
      controller.update({ value });
    },
  });
  return controller;
}
// source:end migration-controlled

// source:start migration-schema-data
interface RegistrationValue {
  account: { name: string };
  contacts: { id: string; email: string }[];
  billing: { street: string; city: string };
}

interface RegistrationContext {
  readonly collectBilling: boolean;
}

function addressNodes(): readonly NodeConfig<
  RegistrationValue,
  typeof migrationFields,
  RegistrationContext
>[] {
  return [
    { kind: "field", id: "street", type: "text", props: { label: "Street" } },
    { kind: "field", id: "city", type: "text", props: { label: "City" } },
  ];
}

export const registrationSchema = (({ context }) => ({
  id: "registration",
  version: 1,
  nodes: [
    {
      kind: "group",
      id: "account",
      nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
    },
    {
      kind: "collection",
      id: "contacts",
      itemKey: item => (item as RegistrationValue["contacts"][number]).id,
      nodes: [{ kind: "field", id: "email", type: "text", props: { label: "Email" } }],
    },
    {
      kind: "group",
      id: "billing",
      when: context.collectBilling,
      nodes: addressNodes(),
    },
  ],
})) satisfies StagesSchemaFactory<
  RegistrationValue,
  typeof migrationFields,
  RegistrationContext
>;

export const accountNamePath = ["account", "name"] as const satisfies DataPath;
export const secondContactEmailPath = ["contacts", 1, "email"] as const satisfies DataPath;
// source:end migration-schema-data

interface MigratedOrder {
  quantity: number;
  price: number;
  customer: string;
  country: string;
  region?: string;
  total: number;
  lines: { id: string; label: string }[];
}

const migrationNumber = {
  view: "number-input",
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    ? { value: Math.trunc(event.payload) }
    : undefined,
} satisfies FieldDefinition<number>;

// source:start migration-processing
const migrationCurrency = {
  view: "currency-input",
  initialValue: 0,
  reduce: ({ event }) => {
    if (event.name !== "input" || typeof event.payload !== "string") return undefined;
    const filtered = event.payload.replace(/[^0-9.-]/g, "");
    const parsed = Number(filtered);
    return { value: Number.isFinite(parsed) ? parsed : 0 };
  },
} satisfies FieldDefinition<number>;

const processingFields = {
  text: migrationText,
  integer: migrationNumber,
  currency: migrationCurrency,
} as const;

const computeTotal = {
  on: "input",
  when: ({ path }) => path[0] === "quantity" || path[0] === "price",
  apply: ({ value }) => [{
    op: "set",
    path: ["total"],
    value: value.quantity * value.price,
  }],
} satisfies TransformConfig<MigratedOrder>;

const processingSchema = {
  id: "processing-migration",
  version: 1,
  transforms: [
    computeTotal,
    {
      on: "input",
      when: ({ path }) => path[0] === "country",
      apply: () => [{ op: "remove", path: ["region"] }],
    },
    {
      on: "promotion:apply",
      apply: ({ value, event }) => [{
        op: "set",
        path: ["total"],
        value: value.total * (1 - Number(event.payload) / 100),
      }],
    },
  ],
  nodes: [
    { kind: "field", id: "quantity", type: "integer" },
    {
      kind: "field",
      id: "price",
      type: "currency",
      transforms: [{
        on: "blur",
        apply: ({ path, fieldValue }) => [{
          op: "set",
          path,
          value: Number(Number(fieldValue).toFixed(2)),
        }],
      }],
    },
    {
      kind: "field",
      id: "customer",
      type: "text",
      transforms: [{
        on: "blur",
        apply: ({ path, fieldValue }) => [{
          op: "set",
          path,
          value: typeof fieldValue === "string" ? fieldValue.trim() : fieldValue,
        }],
      }],
    },
    { kind: "field", id: "country", type: "text" },
    { kind: "field", id: "region", type: "text" },
    { kind: "field", id: "total", type: "currency", disabled: true },
    {
      kind: "collection",
      id: "lines",
      itemKey: item => (item as MigratedOrder["lines"][number]).id,
      nodes: [{ kind: "field", id: "label", type: "text" }],
    },
  ],
} as const satisfies StagesSchema<MigratedOrder, typeof processingFields>;

export function applyProcessingActions(
  controller: StagesController<MigratedOrder, typeof processingFields>,
) {
  controller.dispatch(fieldEvent("blur", ["price"]));
  controller.dispatch(fieldEvent("blur", ["customer"]));
  controller.dispatch(formEvent("promotion:apply", { payload: 10 }));
  controller.dispatch(nodeEvent("collection:sort", [{ kind: "node", id: "lines" }], {
    payload: { order: [1, 0] },
  }));
}

export const migratedProcessingSchema = processingSchema;
// source:end migration-processing

// source:start migration-validation
interface MigratedSignup {
  email: string;
  confirmation: string;
}

const confirmationMatches = {
  id: "confirmation.matches",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  dependencies: [["email"]],
  validate: ({ value, fieldValue, path }) => fieldValue === value.email
    ? []
    : [{
        id: "confirmation.matches",
        code: "mismatch",
        path,
        severity: "error",
        message: "Email addresses must match.",
      }],
} satisfies ValidatorConfig<MigratedSignup>;

const emailAvailable = {
  id: "email.available",
  on: "blur",
  revealOn: ["blur", "submit"],
  async validate({ fieldValue, path, signal }) {
    await Promise.resolve();
    if (signal.aborted) return [];
    return fieldValue === "taken@example.com"
      ? [{
          id: "email.available",
          code: "taken",
          path,
          severity: "error" as const,
          message: "That email is already registered.",
        }]
      : [];
  },
} satisfies ValidatorConfig<MigratedSignup>;

export const migratedValidationSchema = {
  id: "signup-validation",
  version: 1,
  nodes: [
    { kind: "field", id: "email", type: "text", validators: [emailAvailable] },
    {
      kind: "field",
      id: "confirmation",
      type: "text",
      validators: [confirmationMatches],
    },
  ],
} as const satisfies StagesSchema<MigratedSignup, typeof migrationFields>;

export async function validateMigratedSignup(
  controller: StagesController<MigratedSignup, typeof migrationFields>,
) {
  return controller.validate({ scope: "form", event: "submit", reveal: true });
}
// source:end migration-validation

// source:start migration-structures
interface MigratedJourney {
  contacts: { id: string; email: string }[];
  onboarding: {
    account: { name: string };
    review: Record<string, never>;
  };
}

export const migratedJourneySchema = {
  id: "journey",
  version: 1,
  nodes: [
    {
      kind: "collection",
      id: "contacts",
      itemKey: item => (item as MigratedJourney["contacts"][number]).id,
      nodes: [{ kind: "field", id: "email", type: "text" }],
    },
    {
      kind: "wizard",
      id: "onboarding",
      initialStage: "account",
      navigation: { validateCurrent: true, nonLinear: false },
      stages: [
        {
          id: "account",
          nodes: [{ kind: "field", id: "name", type: "text" }],
        },
        { id: "review", nodes: [] },
      ],
    },
  ],
} as const satisfies StagesSchema<MigratedJourney, typeof migrationFields>;

const contactsAddress = [{ kind: "node", id: "contacts" }] as const;
const onboardingAddress = [{ kind: "node", id: "onboarding" }] as const;

export function migrateStructuralActions(
  controller: StagesController<MigratedJourney, typeof migrationFields>,
  contactRowAddress: NodeAddress,
) {
  controller.dispatch(nodeEvent("collection:add", contactsAddress, {
    payload: { value: { id: "contact-2", email: "grace@example.com" } },
  }));
  controller.dispatch(nodeEvent("collection:move", contactRowAddress, {
    payload: { to: 0 },
  }));
  controller.dispatch(nodeEvent("wizard:next", onboardingAddress));
}
// source:end migration-structures

interface Option {
  readonly value: string;
  readonly label: string;
}

interface SelectProps {
  readonly label: string;
  readonly options: readonly Option[];
}

interface ApplicationValue {
  country: string;
  checkout: {
    address: Record<string, never>;
    review: Record<string, never>;
  };
}

interface ApplicationContext {
  readonly countries: readonly Option[];
}

const select = {
  view: "select-input",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, SelectProps>;

const applicationFields = { select } as const;

// source:start migration-application-boundaries
export const applicationSchema = (({ context }) => ({
  id: "application-boundaries",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "country",
      type: "select",
      props: { label: "Country", options: context.countries },
    },
    {
      kind: "wizard",
      id: "checkout",
      navigation: { nonLinear: true },
      stages: [
        { id: "address", nodes: [] },
        { id: "review", nodes: [] },
      ],
    },
  ],
})) satisfies StagesSchemaFactory<ApplicationValue, typeof applicationFields, ApplicationContext>;

export function updateRemoteOptions(
  controller: StagesController<ApplicationValue, typeof applicationFields, ApplicationContext>,
  countries: readonly Option[],
) {
  controller.update({ context: { countries } });
}

export function applyWizardRoute(
  controller: StagesController<ApplicationValue, typeof applicationFields, ApplicationContext>,
  stage: string,
) {
  controller.dispatch(nodeEvent("wizard:go", [{ kind: "node", id: "checkout" }], {
    payload: { stage },
    source: "user",
  }));
}

function activeCheckoutStage(snapshot: StagesSnapshot<ApplicationValue>) {
  const wizard = snapshot.nodes.find(node => node.kind === "wizard" && node.id === "checkout");
  return wizard?.kind === "wizard" ? wizard.activeStage : undefined;
}

export function subscribeWizardRoute(
  controller: StagesController<ApplicationValue, typeof applicationFields, ApplicationContext>,
  currentRoute: () => string | undefined,
  navigate: (stage: string) => void,
) {
  return controller.subscribeSelector(activeCheckoutStage, stage => {
    if (stage !== undefined && stage !== currentRoute()) navigate(stage);
  });
}

export function subscribeMigratedAutosave(
  controller: StagesController<ApplicationValue, typeof applicationFields, ApplicationContext>,
  save: (state: SerializedStagesState) => Promise<void>,
  onError: (error: unknown) => void,
  delayMs = 500,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = controller.subscribeSelector(
    snapshot => snapshot.value,
    () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        void save(controller.serialize()).catch(onError);
      }, delayMs);
    },
  );
  return () => {
    unsubscribe();
    if (timer !== undefined) clearTimeout(timer);
  };
}

export class AcceptedValueHistory<TValue> {
  readonly #entries: TValue[] = [];
  #index = -1;

  accept(value: TValue) {
    this.#entries.splice(this.#index + 1, Infinity, value);
    this.#index = this.#entries.length - 1;
  }

  undo(): TValue | undefined {
    if (this.#index <= 0) return undefined;
    this.#index -= 1;
    return this.#entries[this.#index];
  }

  redo(): TValue | undefined {
    if (this.#index >= this.#entries.length - 1) return undefined;
    this.#index += 1;
    return this.#entries[this.#index];
  }
}
// source:end migration-application-boundaries
