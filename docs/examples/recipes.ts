import {
  nodeEvent,
  stages,
  type DataPath,
  type Diagnostic,
  type FieldDefinition,
  type NodeAddress,
  type RenderNodeSnapshot,
  type StagesController,
  type StagesOptions,
  type StagesSchema,
  type StagesSchemaFactory,
  type StagesSnapshot,
  type ValidationCancellationSignal,
  type ValidationIssue,
} from "@stages/core";
import type { MountedStages } from "@stages/dom";

interface Settings {
  displayName: string;
  email: string;
}

interface TextProps {
  readonly label: string;
}

const settingsText = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const settingsFields = { text: settingsText } as const;

const settingsSchema = {
  id: "settings",
  version: 1,
  nodes: [
    { kind: "field", id: "displayName", type: "text", props: { label: "Display name" } },
    { kind: "field", id: "email", type: "text", props: { label: "Email" } },
  ],
} as const satisfies StagesSchema<Settings, typeof settingsFields>;

// source:start server-save-rejection
export type SaveDecision<TValue> =
  | Readonly<{ status: "accepted"; value: TValue }>
  | Readonly<{ status: "rejected"; message: string }>;

export type SaveStatus<TValue> =
  | Readonly<{ status: "idle"; accepted: TValue }>
  | Readonly<{ status: "saving"; accepted: TValue; proposed: TValue }>
  | Readonly<{ status: "rejected"; accepted: TValue; message: string }>
  | Readonly<{ status: "failed"; accepted: TValue; error: unknown }>;

export function createServerSavedSettings(
  initialValue: Settings,
  save: (proposal: Settings) => Promise<SaveDecision<Settings>>,
  observe: (status: SaveStatus<Settings>) => void,
  reportDiagnostic: (diagnostic: Diagnostic) => void,
) {
  let accepted = initialValue;
  let request = 0;
  let destroyed = false;
  let status: SaveStatus<Settings> = { status: "idle", accepted };
  let controller!: StagesController<Settings, typeof settingsFields>;

  const publish = (next: SaveStatus<Settings>) => {
    status = next;
    observe(status);
  };

  controller = stages({
    schema: settingsSchema,
    fields: settingsFields,
    value: accepted,
    onDiagnostic: reportDiagnostic,
    onChange(change) {
      const attempt = ++request;
      publish({ status: "saving", accepted, proposed: change.value });

      void save(change.value).then(
        decision => {
          if (destroyed || attempt !== request) return;
          if (decision.status === "accepted") {
            // The server may replace or normalize the proposal.
            accepted = decision.value;
            controller.update({ value: accepted });
            publish({ status: "idle", accepted });
          } else {
            // Not updating to the proposal rejects it. Re-publish the last
            // accepted value so adapters can clear their pending UI.
            controller.update({ value: accepted });
            publish({ status: "rejected", accepted, message: decision.message });
          }
        },
        error => {
          if (destroyed || attempt !== request) return;
          controller.update({ value: accepted });
          publish({ status: "failed", accepted, error });
        },
      );
    },
  });

  return {
    controller,
    getStatus: () => status,
    destroy() {
      destroyed = true;
      request += 1;
      controller.destroy();
    },
  };
}
// source:end server-save-rejection

interface RemoteOption {
  readonly value: string;
  readonly label: string;
}

interface RemoteOptionValue {
  countrySearch: string;
  country: string;
}

interface RemoteOptionContext {
  readonly options: readonly RemoteOption[];
  readonly loading: boolean;
  readonly error: string | undefined;
}

interface SelectProps extends TextProps {
  readonly options: readonly RemoteOption[];
  readonly loading: boolean;
  readonly error: string | undefined;
}

const remoteText = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const remoteSelect = {
  view: "select",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, SelectProps, "select">;

const remoteFields = { text: remoteText, select: remoteSelect } as const;

// source:start async-options
export const remoteOptionSchema = {
  id: "remote-country-options",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "countrySearch",
      type: "text",
      props: { label: "Search countries" },
    },
    {
      kind: "field",
      id: "country",
      type: "select",
      props: { label: "Country", options: [], loading: false, error: undefined },
      deriveProps: ({ context }) => ({
        label: "Country",
        options: context.options,
        loading: context.loading,
        error: context.error,
      }),
    },
  ],
} as const satisfies StagesSchema<RemoteOptionValue, typeof remoteFields, RemoteOptionContext>;

