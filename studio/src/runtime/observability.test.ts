import { fieldEvent, stages, type StagesChange } from "@stages/core";
import { describe, expect, it, vi } from "vitest";
import { compileStudioForm } from "../compiler";
import { toUid, type StudioFormDocument } from "../document";
import {
  createStudioPreviewHost,
  createStudioSupportReport,
  filterAndGroupStudioProblems,
  inspectStudioRuntime,
  type StudioProblem,
  type StudioTelemetryEvent,
} from "./index";

const fieldUid = toUid("field_name");
const formUid = toUid("form_observe");

function form(): StudioFormDocument {
  return {
    uid: formUid,
    title: "Observe",
    runtime: { schemaId: "observe", schemaVersion: 3 },
    rootNodeUids: [fieldUid],
    nodes: { [fieldUid]: { uid: fieldUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" } } },
    scenarios: [],
    settings: {},
  };
}

describe("Studio observability", () => {
  it("filters and groups compiler/runtime problems without losing navigation metadata", () => {
    const problems: StudioProblem[] = [
      { code: "compiler.one", source: "compiler", severity: "error", message: "Compiler", formUid, entityUid: fieldUid, propertyPath: ["nodes", fieldUid, "props", "label"] },
      { code: "runtime.one", source: "runtime", severity: "warning", message: "Runtime", formUid, entityUid: fieldUid, runtimePath: ["name"], runtimeAddress: [{ kind: "node", id: "name" }] },
    ];
    expect(filterAndGroupStudioProblems(problems, { severity: "warning" }, "source")).toEqual([
      { key: "runtime", label: "runtime", problems: [problems[1]] },
    ]);
    expect(filterAndGroupStudioProblems(problems, {}, "entity")[0]).toMatchObject({ key: fieldUid, problems });
  });

  it("inspects revision freshness, validation, active stages, and stable row keys", () => {
    const controller = stages<unknown, {}, unknown>({
      schema: { id: "inspection", version: 1, nodes: [{ kind: "collection", id: "people", nodes: [{ kind: "wizard", id: "flow", stages: [{ id: "details", nodes: [] }] }] }] } as const,
      fields: {},
      value: { people: [{ flow: { details: {} } }] },
    });
    const snapshot = controller.getSnapshot();
    const inspection = inspectStudioRuntime(snapshot, snapshot.revision - 1);
    expect(inspection.stale).toBe(true);
    expect(inspection.rows).toEqual([expect.objectContaining({ kind: "row", rowKey: "0", path: ["people", 0] })]);
    expect(inspection.activeStages).toEqual([expect.objectContaining({ kind: "wizard", activeStage: "details" })]);
    expect(inspection.validation.status).toBe("valid");
    controller.destroy();
  });

  it("redacts support reports and emits value-free telemetry through an optional trusted port", async () => {
    const telemetry: StudioTelemetryEvent[] = [];
    const artifact = compileStudioForm(form());
    let proposal: StagesChange<unknown> | undefined;
    const host = createStudioPreviewHost({
      compiled: artifact,
      value: { name: "", password: "domain-secret" },
      telemetry: { emit: (event) => telemetry.push(event) },
      onProposal: (change) => { proposal = change; },
    });
    host.controller.dispatch(fieldEvent("input", ["name"], { payload: "Ada" }));
    await Promise.resolve();
    await Promise.resolve();
    expect(telemetry).toContainEqual({ name: "preview.proposal", transactionId: 1, eventCount: 1, patchCount: 1 });
    expect(JSON.stringify(telemetry)).not.toContain("Ada");

    const report = createStudioSupportReport({
      project: { uid: toUid("project_observe"), title: "Observe" },
      form: { uid: formUid, title: "Observe", schemaId: "observe", schemaVersion: 3 },
      snapshot: host.getSnapshot(),
      acceptedRevision: host.acceptedRevision,
      canonicalValue: host.canonicalValue,
      context: { authorization: "Bearer private" },
      extensions: { apiKey: "private" },
      ...(proposal === undefined ? {} : { pendingProposal: proposal, lastTransaction: proposal }),
      problems: [],
    });
    expect(report).toContain("stages-studio-support");
    expect(report).not.toContain("domain-secret");
    expect(report).not.toContain("Bearer private");
    expect(report).not.toContain('"apiKey": "private"');
    expect(report).toContain("[REDACTED]");
    host.destroy();
  });

  it("emits acceptance, rejection, diagnostics, and recreation lifecycle metadata", async () => {
    const emit = vi.fn();
    const artifact = compileStudioForm(form());
    const proposals: StagesChange<unknown>[] = [];
    const host = createStudioPreviewHost({ compiled: artifact, value: { name: "" }, telemetry: { emit }, onProposal: (proposal) => proposals.push(proposal) });
    host.controller.dispatch(fieldEvent("input", ["name"], { payload: "accepted" }));
    await Promise.resolve(); await Promise.resolve();
    expect(host.acceptProposal(proposals.at(-1)?.transactionId ?? -1)).toBe(true);
    host.controller.dispatch(fieldEvent("input", ["name"], { payload: "rejected" }));
    await Promise.resolve(); await Promise.resolve();
    expect(host.rejectProposal(proposals.at(-1)?.transactionId ?? -1)).toBe(true);
    host.controller.dispatch(fieldEvent("input", ["missing"], { payload: "x" }));
    await Promise.resolve(); await Promise.resolve();
    host.update({ compiled: { ...artifact, fields: { ...artifact.fields, text: { ...artifact.fields.text } } }, value: host.canonicalValue, telemetry: { emit } });
    expect(emit).toHaveBeenCalledWith({ name: "preview.proposal-accepted", transactionId: 1 });
    expect(emit).toHaveBeenCalledWith({ name: "preview.proposal-rejected", transactionId: 2 });
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ name: "preview.diagnostic", code: "event.target-missing" }));
    expect(emit).toHaveBeenCalledWith({ name: "preview.recreated" });
    host.destroy();
  });
});
