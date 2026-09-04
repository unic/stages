import { describe, expect, it } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import {
  canPlaceStudioNode,
  copyStudioNodes,
  createStudioCutCommand,
  createStudioPasteCommand,
  markStudioHistorySaved,
  createStudioHistory,
  dispatchStudioCommand,
  executeStudioCommand,
  isStudioHistoryDirty,
  redoStudioHistory,
  undoStudioHistory,
} from "./index";
import { toUid, validateStudioProject } from "../document";
import type { StudioProjectDocument, Uid } from "../document";
import type { StudioCommand, StudioHistoryState } from "./index";
import { compileStudioForm } from "../compiler";

const formUid = toUid("form_event");
const groupUid = toUid("group_event");
const fieldUid = toUid("field_title");

function project(): StudioProjectDocument {
  const result = validateStudioProject(structuredClone(projectV1), { supportedDefinitions: { text: [1] } });
  if (!result.ok) throw new Error("Fixture must be valid.");
  return result.value;
}

function success(project: StudioProjectDocument, command: StudioCommand): StudioProjectDocument {
  const result = executeStudioCommand(project, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.failure.message);
  return result.document;
}

describe("Studio command engine", () => {
  it("inserts and edits named scenarios through immutable history commands", () => {
    const initial = project();
    const scenarioUid = toUid("scenario_permissions");
    const inserted = success(initial, {
      type: "scenario.insert", formUid, index: 0,
      scenario: { uid: scenarioUid, title: "Read only", value: {}, context: { canEdit: false }, extensions: { features: { review: true } } },
    });
    expect(inserted.forms[formUid]?.scenarios[0]).toMatchObject({ uid: scenarioUid, context: { canEdit: false } });
    expect(initial.forms[formUid]?.scenarios).toEqual([]);

    const updated = success(inserted, { type: "scenario.update", formUid, uid: scenarioUid, changes: { context: { canEdit: true } } });
    expect(updated.forms[formUid]?.scenarios[0]).toMatchObject({ context: { canEdit: true }, extensions: { features: { review: true } } });
    expect(executeStudioCommand(updated, { type: "scenario.update", formUid, uid: toUid("missing_scenario"), changes: { context: {} } })).toMatchObject({ ok: false, failure: { code: "command.scenario-not-found" } });
  });

  it("creates, edits, inserts, overrides, and detaches reusable fragments immutably", () => {
    const initial = project();
    const fragmentUid = toUid("fragment_event");
    const instanceUid = toUid("fragment_event_instance");
    const created = success(initial, {
      type: "fragment.create", formUid, uids: [fieldUid],
      fragment: { uid: fragmentUid, title: "Event details", version: 1, parameters: [] },
      instance: { uid: instanceUid, kind: "fragment", runtimeId: "details", fragmentUid },
    });
    expect(created.fragments[fragmentUid]?.rootNodeUids).toEqual([fieldUid]);
    expect(created.forms[formUid]?.nodes[fieldUid]).toBeUndefined();
    expect(created.forms[formUid]?.nodes[instanceUid]).toMatchObject({ kind: "fragment", fragmentUid });

    const edited = success(created, { type: "fragment.node.update", fragmentUid, uid: fieldUid, changes: { props: { label: "Shared title" } } });
    expect(edited.fragments[fragmentUid]?.nodes[fieldUid]).toMatchObject({ props: { label: "Shared title" } });
    const secondUid = toUid("fragment_event_second");
    const inserted = success(edited, { type: "fragment.insert", formUid, parentUid: null, index: 1, instance: { uid: secondUid, kind: "fragment", runtimeId: "otherDetails", fragmentUid, overrides: { [fieldUid]: { props: { label: "Other title" } } } } });
    const insertedForm = inserted.forms[formUid]!;
    expect(compileStudioForm(insertedForm, inserted.fragments).schema.nodes).toMatchObject([
      { kind: "group", id: "event", nodes: [{ kind: "group", id: "details", nodes: [{ props: { label: "Shared title" } }] }] },
      { kind: "group", id: "otherDetails", nodes: [{ props: { label: "Other title" } }] },
    ]);
    const detachedUid = toUid("detached_title");
    const detached = success(inserted, { type: "fragment.detach", formUid, uid: secondUid, uidMap: { [fieldUid]: detachedUid } });
    expect(detached.forms[formUid]?.nodes[secondUid]).toMatchObject({ kind: "group", runtimeId: "otherDetails", childUids: [detachedUid] });
    expect(detached.forms[formUid]?.nodes[detachedUid]).toMatchObject({ kind: "field", props: { label: "Other title" } });
    expect(detached.fragments[fragmentUid]).toBe(edited.fragments[fragmentUid]);
    expect(initial.fragments).toEqual({});
  });

  it("inserts, updates, moves, duplicates, and deletes while preserving unaffected identity", () => {
    const initial = project();
    const secondUid = toUid("field_summary");
    const inserted = success(initial, {
      type: "node.insert",
      formUid,
      parentUid: groupUid,
      index: 1,
      node: {
        uid: secondUid,
        kind: "field",
        runtimeId: "summary",
        definition: { key: "text", version: 1 },
        props: { label: "Summary" },
      },
    });
    expect(inserted.forms[formUid]?.nodes[fieldUid]).toBe(initial.forms[formUid]?.nodes[fieldUid]);
    expect(inserted.resources).toBe(initial.resources);

    const updated = success(inserted, {
      type: "node.update",
      formUid,
      uid: secondUid,
      changes: { props: { label: "Short summary" } },
    });
    expect(updated.forms[formUid]?.nodes[secondUid]).toMatchObject({ props: { label: "Short summary" } });
    expect(updated.forms[formUid]?.nodes[fieldUid]).toBe(inserted.forms[formUid]?.nodes[fieldUid]);

    const moved = success(updated, {
      type: "node.move", formUid, uid: secondUid, parentUid: groupUid, index: 0,
    });
    expect(moved.forms[formUid]?.nodes[groupUid]).toMatchObject({ childUids: [secondUid, fieldUid] });

    const groupCopyUid = toUid("group_copy");
    const fieldCopyUid = toUid("field_copy");
    const duplicated = success(moved, {
      type: "node.duplicate",
      formUid,
      uid: groupUid,
      parentUid: null,
      index: 1,
      uidMap: { [groupUid]: groupCopyUid, [fieldUid]: fieldCopyUid, [secondUid]: toUid("summary_copy") },
      rootRuntimeId: "eventCopy",
    });
    expect(duplicated.forms[formUid]?.rootNodeUids).toEqual([groupUid, groupCopyUid]);
    expect(duplicated.forms[formUid]?.nodes[groupCopyUid]).toMatchObject({
      uid: groupCopyUid,
      runtimeId: "eventCopy",
      childUids: [toUid("summary_copy"), fieldCopyUid],
    });

    const deleted = success(duplicated, { type: "node.delete", formUid, uid: groupCopyUid });
    expect(deleted.forms[formUid]?.rootNodeUids).toEqual([groupUid]);
    expect(deleted.forms[formUid]?.nodes[groupCopyUid]).toBeUndefined();
    expect(deleted.forms[formUid]?.nodes[fieldCopyUid]).toBeUndefined();
  });

  it("rejects broken graph operations and sibling runtime-ID collisions", () => {
    const initial = project();
    const collision = executeStudioCommand(initial, {
      type: "node.insert",
      formUid,
      parentUid: groupUid,
      index: 1,
      node: {
        uid: toUid("field_collision"),
        kind: "field",
        runtimeId: "title",
        definition: { key: "text", version: 1 },
        props: {},
      },
    });
    expect(collision).toMatchObject({ ok: false, failure: { code: "command.invariant" } });

    const descendantMove = executeStudioCommand(initial, {
      type: "node.move", formUid, uid: groupUid, parentUid: fieldUid, index: 0,
    });
    expect(descendantMove).toMatchObject({ ok: false, failure: { code: "command.invalid-parent" } });

    const structuralUpdate = executeStudioCommand(initial, {
      type: "node.update", formUid, uid: fieldUid, changes: { uid: toUid("changed") },
    });
    expect(structuralUpdate).toMatchObject({ ok: false, failure: { code: "command.invalid-update" } });

    const illegalStage = executeStudioCommand(initial, {
      type: "node.insert",
      formUid,
      parentUid: null,
      index: 1,
      node: { uid: toUid("stage_illegal"), kind: "stage", runtimeId: "step", childUids: [] },
    });
    expect(illegalStage).toMatchObject({ ok: false, failure: { code: "command.incompatible-placement" } });
    expect(initial).toEqual(project());
  });

  it("commits transactions atomically and reports the exact failing command", () => {
    const initial = project();
    const result = executeStudioCommand(initial, {
      type: "transaction",
      label: "Add and configure summary",
      commands: [
        {
          type: "node.insert",
          formUid,
          parentUid: groupUid,
          index: 1,
          node: {
            uid: toUid("field_summary"), kind: "field", runtimeId: "summary",
            definition: { key: "text", version: 1 }, props: {},
          },
        },
        { type: "node.update", formUid, uid: toUid("missing"), changes: { props: { label: "No" } } },
      ],
    });
    expect(result).toMatchObject({
      ok: false,
      failure: { code: "command.node-not-found", commandPath: [1] },
    });
    expect(initial.forms[formUid]?.nodes[toUid("field_summary")]).toBeUndefined();
  });

  it("wraps and unwraps contiguous siblings without changing their UIDs or order", () => {
    const summaryUid = toUid("field_summary");
    const withSummary = success(project(), {
      type: "node.insert", formUid, parentUid: groupUid, index: 1,
      node: { uid: summaryUid, kind: "field", runtimeId: "summary", definition: { key: "text", version: 1 }, props: {} },
    });
    const wrapperUid = toUid("collection_details");
    const wrapped = success(withSummary, {
      type: "node.wrap",
      formUid,
      uids: [summaryUid, fieldUid],
      wrapper: { uid: wrapperUid, kind: "collection", runtimeId: "details", childUids: [], min: 1 },
    });
    expect(wrapped.forms[formUid]?.nodes[groupUid]).toMatchObject({ childUids: [wrapperUid] });
    expect(wrapped.forms[formUid]?.nodes[wrapperUid]).toMatchObject({ childUids: [fieldUid, summaryUid] });

    const unwrapped = success(wrapped, { type: "node.unwrap", formUid, uid: wrapperUid });
    expect(unwrapped.forms[formUid]?.nodes[groupUid]).toMatchObject({ childUids: [fieldUid, summaryUid] });
    expect(unwrapped.forms[formUid]?.nodes[wrapperUid]).toBeUndefined();
    expect(unwrapped.forms[formUid]?.nodes[fieldUid]).toBe(withSummary.forms[formUid]?.nodes[fieldUid]);

    const middleUid = toUid("field_middle");
    const withMiddle = success(withSummary, {
      type: "node.insert", formUid, parentUid: groupUid, index: 1,
      node: { uid: middleUid, kind: "field", runtimeId: "middle", definition: { key: "text", version: 1 }, props: {} },
    });
    const nonContiguous = executeStudioCommand(withMiddle, {
      type: "node.wrap",
      formUid,
      uids: [fieldUid, summaryUid],
      wrapper: { uid: toUid("group_invalid"), kind: "group", runtimeId: "invalid", childUids: [] },
    });
    expect(nonContiguous).toMatchObject({ ok: false, failure: { code: "command.non-contiguous-selection" } });
  });

  it("converts groups, collections, and single-stage wizards losslessly", () => {
    const collection = success(project(), {
      type: "node.convert", formUid, uid: groupUid, targetKind: "collection", collection: { min: 1, initialRows: 1 },
    });
    expect(collection.forms[formUid]?.nodes[groupUid]).toMatchObject({ kind: "collection", childUids: [fieldUid], min: 1 });

    const stageUid = toUid("stage_step1");
    const wizard = success(collection, {
      type: "node.convert",
      formUid,
      uid: groupUid,
      targetKind: "wizard",
      stage: { uid: stageUid, kind: "stage", runtimeId: "step1", childUids: [], presentation: { label: "Step 1" } },
    });
    expect(wizard.forms[formUid]?.nodes[groupUid]).toMatchObject({ kind: "wizard", stageUids: [stageUid] });
    expect(wizard.forms[formUid]?.nodes[stageUid]).toMatchObject({ childUids: [fieldUid] });

    const group = success(wizard, { type: "node.convert", formUid, uid: groupUid, targetKind: "group" });
    expect(group.forms[formUid]?.nodes[groupUid]).toMatchObject({ kind: "group", childUids: [fieldUid] });
    expect(group.forms[formUid]?.nodes[stageUid]).toBeUndefined();
  });

  it("copies, cuts, and pastes self-contained subtrees with explicit UID remapping", () => {
    const initial = project();
    const copied = copyStudioNodes(initial, formUid, [groupUid, fieldUid]);
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    expect(copied.value.rootUids).toEqual([groupUid]);
    expect(Object.keys(copied.value.nodes)).toEqual([groupUid, fieldUid]);

    const copyGroupUid = toUid("group_copy");
    const copyFieldUid = toUid("field_copy");
    const paste = createStudioPasteCommand(copied.value, { formUid, parentUid: null, index: 1 }, {
      [groupUid]: copyGroupUid,
      [fieldUid]: copyFieldUid,
    }, { [groupUid]: "eventCopy" });
    expect(paste.ok).toBe(true);
    if (!paste.ok) return;
    const pasted = success(initial, paste.value);
    expect(pasted.forms[formUid]?.rootNodeUids).toEqual([groupUid, copyGroupUid]);
    expect(pasted.forms[formUid]?.nodes[copyGroupUid]).toMatchObject({ childUids: [copyFieldUid] });

    const cut = success(initial, createStudioCutCommand(copied.value));
    expect(cut.forms[formUid]?.rootNodeUids).toEqual([]);
    expect(cut.forms[formUid]?.nodes).toEqual({});

    const unresolved = createStudioPasteCommand(
      { ...copied.value, dependencies: [toUid("fragment_missing")] },
      { formUid, parentUid: null, index: 1 },
      { [groupUid]: copyGroupUid, [fieldUid]: copyFieldUid },
    );
    expect(unresolved).toMatchObject({ ok: false, code: "command.unresolved-clipboard-dependency" });
  });

  it("moves across containers and enforces the structural compatibility matrix", () => {
    const rootFieldUid = toUid("field_root");
    const withRoot = success(project(), {
      type: "node.insert", formUid, parentUid: null, index: 1,
      node: { uid: rootFieldUid, kind: "field", runtimeId: "root", definition: { key: "text", version: 1 }, props: {} },
    });
    const moved = success(withRoot, { type: "node.move", formUid, uid: rootFieldUid, parentUid: groupUid, index: 1 });
    expect(moved.forms[formUid]?.rootNodeUids).toEqual([groupUid]);
    expect(moved.forms[formUid]?.nodes[groupUid]).toMatchObject({ childUids: [fieldUid, rootFieldUid] });

    expect(canPlaceStudioNode("wizard", "stage")).toBe(true);
    expect(canPlaceStudioNode("wizard", "field")).toBe(false);
    expect(canPlaceStudioNode("root", "stage")).toBe(false);
    expect(canPlaceStudioNode("collection", "wizard")).toBe(true);
  });

  it("authors, orders, and copies discriminated variants and wizard stages by UID", () => {
    const collectionUid = toUid("collection_contacts");
    const personUid = toUid("variant_person");
    const companyUid = toUid("variant_company");
    let current = success(project(), {
      type: "node.insert-subtree", formUid, parentUid: null, index: 1, rootUids: [collectionUid],
      nodes: {
        [collectionUid]: { uid: collectionUid, kind: "collection", runtimeId: "contacts", discriminator: "kind", variantUids: [personUid], initialVariantUid: personUid, initialRows: 1 },
        [personUid]: { uid: personUid, kind: "variant", runtimeId: "person", childUids: [] },
      },
    });
    current = success(current, {
      type: "node.insert", formUid, parentUid: collectionUid, index: 1,
      node: { uid: companyUid, kind: "variant", runtimeId: "company", childUids: [] },
    });
    current = success(current, { type: "node.move", formUid, uid: companyUid, parentUid: collectionUid, index: 0 });
    expect(current.forms[formUid]?.nodes[collectionUid]).toMatchObject({ variantUids: [companyUid, personUid] });

    const invalidChild = executeStudioCommand(current, {
      type: "node.insert", formUid, parentUid: collectionUid, index: 2,
      node: { uid: toUid("field_invalid_variant_child"), kind: "field", runtimeId: "bad", definition: { key: "text", version: 1 }, props: {} },
    });
    expect(invalidChild).toMatchObject({ ok: false, failure: { code: "command.incompatible-placement" } });

    const copied = copyStudioNodes(current, formUid, [collectionUid]);
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    const copyCollectionUid = toUid("collection_contacts_copy");
    const copyPersonUid = toUid("variant_person_copy");
    const copyCompanyUid = toUid("variant_company_copy");
    const paste = createStudioPasteCommand(copied.value, { formUid, parentUid: null, index: 2 }, {
      [collectionUid]: copyCollectionUid,
      [personUid]: copyPersonUid,
      [companyUid]: copyCompanyUid,
    }, { [collectionUid]: "contactsCopy" });
    expect(paste.ok).toBe(true);
    if (!paste.ok) return;
    const pasted = success(current, paste.value);
    expect(pasted.forms[formUid]?.nodes[copyCollectionUid]).toMatchObject({
      variantUids: [copyCompanyUid, copyPersonUid],
      initialVariantUid: copyPersonUid,
    });
  });
});

