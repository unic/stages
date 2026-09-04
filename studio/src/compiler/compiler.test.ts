import { describe, expect, it } from "vitest";
import { evaluateSchema, initialFieldValue, type DynamicMetaSnapshot } from "@stages/core";
import projectV1 from "../document/fixtures/project-v1.json";
import { serializeStudioProject, toUid, validateStudioProject } from "../document";
import type { StudioFormDocument, StudioGroupNode, StudioProjectDocument } from "../document";
import {
  compileStudioForm,
  studioRuntimeAddressKey,
  studioRuntimePathKey,
} from "./index";

const formUid = toUid("form_event");
const groupUid = toUid("group_event");
const fieldUid = toUid("field_title");

function project(): StudioProjectDocument {
  const result = validateStudioProject(structuredClone(projectV1), { supportedDefinitions: { text: [1] } });
  if (!result.ok) throw new Error("Fixture must be valid.");
  return result.value;
}

const meta: DynamicMetaSnapshot = {
  revision: 0,
  isDirty: false,
  touched: [],
  visited: [],
  activeWizards: new Map(),
  extensions: {},
};

describe("minimal Studio compiler", () => {
  it("compiles text fields and groups through the public core evaluator", () => {
    const input = project();
    const before = serializeStudioProject(input);
    const form = input.forms[formUid];
    if (!form) throw new Error("Missing form fixture.");

    const compiled = compileStudioForm(form);
    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.schema).toEqual({
      id: "event-launch",
      version: 1,
      nodes: [{
        kind: "group",
        id: "event",
        nodes: [{
          kind: "field",
          id: "title",
          type: "text",
          props: { label: "Event title" },
        }],
      }],
    });
    expect(initialFieldValue({
      view: compiled.fields.text.view,
      initialValue: compiled.fields.text.initialValue,
    })).toBe("");

    const evaluated = evaluateSchema({
      schema: compiled.schema,
      fields: compiled.fields,
      value: { event: { title: "Launch" } },
      context: {},
      meta,
    });
    expect(evaluated.diagnostics).toEqual([]);
    expect(evaluated.nodes[0]?.children[0]).toMatchObject({
      path: ["event", "title"],
      address: [
        { kind: "node", id: "event" },
        { kind: "node", id: "title" },
      ],
    });
    expect(serializeStudioProject(input)).toBe(before);
    expect(input.forms[formUid]).toBe(form);
  });

  it("emits a presentation render plan and bidirectional UID source map", () => {
    const form = project().forms[formUid];
    if (!form) throw new Error("Missing form fixture.");
    const compiled = compileStudioForm(form);
    const fieldPath = ["event", "title"] as const;
    const fieldAddress = [
      { kind: "node" as const, id: "event" },
      { kind: "node" as const, id: "title" },
    ];

    expect(compiled.renderPlan).toMatchObject({
      formUid,
      nodes: [{ uid: groupUid, kind: "group", children: [{ uid: fieldUid, kind: "field" }] }],
    });
    expect(compiled.sourceMap.byUid.get(fieldUid)).toEqual({
      uid: fieldUid,
      runtimePath: fieldPath,
      runtimeAddress: fieldAddress,
    });
    expect(compiled.sourceMap.uidByPath.get(studioRuntimePathKey(fieldPath))).toBe(fieldUid);
    expect(compiled.sourceMap.uidByAddress.get(studioRuntimeAddressKey(fieldAddress))).toBe(fieldUid);
  });

  it("reports stable compiler diagnostics for sibling IDs and unsupported nodes", () => {
    const original = project().forms[formUid];
    if (!original) throw new Error("Missing form fixture.");
    const duplicateUid = toUid("field_duplicate");
    const collectionUid = toUid("collection_guests");
    const form: StudioFormDocument = {
      ...original,
      rootNodeUids: [groupUid, collectionUid],
      nodes: {
        ...original.nodes,
        [groupUid]: {
          ...original.nodes[groupUid] as StudioGroupNode,
          childUids: [fieldUid, duplicateUid],
        },
        [duplicateUid]: {
          uid: duplicateUid,
          kind: "field",
          runtimeId: "title",
          definition: { key: "text", version: 1 },
          props: {},
        },
        [collectionUid]: {
          uid: collectionUid,
          kind: "collection",
          runtimeId: "guests",
          childUids: [],
        },
      },
    };
    const compiled = compileStudioForm(form);
    expect(compiled.diagnostics.map((entry) => entry.code)).toEqual([
      "compiler.duplicate-sibling-id",
      "compiler.unsupported-node-kind",
      "compiler.unreachable-node",
    ]);
    expect(compiled.diagnostics[0]).toMatchObject({
      entityUid: duplicateUid,
      propertyPath: ["nodes", duplicateUid, "runtimeId"],
      runtimePath: ["event", "title"],
    });
  });

  it("is deterministic and does not share generated arrays between compilations", () => {
    const form = project().forms[formUid];
    if (!form) throw new Error("Missing form fixture.");
    const first = compileStudioForm(form);
    const second = compileStudioForm(form);
    expect(first).toEqual(second);
    expect(first.schema.nodes).not.toBe(second.schema.nodes);
    expect(first.renderPlan.nodes).not.toBe(second.renderPlan.nodes);
  });
});
