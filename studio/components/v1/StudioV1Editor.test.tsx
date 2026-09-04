import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { compileStudioForm } from "../../src/compiler";
import { toUid, type StudioFormDocument, type StudioResourceCatalog } from "../../src/document";
import { ControlledPreview } from "./StudioV1Editor";

function renderPreview(form: StudioFormDocument, resources?: StudioResourceCatalog, defaultLocale = "en") {
  return render(<ControlledPreview form={form} compiled={compileStudioForm(form, {}, resources === undefined ? {} : { localization: { defaultLocale, resources } })} {...(resources === undefined ? {} : { resources })} defaultLocale={defaultLocale} onUpdateScenario={() => {}} onAddScenario={() => undefined} />);
}

describe("Studio extensions, transient state, and localization", () => {
  it("explains ownership, reports locale fallback, resolves labels, and formats canonical values", async () => {
    const amountUid = toUid("field_amount");
    const resources: StudioResourceCatalog = {
      extensions: { draft: { title: "Draft preferences", version: 1, codec: { key: "json", version: 1 } } },
      locales: {
        en: { label: "English", messages: { "field.amount": "Amount" } },
        de: { label: "Deutsch", messages: { "field.amount": "Betrag" } },
        "de-CH": { label: "Deutsch (Schweiz)", messages: {} },
      },
    };
    const form: StudioFormDocument = {
      uid: toUid("form_localized"), title: "Localized", runtime: { schemaId: "localized", schemaVersion: 1 }, rootNodeUids: [amountUid],
      nodes: { [amountUid]: { uid: amountUid, kind: "field", runtimeId: "amount", definition: { key: "number", version: 1 }, props: { label: "Amount" }, localizedProps: { label: "field.amount" }, format: { kind: "number", options: { minimumFractionDigits: 2 } } } },
      scenarios: [{ uid: toUid("scenario_localized"), title: "Swiss", value: { amount: 1234.5 }, context: { locale: "de-CH" }, extensions: { draft: { compact: true } } }], settings: {},
    };
    renderPreview(form, resources);
    await waitFor(() => expect(screen.getByRole("spinbutton", { name: /Betrag/ })).toHaveValue(1234.5));
    expect(screen.getByLabelText("Amount localized value").textContent).toMatch(/^1['’]234\.50$/);
    expect(screen.getByText("localization.fallback")).toBeInTheDocument();
    expect(screen.getByText(/Selection, panels, drafts/)).toBeInTheDocument();
    expect(screen.getByText("Registered extension values JSON")).toBeInTheDocument();
  });
});

describe("Studio advanced collection and wizard Test mode", () => {
  it("exposes replace, duplicate, move, sort, remove, and variant-add commands", async () => {
    const collectionUid = toUid("collection_people");
    const nameUid = toUid("field_name");
    const form: StudioFormDocument = {
      uid: toUid("form_collections"), title: "Collections", runtime: { schemaId: "collections", schemaVersion: 1 }, rootNodeUids: [collectionUid],
      nodes: {
        [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "people", childUids: [nameUid] },
        [nameUid]: { uid: nameUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" } },
      },
      scenarios: [{ uid: toUid("scenario_people"), title: "People", value: { people: [{ name: "Ada" }, { name: "Lin" }] } }], settings: {},
    };
    const homogeneousPreview = renderPreview(form);

    fireEvent.change(screen.getAllByLabelText("Replacement JSON")[0]!, { target: { value: JSON.stringify({ name: "Grace" }) } });
    fireEvent.click(screen.getByRole("button", { name: "Replace row 1" }));
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Name" })[0]).toHaveValue("Grace"));

    fireEvent.click(screen.getByRole("button", { name: "Duplicate row 1" }));
    await waitFor(() => expect(screen.getAllByLabelText(/Row \d+ test controls/)).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "Move row 1 down" }));
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Name" }).map((field) => field.getAttribute("value"))).toEqual(["Grace", "Grace", "Lin"]));
    fireEvent.click(screen.getByRole("button", { name: "Reverse row order" }));
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Name" })[0]).toHaveValue("Lin"));
    fireEvent.click(screen.getByRole("button", { name: "Remove row 1" }));
    await waitFor(() => expect(screen.getAllByLabelText(/Row \d+ test controls/)).toHaveLength(2));
    homogeneousPreview.unmount();

    const variantUid = toUid("variant_person");
    const variantForm: StudioFormDocument = {
      ...form,
      uid: toUid("form_variants"), runtime: { schemaId: "variants", schemaVersion: 1 },
      nodes: {
        [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "people", discriminator: "kind", variantUids: [variantUid] },
        [variantUid]: { uid: variantUid, kind: "variant", runtimeId: "person", childUids: [nameUid] },
        [nameUid]: form.nodes[nameUid]!,
      },
      scenarios: [{ uid: toUid("scenario_variants"), title: "Variants", value: { people: [] } }],
    };
    const variantPreview = renderPreview(variantForm);
    const variantRoot = variantPreview.container.lastElementChild as HTMLElement;
    fireEvent.click(within(variantRoot).getByRole("button", { name: "Add person" }));
    await waitFor(() => expect(within(variantRoot).getByLabelText("Row 1 test controls")).toBeInTheDocument());
  });

  it("shows property-key collision diagnostics and key-strategy guidance", async () => {
    const collectionUid = toUid("collection_keyed");
    const form: StudioFormDocument = {
      uid: toUid("form_keyed"), title: "Keyed", runtime: { schemaId: "keyed", schemaVersion: 1 }, rootNodeUids: [collectionUid],
      nodes: { [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "items", childUids: [], itemKey: { kind: "property", property: "id" } } },
      scenarios: [{ uid: toUid("scenario_keyed"), title: "Collision", value: { items: [{ id: "same" }, { id: "same" }] } }], settings: {},
    };
    renderPreview(form);
    await waitFor(() => expect(screen.getAllByText("schema.duplicate-row-key").length).toBeGreaterThan(0));
    expect(screen.getByText(/conflicting row branch is omitted/)).toBeInTheDocument();
  });

  it("validates before navigation, applies guards, and simulates routes", async () => {
    const wizardUid = toUid("wizard_flow");
    const firstUid = toUid("stage_first");
    const reviewUid = toUid("stage_review");
    const nameUid = toUid("field_name");
    const form: StudioFormDocument = {
      uid: toUid("form_wizard"), title: "Wizard", runtime: { schemaId: "wizard", schemaVersion: 1 }, rootNodeUids: [wizardUid],
      nodes: {
        [wizardUid]: { uid: wizardUid, kind: "wizard", runtimeId: "flow", stageUids: [firstUid, reviewUid], navigation: {
          nonLinear: true, validateCurrent: true,
          guard: { kind: "binary", operator: "===", left: { kind: "reference", scope: "event", path: ["to"] }, right: { kind: "literal", value: "review" } },
        } },
        [firstUid]: { uid: firstUid, kind: "stage", runtimeId: "first", childUids: [nameUid] },
        [reviewUid]: { uid: reviewUid, kind: "stage", runtimeId: "review", childUids: [] },
        [nameUid]: { uid: nameUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" }, validators: [{ id: "name.required", kind: "required", on: "submit", message: "Enter a name." }] },
      },
      scenarios: [{ uid: toUid("scenario_wizard"), title: "Wizard", value: { flow: { first: { name: "" }, review: {} } } }], settings: {},
    };
    renderPreview(form);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByText(/Current wizard stage is invalid; navigation was blocked/)).toBeInTheDocument());
    expect(screen.getByText(/active first/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "Ada" } });
    await waitFor(() => expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Ada"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByText(/active review/)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Simulated route"), { target: { value: "first" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply simulated route" }));
    await waitFor(() => expect(screen.getByText("wizard.navigation-rejected")).toBeInTheDocument());
    expect(screen.getByText(/active review/)).toBeInTheDocument();
  });

  it("operates a wizard in a collection row with a collection inside its stage", async () => {
    const registrationsUid = toUid("collection_registrations");
    const wizardUid = toUid("wizard_registration");
    const detailsUid = toUid("stage_details");
    const reviewUid = toUid("stage_review_nested");
    const guestsUid = toUid("collection_guests");
    const guestNameUid = toUid("field_guest_name");
    const form: StudioFormDocument = {
      uid: toUid("form_nested_policies"), title: "Nested policies", runtime: { schemaId: "nested-policies", schemaVersion: 1 }, rootNodeUids: [registrationsUid],
      nodes: {
        [registrationsUid]: { uid: registrationsUid, kind: "collection", runtimeId: "registrations", childUids: [wizardUid] },
        [wizardUid]: { uid: wizardUid, kind: "wizard", runtimeId: "flow", stageUids: [detailsUid, reviewUid], navigation: { nonLinear: true } },
        [detailsUid]: { uid: detailsUid, kind: "stage", runtimeId: "details", childUids: [guestsUid] },
        [reviewUid]: { uid: reviewUid, kind: "stage", runtimeId: "review", childUids: [], behavior: { when: { kind: "reference", scope: "context", path: ["showReview"] } } },
        [guestsUid]: { uid: guestsUid, kind: "collection", runtimeId: "guests", childUids: [guestNameUid] },
        [guestNameUid]: { uid: guestNameUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Guest name" } },
      },
      scenarios: [{
        uid: toUid("scenario_nested_policies"), title: "Nested", context: { showReview: true },
        value: { registrations: [{ flow: { details: { guests: [] }, review: {} } }] },
      }], settings: {},
    };
    renderPreview(form);

    expect(screen.getByText(/registrations\.0\.flow · active details · visible details, review/)).toBeInTheDocument();
    const collections = screen.getAllByText(/Collection scope:/).map((label) => label.parentElement?.textContent ?? "");
    expect(collections).toContainEqual(expect.stringContaining("registrations.0.flow.details.guests"));
    const addRows = screen.getAllByRole("button", { name: "Add row" });
    fireEvent.click(addRows.at(-1)!);
    await waitFor(() => expect(screen.getAllByLabelText("Row 1 test controls")).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByText(/active review/)).toBeInTheDocument());
  });
});
