import { describe, expect, it } from "vitest";
import { fieldEvent, nodeEvent, stages, type RenderNodeSnapshot, type StagesChange } from "@stages/core";
import {
  createAgendaItem, createEventLaunchFields, createEventLaunchSchema,
  defaultEventLaunchContext, defaultEventLaunchValue, EVENT_LAUNCH_AGENDA_ADDRESS,
  type EventLaunchValue,
} from "../../../examples/shared/event-launch/index";
import agendaProject from "../document/fixtures/event-launch-agenda.json";
import { serializeStudioProject, toUid, validateStudioProject } from "../document";
import { compileStudioForm } from "../compiler";
import { STUDIO_SUPPORTED_DEFINITIONS } from "../registry";
import { createStudioPreviewHost } from "./preview-host";

function openProject() {
  const result = validateStudioProject(agendaProject, { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS });
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
}

function descendants(nodes: readonly RenderNodeSnapshot[]): RenderNodeSnapshot[] {
  return nodes.flatMap((node) => [node, ...(node.kind === "field" ? [] : descendants(node.nodes))]);
}

function agendaRows(nodes: readonly RenderNodeSnapshot[]) {
  const collection = descendants(nodes).find((node) => node.kind === "collection" && node.id === "items");
  if (!collection || collection.kind === "field") throw new Error("Agenda collection is missing.");
  return collection.nodes.map((row) => ({
    id: row.id, path: row.path, address: row.address,
    fields: row.kind === "field" ? [] : row.nodes.filter((node) => node.kind === "field").map((node) => ({
      id: node.id, path: node.path, address: node.address, value: node.value,
      type: node.type, label: node.props["label"], min: node.props["min"],
    })),
  }));
}

const fields = createEventLaunchFields({ text: "text", textarea: "textarea", choice: "choice", number: "number", money: "money", checkbox: "checkbox" });
const schema = createEventLaunchSchema();
const context = { ...defaultEventLaunchContext, validationDelayMs: 0 };
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };

