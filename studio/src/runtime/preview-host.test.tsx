import { act, render } from "@testing-library/react";
import { fieldEvent, nodeEvent, stages, type JsonValue as CoreJsonValue, type StagesChange } from "@stages/core";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import { compileStudioForm, type CompiledStudioForm } from "../compiler";
import { createStudioCompilerSession } from "../compiler/session";
import { defineStudioAsyncServiceBindings } from "../registry";
import { toUid, validateStudioProject, type StudioFieldNode, type StudioFormDocument } from "../document";
import {
  createStudioPreviewHost,
  useStudioPreviewHost,
  type StudioPreviewHost,
  type UseStudioPreviewHostResult,
} from "./index";

const formUid = toUid("form_event");
const fieldUid = toUid("field_title");
const initialValue = { event: { title: "" } };

function compiled(): CompiledStudioForm {
  const opened = validateStudioProject(structuredClone(projectV1), { supportedDefinitions: { text: [1] } });
  if (!opened.ok) throw new Error("Fixture must be valid.");
  const form = opened.value.forms[formUid];
  if (!form) throw new Error("Fixture form is missing.");
  return compileStudioForm(form);
}

async function publish(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Studio preview host", () => {
  it.each(["equivalent", "label"])("preserves accepted state and owner proposals across %s edits, then explicitly resets/recreates", async (edit) => {
    const wizardUid = toUid("wizard_flow");
    const firstUid = toUid("stage_first");
    const secondUid = toUid("stage_second");
    const collectionUid = toUid("collection_people");
    const nameUid = toUid("field_name");
    const form: StudioFormDocument = {
      uid: formUid, title: "Runtime persistence", runtime: { schemaId: "runtime-persistence", schemaVersion: 1 }, rootNodeUids: [wizardUid],
      nodes: {
        [wizardUid]: { uid: wizardUid, kind: "wizard", runtimeId: "flow", stageUids: [firstUid, secondUid] },
        [firstUid]: { uid: firstUid, kind: "stage", runtimeId: "first", childUids: [collectionUid] },
        [secondUid]: { uid: secondUid, kind: "stage", runtimeId: "second", childUids: [] },
        [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "people", childUids: [nameUid] },
        [nameUid]: { uid: nameUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" }, reducers: [{ id: "clear", on: "clear", actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "literal", value: "" } }] }] },
      },
      scenarios: [], settings: {},
    };
    const session = createStudioCompilerSession();
    const artifact = session.compile(form);
    const initial = { flow: { first: { people: [{ name: "Ada" }, { name: "Lin" }] }, second: {} } };
    const extensions = { draft: { panel: "review" } };
    const extensionCodecs = { draft: { encode: (value: unknown) => value as CoreJsonValue, decode: (value: CoreJsonValue) => value } };
    let host: StudioPreviewHost;
    let accept = true;
    host = createStudioPreviewHost({
      compiled: artifact, value: initial, context: { locale: "de-CH" }, extensions, extensionCodecs,
      onProposal: (proposal) => { if (accept) host.acceptProposal(proposal.transactionId); },
    });
    host.controller.dispatch(fieldEvent("focus", ["flow", "first", "people", 0, "name"]));
    host.controller.dispatch(fieldEvent("blur", ["flow", "first", "people", 0, "name"]));
    host.controller.dispatch(nodeEvent("collection:move", [{ kind: "node", id: "flow" }, { kind: "node", id: "first" }, { kind: "node", id: "people" }], { payload: { from: 0, to: 1 } }));
    host.controller.dispatch(nodeEvent("wizard:next", [{ kind: "node", id: "flow" }]));
    await publish();

    accept = false;
    host.controller.dispatch(fieldEvent("input", ["flow", "first", "people", 0, "name"], { payload: "Pending" }));
    await publish();
    const state = host.serialize();
    expect(state.value).toEqual({ flow: { first: { people: [{ name: "Lin" }, { name: "Ada" }] }, second: {} } });
    expect(state.meta["visited"]).not.toEqual([]);
    expect(state.meta["activeWizards"]).not.toEqual([]);
    expect(state.meta["collectionKeys"]).not.toEqual([]);
    expect(state.meta["extensions"]).toEqual(extensions);
    expect(state).not.toHaveProperty("context");
    expect(state).not.toHaveProperty("workbench");
    expect(state).not.toHaveProperty("browser");

    const originalController = host.controller;
    const pending = host.pendingProposal;
    expect(pending).toBeDefined();
    const editedForm = edit === "label" ? { ...form, nodes: { ...form.nodes, [nameUid]: {
      ...form.nodes[nameUid]!, props: { label: "Full name" },
    } } } : structuredClone(form);
    host.update({
      compiled: session.compile(editedForm), value: host.canonicalValue,
      context: { locale: "de-CH" }, extensions, extensionCodecs,
    });
    expect(host.controller).toBe(originalController);
    expect(host.pendingProposal).toBe(pending);
    expect(host.serialize()).toEqual(state);
    expect(host.getSnapshot().value).toEqual(state.value);

    host.reset({ value: initial, context: { locale: "en" }, extensions });
    expect(host.controller).not.toBe(originalController);
    expect(host.pendingProposal).toBeUndefined();
    expect(host.serialize().meta["visited"]).toEqual([]);
    expect((host.getSnapshot().nodes[0] as { activeStage?: string }).activeStage).toBe("first");
    host.recreate(state);
    expect(host.serialize()).toEqual(state);
    expect((host.getSnapshot().nodes[0] as { activeStage?: string }).activeStage).toBe("second");
  });

  it.each(["equivalent", "layout", "theme", "content"])("preserves touched state and pending validation across %s compilation", async (edit) => {
    const base = compiled().expandedForm;
    const field = base.nodes[fieldUid] as StudioFieldNode;
    const blockUid = toUid("block_help");
    const form: StudioFormDocument = { ...base, rootNodeUids: [...base.rootNodeUids, blockUid], nodes: {
      ...base.nodes, [blockUid]: { uid: blockUid, kind: "block", definition: { key: "block:help", version: 1 }, props: { text: "Before" } }, [fieldUid]: {
      ...field,
      reducers: [{ id: "clear", on: "clear", actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "literal", value: "" } }] }],
      validators: [{ kind: "service", service: { key: "availability", version: 1 }, request: { kind: "literal", value: "check" }, on: "submit" }],
    } } };
    let finish: ((result: { status: "failure"; code: string }) => void) | undefined;
    const pending = new Promise<{ status: "failure"; code: string }>((resolve) => { finish = resolve; });
    const cancelled = vi.fn();
    const invoke = vi.fn(({ validation }) => {
      validation.signal.onCancel(cancelled);
      return pending;
    });
    const serviceBindings = defineStudioAsyncServiceBindings([{ key: "availability", version: 1, invoke }]);
    const session = createStudioCompilerSession();
    const artifact = session.compile(form, {}, { serviceBindings });
    expect(artifact.diagnostics).toEqual([]);
    const host = createStudioPreviewHost({ compiled: artifact, value: initialValue });
    const original = host.controller;
    try {
      host.controller.dispatch(fieldEvent("blur", ["event", "title"]));
      await publish();
      const touched = host.serialize().meta["touched"];
      expect(touched).not.toEqual([]);
      const validation = host.controller.validate({ event: "submit", reveal: true });
      expect(host.getSnapshot().validation.pendingCount).toBe(1);
      const edited: StudioFormDocument = edit === "layout"
        ? { ...form, nodes: { ...form.nodes, [fieldUid]: { ...form.nodes[fieldUid]!, presentation: {
          layout: { width: { mobile: "full", tablet: "half", desktop: "half" } },
        } } } }
        : edit === "theme" ? { ...form, settings: { ...form.settings, theme: { ...artifact.renderPlan.theme, accent: "#ff0000" } } }
          : edit === "content" ? { ...form, nodes: { ...form.nodes, [blockUid]: {
            ...form.nodes[blockUid]!, props: { text: "After" },
          } } } : structuredClone(form);
      const next = session.compile(edited, {}, { serviceBindings });
      if (edit !== "equivalent") {
        expect(next).not.toBe(artifact);
        expect(next.renderPlan).not.toEqual(artifact.renderPlan);
      }
      expect(next.schemaInput).toBe(artifact.schemaInput);
      const revision = host.getSnapshot().revision;
      host.update({ compiled: next, value: initialValue });
      expect(host.getSnapshot().revision).toBe(revision);
      expect(host.controller).toBe(original);
      expect(host.serialize().meta["touched"]).toEqual(touched);
      expect(host.getSnapshot().validation.pendingCount).toBe(1);
      expect(cancelled).not.toHaveBeenCalled();
      expect(invoke).toHaveBeenCalledTimes(1);
      finish?.({ status: "failure", code: "taken" });
      const result = await validation;
      expect(result.issues).toContainEqual(expect.objectContaining({ code: "taken" }));
    } finally {
      host.destroy();
    }
  });

  it("cancels obsolete validation after a validator edit and suppresses its late result", async () => {
    const base = compiled().expandedForm;
    const field = base.nodes[fieldUid] as StudioFieldNode;
    const form: StudioFormDocument = { ...base, nodes: { ...base.nodes, [fieldUid]: {
      ...field, validators: [{ kind: "service", service: { key: "availability", version: 1 }, on: "submit" }],
    } } };
    let finish!: (result: { status: "failure"; code: string }) => void;
    const pending = new Promise<{ status: "failure"; code: string }>((resolve) => { finish = resolve; });
    const cancelled = vi.fn();
    const serviceBindings = defineStudioAsyncServiceBindings([{ key: "availability", version: 1, invoke: ({ validation }) => {
      validation.signal.onCancel(cancelled);
      return pending;
    } }]);
    const session = createStudioCompilerSession();
    const artifact = session.compile(form, {}, { serviceBindings });
    const host = createStudioPreviewHost({ compiled: artifact, value: initialValue });
    try {
      host.controller.dispatch(fieldEvent("blur", ["event", "title"]));
      await publish();
      const touched = host.serialize().meta["touched"];
      const oldRun = host.controller.validate({ event: "submit", reveal: true });
      expect(host.getSnapshot().validation.pendingCount).toBe(1);
      const next = session.compile({ ...form, nodes: { ...form.nodes, [fieldUid]: {
        ...field, validators: [{ kind: "required", code: "current-required", on: "submit" }],
      } } }, {}, { serviceBindings });
      expect(next.schemaInput).not.toBe(artifact.schemaInput);
      const original = host.controller;
      host.update({ compiled: next, value: initialValue });
      expect(host.controller).toBe(original);
      expect(cancelled).toHaveBeenCalledTimes(1);
      expect(host.serialize().meta["touched"]).toEqual(touched);
      const current = await host.controller.validate({ event: "submit", reveal: true });
      expect(current.issues).toContainEqual(expect.objectContaining({ code: "current-required" }));
      finish({ status: "failure", code: "obsolete-result" });
      await oldRun;
      await publish();
      expect(JSON.stringify(host.getSnapshot().validation)).not.toContain("obsolete-result");
      expect(host.getSnapshot().validation.pendingCount).toBe(0);
    } finally {
      host.destroy();
    }
  });

  it("recreates registered durable extensions without adapter-only workbench state", () => {
    const artifact = compiled();
    const extensionCodecs = { draft: { encode: (value: unknown) => value as CoreJsonValue, decode: (value: CoreJsonValue) => value } };
    const host = createStudioPreviewHost({
      compiled: artifact,
      value: initialValue,
      extensions: { draft: { compact: true } },
      extensionCodecs,
    });
    const serialized = host.controller.serialize();
    expect(serialized.meta["extensions"]).toEqual({ draft: { compact: true } });
    expect(serialized).not.toHaveProperty("workbench");
    const recreated = stages({ schema: artifact.schemaInput, fields: artifact.fields, state: serialized, extensionCodecs });
    expect(recreated.serialize().meta["extensions"]).toEqual({ draft: { compact: true } });
  });

  it("accepts proposals immediately without an update loop", async () => {
    const proposals: StagesChange<unknown>[] = [];
    let host: StudioPreviewHost;
    host = createStudioPreviewHost({
      compiled: compiled(),
      value: initialValue,
      onProposal(proposal) {
        proposals.push(proposal);
        host.acceptProposal(proposal.transactionId);
      },
    });
    const listener = vi.fn();
    host.subscribe(listener);

    host.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Launch" }));
    await publish();

    expect(proposals).toHaveLength(1);
    expect(host.pendingProposal).toBeUndefined();
    expect(host.canonicalValue).toEqual({ event: { title: "Launch" } });
    expect(host.getSnapshot().value).toEqual({ event: { title: "Launch" } });
    const publications = listener.mock.calls.length;
    await publish();
    expect(listener).toHaveBeenCalledTimes(publications);
  });

  it("supports delayed acceptance, rejection, and owner replacement", async () => {
    const proposals: StagesChange<unknown>[] = [];
    const host = createStudioPreviewHost({
      compiled: compiled(),
      value: initialValue,
      onProposal: (proposal) => proposals.push(proposal),
    });

    host.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Delayed" }));
    await publish();
    const delayed = proposals.at(-1);
    expect(delayed).toBeDefined();
    expect(host.getSnapshot().value).toEqual(initialValue);
    expect(host.pendingProposal).toBe(delayed);
    expect(host.acceptProposal(delayed?.transactionId ?? -1)).toBe(true);
    await publish();
    expect(host.getSnapshot().value).toEqual({ event: { title: "Delayed" } });

    host.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Rejected" }));
    await publish();
    const rejected = proposals.at(-1);
    expect(host.rejectProposal(rejected?.transactionId ?? -1)).toBe(true);
    await publish();
    expect(host.canonicalValue).toEqual({ event: { title: "Delayed" } });

    host.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Proposed" }));
    await publish();
    const replaced = proposals.at(-1);
    expect(host.acceptProposal(replaced?.transactionId ?? -1, { event: { title: "Replacement" } })).toBe(true);
    await publish();
    expect(host.getSnapshot().value).toEqual({ event: { title: "Replacement" } });
  });

  it("keeps callbacks fresh and recreates only for creation-time changes", async () => {
    const first = vi.fn();
    const latest = vi.fn();
    const controllerChanges = vi.fn();
    const artifact = compiled();
    const host = createStudioPreviewHost({ compiled: artifact, value: initialValue, onProposal: first });
    const originalController = host.controller;
    const initialRevision = host.getSnapshot().revision;

    host.update({
      compiled: { ...artifact, schema: { ...artifact.schema }, schemaInput: { ...artifact.schema } },
      value: initialValue,
      context: { locale: "de-CH" },
      extensions: {},
      onProposal: latest,
      onControllerChange: controllerChanges,
    });
    expect(host.controller).toBe(originalController);
    expect(controllerChanges).not.toHaveBeenCalled();
    await publish();
    expect(host.getSnapshot().revision).toBeGreaterThan(initialRevision);
    host.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Fresh" }));
    await publish();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    const changedRegistry = { ...artifact.fields, text: { ...artifact.fields.text } };
    host.update({
      compiled: { ...artifact, fields: changedRegistry },
      value: initialValue,
      onProposal: latest,
      onControllerChange: controllerChanges,
    });
    expect(host.controller).not.toBe(originalController);
    expect(controllerChanges).toHaveBeenCalledTimes(1);
    originalController.dispatch(fieldEvent("input", ["event", "title"], { payload: "Stale" }));
    await publish();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it("preserves the last valid dynamic tree, recovers, and diagnoses incompatible identity", async () => {
    const dynamicUid = toUid("field_dynamic");
    const dynamicForm: StudioFormDocument = {
      uid: formUid, title: "Dynamic", runtime: { schemaId: "dynamic", schemaVersion: 1 }, rootNodeUids: [dynamicUid],
      nodes: {
        [dynamicUid]: {
          uid: dynamicUid, kind: "field", runtimeId: "dynamic", definition: { key: "text", version: 1 }, props: { label: "Dynamic" },
          behavior: { presentWhen: { kind: "reference", scope: "context", path: ["enabled"] } },
        },
      }, scenarios: [], settings: {},
    };
    const dynamicCompiled = compileStudioForm(dynamicForm);
    const host = createStudioPreviewHost({ compiled: dynamicCompiled, value: { dynamic: "" }, context: { enabled: true } });
    expect(host.getSnapshot().nodes.map(({ id }) => id)).toEqual(["dynamic"]);

    host.update({ compiled: dynamicCompiled, value: { dynamic: "" }, context: {} });
    await publish();
    expect(host.getSnapshot().nodes.map(({ id }) => id)).toEqual(["dynamic"]);
    expect(host.getSnapshot().diagnostics).toContainEqual(expect.objectContaining({ code: "schema.factory-failed" }));

    host.update({ compiled: dynamicCompiled, value: { dynamic: "" }, context: { enabled: false } });
    await publish();
    expect(host.getSnapshot().nodes).toEqual([]);
    expect(host.getSnapshot().diagnostics).toEqual([]);

    host.update({ compiled: dynamicCompiled, value: { dynamic: "" }, context: { enabled: true } });
    await publish();
    expect(host.getSnapshot().nodes.map(({ id }) => id)).toEqual(["dynamic"]);

    const beforeFailedReset = host.controller;
    expect(() => host.reset({ value: { dynamic: "" }, context: {} })).toThrow(/Reference path enabled does not exist/);
    expect(host.controller).toBe(beforeFailedReset);
    expect(host.getSnapshot().nodes.map(({ id }) => id)).toEqual(["dynamic"]);

    const incompatible = compileStudioForm({
      ...dynamicForm,
      nodes: { ...dynamicForm.nodes, [dynamicUid]: { ...dynamicForm.nodes[dynamicUid] as StudioFieldNode, definition: { key: "number", version: 1 } } },
    });
    host.update({ compiled: incompatible, value: { dynamic: 0 }, context: { enabled: true } });
    await publish();
    expect(host.getSnapshot().diagnostics).toContainEqual(expect.objectContaining({ code: "schema.incompatible-identity" }));
  });

  it("maps runtime diagnostics back to Studio UIDs and tears down terminally", async () => {
    const diagnostics = vi.fn();
    const host = createStudioPreviewHost({
      compiled: compiled(),
      value: initialValue,
      onDiagnostic: diagnostics,
    });
    const fieldAddress = [
      { kind: "node" as const, id: "event" },
      { kind: "row" as const, id: "missing-row" },
      { kind: "node" as const, id: "title" },
    ];
    host.controller.dispatch(nodeEvent("input", fieldAddress));
    await publish();
    expect(diagnostics).toHaveBeenCalledWith(expect.objectContaining({
      code: "event.target-missing",
      source: "runtime",
      formUid,
      entityUid: fieldUid,
      runtimeAddress: fieldAddress,
    }));

    host.destroy();
    expect(host.destroyed).toBe(true);
    host.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Ignored" }));
    await publish();
    expect(host.getSnapshot().value).toEqual(initialValue);
  });
});

describe("useStudioPreviewHost", () => {
  it("survives Strict Mode effect replay, stays fresh, and destroys after real unmount", async () => {
    let current: UseStudioPreviewHostResult | undefined;
    const first = vi.fn();
    const latest = vi.fn();
    const artifact = compiled();
    const strictHost = createStudioPreviewHost({
      compiled: artifact,
      value: initialValue,
      onProposal: first,
    });

    function Harness({ onProposal }: { readonly onProposal: (proposal: StagesChange<unknown>) => void }) {
      current = useStudioPreviewHost(strictHost, { compiled: artifact, value: initialValue, onProposal });
      return <output>{String(current.snapshot.revision)}</output>;
    }

    const view = render(<StrictMode><Harness onProposal={first} /></StrictMode>);
    await act(publish);
    expect(current?.host.destroyed).toBe(false);
    const strictController = current?.controller;

    view.rerender(<StrictMode><Harness onProposal={latest} /></StrictMode>);
    current?.controller.dispatch(fieldEvent("input", ["event", "title"], { payload: "Strict" }));
    await act(publish);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(current?.controller).toBe(strictController);

    const host = current?.host;
    view.unmount();
    await act(publish);
    expect(host?.destroyed).toBe(true);
  });
});
