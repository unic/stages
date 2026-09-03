import {
  fieldEvent,
  type DeepReadonly,
  type FieldDefinition,
  type FieldValidationIssue,
  type FieldValidator,
  type NodeAddress,
  type StagesController,
  type StagesSchema,
  type ValidationFailureContext,
  type ValidationFailureIssueFactory,
  type ValidationCancellationSignal,
  type ValidationIssue,
  type ValidationSnapshot,
  type ValidatorConfig,
} from "@stages/core";

interface TextProps {
  readonly label: string;
  readonly requiredMessage: string;
}

interface SignupValue {
  tenantId: string;
  email: string;
  password: string;
  confirmation: string;
  members: Array<{ id: string; email: string }>;
  subtotal: number;
  tax: number;
  total: number;
  marketingConsent: string;
  marketingRequired: boolean;
}

interface SignupContext {
  readonly emailEndpoint: string;
  readonly canEditMarketing: boolean;
  readonly messages: {
    readonly invalidEmail: string;
    readonly emailTaken: string;
    readonly passwordsDiffer: string;
    readonly validationFailed: string;
  };
}

// source:start validator-kinds
export const requiredText = {
  id: "required",
  validate(value, props): readonly FieldValidationIssue[] {
    return value.trim() === ""
      ? [{ id: "required", code: "required", severity: "error", message: props.requiredMessage }]
      : [];
  },
} satisfies FieldValidator<string, TextProps>;

export const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
  validators: [requiredText],
} satisfies FieldDefinition<string, TextProps, "text">;

export const fields = { text } as const;

export const signupSchema = {
  id: "signup",
  version: 1,
  validators: [{
    id: "passwords.match",
    on: "submit",
    validate: ({ value }) => value.password === value.confirmation
      ? []
      : [{
          id: "passwords.match",
          code: "passwords-differ",
          path: ["confirmation"],
          severity: "error",
        }],
  }],
  nodes: [{
    kind: "field",
    id: "email",
    type: "text",
    props: { label: "Email", requiredMessage: "Enter an email address" },
    validators: [{
      id: "email.format",
      on: ["input", "submit"],
      validate: ({ fieldValue, path }) => typeof fieldValue === "string" && fieldValue.includes("@")
        ? []
        : [{ id: "email.format", code: "email", path, severity: "error" }],
    }],
  }],
} as const satisfies StagesSchema<SignupValue, typeof fields, SignupContext>;
// source:end validator-kinds

// source:start validation-overview
export async function submitSignup(
  controller: StagesController<SignupValue, typeof fields, SignupContext>,
  save: (value: DeepReadonly<SignupValue>) => Promise<void>,
): Promise<boolean> {
  const result = await controller.validate({ event: "submit", reveal: true });
  if (result.status !== "valid") return false;

  await save(controller.getSnapshot().value);
  return true;
}
// source:end validation-overview

// source:start execution-and-reveal
export const emailPolicy = {
  id: "email.format",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  when: ({ fieldValue }) => typeof fieldValue === "string" && fieldValue !== "",
  validate: ({ fieldValue, path, context }) => String(fieldValue).includes("@")
    ? []
    : [{
        id: "email.format",
        code: "email",
        path,
        severity: "error",
        message: context.messages.invalidEmail,
      }],
} satisfies ValidatorConfig<SignupValue, SignupContext>;

export function editThenBlur(
  controller: StagesController<SignupValue, typeof fields, SignupContext>,
) {
  // Runs validation without revealing a configured issue.
  controller.dispatch(fieldEvent("input", ["email"], { payload: "invalid" }));
  // Reveals the cached issue; blur is not required to be in `on`.
  controller.dispatch(fieldEvent("blur", ["email"]));
}
// source:end execution-and-reveal

// source:start validation-scopes
export async function validateSignupScopes(
  controller: StagesController<SignupValue, typeof fields, SignupContext>,
  rowAddress: NodeAddress,
): Promise<readonly ValidationSnapshot[]> {
  const form = await controller.validate({ event: "submit" });
  const email = await controller.validate({
    scope: { path: ["email"] },
    event: "submit",
    reveal: true,
  });
  const member = await controller.validate({
    scope: { address: rowAddress },
    event: "submit",
  });
  return [form, email, member];
}
// source:end validation-scopes

// source:start validation-dependencies
export const confirmationMatches = {
  id: "confirmation.matches",
  on: ["input", "submit"],
  dependencies: [["password"]],
  validate: ({ value, fieldValue, path }) => fieldValue === value.password
    ? []
    : [{ id: "confirmation.matches", code: "mismatch", path, severity: "error" }],
} satisfies ValidatorConfig<SignupValue, SignupContext>;