export function createRemoteOptionController(
  initialValue: RemoteOptionValue,
  search: (query: string, signal: AbortSignal) => Promise<readonly RemoteOption[]>,
) {
  let value = initialValue;
  let context: RemoteOptionContext = { options: [], loading: false, error: undefined };
  let activeRequest: AbortController | undefined;
  let generation = 0;
  let destroyed = false;
  let controller!: StagesController<RemoteOptionValue, typeof remoteFields, RemoteOptionContext>;

  const updateContext = (next: RemoteOptionContext) => {
    context = next;
    controller.update({ context });
  };

  const load = async (query: string) => {
    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    const currentGeneration = ++generation;
    updateContext({ ...context, loading: true, error: undefined });
    try {
      const options = await search(query, request.signal);
      if (destroyed || request.signal.aborted || currentGeneration !== generation) return;
      updateContext({ options, loading: false, error: undefined });
    } catch (error) {
      if (destroyed || request.signal.aborted || currentGeneration !== generation) return;
      updateContext({ ...context, loading: false, error: String(error) });
    }
  };

  controller = stages({
    schema: remoteOptionSchema,
    fields: remoteFields,
    value,
    context,
    onChange(change) {
      value = change.value;
      controller.update({ value });
    },
  });

  const unsubscribe = controller.subscribeSelector(
    snapshot => snapshot.value.countrySearch,
    query => void load(query),
  );
  void load(value.countrySearch);

  return {
    controller,
    refresh: () => load(value.countrySearch),
    destroy() {
      destroyed = true;
      generation += 1;
      activeRequest?.abort();
      unsubscribe();
      controller.destroy();
    },
  };
}
// source:end async-options

interface CheckoutValue {
  deliveryMethod: "ship" | "pickup";
  checkout: {
    contact: { email: string };
    delivery: { address: string };
    payment: { card: string; acceptedTerms: boolean };
    review: Record<string, never>;
  };
}

