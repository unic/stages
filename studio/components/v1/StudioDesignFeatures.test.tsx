import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { compileStudioForm } from "../../src/compiler";
import { toUid, type StudioFieldNode, type StudioFormDocument } from "../../src/document";
import { StudioDesignFeatures } from "./StudioDesignFeatures";
import { ControlledPreview } from "./StudioV1Editor";

const plain: StudioFieldNode = { uid: toUid("amount"), kind: "field", runtimeId: "amount", definition: { key: "number", version: 1 }, props: { label: "Amount" } };
const configured: StudioFieldNode = {
  ...plain,
  validators: [{ kind: "required", id: "required.amount", message: "Enter an amount." }],
  transforms: [{ id: "adjust", on: "custom:adjust", actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "literal", value: 10 } }] }],
  format: { kind: "number" },
  behavior: { when: { kind: "literal", value: true } },
};

describe("Design feature indicators", () => {
  it("shows configured features with details on keyboard focus, and updates after settings are removed", async () => {
    const user = userEvent.setup();
    const view = render(<StudioDesignFeatures node={configured} />);
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.getByRole("img", { name: "Validation: 1 validation rule configured" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Transforms: 1 transform" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Localization: Regional value formatting" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Logic: Conditional visibility" })).toBeVisible();
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("1 validation rule configured");
    view.rerender(<StudioDesignFeatures node={plain} />);
    expect(screen.queryByRole("group", { name: "Configured features" })).toBeNull();
  });

  it("recognizes reducers, translated messages, and derived properties without marking empty settings", () => {
    const view = render(<StudioDesignFeatures node={{ ...plain, validators: [], transforms: [], reducers: [], localizedProps: {}, derivedProps: {}, behavior: { disabled: false } }} />);
    expect(screen.queryByRole("img")).toBeNull();
    view.rerender(<StudioDesignFeatures node={{
      ...plain,
      reducers: configured.transforms!,
      validators: [{ kind: "required", message: { default: "Required", translations: { de: "Pflichtfeld" } } }],
      derivedProps: { label: { kind: "literal", value: "Total" } },
    }} />);
    expect(screen.getByRole("img", { name: "Transforms: 1 reducer" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Localization: Translated validation messages" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Logic: Derived properties" })).toBeVisible();
  });

  it("decorates nested fields only in Design and keeps answer controls unchanged in Preview", async () => {
    const groupUid = toUid("details");
    const form: StudioFormDocument = {
      uid: toUid("form_design"), title: "Example form", runtime: { schemaId: "design", schemaVersion: 1 },
      rootNodeUids: [groupUid],
      nodes: { [groupUid]: { uid: groupUid, runtimeId: "details", kind: "group", childUids: [configured.uid] }, [configured.uid]: configured },
      scenarios: [{ uid: toUid("example"), title: "Example", value: { details: { amount: 12 } } }], settings: {},
    };
    const props = { form, compiled: compileStudioForm(form), defaultLocale: "en", onUpdateScenario: () => {}, onAddScenario: () => undefined };
    const view = render(<ControlledPreview {...props} variant="canvas" />);
    expect(screen.getByLabelText("Design indicators")).toBeVisible();
    const field = view.container.querySelector('[data-design-kind="field"]')!;
    expect(within(field as HTMLElement).getAllByRole("img")).toHaveLength(4);
    await waitFor(() => expect(screen.getByRole("spinbutton", { name: /Amount/ })).toHaveValue(12));
    view.rerender(<ControlledPreview {...props} />);
    expect(screen.queryByLabelText("Design indicators")).toBeNull();
    expect(screen.queryByRole("group", { name: "Configured features" })).toBeNull();
    expect(view.container.querySelector(".studio-design-node")).toBeNull();
    await waitFor(() => expect(screen.getByRole("spinbutton", { name: /Amount/ })).toHaveValue(12));
  });
});
