import { describe, expect, it } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import {
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
