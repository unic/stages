import { describe, expect, it } from "vitest";
import { toUid } from "../document";
import {
  createStudioWorkbenchState,
  clearStudioSelection,
  reconcileStudioWorkbench,
  revealStudioUid,
  selectStudioUid,
  setStudioExpansion,
  createStudioDropCommand,
  createStudioRelativeMoveCommand,
} from "./index";
import type { StudioFormDocument } from "../document";

const form = toUid("form");
const group = toUid("group");
const first = toUid("first");
const second = toUid("second");
const visible = [form, group, first, second];

describe("Studio workbench state", () => {
  it("supports replacement, toggle, and contiguous range selection by UID", () => {
    let state = selectStudioUid(createStudioWorkbenchState(), group, visible);
    state = selectStudioUid(state, second, visible, { extend: true });
    expect(state.selectedUids).toEqual([group, first, second]);

    state = selectStudioUid(state, first, visible, { toggle: true });
    expect(state.selectedUids).toEqual([group, second]);
    expect(state.focusedUid).toBe(first);

    state = clearStudioSelection(state);
    expect(state.selectedUids).toEqual([]);
    expect(state.selectionAnchorUid).toBeUndefined();
  });

  it("reveals every ancestor before focusing a diagnostic target", () => {
    const parents = new Map([
      [form, undefined],
      [group, form],
      [first, group],
    ]);
    const state = revealStudioUid(createStudioWorkbenchState(), first, parents);
    expect([...state.expandedUids]).toEqual([group, form]);
    expect(state.selectedUids).toEqual([first]);
    expect(state.focusedUid).toBe(first);
  });

  it("keeps selection and expansion through rename or reorder and removes deleted UIDs", () => {
    let state = selectStudioUid(createStudioWorkbenchState(), first, visible);
    state = setStudioExpansion(state, group, true);

    const reordered = [form, group, second, first];
    const preserved = reconcileStudioWorkbench(state, new Set(reordered), reordered);
    expect(preserved.selectedUids).toEqual([first]);
    expect(preserved.expandedUids.has(group)).toBe(true);

    const afterDelete = reconcileStudioWorkbench(preserved, new Set([form, group, second]), [form, group, second]);
    expect(afterDelete.selectedUids).toEqual([]);
    expect(afterDelete.focusedUid).toBe(form);
  });
});

describe("Studio structural move planning", () => {
  const formDocument: StudioFormDocument = {
    uid: form,
    title: "Form",
    runtime: { schemaId: "form", schemaVersion: 1 },
    rootNodeUids: [group, second],
    nodes: {
      [group]: { uid: group, kind: "group", runtimeId: "group", childUids: [first] },
      [first]: { uid: first, kind: "field", runtimeId: "first", definition: { key: "text", version: 1 }, props: {} },
      [second]: { uid: second, kind: "field", runtimeId: "second", definition: { key: "text", version: 1 }, props: {} },
    },
    scenarios: [],
    settings: {},
  };

  it("uses node.move for keyboard reorder and pointer cross-container drop", () => {
    expect(createStudioRelativeMoveCommand(formDocument, second, "top")).toEqual({
      type: "node.move", formUid: form, uid: second, parentUid: null, index: 0,
    });
    expect(createStudioDropCommand(formDocument, second, group)).toEqual({
      type: "node.move", formUid: form, uid: second, parentUid: group, index: 1,
    });
    expect(createStudioDropCommand(formDocument, second, group, "before")).toEqual({
      type: "node.move", formUid: form, uid: second, parentUid: null, index: 0,
    });
    expect(createStudioDropCommand(formDocument, group, second, "after")).toEqual({
      type: "node.move", formUid: form, uid: group, parentUid: null, index: 1,
    });
    expect(createStudioRelativeMoveCommand(formDocument, second, "in")).toEqual({
      type: "node.move", formUid: form, uid: second, parentUid: group, index: 1,
    });
    expect(createStudioRelativeMoveCommand(formDocument, first, "out")).toEqual({
      type: "node.move", formUid: form, uid: first, parentUid: null, index: 1,
    });
  });
});
