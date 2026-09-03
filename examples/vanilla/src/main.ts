import {
  stages,
  type ContainerSnapshot,
  type NodeAddress,
  type StagesController,
  type StagesSchema,
  type ValidationIssue,
  type ValidatorConfig,
} from "@stages/core";
import { createDomFields, mountStages } from "@stages/dom";

interface WorkspaceValue {
  setup: {
    account: {
      name: string;
      email: string;
    };
    preferences: {
      seats?: number;
      productNews: boolean;
    };
    review: {
      confirmation: string;
    };
  };
}

function required(id: string, message: string): ValidatorConfig<WorkspaceValue> {
  return {
    id,
    on: ["input", "submit"],
    revealOn: ["blur", "submit"],
    validate({ fieldValue, path }): readonly ValidationIssue[] {
      return typeof fieldValue === "string" && fieldValue.trim().length > 0
        ? []
        : [{ id, code: "required", message, path, severity: "error" }];
    },
  };
}

const fields = createDomFields();
const schema = {
  id: "vanilla-workspace",
  version: 1,
  nodes: [{
    kind: "wizard",
    id: "setup",
    initialStage: "account",
    navigation: { validateCurrent: true },
    stages: [
      {
        id: "account",
        nodes: [
          {
            kind: "field",
            id: "name",
            type: "text",
            props: { label: "Workspace name", placeholder: "Northwind" },
            validators: [required("workspace-name.required", "Enter a workspace name.")],
          },
          {
            kind: "field",
            id: "email",
            type: "text",
            props: { label: "Contact email", inputType: "email", placeholder: "you@example.com" },
            validators: [required("email.required", "Enter a contact email.")],
          },
        ],
      },
      {
        id: "preferences",
        nodes: [
          {
            kind: "field",
            id: "seats",
            type: "number",
            props: { label: "Team size" },
          },
          {
            kind: "field",
            id: "productNews",
            type: "checkbox",
            props: { label: "Send occasional product updates" },
          },
        ],
      },
      {
        id: "review",
        nodes: [{
          kind: "field",
          id: "confirmation",
          type: "text",
          props: { label: "Type CREATE to confirm", placeholder: "CREATE" },
          validators: [{
            id: "confirmation.matches",
            on: ["input", "submit"],
            revealOn: ["blur", "submit"],
            validate({ fieldValue, path }) {
              return fieldValue === "CREATE"
                ? []
                : [{
                    id: "confirmation.matches",
                    code: "confirmation",
                    message: "Type CREATE exactly to finish.",
                    path,
                    severity: "error",
                  }];
            },
          }],
        }],
      },
    ],
  }],
} as const satisfies StagesSchema<WorkspaceValue, typeof fields>;

const initialValue: WorkspaceValue = {
  setup: {
    account: { name: "", email: "" },
    preferences: { seats: 5, productNews: false },
    review: { confirmation: "" },
  },
};

function query<TElement extends Element>(selector: string): TElement {
  const match = document.querySelector<TElement>(selector);
  if (match === null) throw new Error(`Missing example element: ${selector}`);
  return match;
}

const form = query<HTMLFormElement>("#wizard-form");
const root = query<HTMLElement>("#stages-root");
const previous = query<HTMLButtonElement>("#previous");
const next = query<HTMLButtonElement>("#next");
const submit = query<HTMLButtonElement>("#submit");
const progress = query<HTMLOListElement>("#progress");
const status = query<HTMLElement>("#form-status");
const debugValue = query<HTMLElement>("#debug-value");
const wizardAddress: NodeAddress = [{ kind: "node", id: "setup" }];
let acceptedValue = initialValue;
let controller: StagesController<WorkspaceValue, typeof fields>;

controller = stages({
  schema,
  fields,
  value: acceptedValue,
  onChange({ value }) {
    acceptedValue = value;
    controller.update({ value: acceptedValue });
  },
});

const mounted = mountStages(root, controller);

function wizardSnapshot(): ContainerSnapshot {
  const wizard = controller.getSnapshot().nodes[0];
  if (wizard?.kind !== "wizard") throw new Error("The setup wizard is unavailable.");
  return wizard;
}

function renderChrome(): void {
  const snapshot = controller.getSnapshot();
  const wizard = wizardSnapshot();
  const stages = wizard.nodes.filter((node): node is ContainerSnapshot => node.kind === "stage");

  progress.replaceChildren(...stages.map((stage) => {
    const item = document.createElement("li");
    item.textContent = stage.id;
    if (stage.active === true) item.setAttribute("aria-current", "step");
    return item;
  }));
  previous.disabled = wizard.canPrevious !== true;
  next.hidden = wizard.canNext !== true;
  submit.hidden = wizard.canNext === true;
  debugValue.textContent = JSON.stringify({
    value: snapshot.value,
    state: controller.serialize(),
  }, null, 2);
}

async function validateActiveStage(): Promise<boolean> {
  const activeStage = wizardSnapshot().activeStage;
  if (activeStage === undefined) return false;
  const result = await controller.validate({
    scope: { address: [...wizardAddress, { kind: "node", id: activeStage }] },
    event: "submit",
    reveal: true,
  });
  if (!result.isValid) {
    status.textContent = "Please fix the highlighted fields before continuing.";
    mounted.focusFirstIssue({ preventScroll: false });
  }
  return result.isValid;
}

previous.addEventListener("click", () => {
  status.textContent = "";
  controller.dispatch({ name: "wizard:previous", target: { kind: "node", address: wizardAddress } });
});

next.addEventListener("click", async () => {
  status.textContent = "";
  if (await validateActiveStage()) {
    controller.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = await controller.validate({ scope: "form", event: "submit", reveal: true });
  status.textContent = result.isValid
    ? `Workspace “${acceptedValue.setup.account.name}” is ready to create.`
    : "Please fix the highlighted fields before finishing.";
  if (!result.isValid) mounted.focusFirstIssue({ preventScroll: false });
});

const unsubscribeChrome = controller.subscribe(renderChrome);
renderChrome();

window.addEventListener("pagehide", () => {
  unsubscribeChrome();
  mounted.destroy();
  controller.destroy();
}, { once: true });