export const uniqueMemberEmails = {
  id: "members.unique-email",
  on: ["input", "submit"],
  validate: ({ fieldValue }) => {
    const members = fieldValue as DeepReadonly<SignupValue["members"]>;
    const firstIndex = new Map<string, number>();
    const issues: ValidationIssue[] = [];
    members.forEach((member, index) => {
      const previous = firstIndex.get(member.email);
      if (previous === undefined) firstIndex.set(member.email, index);
      else issues.push({
        id: `members.unique-email.${member.id}`,
        code: "duplicate-email",
        path: ["members", index, "email"],
        severity: "error",
        meta: { duplicatesIndex: previous },
      });
    });
    return issues;
  },
} satisfies ValidatorConfig<SignupValue, SignupContext>;

export const totalMatches = {
  id: "total.matches",
  on: ["input", "submit"],
  dependencies: [["subtotal"], ["tax"]],
  validate: ({ value, fieldValue, path }) => fieldValue === value.subtotal + value.tax
    ? []
    : [{ id: "total.matches", code: "incorrect-total", path, severity: "error" }],
} satisfies ValidatorConfig<SignupValue, SignupContext>;
// source:end validation-dependencies

// source:start async-cancellation
export const uniqueEmail = {
  id: "email.unique",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  dependencies: [["tenantId"]],
  when: ({ fieldValue }) => typeof fieldValue === "string" && fieldValue.includes("@"),
  async validate({ value, fieldValue, path, context, signal }) {
    const request = new AbortController();
    const unsubscribe = signal.onCancel(() => request.abort());
    try {
      const query = new URLSearchParams({
        tenant: value.tenantId,
        email: String(fieldValue),
      });
      const response = await fetch(`${context.emailEndpoint}?${query}`, {
        signal: request.signal,
      });
      if (!response.ok) throw new Error(`Availability request failed (${response.status})`);
      const body = await response.json() as { readonly available?: unknown };
      return body.available === true
        ? []
        : [{ id: "email.unique", code: "taken", path, severity: "error", message: context.messages.emailTaken }];
    } finally {
      unsubscribe();
    }
  },
} satisfies ValidatorConfig<SignupValue, SignupContext>;
// source:end async-cancellation

// source:start disabled-and-conditional
export const marketingConsentPolicy = {
  id: "marketing.consent",
  on: "submit",
  includeDisabled: true,
  dependencies: [["marketingRequired"]],
  when: ({ value }) => value.marketingRequired,
  validate: ({ fieldValue, path }) => fieldValue === "accepted"
    ? []
    : [{ id: "marketing.consent", code: "consent-required", path, severity: "error" }],
} satisfies ValidatorConfig<SignupValue, SignupContext>;

export const marketingNode = {
  kind: "field",
  id: "marketingConsent",
  type: "text",
  props: { label: "Marketing consent", requiredMessage: "Choose an option" },
  disabled: ({ context }: { context: DeepReadonly<SignupContext> }) => !context.canEditMarketing,
  validators: [marketingConsentPolicy],
} as const;
// source:end disabled-and-conditional

interface FailureMessages {
  readonly validationFailed: string;
}

// source:start failure-localization
export function localizedFailureIssues(
  messages: FailureMessages,
): ValidationFailureIssueFactory {
  return (failure: ValidationFailureContext) => ({
    code: failure.kind === "when" ? "validation-condition-failed" : "validation-service-failed",
    message: messages.validationFailed,
    meta: { validatorId: failure.validatorId, event: failure.event },
  });
}

export const localizedEmailPolicy = {
  ...emailPolicy,
  validate: ({ fieldValue, path, context }) => String(fieldValue).includes("@")
    ? []
    : [{
        id: "email.format",
        code: "email",
        path,
        severity: "error",
        message: context.messages.invalidEmail,
      }],
} satisfies ValidatorConfig<SignupValue, SignupContext>;
// source:end failure-localization

// source:start validation-type-usage
export function firstVisibleError(
  snapshot: ValidationSnapshot,
): ValidationIssue | undefined {
  return snapshot.visibleIssues.find(issue => issue.severity === "error");
}

export function connectCancellation(
  signal: ValidationCancellationSignal,
  cancel: () => void,
): () => void {
  if (signal.aborted) {
    cancel();
    return () => undefined;
  }
  return signal.onCancel(cancel);
}
// source:end validation-type-usage