describe("Studio document history", () => {
  function dispatch(history: StudioHistoryState, command: StudioCommand, options = {}): StudioHistoryState {
    const result = dispatchStudioCommand(history, command, options);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.failure.message);
    return result.history;
  }

  it("supports labeled undo/redo, save cursors, branching, and bounded checkpoints", () => {
    const initial = project();
    let history = createStudioHistory(initial, { maxCheckpoints: 2 });
    expect(isStudioHistoryDirty(history)).toBe(false);
    for (let index = 0; index < 3; index += 1) {
      history = dispatch(history, {
        type: "node.update", formUid, uid: fieldUid, changes: { props: { label: `Title ${index}` } },
      }, { label: `Set title ${index}` });
    }
    expect(history.past).toHaveLength(2);
    expect(history.past.at(-1)?.label).toBe("Set title 2");
    expect(isStudioHistoryDirty(history)).toBe(true);
    history = markStudioHistorySaved(history);
    expect(isStudioHistoryDirty(history)).toBe(false);
    history = undoStudioHistory(history);
    expect(isStudioHistoryDirty(history)).toBe(true);
    history = redoStudioHistory(history);
    expect(isStudioHistoryDirty(history)).toBe(false);
    history = undoStudioHistory(history);
    history = dispatch(history, {
      type: "node.update", formUid, uid: fieldUid, changes: { props: { label: "Branched" } },
    });
    expect(history.future).toEqual([]);
    expect(isStudioHistoryDirty(history)).toBe(true);
  });

  it("coalesces only consecutive typing with an explicit matching key", () => {
    let history = createStudioHistory(project());
    history = dispatch(history, {
      type: "node.update", formUid, uid: fieldUid, changes: { props: { label: "E" } },
    }, { label: "Type label", coalesceKey: "field_title:props.label" });
    history = dispatch(history, {
      type: "node.update", formUid, uid: fieldUid, changes: { props: { label: "Ev" } },
    }, { label: "Type label", coalesceKey: "field_title:props.label" });
    expect(history.past).toHaveLength(1);
    expect(undoStudioHistory(history).present).toEqual(project());

    history = markStudioHistorySaved(history);
    history = dispatch(history, {
      type: "node.update", formUid, uid: fieldUid, changes: { props: { label: "Eve" } },
    }, { label: "Type label", coalesceKey: "field_title:props.label" });
    expect(history.past).toHaveLength(2);

    history = dispatch(history, {
      type: "node.insert", formUid, parentUid: null, index: 1,
      node: {
        uid: toUid("heading_block"), kind: "block",
        definition: { key: "heading", version: 1 }, props: { text: "Heading" },
      },
    }, { label: "Semantic insert", coalesceKey: "field_title:props.label" });
    expect(history.past).toHaveLength(3);
  });

  it("round-trips a deterministic randomized command sequence exactly", () => {
    const initial = project();
    let history = createStudioHistory(initial, { maxCheckpoints: 256 });
    let random = 0x51f15e;
    const next = (): number => {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      return random;
    };
    let created = 0;
    for (let step = 0; step < 120; step += 1) {
      const form = history.present.forms[formUid];
      if (!form) throw new Error("Missing form.");
      const group = form.nodes[groupUid];
      if (!group || group.kind !== "group") throw new Error("Missing group.");
      const dynamic = group.childUids.filter((uid) => uid !== fieldUid);
      const operation = next() % 3;
      let command: StudioCommand;
      if (operation === 0 || dynamic.length === 0) {
        created += 1;
        const uid = toUid(`random_${created}`);
        command = {
          type: "node.insert", formUid, parentUid: groupUid,
          index: next() % (group.childUids.length + 1),
          node: {
            uid, kind: "field", runtimeId: `random${created}`,
            definition: { key: "text", version: 1 }, props: { label: `Field ${created}` },
          },
        };
      } else if (operation === 1) {
        const uid = dynamic[next() % dynamic.length] as Uid;
        command = { type: "node.delete", formUid, uid };
      } else {
        const uid = group.childUids[next() % group.childUids.length] as Uid;
        command = {
          type: "node.move", formUid, uid, parentUid: groupUid,
          index: next() % group.childUids.length,
        };
      }
      history = dispatch(history, command, { label: `Random ${step}` });
    }
    const final = history.present;
    const entries = history.past.length;
    for (let index = 0; index < entries; index += 1) history = undoStudioHistory(history);
    expect(history.present).toBe(initial);
    expect(history.present).toEqual(initial);
    for (let index = 0; index < entries; index += 1) history = redoStudioHistory(history);
    expect(history.present).toBe(final);
    expect(history.present).toEqual(final);
  });
});
