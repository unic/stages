import { STUDIO_DEMO_PROJECTS } from "./studioDemoProjects";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { studioLayout } from "../../src/registry";
import { compileStudioForm } from "../../src/compiler";
import { toUid, type StudioFormDocument, type StudioResourceCatalog } from "../../src/document";
import { ControlledPreview } from "./StudioV1Editor";

function renderPreview(form: StudioFormDocument, resources?: StudioResourceCatalog, defaultLocale = "en") {
  const result = render(<ControlledPreview form={form} compiled={compileStudioForm(form, {}, resources === undefined ? {} : { localization: { defaultLocale, resources } })} {...(resources === undefined ? {} : { resources })} defaultLocale={defaultLocale} onUpdateScenario={() => {}} onAddScenario={() => undefined} />);
  // These contract tests exercise the explicitly revealed runtime tools.
  for (const name of [/^Problems \(/, "Scenario data", "Runtime persistence", "Events & proposals", "Dynamic structure", "Runtime observability", "Validation tools"]) {
    fireEvent.click(screen.getByRole("button", { name }));
  }
  fireEvent.click(screen.getByRole("button", { name: "Test details" }));
  return result;
}

describe("Preview submission", () => {
  it("reveals submit validation without opening test tools and accepts corrected answers", async () => {
    const demo = STUDIO_DEMO_PROJECTS.find(({ id }) => id === "contact")!;
    const original = Object.values(demo.project.forms)[0]!;
    const form = { ...original, scenarios: [original.scenarios[1]!] };
    render(<ControlledPreview form={form} compiled={compileStudioForm(form)} defaultLocale="en" onUpdateScenario={() => {}} onAddScenario={() => undefined} />);
    expect(screen.queryByText("Enter your name.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    const name = screen.getByRole("textbox", { name: /Full name/ });
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("Please correct the validation errors and submit again.")).toBeVisible();
    fireEvent.change(name, { target: { value: "Ada" } });
    await waitFor(() => expect(name).toHaveValue("Ada"));
    fireEvent.submit(screen.getByRole("form", { name: form.title }));
    await waitFor(() => expect(screen.getByText("Form is valid. Preview submission succeeded.")).toBeVisible());
    expect(name).not.toHaveAttribute("aria-invalid", "true");
    fireEvent.click(screen.getByRole("button", { name: "Reset to scenario" }));
    expect(screen.queryByText("Form is valid. Preview submission succeeded.")).toBeNull();
  });
});

describe("Studio component gallery", () => {
  it("renders native controls and accepts their typed values", async () => {
    const gallery = STUDIO_DEMO_PROJECTS.find(({ id }) => id === "gallery")!;
    const form = Object.values(gallery.project.forms)[0]!;
    const preview = renderPreview(form);
    for (const [label, type, value] of [["Email", "email", "new@example.com"], ["Phone", "tel", "+41 555"], ["Website", "url", "https://stages.test"], ["Password", "password", "test secret"], ["Preferred time", "time", "14:30"]]) {
      const input = screen.getByLabelText(label!);
      expect(input).toHaveAttribute("type", type);
      fireEvent.change(input, { target: { value } });
      await waitFor(() => expect(input).toHaveValue(value));
    }
    const slider = screen.getByRole("slider", { name: "Rating" });
    fireEvent.change(slider, { target: { value: "9" } });
    await waitFor(() => expect(slider).toHaveValue("9"));
    const checkbox = screen.getByRole("checkbox", { name: "Contact me about my request" });
    expect(checkbox.closest("label")).toHaveClass("studio-field--checkbox");
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(preview.container.querySelector(".studio-range-control output")).toHaveTextContent("9");
  });
});

describe("Studio responsive preview layout", () => {
  it.each(["desktop", "tablet", "mobile"])("fills nested Kitchensink items at %s even with saved multi-column settings", async (breakpoint) => {
    const style = document.createElement("style");
    style.textContent = readFileSync("styles/globals.css", "utf8");
    document.head.append(style);
    try {
      const project = STUDIO_DEMO_PROJECTS.find(({ id }) => id === "kitchensink")!.project;
      const source = Object.values(project.forms)[0]!;
      // Reproduce the original saved demo, not just the corrected defaults.
      const form = { ...source, nodes: Object.fromEntries(Object.entries(source.nodes).map(([id, node]) => [id, {
        ...node, presentation: { ...node.presentation, layout: { ...studioLayout(node.presentation?.["layout"]), columns: { mobile: 1, tablet: 2, desktop: 4 } } },
      }])) };
      const compiled = compileStudioForm(form, project.fragments);
      render(<div data-preview-breakpoint={breakpoint}><ControlledPreview form={compiled.expandedForm} compiled={compiled} defaultLocale="en" onUpdateScenario={() => {}} onAddScenario={() => undefined} /></div>);
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Full name" })).toHaveValue("Ada Lovelace"));
      const wrappers = document.querySelectorAll(".studio-v1-preview__layout > .studio-field, .studio-v1-preview__layout > .studio-v1-preview__group, .studio-v1-preview__layout > .studio-v1-preview__collection, .studio-v1-preview__layout > .studio-v1-preview__wizard, .studio-v1-preview__layout > h2, .studio-v1-preview__layout > [role=note]");
      expect(wrappers.length).toBeGreaterThan(30);
      for (const wrapper of wrappers) {
        expect(getComputedStyle(wrapper).gridColumn).toBe("1 / -1");
        expect(parseFloat(getComputedStyle(wrapper).minWidth)).toBe(0);
      }
      const nameLayout = screen.getByRole("textbox", { name: "Full name" }).closest(".studio-v1-preview__layout")!;
      expect(nameLayout).toHaveAttribute(`data-width-${breakpoint}`, breakpoint === "mobile" ? "full" : "half");
      expect(getComputedStyle(nameLayout.parentElement!).display).toBe("flex");
    } finally { style.remove(); }
  });

  it("packs two half-width fields beside each other inside a group", async () => {
    const style = document.createElement("style");
    style.textContent = readFileSync("styles/globals.css", "utf8");
    document.head.append(style);
    const groupUid = toUid("group_contact");
    const firstUid = toUid("field_first_name");
    const lastUid = toUid("field_last_name");
    const halfWidth = {
      width: { mobile: "full", tablet: "half", desktop: "half" },
      columns: { mobile: 1, tablet: 1, desktop: 1 },
      align: { mobile: "stretch", tablet: "stretch", desktop: "stretch" },
    } as const;
    const form: StudioFormDocument = {
      uid: toUid("form_contact"), title: "Contact", runtime: { schemaId: "contact", schemaVersion: 1 }, rootNodeUids: [groupUid],
      nodes: {
        [groupUid]: { uid: groupUid, kind: "group", runtimeId: "contact", childUids: [firstUid, lastUid], presentation: { label: "Contact" } },
        [firstUid]: { uid: firstUid, kind: "field", runtimeId: "firstName", definition: { key: "text", version: 1 }, props: { label: "First name" }, presentation: { layout: halfWidth } },
        [lastUid]: { uid: lastUid, kind: "field", runtimeId: "lastName", definition: { key: "text", version: 1 }, props: { label: "Last name" }, presentation: { layout: halfWidth } },
      },
      scenarios: [{ uid: toUid("scenario_contact"), title: "Contact", value: { contact: { firstName: "Ada", lastName: "Lovelace" } } }], settings: {},
    };

    renderPreview(form);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue("Ada"));
    const group = document.querySelector(".studio-v1-preview__group");
    const firstLayout = screen.getByRole("textbox", { name: "First name" }).closest(".studio-v1-preview__layout");
    const lastLayout = screen.getByRole("textbox", { name: "Last name" }).closest(".studio-v1-preview__layout");

    expect(group).not.toBeNull();
    expect(getComputedStyle(group as Element).display).toBe("flex");
    expect(getComputedStyle(group as Element).flexWrap).toBe("wrap");
    expect(firstLayout?.parentElement).toBe(group);
    expect(lastLayout?.parentElement).toBe(group);
    expect(firstLayout).toHaveAttribute("data-width-desktop", "half");
    expect(lastLayout).toHaveAttribute("data-width-desktop", "half");
    expect(getComputedStyle(firstLayout as Element).width).toContain("50%");
    expect(getComputedStyle(firstLayout as Element).width).toContain("--studio-preview-spacing");
    style.remove();
  });
});

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

describe("Studio test data and runtime persistence", () => {
  it("resets, serializes, and recreates accepted scenario state", async () => {
    const fieldUid = toUid("field_title");
    const form: StudioFormDocument = {
      uid: toUid("form_persistence"), title: "Persistence", runtime: { schemaId: "persistence", schemaVersion: 1 }, rootNodeUids: [fieldUid],
      nodes: { [fieldUid]: { uid: fieldUid, kind: "field", runtimeId: "title", definition: { key: "text", version: 1 }, props: { label: "Title" } } },
      scenarios: [{ uid: toUid("scenario_named"), title: "Named baseline", value: { title: "Initial" }, context: { locale: "en", permission: "editor" }, extensions: { draft: { panel: "details" } }, services: { lookup: { outcome: "success" } } }],
      settings: {},
    };
    renderPreview(form);

    expect(screen.getByLabelText("Scenario name")).toHaveValue("Named baseline");
    expect(screen.getByLabelText("Domain value JSON")).toHaveValue(JSON.stringify(form.scenarios[0]!.value, null, 2));
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Accepted" } });
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Accepted"));
    fireEvent.click(screen.getByRole("button", { name: "Save runtime envelope" }));
    const envelope = JSON.parse((screen.getByLabelText("Serialized runtime envelope") as HTMLTextAreaElement).value) as Record<string, unknown>;
    expect(envelope["value"]).toEqual({ title: "Accepted" });
    expect((envelope["meta"] as Record<string, unknown>)["extensions"]).toEqual({ draft: { panel: "details" } });
    expect(envelope).not.toHaveProperty("context");
    expect(envelope).not.toHaveProperty("workbench");

    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Later" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset to scenario" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Initial"));
    fireEvent.click(screen.getByRole("button", { name: "Recreate preview" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Accepted"));

    fireEvent.click(screen.getByRole("button", { name: "Validate form" }));
    fireEvent.change(screen.getByLabelText("Data path"), { target: { value: "title" } });
    fireEvent.click(screen.getByRole("button", { name: "Validate path" }));
    await waitFor(() => expect(screen.getByText(/Selected scope is valid/)).toBeInTheDocument());
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

  it("creates editable keyed agenda variants and gives duplicates fresh identities", async () => {
    const demo = STUDIO_DEMO_PROJECTS.find(({ id }) => id === "agenda")!;
    const form = Object.values(demo.project.forms)[0]!;
    const preview = renderPreview(form);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Add session" })).toBeEnabled());
    for (const [variant, label] of [["session", "Session title"], ["workshop", "Workshop title"], ["break", "Break label"]]) {
      const previousCount = preview.container.querySelectorAll(".studio-v1-preview__row").length;
      fireEvent.click(screen.getByRole("button", { name: `Add ${variant}` }));
      await waitFor(() => expect(preview.container.querySelectorAll(".studio-v1-preview__row")).toHaveLength(previousCount + 1));
      const rows = preview.container.querySelectorAll<HTMLElement>(".studio-v1-preview__row");
      const added = within(rows[rows.length - 1]!);
      const input = await added.findByRole("textbox", { name: label! });
      fireEvent.change(input, { target: { value: `New ${variant}` } });
      await waitFor(() => expect(input).toHaveValue(`New ${variant}`));
      expect(added.getByRole("button", { name: /Remove row/ })).toBeEnabled();
    }
    fireEvent.click(screen.getByRole("button", { name: "Duplicate row 4" }));
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Workshop title" })).toHaveLength(2));
    const titles = screen.getAllByRole("textbox", { name: "Workshop title" });
    fireEvent.change(titles[1]!, { target: { value: "Independent copy" } });
    expect(titles[0]).toHaveValue("New workshop");
    const keys = Array.from(preview.container.querySelectorAll(".studio-v1-preview__row-tools code"), (code) => code.textContent);
    expect(keys).toHaveLength(6);
    expect(new Set(keys).size).toBe(6);
    fireEvent.click(screen.getByRole("button", { name: "Move row 5 up" }));
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Workshop title" })[0]).toHaveValue("Independent copy"));
    fireEvent.click(screen.getByRole("button", { name: "Remove row 4" }));
    await waitFor(() => expect(screen.getAllByRole("textbox", { name: "Workshop title" })).toHaveLength(1));
    expect(screen.getByRole("textbox", { name: "Workshop title" })).toHaveValue("New workshop");
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
    expect(screen.getByLabelText("Problem source")).toHaveValue("all");
    fireEvent.change(screen.getByLabelText("Problem source"), { target: { value: "compiler" } });
    expect(screen.getByText("No matching problems")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Problem source"), { target: { value: "runtime" } });
    fireEvent.change(screen.getByLabelText("Group problems by"), { target: { value: "severity" } });
    expect(screen.getByRole("region", { name: "severity: error" })).toBeInTheDocument();
    expect(screen.getByText(/Revision/).parentElement?.textContent).toMatch(/accepted/);
    expect(screen.getByRole("button", { name: "Copy redacted support report" })).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("Stage"), { target: { value: firstUid } });
    fireEvent.click(screen.getByRole("button", { name: "Validate stage" }));
    await waitFor(() => expect(screen.getByText(/1 visible issue/)).toBeInTheDocument());
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
