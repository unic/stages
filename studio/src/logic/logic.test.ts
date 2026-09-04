import { describe, expect, it } from "vitest";
import { fieldEvent, stages, type StagesChange } from "@stages/core";
import { compileStudioForm } from "../compiler";
import { toUid, type StudioFormDocument, type StudioLogicRule } from "../document";
import { resolveStudioPatchPath } from "./compiler";

const formUid = toUid("form_logic");
const groupUid = toUid("group_order");
const sourceUid = toUid("field_source");
const targetUid = toUid("field_target");

function setRule(id: string, value: number): StudioLogicRule {
  return {
    id,
    on: "logic:apply",
    actions: [{ op: "set", target: { kind: "node", uid: targetUid }, value: { kind: "literal", value } }],
  };
}

function form(): StudioFormDocument {
  return {
    uid: formUid,
    title: "Logic",
    runtime: { schemaId: "logic", schemaVersion: 1 },
    rootNodeUids: [groupUid, targetUid],
    nodes: {
      [groupUid]: {
        uid: groupUid,
        kind: "group",
        runtimeId: "source",
        childUids: [sourceUid],
        transforms: [setRule("group", 3)],
      },
      [sourceUid]: {
        uid: sourceUid,
        kind: "field",
        runtimeId: "amount",
        definition: { key: "number", version: 1 },
        props: { label: "Amount" },
        reducers: [{
          id: "payload",
          on: "logic:apply",
          actions: [{
            op: "set",
            target: { kind: "event-target" },
            value: { kind: "reference", scope: "event", path: ["payload"] },
          }],
        }],
        transforms: [setRule("field", 2)],
      },
      [targetUid]: {
        uid: targetUid,
        kind: "field",
        runtimeId: "result",
        definition: { key: "number", version: 1 },
        props: { label: "Result" },
      },
    },
    transforms: [setRule("root", 4)],
    events: [{ id: "apply", title: "Apply", name: "logic:apply", target: { kind: "node", uid: sourceUid }, source: "user" }],
    scenarios: [],
    settings: {},
  };
}

describe("Studio event, reducer, transform, and patch compilation", () => {
  it("preserves reducer then target-to-root transform ordering and exact changes", async () => {
    const compiled = compileStudioForm(form());
    expect(compiled.diagnostics).toEqual([]);
    const changes: StagesChange<unknown>[] = [];
    const controller = stages({
      schema: compiled.schema,
      fields: compiled.fields,
      value: { source: { amount: 0 }, result: 0 },
      onChange: (change) => {
        changes.push(change);
        controller.update({ value: change.value });
      },
    });

    controller.batch(() => {
      controller.dispatch(fieldEvent("logic:apply", ["source", "amount"], { payload: 7, source: "user" }));
      controller.dispatch(fieldEvent("logic:apply", ["source", "amount"], { payload: 8, source: "user" }));
    });
    await Promise.resolve();

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      previousValue: { source: { amount: 0 }, result: 0 },
      value: { source: { amount: 8 }, result: 4 },
      source: "user",
      events: [
        { name: "logic:apply", payload: 7, source: "user" },
        { name: "logic:apply", payload: 8, source: "user" },
      ],
    });
    expect(changes[0]?.patches).toEqual([
      { op: "set", path: ["source", "amount"], value: 7 },
      { op: "set", path: ["result"], value: 2 },
      { op: "set", path: ["result"], value: 3 },
      { op: "set", path: ["result"], value: 4 },
      { op: "set", path: ["source", "amount"], value: 8 },
      { op: "set", path: ["result"], value: 2 },
      { op: "set", path: ["result"], value: 3 },
      { op: "set", path: ["result"], value: 4 },
    ]);
  });

  it("keeps an unaccepted proposal out of the canonical snapshot", async () => {
    const compiled = compileStudioForm(form());
    let proposal: StagesChange<unknown> | undefined;
    const controller = stages({
      schema: compiled.schema,
      fields: compiled.fields,
      value: { source: { amount: 0 }, result: 0 },
      onChange: (change) => { proposal = change; },
    });
    controller.dispatch(fieldEvent("logic:apply", ["source", "amount"], { payload: 9 }));
    await Promise.resolve();
    expect(proposal?.value).toEqual({ source: { amount: 9 }, result: 4 });
    expect(controller.getSnapshot().value).toEqual({ source: { amount: 0 }, result: 0 });
  });

  it("validates targets and carries live collection row indexes to picked siblings", () => {
    const missingUid = toUid("field_missing");
    const invalid = form();
    const source = invalid.nodes[sourceUid];
    if (source?.kind !== "field") throw new Error("Expected source field.");
    const compiled = compileStudioForm({
      ...invalid,
      nodes: {
        ...invalid.nodes,
        [sourceUid]: { ...source, transforms: [{ ...setRule("invalid", 1), actions: [{ op: "remove", target: { kind: "node", uid: missingUid } }] }] },
      },
    });
    expect(compiled.diagnostics).toContainEqual(expect.objectContaining({
      code: "compiler.invalid-patch-target",
      entityUid: sourceUid,
      propertyPath: ["nodes", sourceUid, "transforms", 0, "actions", 0, "target"],
    }));

    const rowSource = toUid("field_row_quantity");
    const rowTarget = toUid("field_row_total");
    expect(resolveStudioPatchPath(
      { kind: "node", uid: rowTarget },
      new Map([[rowSource, ["items", "quantity"]], [rowTarget, ["items", "total"]]]),
      ["items", 3, "quantity"],
    )).toEqual(["items", 3, "total"]);
  });
});
