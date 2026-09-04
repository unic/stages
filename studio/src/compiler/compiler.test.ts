import { describe, expect, it } from "vitest";
import { evaluateSchema, initialFieldValue, type DynamicMetaSnapshot } from "@stages/core";
import projectV1 from "../document/fixtures/project-v1.json";
import { serializeStudioProject, toUid, validateStudioProject } from "../document";
import type { JsonObject, StudioFormDocument, StudioGroupNode, StudioNode, StudioProjectDocument, Uid } from "../document";
import { DEFAULT_STUDIO_THEME } from "../registry";
import {
  compileStudioForm,
  createEmptyStudioScenarioValue,
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
  it("expands multiple linked instances with overrides and definition provenance", () => {
    const fragmentUid = toUid("fragment_address");
    const definitionFieldUid = toUid("fragment_street");
    const firstInstanceUid = toUid("fragment_home");
    const secondInstanceUid = toUid("fragment_work");
    const form: StudioFormDocument = {
      uid: formUid, title: "Fragments", runtime: { schemaId: "fragments", schemaVersion: 1 },
      rootNodeUids: [firstInstanceUid, secondInstanceUid],
      nodes: {
        [firstInstanceUid]: { uid: firstInstanceUid, kind: "fragment", runtimeId: "home", fragmentUid },
        [secondInstanceUid]: { uid: secondInstanceUid, kind: "fragment", runtimeId: "work", fragmentUid, overrides: { [definitionFieldUid]: { props: { label: "Office street" } } } },
      }, scenarios: [], settings: {},
    };
    const compiled = compileStudioForm(form, {
      [fragmentUid]: {
        uid: fragmentUid, title: "Address", version: 1, parameters: [], rootNodeUids: [definitionFieldUid],
        nodes: { [definitionFieldUid]: { uid: definitionFieldUid, kind: "field", runtimeId: "street", definition: { key: "text", version: 1 }, props: { label: "Street" } } },
      },
    });
    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.schema.nodes).toMatchObject([
      { kind: "group", id: "home", nodes: [{ kind: "field", id: "street", props: { label: "Street" } }] },
      { kind: "group", id: "work", nodes: [{ kind: "field", id: "street", props: { label: "Office street" } }] },
    ]);
    const instanceEntries = [...compiled.sourceMap.byUid.values()].filter((entry) => entry.fragmentNodeUid === definitionFieldUid);
    expect(instanceEntries).toHaveLength(2);
    expect(instanceEntries.map((entry) => entry.fragmentInstanceUids)).toEqual([[firstInstanceUid], [secondInstanceUid]]);
    expect(createEmptyStudioScenarioValue(form, {
      [fragmentUid]: { uid: fragmentUid, title: "Address", version: 1, parameters: [], rootNodeUids: [definitionFieldUid], nodes: { [definitionFieldUid]: { uid: definitionFieldUid, kind: "field", runtimeId: "street", definition: { key: "text", version: 1 }, props: {} } } },
    })).toEqual({ home: { street: "" }, work: { street: "" } });
  });

  it("reports cyclic fragment provenance without recursing indefinitely", () => {
    const fragmentUid = toUid("fragment_recursive");
    const nestedUid = toUid("fragment_nested_instance");
    const instanceUid = toUid("fragment_root_instance");
    const form: StudioFormDocument = {
      uid: formUid, title: "Cycle", runtime: { schemaId: "cycle", schemaVersion: 1 },
      rootNodeUids: [instanceUid],
      nodes: { [instanceUid]: { uid: instanceUid, kind: "fragment", runtimeId: "root", fragmentUid } },
      scenarios: [], settings: {},
    };
    const compiled = compileStudioForm(form, {
      [fragmentUid]: {
        uid: fragmentUid, title: "Recursive", version: 1, parameters: [], rootNodeUids: [nestedUid],
        nodes: { [nestedUid]: { uid: nestedUid, kind: "fragment", runtimeId: "nested", fragmentUid } },
      },
    });
    expect(compiled.diagnostics).toContainEqual(expect.objectContaining({
      code: "compiler.fragment-cycle",
      fragmentDefinitionUid: fragmentUid,
      fragmentInstanceUids: [instanceUid, nestedUid],
    }));
  });

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

  it("reports stable compiler diagnostics for sibling IDs", () => {
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

    expect(compiled.schema.nodes).toEqual([
      expect.objectContaining({ kind: "field", id: "name" }),
      { kind: "collection", id: "people", nodes: [] },
      { kind: "wizard", id: "signup", stages: [{ id: "details", nodes: [] }] },
    ]);
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
    expect(compiled.diagnostics).toEqual([]);
  });

  it("compiles collection constraints, variants, stable keys, wizard policy, and explicit empty scenario rows", () => {
    const collectionUid = toUid("collection_contacts");
    const personUid = toUid("variant_person");
    const nameUid = toUid("field_name");
    const wizardUid = toUid("wizard_flow");
    const introUid = toUid("stage_intro");
    const reviewUid = toUid("stage_review");
    const form: StudioFormDocument = {
      uid: formUid,
      title: "Structural form",
      runtime: { schemaId: "structural", schemaVersion: 1 },
      rootNodeUids: [collectionUid, wizardUid],
      nodes: {
        [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "contacts", min: 1, max: 3, initialRows: 1, itemKey: { kind: "property", property: "id" }, discriminator: "kind", variantUids: [personUid], initialVariantUid: personUid },
        [personUid]: { uid: personUid, kind: "variant", runtimeId: "person", childUids: [nameUid] },
        [nameUid]: { uid: nameUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" } },
        [wizardUid]: { uid: wizardUid, kind: "wizard", runtimeId: "flow", stageUids: [introUid, reviewUid], initialStageUid: reviewUid, navigation: { nonLinear: true, validateCurrent: true } },
        [introUid]: { uid: introUid, kind: "stage", runtimeId: "intro", childUids: [] },
        [reviewUid]: { uid: reviewUid, kind: "stage", runtimeId: "review", childUids: [] },
      },
      scenarios: [],
      settings: {},
    };
    const compiled = compileStudioForm(form);
    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.schema.nodes).toMatchObject([{
      kind: "collection", id: "contacts", min: 1, max: 3, discriminator: "kind",
      variants: { person: { nodes: [{ kind: "field", id: "name" }] } },
    }, {
      kind: "wizard", id: "flow", initialStage: "review",
      navigation: { nonLinear: true, validateCurrent: true },
      stages: [{ id: "intro" }, { id: "review" }],
    }]);
    expect((compiled.schema.nodes[0] as { itemKey?: (value: unknown, index: number) => string }).itemKey?.({ id: "contact-1" }, 0)).toBe("contact-1");
    const empty = createEmptyStudioScenarioValue(form);
    expect(empty).toEqual({
      contacts: [{ id: "row-1", kind: "person", name: "" }],
      flow: { intro: {}, review: {} },
    });
    const evaluated = evaluateSchema({ schema: compiled.schema, fields: compiled.fields, value: empty, context: {}, meta });
    expect(evaluated.diagnostics).toEqual([]);
  });

  it("matches the representative group, collection, variant, and wizard nesting permutations", () => {
    const kinds = ["group", "collection", "variant", "wizard"] as const;
    const sequences: Array<readonly (typeof kinds)[number][]> = [];
    let current: Array<readonly (typeof kinds)[number][]> = [[]];
    for (let depth = 1; depth <= 3; depth += 1) {
      current = current.flatMap((sequence) => kinds.map((kind) => [...sequence, kind]));
      sequences.push(...current);
    }
    const deep = Array.from({ length: 32 }, (_, index) => kinds[index % kinds.length]!);
    for (const [fixtureIndex, sequence] of [...sequences, deep].entries()) {
      const nodes = {} as Record<Uid, StudioNode>;
      const leafUid = toUid(`field_leaf_${fixtureIndex}`);
      nodes[leafUid] = { uid: leafUid, kind: "field", runtimeId: "leaf", definition: { key: "text", version: 1 }, props: { label: "Leaf" } };
      let rootUid = leafUid;
      let value: JsonObject = { leaf: "Ada" };
      for (let index = sequence.length - 1; index >= 0; index -= 1) {
        const kind = sequence[index]!;
        const uid = toUid(`${kind}_${fixtureIndex}_${index}`);
        const id = `${kind}${index}`;
        if (kind === "group") {
          nodes[uid] = { uid, kind: "group", runtimeId: id, childUids: [rootUid] };
          value = { [id]: value };
        } else if (kind === "collection") {
          nodes[uid] = { uid, kind: "collection", runtimeId: id, childUids: [rootUid], itemKey: { kind: "index" } };
          value = { [id]: [value] };
        } else if (kind === "variant") {
          const variantUid = toUid(`variant_entry_${fixtureIndex}_${index}`);
          nodes[variantUid] = { uid: variantUid, kind: "variant", runtimeId: "entry", childUids: [rootUid] };
          nodes[uid] = { uid, kind: "collection", runtimeId: id, discriminator: "variant", variantUids: [variantUid] };
          value = { [id]: [{ variant: "entry", ...value }] };
        } else {
          const stageUid = toUid(`stage_${fixtureIndex}_${index}`);
          nodes[stageUid] = { uid: stageUid, kind: "stage", runtimeId: `step${index}`, childUids: [rootUid] };
          nodes[uid] = { uid, kind: "wizard", runtimeId: id, stageUids: [stageUid], initialStageUid: stageUid };
          value = { [id]: { [`step${index}`]: value } };
        }
        rootUid = uid;
      }
      const form: StudioFormDocument = { uid: formUid, title: "Permutation", runtime: { schemaId: `permutation-${fixtureIndex}`, schemaVersion: 1 }, rootNodeUids: [rootUid], nodes, scenarios: [], settings: {} };
      const compiled = compileStudioForm(form);
      expect(compiled.diagnostics, sequence.join(" > ")).toEqual([]);
      expect(evaluateSchema({ schema: compiled.schema, fields: compiled.fields, value, context: {}, meta }).diagnostics, sequence.join(" > ")).toEqual([]);
    }
  });
});