const checkoutText = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const checkoutCheckbox = {
  view: "checkbox",
  initialValue: false,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "boolean"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<boolean, TextProps, "checkbox">;

const checkoutFields = { text: checkoutText, checkbox: checkoutCheckbox } as const;

// source:start multi-step-checkout
type VerifyCard = (
  card: string,
  signal: ValidationCancellationSignal,
) => Promise<boolean>;

export function createCheckoutSchema(
  verifyCard: VerifyCard,
): StagesSchema<CheckoutValue, typeof checkoutFields> {
  return {
    id: "checkout",
    version: 1,
    nodes: [
      { kind: "field", id: "deliveryMethod", type: "text", props: { label: "Delivery method" } },
      {
        kind: "wizard",
        id: "checkout",
        initialStage: "contact",
        navigation: {
          validateCurrent: true,
          nonLinear: true,
          guard: (value, _from, to) =>
            to !== "review" || value.checkout.payment.acceptedTerms,
        },
        stages: [
          {
            id: "contact",
            nodes: [{
              kind: "field",
              id: "email",
              type: "text",
              props: { label: "Email" },
              validators: [
                {
                  id: "contact.email.required",
                  on: "submit",
                  validate: ({ fieldValue, path }) => fieldValue === ""
                    ? [{ id: "contact.email.required", code: "required", path, severity: "error" }]
                    : [],
                },
                {
                  id: "contact.email.test-domain",
                  on: "submit",
                  validate: ({ fieldValue, path }) => typeof fieldValue === "string"
                    && fieldValue.endsWith("@example.test")
                    ? [{ id: "contact.email.test-domain", code: "test-domain", path, severity: "warning" }]
                    : [],
                },
              ],
            }],
          },
          {
            id: "delivery",
            when: ({ value }) => value.deliveryMethod === "ship",
            nodes: [{
              kind: "field",
              id: "address",
              type: "text",
              props: { label: "Delivery address" },
              validators: [{
                id: "delivery.address.required",
                on: "submit",
                validate: ({ fieldValue, path }) => fieldValue === ""
                  ? [{ id: "delivery.address.required", code: "required", path, severity: "error" }]
                  : [],
              }],
            }],
          },
          {
            id: "payment",
            nodes: [
              {
                kind: "field",
                id: "card",
                type: "text",
                props: { label: "Card number" },
                validators: [{
                  id: "payment.card.authorized",
                  on: "submit",
                  async validate({ fieldValue, path, signal }) {
                    const authorized = await verifyCard(String(fieldValue), signal);
                    if (signal.aborted || authorized) return [];
                    return [{ id: "payment.card.authorized", code: "declined", path, severity: "error" }];
                  },
                }],
              },
              {
                kind: "field",
                id: "acceptedTerms",
                type: "checkbox",
                props: { label: "I accept the terms" },
              },
            ],
          },
          { id: "review", nodes: [] },
        ],
      },
    ],
  };
}

export async function validateAndAdvanceCheckout(
  controller: StagesController<CheckoutValue, typeof checkoutFields>,
  currentStageAddress: NodeAddress,
  focusFirstIssue: () => boolean,
) {
  const result = await controller.validate({
    scope: { address: currentStageAddress },
    event: "submit",
    reveal: true,
  });
  if (!result.isValid) {
    focusFirstIssue();
    return false;
  }
  controller.dispatch(nodeEvent("wizard:next", [{ kind: "node", id: "checkout" }]));
  return true;
}
// source:end multi-step-checkout

// source:start focus-error-summary
function renderErrorSummary(
  summary: HTMLElement,
  issues: readonly ValidationIssue[],
  focus: (path: DataPath) => boolean,
) {
  const document = summary.ownerDocument;
  const heading = document.createElement("h2");
  heading.textContent = `${issues.length} ${issues.length === 1 ? "error" : "errors"} need attention`;
  const list = document.createElement("ul");

  for (const issue of issues) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = issue.message ?? issue.code;
    button.addEventListener("click", () => focus(issue.path));
    item.append(button);
    list.append(item);
  }

  summary.replaceChildren(heading, list);
  summary.hidden = false;
  summary.tabIndex = -1;
  summary.setAttribute("role", "alert");
  summary.focus();
}

export async function validateWithErrorSummary<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  mounted: MountedStages,
  summary: HTMLElement,
) {
  const result = await controller.validate({ event: "submit", reveal: true });
  const errors = result.visibleIssues.filter(issue => issue.severity === "error");
  if (errors.length === 0) {
    summary.replaceChildren();
    summary.hidden = true;
    return true;
  }

  renderErrorSummary(summary, errors, path => mounted.focus(path, { preventScroll: false }));
  return false;
}
// source:end focus-error-summary

interface LocalizedValue {
  name: string;
  budget: number;
}

interface LocalizedMessages {
  readonly name: string;
  readonly budget: string;
  readonly required: string;
}

interface LocalizedContext {
  readonly locale: string;
  readonly currency: string;
  readonly messages: LocalizedMessages;
}

interface MoneyProps extends TextProps {
  readonly locale: string;
  readonly currency: string;
}

