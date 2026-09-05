import { act, createEvent, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudioEditorPage from "./StudioEditorPage";
import useStagesStore from "./store";
import editorConfig from "./configTemplates/initialConfig";
import { createMemoryProjectRepository } from "../src/projects";
import { toUid } from "../src/document";
import * as studioCompiler from "../src/compiler/compiler";
import projectV0 from "../src/document/fixtures/project-v0.json";

function outlineProjectSnapshot() {
  const project = {
    format: "stages-studio",
    formatVersion: 1,
    project: { uid: toUid("legacy_project"), title: "Outline project", defaultLocale: "en" },
    forms: {
      [toUid("form_outline")]: {
        uid: toUid("form_outline"),
        title: "Registration",
        runtime: { schemaId: "registration", schemaVersion: 1 },
        rootNodeUids: [toUid("field_first"), toUid("field_second"), toUid("group_drop"), toUid("wizard_journey")],
        nodes: {
          [toUid("field_first")]: {
            uid: toUid("field_first"), kind: "field", runtimeId: "first", definition: { key: "text", version: 1 }, props: { label: "First field" },
          },
          [toUid("field_second")]: {
            uid: toUid("field_second"), kind: "field", runtimeId: "second", definition: { key: "text", version: 1 }, props: { label: "Second field" },
          },
          [toUid("group_drop")]: {
            uid: toUid("group_drop"), kind: "group", runtimeId: "drop", childUids: [], presentation: { label: "Drop group" },
          },
          [toUid("wizard_journey")]: {
            uid: toUid("wizard_journey"), kind: "wizard", runtimeId: "journey", stageUids: [toUid("stage_details")], presentation: { label: "Journey" },
          },
          [toUid("stage_details")]: {
            uid: toUid("stage_details"), kind: "stage", runtimeId: "details", childUids: [toUid("field_nested")], presentation: { label: "Details" },
          },
          [toUid("field_nested")]: {
            uid: toUid("field_nested"), kind: "field", runtimeId: "nested", definition: { key: "text", version: 1 }, props: { label: "Nested field" },
          },
        },
        scenarios: [],
        settings: {},
      },
    },
    fragments: {},
    resources: {},
  };
  return {
    uid: project.project.uid,
    title: project.project.title,
    revision: 1,
    updatedAt: "2026-09-04T00:00:00.000Z",
    project,
  };
}

function emptyProjectSnapshot() {
  const snapshot = outlineProjectSnapshot();
  const form = snapshot.project.forms[toUid("form_outline")];
  return {
    ...snapshot,
    title: "Empty project",
    project: {
      ...snapshot.project,
      project: { ...snapshot.project.project, title: "Empty project" },
      forms: {
        [toUid("form_outline")]: { ...form, rootNodeUids: [], nodes: {} },
      },
    },
  };
}

function dynamicProjectSnapshot() {
  const snapshot = outlineProjectSnapshot();
  const form = snapshot.project.forms[toUid("form_outline")];
  const reference = (scope, path) => ({ kind: "reference", scope, path });
  return {
    ...snapshot,
    project: {
      ...snapshot.project,
      forms: {
        [form.uid]: {
          ...form,
          nodes: {
            ...form.nodes,
            [toUid("field_first")]: { ...form.nodes[toUid("field_first")], behavior: { when: reference("context", ["showFirst"]) } },
            [toUid("field_second")]: {
              ...form.nodes[toUid("field_second")],
              behavior: { disabled: reference("context", ["readOnly"]) },
              derivedProps: {
                label: {
                  kind: "conditional",
                  condition: { kind: "binary", operator: "===", left: reference("context", ["locale"]), right: { kind: "literal", value: "de" } },
                  whenTrue: { kind: "literal", value: "Zweiter" },
                  whenFalse: { kind: "literal", value: "Second field" },
                },
              },
            },
            [toUid("group_drop")]: { ...form.nodes[toUid("group_drop")], behavior: { presentWhen: reference("extension", ["features", "drop"]) } },
          },
          scenarios: [
            { uid: toUid("scenario_editing"), title: "Editing", value: {}, context: { showFirst: true, readOnly: false, locale: "en" }, extensions: { features: { drop: true } } },
            { uid: toUid("scenario_readonly"), title: "Read only", value: {}, context: { showFirst: false, readOnly: true, locale: "de" }, extensions: { features: { drop: false } } },
          ],
        },
      },
    },
  };
}

async function openWorkbenchPanel(user, name) {
  const trigger = screen.getByRole("button", { name });
  if (trigger.getAttribute("aria-pressed") !== "true") await user.click(trigger);
}

async function openPreview(user) {
  const trigger = screen.getByRole("button", { name: "Preview" });
  if (trigger.getAttribute("aria-pressed") !== "true") await user.click(trigger);
  for (const name of [/^Problems \(/, "Scenario data", "Dynamic structure", "Runtime observability", "Validation tools"]) {
    await user.click(screen.getByRole("button", { name }));
  }
}

describe("StudioEditorPage interactions", () => {
  beforeEach(() => {
    useStagesStore.setState({
      currentConfig: editorConfig,
      data: {},
      isEditMode: false,
      editorTabIndex: 0,
      selectedElement: "",
      activeContextMenuInput: "",
      undoData: [editorConfig],
      activeUndoIndex: 0,
      previewSize: "desktop",
    });
    vi.spyOn(useStagesStore.persist, "rehydrate").mockResolvedValue(undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("switches to editing, selects a field, and edits its configuration without an update loop", async () => {
    let updates = 0;
    const unsubscribe = useStagesStore.subscribe(() => { updates += 1; });
    const user = userEvent.setup();
    render(<StudioEditorPage />);

    await user.click(screen.getByRole("button", { name: "Switch to editor mode" }));
    const canvasInput = await waitFor(() => {
      const input = document.querySelector('input[name="username"]');
      expect(input).toBeTruthy();
      return input;
    });
    await user.hover(canvasInput);
    await user.click(canvasInput);
    await user.type(canvasInput, "Ada");
    await waitFor(() => expect(useStagesStore.getState().data.username).toBe("Ada"));
    const labelInput = await waitFor(() => {
      const input = document.querySelector('input[name="label"]');
      expect(input).toBeTruthy();
      return input;
    });
    const updatesBeforeTyping = updates;
    await user.clear(labelInput);
    await user.type(labelInput, "Full name");

    await waitFor(() => expect(useStagesStore.getState().currentConfig[1].label).toBe("Full name"));
    expect(updates - updatesBeforeTyping).toBeLessThanOrEqual(10);
    unsubscribe();
  });

  it("opens demos as separate projects and switches layouts without resetting answers", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository();
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Open demo" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Open demo" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: /Full name/ })).toHaveValue("Ada Lovelace"));
    const name = screen.getByRole("textbox", { name: /Full name/ });
    await user.clear(name);
    await user.type(name, "Test person");
    for (const breakpoint of ["Mobile", "Tablet", "Desktop"]) {
      await user.click(screen.getByRole("button", { name: breakpoint, exact: true }));
      expect(screen.getByTestId("studio-v1-editor")).toHaveAttribute("data-preview-breakpoint", breakpoint.toLowerCase());
      expect(name).toHaveValue("Test person");
    }
    await user.selectOptions(screen.getByLabelText("Demo form"), "controls");
    await user.click(screen.getByRole("button", { name: "Open demo" }));
    await waitFor(() => expect(screen.getByRole("spinbutton", { name: "Tickets" })).toHaveValue(2));
    const saved = await repository.list();
    expect(saved.map(({ title }) => title)).toEqual(expect.arrayContaining(["Simple contact", "Registration & preferences"]));
    await user.click(screen.getByRole("button", { name: "Preview", exact: true }));
    await user.click(screen.getByRole("button", { name: "Mobile", exact: true }));
    expect(screen.getByRole("spinbutton", { name: "Tickets" })).toHaveValue(2);
  });

  it("opens the Kitchensink and exposes interactive feature sections", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Open demo" })).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Demo form"), "kitchensink");
    await user.click(screen.getByRole("button", { name: "Open demo" }));
    await waitFor(() => expect(screen.getByRole("spinbutton", { name: "Quantity", exact: true })).toHaveValue(3));
    expect(screen.getByRole("textbox", { name: "Company name", exact: true })).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox", { name: "Account type" }), "Personal");
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Company name", exact: true })).toBeNull());
    expect(screen.getByRole("textbox", { name: /^Advanced reference/ })).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Show advanced options" }));
    await waitFor(() => expect(screen.queryByRole("textbox", { name: /^Advanced reference/ })).toBeNull());
    expect(document.querySelectorAll('[data-canvas-uid][data-design-kind="fragment"]')).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Preview", exact: true }));
    expect(screen.getByRole("option", { name: "Invalid · submit to see errors" })).toBeInTheDocument();
  });

  it("imports live startup state into document v1 behind the feature flag", () => {
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository()} />);
    const startup = document.querySelector('[data-studio-startup="document-v1"]');
    expect(startup).toBeTruthy();
    expect(startup).toHaveAttribute("data-studio-project-format", "stages-studio");
    expect(startup).toHaveAttribute("data-studio-import-errors", "0");
    expect(screen.getByRole("region", { name: "Canvas" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Canvas" })).toBeNull();
    expect(screen.queryByText(/click to select · drag/)).toBeNull();
  });

  it("does not recompile the active form for selection and panel changes", async () => {
    const user = userEvent.setup();
    const compile = vi.spyOn(studioCompiler, "compileStudioForm");
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository()} />);
    await screen.findByText("New local draft");
    expect(compile).toHaveBeenCalled();
    compile.mockClear();
    const canvas = screen.getByRole("region", { name: "Canvas" });
    await user.click(within(canvas).getAllByRole("textbox")[0]);
    await user.click(screen.getByRole("button", { name: "Project" }));
    await user.click(screen.getByRole("button", { name: "Project" }));
    expect(compile).not.toHaveBeenCalled();
  });

  it("hydrates before reading the legacy local-storage migration preview", async () => {
    const repository = createMemoryProjectRepository();
    const element = <StudioEditorPage documentV1Enabled projectRepository={repository} />;
    const storage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: undefined });
    const serverHtml = renderToString(element);
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    storage.setItem("stages-studio-storage-0.1", JSON.stringify({
      state: { currentConfig: [{ id: "name", type: "text" }], generalConfig: { title: "Hydrated legacy form" } },
    }));
    expect(serverHtml).not.toContain("Legacy project found");

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const root = hydrateRoot(container, element);
    await waitFor(() => expect(within(container).getByRole("button", { name: "Project" })).toBeInTheDocument());
    fireEvent.click(within(container).getByRole("button", { name: "Project" }));
    await waitFor(() => expect(container).toHaveTextContent("Legacy project found"));
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("Hydration failed");
    await act(async () => root.unmount());
    container.remove();
  });

  it("runs the document-v1 editor slice from palette through local draft reload", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository();
    const first = render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("New local draft");
    await openWorkbenchPanel(user, "Insert");

    await user.click(screen.getByRole("button", { name: "Add text field" }));
    const label = screen.getByRole("textbox", { name: "Label" });
    await user.clear(label);
    await user.type(label, "Speaker name");
    expect(screen.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: "Speaker name" }), "Ada");
    expect(screen.getByRole("textbox", { name: "Speaker name" })).toHaveValue("Ada");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("textbox", { name: "Text field" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Local draft saved");

    first.unmount();
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    expect(screen.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
  });

  it("creates, duplicates, renames, deletes, and restores local projects", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Project");

    await user.click(screen.getByRole("button", { name: "Duplicate project" }));
    await screen.findByText("Project duplicated");
    expect(screen.getByRole("combobox", { name: "Local project" })).toHaveTextContent("Outline project copy");

    const title = screen.getByRole("textbox", { name: "Project title" });
    await user.clear(title);
    await user.type(title, "Workshop copy");
    await user.click(screen.getByRole("button", { name: "Rename project" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Local draft saved");

    await user.click(screen.getByRole("button", { name: "Project actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete project…" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    await screen.findByText("Project moved to recovery");
    await user.click(screen.getByRole("button", { name: /^Recovery/ }));
    const deleted = screen.getByText(/Workshop copy · deleted r2/).closest("li");
    expect(deleted).toBeTruthy();
    await user.click(within(deleted).getByRole("button", { name: "Restore…" }));
    await user.click(within(deleted).getByRole("button", { name: "Confirm restore" }));
    await screen.findByText(/Recovered Workshop copy from deleted revision 2/);
    expect(screen.getByRole("textbox", { name: "Project title" })).toHaveValue("Workshop copy");

    await user.click(screen.getByRole("button", { name: "Create project" }));
    await screen.findByText("Project created");
    expect(screen.getByRole("textbox", { name: "Project title" })).toHaveValue("Untitled project");
  });

  it("previews and migrates legacy local storage only after confirmation", async () => {
    const user = userEvent.setup();
    localStorage.setItem("stages-studio-storage-0.1", JSON.stringify({
      state: {
        currentConfig: [{ id: "attendee", type: "text", label: "Attendee" }],
        generalConfig: { title: "Legacy registration" },
        data: { attendee: "Ada" },
        fieldsets: [],
      },
      version: 0,
    }));
    const repository = createMemoryProjectRepository();
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("New local draft");
    await openWorkbenchPanel(user, "Project");
    expect(screen.getByText(/Legacy registration · 1 top-level blocks/)).toBeVisible();
    expect(localStorage.getItem("stages-studio-storage-0.1")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Confirm legacy migration" }));
    await screen.findByText(/Legacy project migrated/);
    expect(localStorage.getItem("stages-studio-storage-0.1")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Project title" })).toHaveValue("Legacy registration");
  });

  it("keeps project history dirty and blocks project changes after a storage failure", async () => {
    const user = userEvent.setup();
    const memory = createMemoryProjectRepository([outlineProjectSnapshot()]);
    const repository = {
      ...memory,
      save: vi.fn(async () => { throw new DOMException("Local quota exhausted", "QuotaExceededError"); }),
    };
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Insert");
    await user.click(screen.getByRole("button", { name: "Add text field" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText(/Local save failed: Local quota exhausted/);
    expect(screen.getByText("Unsaved project changes")).toBeVisible();

    await openWorkbenchPanel(user, "Project");
    await user.click(screen.getByRole("button", { name: "Create project" }));
    await screen.findByText("Could not create a project because pending changes are not saved.");
    expect(screen.getByRole("textbox", { name: "Project title" })).toHaveValue("Outline project");
  });

  it("imports with migration reports and exposes deterministic export artifacts", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Project");

    await user.click(screen.getByRole("button", { name: "Import & export" }));
    await user.click(screen.getByRole("button", { name: "Generate export artifacts" }));
    expect(screen.getByText(/Generated 9 deterministic artifacts/)).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Generated artifact" })).toHaveValue("project.stages.json");
    expect(screen.getByRole("textbox", { name: "Artifact source" }).value).toContain('"format": "stages-studio"');
    const download = screen.getByRole("link", { name: "Download artifact" });
    expect(download).toHaveAttribute("download", "project.stages.json");
    expect(decodeURIComponent(download.getAttribute("href").split(",")[1])).toBe(screen.getByRole("textbox", { name: "Artifact source" }).value);

    fireEvent.change(screen.getByRole("textbox", { name: "Studio project JSON" }), { target: { value: JSON.stringify(projectV0) } });
    await user.click(screen.getByRole("button", { name: "Import and validate" }));
    expect(screen.getByText(/Applied: studio-project-0-to-1/)).toBeVisible();
    expect(screen.getAllByText("Event launch").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("textbox", { name: "Studio project JSON" }), { target: { value: "{" } });
    await user.click(screen.getByRole("button", { name: "Import and validate" }));
    expect(screen.getByText(/document.invalid-json/)).toBeVisible();
  });

  it("keeps export artifacts downloadable when a legacy field blocks runtime generation", async () => {
    const user = userEvent.setup();
    const snapshot = outlineProjectSnapshot();
    snapshot.project.forms.form_outline.nodes.field_first.definition = { key: "rating", version: 1 };
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([snapshot])} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Project");
    await user.click(screen.getByRole("button", { name: "Import & export" }));
    await user.click(screen.getByRole("button", { name: "Generate export artifacts" }));
    expect(screen.getByText(/Project JSON is ready to download/)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Artifact source" }).value).toContain('"rating"');
    expect(screen.getByRole("link", { name: "Download artifact" })).toHaveAttribute("download", "project.stages.json");
    await user.selectOptions(screen.getByRole("combobox", { name: "Generated artifact" }), "export-report.json");
    expect(screen.getByRole("textbox", { name: "Artifact source" }).value).toContain("document.unsupported-definition-version");
    expect(screen.getByRole("link", { name: "Download artifact" })).toHaveAttribute("download", "export-report.json");
  });

  it("generates the field palette and keeps invalid inspector drafts out of command history", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([emptyProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Insert");

    for (const name of ["text field", "text area", "number", "choice", "checkbox", "date", "email", "phone", "website", "password", "time", "slider"]) {
      expect(screen.getByRole("button", { name: `Add ${name}` })).toBeVisible();
    }

    await user.click(screen.getByRole("button", { name: "Add number" }));
    expect(screen.getByRole("spinbutton", { name: "Number" })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Minimum" }), { target: { value: "-" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Minimum must be a finite number.");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByRole("spinbutton", { name: "Number" })).toBeNull();
  });

  it("edits choice options as rows and supports undo", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([emptyProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Insert");
    await user.click(screen.getByRole("button", { name: "Add choice" }));
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.clear(screen.getByRole("textbox", { name: "Option 1", exact: true }));
    await user.type(screen.getByRole("textbox", { name: "Option 1", exact: true }), "Design");
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.clear(screen.getByRole("textbox", { name: "Option 2", exact: true }));
    await user.type(screen.getByRole("textbox", { name: "Option 2", exact: true }), "Engineering");
    const choice = screen.getByRole("combobox", { name: "Choice", exact: true });
    expect(within(choice).getAllByRole("option").map((option) => option.textContent)).toEqual(["Choose…", "Design", "Engineering"]);
    await user.click(screen.getByRole("button", { name: "Move option 2 up" }));
    expect(within(choice).getAllByRole("option")[1]).toHaveTextContent("Engineering");
    await user.click(screen.getByRole("button", { name: "Remove option 1" }));
    expect(within(choice).queryByRole("option", { name: "Engineering" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(within(choice).getByRole("option", { name: "Engineering" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Option 1", exact: true })).toHaveValue("Engineering");
    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("textbox", { name: "Option 1", exact: true })).toHaveValue("Design");
  });

  it("authors decorative content without creating a preview form value", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([emptyProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Insert");

    for (const name of ["heading", "message", "divider", "help text"]) {
      expect(screen.getByRole("button", { name: `Add ${name}` })).toBeVisible();
    }
    await user.click(screen.getByRole("button", { name: "Add heading" }));
    expect(screen.getByRole("heading", { name: "Heading", level: 2 })).toBeVisible();
    await user.clear(screen.getByRole("textbox", { name: "Heading" }));
    await user.type(screen.getByRole("textbox", { name: "Heading" }), "About you");
    expect(screen.getByRole("heading", { name: "About you", level: 2 })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "About you" })).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Half width" }));
    expect(screen.getByRole("heading", { name: "About you", level: 2 }).closest(".studio-v1-preview__layout")).toHaveAttribute("data-width-desktop", "half");
    expect(document.querySelector('[data-studio-theme="default"]')).toHaveStyle({
      "--studio-preview-background": "#ffffff",
    });
  });

  it("authors variant collections and ordered wizard stages from the structural palette", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([emptyProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Insert");

    await user.click(screen.getByRole("button", { name: "Add variant collection" }));
    expect(screen.getByRole("group", { name: "Variant collection settings" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Discriminator" })).toHaveValue("kind");
    await openWorkbenchPanel(user, "Layers");
    expect(document.querySelectorAll('[data-kind="variant"]')).toHaveLength(1);
    await openWorkbenchPanel(user, "Insert");
    await user.click(screen.getByRole("button", { name: "Add variant to selected collection" }));
    await openWorkbenchPanel(user, "Layers");
    expect(document.querySelectorAll('[data-kind="variant"]')).toHaveLength(2);

    await openWorkbenchPanel(user, "Insert");
    await user.click(screen.getByRole("button", { name: "Add wizard" }));
    expect(screen.getByRole("group", { name: "Wizard settings" })).toBeVisible();
    await openWorkbenchPanel(user, "Layers");
    expect(document.querySelectorAll('[data-kind="stage"]')).toHaveLength(1);
    await openWorkbenchPanel(user, "Insert");
    await user.click(screen.getByRole("button", { name: "Add stage to selected wizard" }));
    await openWorkbenchPanel(user, "Layers");
    expect(document.querySelectorAll('[data-kind="stage"]')).toHaveLength(2);
  });

  it("searches nested layers without losing the existing collapsed state", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");
    await user.click(screen.getByRole("button", { name: "Collapse all layers" }));
    expect(screen.queryByRole("treeitem", { name: "Nested field" })).toBeNull();
    await user.type(screen.getByRole("textbox", { name: "Search layers" }), "Nested");
    expect(screen.getByRole("treeitem", { name: "Journey" })).toHaveAttribute("aria-expanded", "true");
    const nested = screen.getByRole("treeitem", { name: "Nested field" });
    expect(nested).toBeVisible();
    expect(screen.queryByRole("treeitem", { name: "First field" })).toBeNull();
    fireEvent.click(nested);
    expect(nested).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("button", { name: "Clear layer search" }));
    expect(screen.queryByRole("treeitem", { name: "Nested field" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Expand all layers" }));
    expect(screen.getByRole("treeitem", { name: "Nested field" })).toHaveAttribute("aria-selected", "true");
  });

  it("starts preview with the form visible and technical tools collapsed", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByRole("textbox", { name: "First field" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Named scenario" })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Problem source" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Save runtime envelope" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Simulated route" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Test details" }));
    expect(screen.getByRole("combobox", { name: "Simulated route" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Runtime persistence" }));
    expect(screen.getByRole("button", { name: "Save runtime envelope" })).toBeVisible();
  });

  it("coordinates keyboard outline navigation and multi-selection across compiled structural nodes", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");

    const formItem = document.querySelector('[data-outline-uid="form_outline"]');
    const firstItem = document.querySelector('[data-outline-uid="field_first"]');
    const secondItem = document.querySelector('[data-outline-uid="field_second"]');
    const wizardItem = document.querySelector('[data-outline-uid="wizard_journey"]');
    expect(formItem).toBeTruthy();
    expect(firstItem).toBeTruthy();
    expect(secondItem).toBeTruthy();
    expect(wizardItem).toBeTruthy();

    await act(async () => { formItem.focus(); });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(document.activeElement).toBe(firstItem);
    expect(firstItem).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue("First field");
    const runtimeIdInput = screen.getByRole("textbox", { name: "Runtime ID" });
    expect(runtimeIdInput).toHaveAttribute("readonly");
    expect(runtimeIdInput).toHaveAccessibleDescription(/Read-only.*Used by data and logic references/);
    await user.type(runtimeIdInput, "renamed");
    expect(firstItem).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Runtime ID" })).toHaveValue("first");

    fireEvent.click(secondItem, { ctrlKey: true });
    expect(firstItem).toHaveAttribute("aria-selected", "true");
    expect(secondItem).toHaveAttribute("aria-selected", "true");
    await user.type(screen.getByRole("textbox", { name: /^Label/ }), "Shared label");
    await user.click(screen.getByRole("button", { name: "Apply Label to selection" }));
    expect(screen.getAllByRole("textbox", { name: "Shared label" })).toHaveLength(2);

    await act(async () => { wizardItem.focus(); });
    await user.keyboard("{ArrowRight}");
    const stageItem = document.querySelector('[data-outline-uid="stage_details"]');
    expect(stageItem).toBeTruthy();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(stageItem);
    await user.keyboard("{ArrowRight}");
    expect(document.querySelector('[data-outline-uid="field_nested"]')).toBeTruthy();

    await openPreview(user);
    expect(screen.getByText("No problems")).toBeVisible();
  });

  it("routes keyboard, context-menu, shortcut, and pointer structure edits through commands", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");

    let firstItem = document.querySelector('[data-outline-uid="field_first"]');
    let secondItem = document.querySelector('[data-outline-uid="field_second"]');
    const dropGroup = document.querySelector('[data-outline-uid="group_drop"]');
    expect(firstItem && secondItem && dropGroup).toBeTruthy();

    await act(async () => { firstItem.focus(); });
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await screen.findByText("First field moved down.");
    const rootGroup = document.querySelector('[data-outline-uid="form_outline"] > [role="group"]');
    expect(rootGroup.children[0]).toHaveAttribute("data-outline-uid", "field_second");
    expect(rootGroup.children[1]).toHaveAttribute("data-outline-uid", "field_first");

    firstItem = document.querySelector('[data-outline-uid="field_first"]');
    secondItem = document.querySelector('[data-outline-uid="field_second"]');
    fireEvent.click(secondItem);
    fireEvent.click(firstItem, { ctrlKey: true });
    fireEvent.contextMenu(firstItem);
    await user.click(screen.getByRole("menuitem", { name: "Group" }));
    await screen.findByText("2 nodes grouped.");
    const grouped = document.querySelector('[data-kind="group"][aria-selected="true"]');
    expect(grouped).toBeTruthy();

    await act(async () => { grouped.focus(); });
    await user.keyboard("{Control>}{Shift>}g{/Shift}{/Control}");
    await screen.findByText("Group ungrouped.");
    expect(document.querySelector('[data-outline-uid="field_first"]')).toBeTruthy();
    expect(document.querySelector('[data-outline-uid="field_second"]')).toBeTruthy();

    secondItem = document.querySelector('[data-outline-uid="field_second"]');
    fireEvent.click(secondItem);
    await act(async () => { secondItem.focus(); });
    await user.keyboard("{Control>}c{/Control}{Control>}v{/Control}");
    await screen.findByText("Node pasted.");
    expect(screen.getAllByRole("textbox", { name: "Second field" })).toHaveLength(2);
    await user.keyboard("{Control>}x{/Control}");
    await screen.findByText("Node cut.");
    expect(screen.getAllByRole("textbox", { name: "Second field" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Undo" }));

    secondItem = document.querySelector('[data-outline-uid="field_second"]');
    const data = new Map();
    const dataTransfer = {
      effectAllowed: "all",
      setData: (type, value) => data.set(type, value),
      getData: (type) => data.get(type) ?? "",
    };
    fireEvent.dragStart(secondItem, { dataTransfer });
    fireEvent.dragOver(dropGroup, { dataTransfer });
    fireEvent.drop(dropGroup, { dataTransfer });
    await screen.findByText("Second field moved to Drop group.");
    await user.click(screen.getByRole("button", { name: "Expand Drop group" }));
    secondItem = document.querySelector('[data-outline-uid="field_second"]');
    expect(secondItem).toHaveAttribute("aria-level", "3");
    await act(async () => { secondItem.focus(); });
    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await screen.findByText("Second field moved out.");
    expect(document.querySelector('[data-outline-uid="field_second"]')).toHaveAttribute("aria-level", "2");
  });

  it("supports canvas clipboard, backspace cut, duplicate, undo and redo shortcuts", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    const canvasNode = (uid) => document.querySelector(`[data-canvas-uid="${uid}"]`);
    await user.click(canvasNode("field_first"));
    await user.keyboard("{Meta>}c{/Meta}");
    await screen.findByText("Node copied.");
    await user.keyboard("{Meta>}v{/Meta}");
    expect(canvasNode("field_first_copy")).toBeTruthy();
    await user.keyboard("{Backspace}");
    expect(canvasNode("field_first_copy")).toBeNull();
    await user.keyboard("{Control>}v{/Control}");
    expect(canvasNode("field_first_copy_copy")).toBeTruthy();
    await user.keyboard("{Control>}d{/Control}");
    expect(canvasNode("field_first_copy_copy_copy")).toBeTruthy();
    await user.keyboard("{Control>}z{/Control}");
    expect(canvasNode("field_first_copy_copy_copy")).toBeNull();
    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(canvasNode("field_first_copy_copy_copy")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(document.querySelector('[data-authoring-selected="true"]')).toBeNull();
  });

  it("moves adjacent selected items with arrows and keeps keyboard focus across nesting", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    const canvasNode = (uid) => document.querySelector(`[data-canvas-uid="${uid}"]`);
    await user.click(canvasNode("field_second"));
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(canvasNode("field_second").parentElement.closest('[data-canvas-uid]')).toBe(canvasNode("group_drop"));
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(canvasNode("field_second").parentElement.closest('[data-canvas-uid]')).toBeNull();
    await user.click(canvasNode("field_first"));
    fireEvent.click(canvasNode("field_second"), { shiftKey: true });
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(canvasNode("field_first").parentElement.closest('[data-canvas-uid]')).toBe(canvasNode("group_drop"));
    expect(canvasNode("field_second").parentElement.closest('[data-canvas-uid]')).toBe(canvasNode("group_drop"));
    await user.keyboard("{Control>}z{/Control}");
    expect(canvasNode("field_first").parentElement.closest('[data-canvas-uid]')).toBeNull();
    expect(canvasNode("field_second").parentElement.closest('[data-canvas-uid]')).toBeNull();
  });

  it("selects all, groups and ungroups, then deletes with keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    await user.click(document.querySelector('[data-canvas-uid="field_first"]'));
    await user.keyboard("{Control>}a{/Control}");
    expect(document.querySelectorAll('[data-authoring-selected="true"]')).toHaveLength(4);
    await user.keyboard("{Control>}g{/Control}");
    await screen.findByText("4 nodes grouped.");
    await user.keyboard("{Control>}{Shift>}g{/Shift}{/Control}");
    expect(document.querySelectorAll('[data-authoring-selected="true"]')).toHaveLength(4);
    await user.keyboard("{Delete}");
    expect(document.querySelector('[data-canvas-uid="field_first"]')).toBeNull();
    await user.keyboard("{Control>}z{/Control}");
    expect(document.querySelector('[data-canvas-uid="field_first"]')).toBeTruthy();
  });

  it("leaves typing and preview keyboard events alone", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    const first = document.querySelector('[data-canvas-uid="field_first"]');
    await user.click(first);
    const label = screen.getByRole("textbox", { name: "Label", exact: true });
    await user.click(label);
    await user.keyboard("{End}{Backspace}");
    expect(label).toHaveValue("First fiel");
    expect(first).toBeInTheDocument();
    const input = within(first).getByRole("textbox");
    await user.click(input);
    const event = createEvent.keyDown(input, { key: "Backspace", bubbles: true, cancelable: true });
    fireEvent(input, event);
    expect(event.defaultPrevented).toBe(false);
    await user.click(screen.getByRole("button", { name: "Preview", exact: true }));
    const previewInput = screen.getByRole("textbox", { name: "First fiel", exact: true });
    const previewEvent = createEvent.keyDown(previewInput, { key: "d", ctrlKey: true, bubbles: true, cancelable: true });
    fireEvent(previewInput, previewEvent);
    expect(previewEvent.defaultPrevented).toBe(false);
  });

  it("offers contextual field actions for a selection with undo and clipboard preservation", async () => {
    const user = userEvent.setup();
    const snapshot = outlineProjectSnapshot();
    snapshot.project.forms.form_outline.nodes.field_first.validators = [{ kind: "length", min: 2 }];
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([snapshot])} />);
    await screen.findByText("Local draft loaded");
    const first = () => document.querySelector('[data-canvas-uid="field_first"]');
    const second = () => document.querySelector('[data-canvas-uid="field_second"]');
    await user.click(first());
    fireEvent.click(second(), { shiftKey: true });
    fireEvent.contextMenu(second());
    expect(screen.queryByRole("menuitem", { name: "Add stage" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Make required" }));
    expect(within(first()).getByRole("img", { name: "Validation: 2 validation rules configured" })).toBeTruthy();
    expect(within(second()).getByRole("img", { name: "Validation: 1 validation rule configured" })).toBeTruthy();
    fireEvent.contextMenu(second());
    await user.click(screen.getByRole("menuitem", { name: "Make optional" }));
    expect(within(first()).getByRole("textbox")).not.toBeRequired();
    expect(within(first()).getByRole("img", { name: "Validation: 1 validation rule configured" })).toBeTruthy();
    fireEvent.contextMenu(second());
    await user.click(screen.getByRole("menuitem", { name: "Disable", exact: true }));
    expect(within(first()).getByRole("textbox")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(within(first()).getByRole("textbox")).toBeEnabled();
    fireEvent.contextMenu(second());
    await user.click(screen.getByRole("menuitem", { name: "Duplicate", exact: true }));
    await screen.findByText("Selection duplicated.");
    expect(document.querySelector('[data-canvas-uid="field_first_copy"]')).toBeTruthy();
    fireEvent.contextMenu(document.querySelector('[data-canvas-uid="field_first_copy"]'));
    expect(screen.getByRole("menuitem", { name: "Paste", exact: true })).toBeDisabled();
    await user.click(screen.getByRole("menuitem", { name: "Delete", exact: true }));
    expect(document.querySelector('[data-canvas-uid="field_first_copy"]')).toBeNull();
    expect(first()).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(document.querySelector('[data-canvas-uid="field_first_copy"]')).toBeTruthy();
  });

  it("offers variant defaults and preserves conditional disabled rules", async () => {
    const user = userEvent.setup();
    const snapshot = outlineProjectSnapshot();
    const form = snapshot.project.forms.form_outline;
    form.nodes.group_drop = { uid: "group_drop", kind: "collection", runtimeId: "items", discriminator: "kind", variantUids: ["variant_a"], initialVariantUid: "variant_a" };
    form.nodes.variant_a = { uid: "variant_a", kind: "variant", runtimeId: "a", childUids: [] };
    form.nodes.field_first.behavior = { disabled: { kind: "literal", value: true } };
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([snapshot])} />);
    await screen.findByText("Local draft loaded");
    fireEvent.contextMenu(document.querySelector('[data-canvas-uid="field_first"]'));
    expect(screen.queryByRole("menuitem", { name: /^(Enable|Disable)$/ })).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    await user.click(screen.getByRole("button", { name: "Layers", exact: true }));
    fireEvent.contextMenu(document.querySelector('[data-outline-uid="group_drop"]'));
    await user.click(screen.getByRole("menuitem", { name: "Add variant" }));
    await screen.findByText("variant added");
    const variants = document.querySelectorAll('[data-outline-uid="group_drop"] [data-kind="variant"]');
    expect(variants).toHaveLength(2);
    fireEvent.contextMenu(variants[1]);
    await user.click(screen.getByRole("menuitem", { name: "Make initial variant" }));
    fireEvent.contextMenu(variants[1]);
    expect(screen.queryByRole("menuitem", { name: "Make initial variant" })).toBeNull();
  });

  it("adds stages from the outline and offers child insertion on containers", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    await user.click(screen.getByRole("button", { name: "Layers", exact: true }));
    fireEvent.contextMenu(document.querySelector('[data-outline-uid="wizard_journey"]'));
    expect(screen.queryByRole("menuitem", { name: "Make required" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Add stage", exact: true }));
    await screen.findByText("stage added");
    expect(document.querySelectorAll('[data-outline-uid="wizard_journey"] [data-kind="stage"]')).toHaveLength(2);
    fireEvent.contextMenu(document.querySelector('[data-canvas-uid="group_drop"]'));
    await user.click(screen.getByRole("menuitem", { name: "Add item…" }));
    await user.click(screen.getByRole("menuitem", { name: "Insert text field", exact: true }));
    expect(document.querySelector('[data-canvas-uid="group_drop"] input')).toBeTruthy();
  });

  it("shift-selects canvas items, batch edits shared props with undo, and groups the selection", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    const first = document.querySelector('[data-canvas-uid="field_first"]');
    const second = document.querySelector('[data-canvas-uid="field_second"]');
    await user.click(first);
    fireEvent.click(second, { shiftKey: true });
    expect(first).toHaveAttribute("data-authoring-selected", "true");
    expect(second).toHaveAttribute("data-authoring-selected", "true");
    expect(screen.getByText("2 items selected")).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: "Placeholder" }), "Shared hint");
    await user.click(screen.getByRole("button", { name: "Apply Placeholder to selection" }));
    expect(within(first).getByRole("textbox")).toHaveAttribute("placeholder", "Shared hint");
    expect(within(second).getByRole("textbox")).toHaveAttribute("placeholder", "Shared hint");
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(within(first).getByRole("textbox")).not.toHaveAttribute("placeholder", "Shared hint");
    expect(within(second).getByRole("textbox")).not.toHaveAttribute("placeholder", "Shared hint");
    fireEvent.contextMenu(second, { clientX: 24, clientY: 32 });
    await user.click(screen.getByRole("menuitem", { name: "Group", exact: true }));
    await screen.findByText("2 nodes grouped.");
    expect(first.closest('[data-design-kind="group"]')).toBe(second.closest('[data-design-kind="group"]'));
    expect(document.querySelector('[data-design-kind="group"] [data-canvas-uid="field_first"]')).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(document.querySelector('[data-design-kind="group"] [data-canvas-uid="field_first"]')).toBeNull();
  });

  it("shift-click toggles a nested canvas item independently of collapsed layers", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    const first = document.querySelector('[data-canvas-uid="field_first"]');
    const nested = document.querySelector('[data-canvas-uid="field_nested"]');
    await user.click(first);
    fireEvent.click(nested, { shiftKey: true });
    expect(first).toHaveAttribute("data-authoring-selected", "true");
    expect(nested).toHaveAttribute("data-authoring-selected", "true");
    expect(screen.getByText("2 items selected")).toBeVisible();
    fireEvent.click(nested, { shiftKey: true });
    expect(first).toHaveAttribute("data-authoring-selected", "true");
    expect(nested).not.toHaveAttribute("data-authoring-selected");
  });

  it("selects, clears selection, shows drop placement, and opens structure actions on the canvas", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");

    const first = document.querySelector('[data-canvas-uid="field_first"]');
    let dropGroup = document.querySelector('[data-canvas-uid="group_drop"]');
    expect(first && dropGroup).toBeTruthy();
    await user.click(first);
    expect(first).toHaveAttribute("data-authoring-selected", "true");
    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue("First field");
    await user.click(document.querySelector(".studio-v1-authoring-canvas .studio-v1-preview__fields"));
    expect(first).not.toHaveAttribute("data-authoring-selected");
    expect(screen.getByText("Select an item in the outline or canvas.")).toBeVisible();

    fireEvent.contextMenu(first, { clientX: 24, clientY: 32 });
    expect(first).toHaveAttribute("data-authoring-selected", "true");
    expect(screen.getByRole("menuitem", { name: /Move to top/ })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Structure" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Copy/ }));
    await screen.findByText("Node copied.");
    dropGroup = document.querySelector('[data-canvas-uid="group_drop"]');

    const data = new Map();
    const dataTransfer = {
      effectAllowed: "all",
      dropEffect: "none",
      setData: (type, value) => data.set(type, value),
      getData: (type) => data.get(type) ?? "",
    };
    fireEvent.dragStart(screen.getByRole("button", { name: "Move field_second" }), { dataTransfer });
    vi.spyOn(dropGroup, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 100, width: 200, height: 100, toJSON: () => ({}) });
    const dragOver = createEvent.dragOver(dropGroup, { dataTransfer });
    Object.defineProperty(dragOver, "clientY", { value: 50 });
    fireEvent(dropGroup, dragOver);
    expect(dropGroup).toHaveAttribute("data-drop-position", "inside");
    const drop = createEvent.drop(dropGroup, { dataTransfer });
    Object.defineProperty(drop, "clientY", { value: 50 });
    fireEvent(dropGroup, drop);
    await screen.findByText("Second field moved inside Drop group.");
  });

  it("inserts an item at the exact canvas position opened between siblings", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");

    const insertBeforeSecond = screen.getByRole("button", { name: "Insert before Second field" });
    fireEvent.contextMenu(insertBeforeSecond, { clientX: 40, clientY: 48 });
    expect(screen.getByRole("menu", { name: "Insert item" })).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name: "Insert text field" }));
    await screen.findByText("Text field added");

    const root = document.querySelector(".studio-v1-authoring-canvas .studio-v1-preview__fields");
    const rootUids = [...root.children].map((child) => child.getAttribute("data-canvas-uid"));
    expect(rootUids.slice(0, 3)).toEqual(["field_first", "field_text", "field_second"]);
    expect(screen.getByRole("textbox", { name: "Text field" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByRole("textbox", { name: "Text field" })).toBeNull();
  });

  it("changes canvas widths only at the active breakpoint with undo and saved layout", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    const view = render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await user.type(screen.getByRole("textbox", { name: "First field", exact: true }), "Keep this answer");
    const canvas = within(screen.getByRole("region", { name: "Canvas", exact: true }));
    await user.click(screen.getByRole("button", { name: "Tablet", exact: true }));
    await user.click(canvas.getByRole("button", { name: "Half width for first on tablet" }));
    const field = document.querySelector('[data-canvas-uid="field_first"]');
    await waitFor(() => expect(field).toHaveAttribute("data-width-tablet", "half"));
    expect(field).toHaveAttribute("data-width-mobile", "full");
    expect(field).toHaveAttribute("data-width-desktop", "full");
    expect(canvas.getByRole("button", { name: "Half width for first on tablet" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox", { name: "First field", exact: true })).toHaveValue("Keep this answer");
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    await waitFor(() => expect(field).toHaveAttribute("data-width-tablet", "full"));
    await user.click(screen.getByRole("button", { name: "Redo", exact: true }));
    await waitFor(() => expect(field).toHaveAttribute("data-width-tablet", "half"));
    await user.click(screen.getByRole("button", { name: "Mobile", exact: true }));
    await user.click(canvas.getByRole("button", { name: "Quarter width for first on mobile" }));
    await waitFor(() => expect(field).toHaveAttribute("data-width-mobile", "quarter"));
    expect(field).toHaveAttribute("data-width-tablet", "half");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Local draft saved");
    view.unmount();
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    const restored = document.querySelector('[data-canvas-uid="field_first"]');
    expect(restored).toHaveAttribute("data-width-mobile", "quarter");
    expect(restored).toHaveAttribute("data-width-tablet", "half");
    expect(restored).toHaveAttribute("data-width-desktop", "full");
  });

  it("labels canvas borders with paths and source kinds and resizes fragment instances independently", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    expect(document.querySelector('[data-canvas-uid="field_nested"] > .studio-canvas-identity')).toHaveTextContent(/^journey\.details\.nested$/);
    expect(document.querySelector('[data-canvas-uid="group_drop"] > .studio-canvas-identity')).toHaveTextContent(/^drop$/);
    await openWorkbenchPanel(user, "Layers");
    fireEvent.click(document.querySelector('[data-outline-uid="field_first"]'));
    await user.click(screen.getByRole("button", { name: "Create fragment from selection" }));
    await user.click(screen.getByRole("button", { name: "Insert Fragment 1" }));
    const fragments = document.querySelectorAll('[data-canvas-uid][data-design-kind="fragment"]');
    expect(fragments).toHaveLength(2);
    expect(fragments[0].querySelector('.studio-canvas-identity')).toHaveTextContent(/^fragment$/);
    expect(fragments[0].querySelector('[data-design-kind="field"] > .studio-canvas-identity')).toHaveTextContent(/^fragment\.first$/);
    await user.click(within(fragments[0]).getByRole("button", { name: "Half width for fragment on desktop" }));
    await waitFor(() => expect(fragments[0]).toHaveAttribute("data-width-desktop", "half"));
    expect(fragments[1]).toHaveAttribute("data-width-desktop", "full");
    await user.click(screen.getByRole("button", { name: "Preview", exact: true }));
    expect(document.querySelector('.studio-canvas-identity')).toBeNull();
    expect(document.querySelector('.studio-canvas-widths')).toBeNull();
  });

  it("creates, reuses, overrides, edits, and detaches linked fragments", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");

    fireEvent.click(document.querySelector('[data-outline-uid="field_first"]'));
    await openWorkbenchPanel(user, "Insert");
    await user.click(screen.getByRole("button", { name: "Create fragment from selection" }));
    await screen.findByText("Fragment 1 created");
    const definitionId = screen.getByRole("textbox", { name: "First field definition ID" });
    expect(definitionId).toHaveAttribute("readonly");
    expect(definitionId).toHaveAccessibleDescription(/Definition IDs are read-only/);
    await user.type(definitionId, "renamed");
    expect(definitionId).toHaveValue("first");

    const definitionName = screen.getByRole("textbox", { name: "Definition name" });
    await user.clear(definitionName);
    await user.type(definitionName, "Contact");
    await user.click(screen.getByRole("button", { name: "Insert Contact" }));
    await screen.findByText("Contact inserted");
    const override = screen.getByRole("textbox", { name: "Override First field label" });
    await user.type(override, "Primary contact");
    expect(screen.getByRole("textbox", { name: "Primary contact" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Detach instance" }));
    await screen.findByText("Contact detached");
    expect(document.querySelector('[data-kind="fragment"][aria-selected="true"]')).toBeNull();
    expect(screen.getByRole("textbox", { name: "Primary contact" })).toBeVisible();
  });

  it("edits shared fragment settings for every instance with undo, overrides, and persistence", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    const view = render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");
    fireEvent.click(document.querySelector('[data-outline-uid="field_first"]'));
    await user.click(screen.getByRole("button", { name: "Create fragment from selection" }));
    await user.click(screen.getByRole("button", { name: "Insert Fragment 1" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Override First field label" }), { target: { value: "Personal label" } });
    await user.click(screen.getByRole("button", { name: "Edit shared contents" }));
    const shared = within(screen.getByRole("region", { name: "Shared fragment editor" }));
    fireEvent.change(shared.getByRole("textbox", { name: "Label", exact: true }), { target: { value: "Shared name" } });
    expect(await screen.findByRole("textbox", { name: "Shared name", exact: true })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Personal label", exact: true })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(screen.getByRole("textbox", { name: "First field", exact: true })).toBeVisible();
    expect(shared.getByRole("textbox", { name: "Label", exact: true })).toHaveValue("First field");
    await user.click(screen.getByRole("button", { name: "Redo", exact: true }));
    expect(shared.getByRole("textbox", { name: "Label", exact: true })).toHaveValue("Shared name");
    await user.click(shared.getByRole("button", { name: "Back to form" }));
    await user.clear(screen.getByRole("textbox", { name: "Override Shared name label" }));
    const inputs = screen.getAllByRole("textbox", { name: "Shared name", exact: true });
    expect(inputs).toHaveLength(2);
    await user.type(inputs[0], "Alice");
    await user.type(inputs[1], "Bob");
    expect(inputs[0]).toHaveValue("Alice");
    expect(inputs[1]).toHaveValue("Bob");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Local draft saved");
    view.unmount();
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    expect(screen.getAllByRole("textbox", { name: "Shared name", exact: true })).toHaveLength(2);
    await openWorkbenchPanel(user, "Layers");
    await user.click(screen.getByRole("button", { name: "Edit Fragment 1" }));
    expect(screen.getByRole("region", { name: "Shared fragment editor" })).toBeVisible();
  });

  it("inserts fragments inside the selected group and through a canvas insertion menu", async () => {
    const user = userEvent.setup();
    render(<StudioEditorPage documentV1Enabled projectRepository={createMemoryProjectRepository([outlineProjectSnapshot()])} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");
    const first = document.querySelector('[data-outline-uid="field_first"]');
    fireEvent.contextMenu(first);
    await user.click(screen.getByRole("menuitem", { name: "Create fragment from selection" }));
    fireEvent.click(document.querySelector('[data-outline-uid="group_drop"]'));
    await user.click(screen.getByRole("button", { name: "Insert Fragment 1" }));
    const group = document.querySelector('[data-outline-uid="group_drop"]');
    expect(group.querySelector('[data-kind="fragment"]')).not.toBeNull();
    fireEvent.contextMenu(group);
    await user.click(screen.getByRole("menuitem", { name: "Add item…" }));
    await user.click(screen.getByRole("menuitem", { name: "Insert Fragment 1" }));
    expect(group.querySelectorAll('[data-kind="fragment"]')).toHaveLength(2);
    expect(screen.getAllByRole("textbox", { name: "First field", exact: true })).toHaveLength(3);
  });

  it("authors safe visibility expressions without offering unsupported computed values", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([outlineProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");

    fireEvent.click(document.querySelector('[data-outline-uid="field_first"]'));
    await user.click(screen.getByRole("switch", { name: "Conditional visibility" }));
    const visibility = screen.getByLabelText("Visibility expression");
    await user.selectOptions(within(visibility).getByRole("combobox", { name: "Expression" }), "reference");
    const visibilityPath = within(visibility).getByRole("combobox", { name: "Reference path" });
    await user.type(visibilityPath, "second");
    expect(screen.getByLabelText("Visibility expression text")).toHaveTextContent("value.second");

    expect(screen.queryByRole("switch", { name: "Computed value" })).toBeNull();
    expect(screen.getByText(/Computed values are reserved and cannot execute/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Local draft saved");
    const saved = await repository.load(toUid("legacy_project"));
    const field = saved.project.forms[toUid("form_outline")].nodes[toUid("field_first")];
    expect(field.behavior.when).toEqual({ kind: "reference", scope: "value", path: ["second"] });
    expect(field.computed).toBeUndefined();
  });

  it("preserves imported computed data until the author explicitly removes it", async () => {
    const user = userEvent.setup();
    const snapshot = outlineProjectSnapshot();
    const computed = { kind: "literal", value: 5 };
    snapshot.project.forms.form_outline.nodes.field_first.computed = computed;
    const repository = createMemoryProjectRepository([snapshot]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openWorkbenchPanel(user, "Layers");
    fireEvent.click(document.querySelector('[data-outline-uid="field_first"]'));
    expect(screen.getByText(/This imported field contains an unsupported computed value/)).toBeVisible();
    expect((await repository.load(snapshot.uid)).project.forms.form_outline.nodes.field_first.computed).toEqual(computed);
    await user.click(screen.getByRole("button", { name: "Remove unsupported computed value" }));
    expect(screen.queryByRole("button", { name: "Remove unsupported computed value" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Local draft saved");
    expect((await repository.load(snapshot.uid)).project.forms.form_outline.nodes.field_first.computed).toBeUndefined();
  });

  it("switches dynamic scenarios and distinguishes dormant, absent, and disabled nodes", async () => {
    const user = userEvent.setup();
    const repository = createMemoryProjectRepository([dynamicProjectSnapshot()]);
    render(<StudioEditorPage documentV1Enabled projectRepository={repository} />);
    await screen.findByText("Local draft loaded");
    await openPreview(user);

    await user.selectOptions(screen.getByRole("combobox", { name: "Named scenario" }), "scenario_readonly");
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Zweiter" })).toBeDisabled();
      expect(screen.getByText("dormant")).toBeVisible();
      expect(screen.getByText("structurally absent")).toBeVisible();
      expect(screen.getByText("disabled (possibly inherited)")).toBeVisible();
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Context JSON" }), {
      target: { value: JSON.stringify({ showFirst: true, readOnly: false, locale: "en" }) },
    });
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Second field" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Add scenario" }));
    await screen.findByText("Scenario 3 added");
    expect(screen.getByRole("combobox", { name: "Named scenario" })).toHaveValue("scenario_3");
  });

  it("keeps native input shortcuts isolated and handles editor redo once", async () => {
    const firstConfig = structuredClone(editorConfig);
    const secondConfig = structuredClone(editorConfig);
    const thirdConfig = structuredClone(editorConfig);
    secondConfig[1].label = "Second";
    thirdConfig[1].label = "Third";
    useStagesStore.setState({
      currentConfig: secondConfig,
      isEditMode: true,
      undoData: [firstConfig, secondConfig, thirdConfig],
      activeUndoIndex: 1,
    });
    render(<StudioEditorPage />);
    const canvasInput = await waitFor(() => {
      const input = document.querySelector('input[name="username"]');
      expect(input).toBeTruthy();
      return input;
    });

    fireEvent.keyDown(canvasInput, { key: "z", metaKey: true });
    expect(useStagesStore.getState().activeUndoIndex).toBe(1);

    fireEvent.keyDown(document, { key: "z", metaKey: true, shiftKey: true });
    expect(useStagesStore.getState().activeUndoIndex).toBe(2);
    expect(useStagesStore.getState().currentConfig[1].label).toBe("Third");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  });
});