describe("Event Launch Studio agenda capstone slice", () => {
  it("loads as portable document v1 and starts from the canonical agenda fixture", () => {
    const project = openProject();
    expect(validateStudioProject(JSON.parse(serializeStudioProject(project)), { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS }).ok).toBe(true);
    const form = project.forms[toUid("form_agenda")]!;
    expect(form.scenarios[0]!.value).toEqual({ launch: {
      venue: { capacity: defaultEventLaunchValue.launch.venue.capacity },
      agenda: defaultEventLaunchValue.launch.agenda,
    } });
    expect(compileStudioForm(form).diagnostics).toEqual([]);
  });

  it("matches canonical proposals, variant rows, reordering, replacement, and recreation", async () => {
    const form = openProject().forms[toUid("form_agenda")]!;
    const compiled = compileStudioForm(form);
    const preview = createStudioPreviewHost({ compiled, value: structuredClone(form.scenarios[0]!.value) });
    let proposal: StagesChange<EventLaunchValue> | undefined;
    let canonicalValue = structuredClone(defaultEventLaunchValue);
    let canonical = stages({ schema, fields, context, value: canonicalValue, onChange: (change) => { proposal = change; } });
    const compareRows = () => expect(agendaRows(preview.getSnapshot().nodes)).toEqual(agendaRows(canonical.getSnapshot().nodes));
    const dispatch = async (event: ReturnType<typeof nodeEvent>) => {
      proposal = undefined;
      canonical.dispatch(event);
      preview.controller.dispatch(event);
      await tick();
      compareRows(); // Both owners still expose accepted values and row addresses.
      expect(proposal).toBeDefined();
      expect(preview.pendingProposal?.patches).toEqual(proposal!.patches);
    };
    const accept = () => {
      canonicalValue = proposal!.value;
      canonical.update({ value: canonicalValue });
      preview.acceptProposal(preview.pendingProposal!.transactionId);
      compareRows();
    };
    try {
      compareRows();
      const originalKeys = agendaRows(preview.getSnapshot().nodes).map((row) => row.id);
      await dispatch(nodeEvent("collection:add", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { value: createAgendaItem("workshop", "agenda-workshop-test") } }));
      accept();
      expect(agendaRows(preview.getSnapshot().nodes).slice(0, 2).map((row) => row.id)).toEqual(originalKeys);
      expect(agendaRows(preview.getSnapshot().nodes)[2]!.fields.map((field) => field.id)).toEqual(["title", "facilitator", "durationMinutes", "capacity"]);
      await dispatch(fieldEvent("input", ["launch", "agenda", "items", 2, "facilitator"], { payload: "Grace Hopper" }));
      accept();
      const added = agendaRows(preview.getSnapshot().nodes)[2]!;
      await dispatch(nodeEvent("collection:move", added.address, { payload: { to: 0 } }));
      canonical.update({ value: canonicalValue });
      preview.rejectProposal(preview.pendingProposal!.transactionId);
      compareRows();
      expect(agendaRows(preview.getSnapshot().nodes)[2]!.id).toBe(added.id);
      await dispatch(nodeEvent("collection:move", added.address, { payload: { to: 0 } }));
      accept();
      expect(agendaRows(preview.getSnapshot().nodes)[0]!.id).toBe(added.id);
      await dispatch(nodeEvent("collection:replace", added.address, { payload: { value: {
        id: "agenda-workshop-test", kind: "session", title: "Converted", speaker: "Ada", durationMinutes: 30,
      } } }));
      accept();
      expect(agendaRows(preview.getSnapshot().nodes)[0]!.id).toBe(added.id);
      await dispatch(nodeEvent("collection:sort", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { order: [1, 2, 0] } }));
      accept();
      for (const controller of [canonical, preview.controller]) controller.dispatch(fieldEvent("blur", ["launch", "agenda", "items", 0, "title"]));
      await tick();
      const saved = preview.serialize();
      const canonicalSaved = canonical.serialize();
      expect(saved.meta["touched"]).toEqual(canonicalSaved.meta["touched"]);
      expect(saved.meta["touched"]).not.toEqual([]);
      canonical.destroy();
      canonical = stages({ schema, fields, context, state: canonicalSaved });
      preview.recreate(saved);
      compareRows();
      expect(preview.serialize()).toEqual(saved);
    } finally {
      canonical.destroy();
      preview.destroy();
    }
  });

  it.each(["session", "workshop", "break"] as const)("matches the canonical duration validation path for %s rows", async (kind) => {
    const form = openProject().forms[toUid("form_agenda")]!;
    const value = structuredClone(defaultEventLaunchValue);
    value.launch.agenda.items = [{ ...createAgendaItem(kind, "invalid-duration"), durationMinutes: 0 }];
    const canonical = stages({ schema, fields, context, value });
    const preview = createStudioPreviewHost({ compiled: compileStudioForm(form), value: { launch: {
      venue: { capacity: value.launch.venue.capacity }, agenda: value.launch.agenda,
    } } });
    const path = ["launch", "agenda", "items", 0, "durationMinutes"];
    try {
      const options = { scope: { path }, event: "submit", reveal: true } as const;
      const expected = await canonical.validate(options);
      const actual = await preview.controller.validate(options);
      const issues = (result: typeof expected) => result.issues.map(({ code, path, severity }) => ({ code, path, severity }));
      expect(issues(actual)).toEqual(issues(expected));
      expect(issues(actual)).toEqual([{ code: "agenda.duration", path, severity: "error" }]);
      expect(preview.getDiagnostics()).toEqual([]);
      const remove = nodeEvent("collection:remove", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { index: 0 } });
      canonical.dispatch(remove);
      preview.controller.dispatch(remove);
      await tick();
      expect(canonical.getSnapshot().diagnostics.at(-1)?.code).toBe("collection.min");
      expect(preview.getDiagnostics().at(-1)).toMatchObject({ code: "collection.min", entityUid: "collection_items" });
      expect(agendaRows(preview.getSnapshot().nodes)).toEqual(agendaRows(canonical.getSnapshot().nodes));
    } finally {
      canonical.destroy();
      preview.destroy();
    }
  });

  it.each([
    [0, 240, false], [-1, 240, false], [30, 240, true],
    [240, 240, true], [241, 240, false], [1, 0, false],
  ] as const)("matches workshop capacity %s against venue capacity %s", async (capacity, venueCapacity, valid) => {
    const form = openProject().forms[toUid("form_agenda")]!;
    const value = structuredClone(defaultEventLaunchValue);
    value.launch.venue.capacity = venueCapacity;
    value.launch.agenda.items = [{ id: "workshop", kind: "workshop", title: "Workshop", facilitator: "Ada", durationMinutes: 60, capacity }];
    const canonical = stages({ schema, fields, context, value });
    const preview = createStudioPreviewHost({ compiled: compileStudioForm(form), value });
    const path = ["launch", "agenda", "items", 0, "capacity"];
    const options = { scope: { path }, event: "submit", reveal: true } as const;
    try {
      const expected = await canonical.validate(options);
      const actual = await preview.controller.validate(options);
      const issues = (result: typeof expected) => result.issues.map(({ code, path, severity, message }) => ({ code, path, severity, message }));
      expect(issues(actual)).toEqual(issues(expected));
      expect(actual.isValid).toBe(valid);
      expect(actual.issues).toHaveLength(valid ? 0 : 1);
      expect(preview.getDiagnostics()).toEqual([]);
    } finally {
      canonical.destroy();
      preview.destroy();
    }
  });

  it("invalidates capacity issues when the accepted venue bound changes without accepting pending proposals", async () => {
    const form = openProject().forms[toUid("form_agenda")]!;
    const value = structuredClone(defaultEventLaunchValue);
    value.launch.venue.capacity = 50;
    value.launch.agenda.items = [{ id: "workshop", kind: "workshop", title: "Workshop", facilitator: "Ada", durationMinutes: 60, capacity: 100 }];
    let proposal: StagesChange<EventLaunchValue> | undefined;
    const canonical = stages({ schema, fields, context, value, onChange: (change) => { proposal = change; } });
    const preview = createStudioPreviewHost({ compiled: compileStudioForm(form), value });
    const options = { scope: { path: ["launch", "agenda", "items", 0, "capacity"] }, event: "submit", reveal: true } as const;
    const compareValidation = async (valid: boolean) => {
      const expected = await canonical.validate(options);
      const actual = await preview.controller.validate(options);
      expect(actual.issues.map(({ code, path }) => ({ code, path }))).toEqual(expected.issues.map(({ code, path }) => ({ code, path })));
      expect(actual.isValid).toBe(valid);
    };
    try {
      await compareValidation(false);
      const expanded = structuredClone(value);
      expanded.launch.venue.capacity = 240;
      canonical.update({ value: expanded });
      preview.replaceValue(expanded);
      // Dependency invalidation drops the revealed issue without another validation call.
      for (const controller of [canonical, preview.controller]) {
        expect(controller.getSnapshot().validation.issues.some(({ code }) => code === "capacity")).toBe(false);
      }
      await compareValidation(true);
      const event = fieldEvent("input", ["launch", "venue", "capacity"], { payload: 50 });
      canonical.dispatch(event);
      preview.controller.dispatch(event);
      await tick();
      expect(proposal).toBeDefined();
      expect(preview.pendingProposal).toBeDefined();
      await compareValidation(true);
      canonical.update({ value: proposal!.value });
      preview.acceptProposal(preview.pendingProposal!.transactionId);
      await compareValidation(false);
    } finally {
      canonical.destroy();
      preview.destroy();
    }
  });
});
