import { describe, expect, it } from "vitest";
import { toUid } from "../document";
import {
  createStudioWorkbenchState,
  reconcileStudioWorkbench,
  revealStudioUid,
  selectStudioUid,
  setStudioExpansion,
} from "./index";

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