const localizedText = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const localizedMoney = {
  view: "money",
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<number, MoneyProps, "money">;

const localizedFields = { text: localizedText, money: localizedMoney } as const;

// source:start localization
export const localizedSchema = (({ context }) => ({
  id: "localized-onboarding",
  version: 1,
  nodes: [
    {
      kind: "field",
      id: "name",
      type: "text",
      props: { label: context.messages.name },
      deriveProps: ({ context: current }) => ({ label: current.messages.name }),
      validators: [{
        id: "name.required",
        on: "submit",
        validate: ({ fieldValue, path, context: current }) => fieldValue === ""
          ? [{
              id: "name.required",
              code: "required",
              path,
              severity: "error",
              message: current.messages.required,
            }]
          : [],
      }],
    },
    {
      kind: "field",
      id: "budget",
      type: "money",
      props: {
        label: context.messages.budget,
        locale: context.locale,
        currency: context.currency,
      },
      deriveProps: ({ context: current }) => ({
        label: current.messages.budget,
        locale: current.locale,
        currency: current.currency,
      }),
    },
  ],
})) satisfies StagesSchemaFactory<LocalizedValue, typeof localizedFields, LocalizedContext>;

export function changeLocale(
  controller: StagesController<LocalizedValue, typeof localizedFields, LocalizedContext>,
  context: LocalizedContext,
) {
  controller.update({ context });
}

export function formatMoney(value: number, props: MoneyProps) {
  return new Intl.NumberFormat(props.locale, {
    style: "currency",
    currency: props.currency,
  }).format(value);
}
// source:end localization

// source:start undo-redo
export function createUndoableSettings(initialValue: Settings, undoDepth = 50) {
  const entryLimit = Math.max(1, Math.floor(undoDepth) + 1);
  const entries: Settings[] = [initialValue];
  let index = 0;
  let value = initialValue;
  let controller!: StagesController<Settings, typeof settingsFields>;

  const publish = (next: Settings) => {
    value = next;
    controller.update({ value });
  };

  controller = stages({
    schema: settingsSchema,
    fields: settingsFields,
    value,
    onChange(change) {
      value = change.value;
      entries.splice(index + 1);
      entries.push(value);
      if (entries.length > entryLimit) entries.splice(0, entries.length - entryLimit);
      index = entries.length - 1;
      controller.update({ value });
    },
  });

  return {
    controller,
    canUndo: () => index > 0,
    canRedo: () => index < entries.length - 1,
    undo() {
      if (index === 0) return false;
      index -= 1;
      publish(entries[index]!);
      return true;
    },
    redo() {
      if (index >= entries.length - 1) return false;
      index += 1;
      publish(entries[index]!);
      return true;
    },
    destroy: () => controller.destroy(),
  };
}
// source:end undo-redo

function addressesEqual(left: NodeAddress, right: NodeAddress) {
  return left.length === right.length
    && left.every((segment, index) => {
      const other = right[index];
      return other !== undefined && segment.kind === other.kind && segment.id === other.id;
    });
}

function activeWizardStage(nodes: readonly RenderNodeSnapshot[], address: NodeAddress): string | undefined {
  for (const node of nodes) {
    if (node.kind === "field") continue;
    if (node.kind === "wizard" && addressesEqual(node.address, address)) return node.activeStage;
    const nested = activeWizardStage(node.nodes, address);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

// source:start wizard-routing
export interface WizardRoutePort {
  read(): string | undefined;
  write(stage: string): void;
  subscribe(listener: () => void): () => void;
}

export function bindWizardRoute<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  wizardAddress: NodeAddress,
  route: WizardRoutePort,
) {
  const selectStage = (snapshot: StagesSnapshot<TValue>) =>
    activeWizardStage(snapshot.nodes, wizardAddress);

  const applyRoute = () => {
    const requested = route.read();
    if (requested !== undefined && requested !== selectStage(controller.getSnapshot())) {
      controller.dispatch(nodeEvent("wizard:go", wizardAddress, {
        payload: { stage: requested },
        source: "user",
      }));
    }
  };

  const unsubscribeRoute = route.subscribe(applyRoute);
  const unsubscribeController = controller.subscribeSelector(selectStage, stage => {
    if (stage !== undefined && stage !== route.read()) route.write(stage);
  });
  applyRoute();

  return () => {
    unsubscribeRoute();
    unsubscribeController();
  };
}
// source:end wizard-routing

// source:start ssr-teardown
export function evaluateRequest<TValue, TFields, TContext>(
  options: StagesOptions<TValue, TFields, TContext>,
): StagesSnapshot<TValue> {
  // Create one controller per request; never keep it in module-global state.
  const controller = stages(options);
  try {
    return controller.getSnapshot();
  } finally {
    controller.destroy();
  }
}

export function ownClientLifecycle<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  mounted: MountedStages,
  stopExternalWork: () => void,
) {
  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    // Stop timers, requests, router listeners, and autosave first.
    stopExternalWork();
    mounted.destroy();
    controller.destroy();
  };
}
// source:end ssr-teardown

void settingsSchema;
