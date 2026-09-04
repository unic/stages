import { describe, expect, it } from "vitest";
import { evaluateSchema, initialFieldValue, type DynamicMetaSnapshot } from "@stages/core";
import projectV1 from "../document/fixtures/project-v1.json";
import { serializeStudioProject, toUid, validateStudioProject } from "../document";
import type { StudioFormDocument, StudioGroupNode, StudioProjectDocument } from "../document";
import { DEFAULT_STUDIO_THEME } from "../registry";
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

  it("interleaves decorative content without adding submitted values and preserves future-container order", () => {
    const headingUid = toUid("block_heading");
    const hiddenUid = toUid("block_hidden_help");
    const dividerUid = toUid("block_divider");
    const collectionUid = toUid("collection_people");
    const messageUid = toUid("block_collection_message");
    const wizardUid = toUid("wizard_signup");
    const stageUid = toUid("stage_details");
    const stageHelpUid = toUid("block_stage_help");
    const form: StudioFormDocument = {
      uid: formUid,
      title: "Presentation ordering",
      runtime: { schemaId: "presentation-order", schemaVersion: 1 },
      rootNodeUids: [headingUid, hiddenUid, fieldUid, collectionUid, dividerUid, wizardUid],
      nodes: {
        [headingUid]: { uid: headingUid, kind: "block", definition: { key: "block:heading", version: 1 }, props: { text: "Start", level: "2" } },
        [hiddenUid]: { uid: hiddenUid, kind: "block", definition: { key: "block:help", version: 1 }, props: { text: "Hidden" }, behavior: { when: { kind: "literal", value: false } } },
        [fieldUid]: { uid: fieldUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" } },
        [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "people", childUids: [messageUid] },
        [messageUid]: { uid: messageUid, kind: "block", definition: { key: "block:message", version: 1 }, props: { text: "One per guest", tone: "info" } },
        [dividerUid]: { uid: dividerUid, kind: "block", definition: { key: "block:divider", version: 1 }, props: { label: "Continue" } },
        [wizardUid]: { uid: wizardUid, kind: "wizard", runtimeId: "signup", stageUids: [stageUid] },
        [stageUid]: { uid: stageUid, kind: "stage", runtimeId: "details", childUids: [stageHelpUid] },
        [stageHelpUid]: { uid: stageHelpUid, kind: "block", definition: { key: "block:help", version: 1 }, props: { text: "Stage help" } },
      },
      scenarios: [],
      settings: { theme: { ...DEFAULT_STUDIO_THEME, accent: "#be123c" } },
    };
    const compiled = compileStudioForm(form);

    expect(compiled.schema.nodes).toEqual([expect.objectContaining({ kind: "field", id: "name" })]);
    expect(compiled.renderPlan.nodes.map(({ uid }) => uid)).toEqual(form.rootNodeUids);
    expect(compiled.renderPlan.nodes[1]).toMatchObject({ uid: hiddenUid, kind: "block", hidden: true });
    expect(compiled.renderPlan.nodes[3]).toMatchObject({
      uid: collectionUid,
      kind: "collection",
      children: [{ uid: messageUid, kind: "block" }],
    });
    expect(compiled.renderPlan.nodes[5]).toMatchObject({
      uid: wizardUid,
      children: [{ uid: stageUid, children: [{ uid: stageHelpUid, kind: "block" }] }],
    });
    expect(compiled.renderPlan.theme.accent).toBe("#be123c");
    expect(compiled.diagnostics.map(({ code }) => code)).toEqual([
      "compiler.unsupported-node-kind",
      "compiler.unsupported-node-kind",
      "compiler.unsupported-node-kind",
    ]);
  });
});
