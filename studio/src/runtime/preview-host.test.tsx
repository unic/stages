import { act, render } from "@testing-library/react";
import { fieldEvent, nodeEvent, type StagesChange } from "@stages/core";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import { compileStudioForm, type CompiledStudioForm } from "../compiler";
import { toUid, validateStudioProject } from "../document";
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
      compiled: { ...artifact, schema: { ...artifact.schema } },
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
