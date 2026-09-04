import type { Uid } from "../document";

export * from "./outline";
export * from "./structure";

export interface StudioWorkbenchState {
  readonly selectedUids: readonly Uid[];
  readonly selectionAnchorUid?: Uid;
  readonly focusedUid?: Uid;
  readonly expandedUids: ReadonlySet<Uid>;
}

export interface StudioSelectionOptions {
  readonly extend?: boolean;
  readonly toggle?: boolean;
}

export function clearStudioSelection(state: StudioWorkbenchState): StudioWorkbenchState {
  const { selectionAnchorUid: _selectionAnchorUid, ...rest } = state;
  return { ...rest, selectedUids: [] };
}

export function createStudioWorkbenchState(initial?: {
  readonly expandedUids?: readonly Uid[];
  readonly focusedUid?: Uid;
}): StudioWorkbenchState {
  return {
    selectedUids: [],
    expandedUids: new Set(initial?.expandedUids ?? []),
    ...(initial?.focusedUid === undefined ? {} : { focusedUid: initial.focusedUid }),
  };
}

export function selectStudioUid(
  state: StudioWorkbenchState,
  uid: Uid,
  visibleUids: readonly Uid[],
  options: StudioSelectionOptions = {},
): StudioWorkbenchState {
  if (options.extend && state.selectionAnchorUid !== undefined) {
    const anchorIndex = visibleUids.indexOf(state.selectionAnchorUid);
    const nextIndex = visibleUids.indexOf(uid);
    if (anchorIndex >= 0 && nextIndex >= 0) {
      const start = Math.min(anchorIndex, nextIndex);
      const end = Math.max(anchorIndex, nextIndex);
      return {
        ...state,
        selectedUids: visibleUids.slice(start, end + 1),
        focusedUid: uid,
      };
    }
  }

  if (options.toggle) {
    const selected = new Set(state.selectedUids);
    if (selected.has(uid)) selected.delete(uid);
    else selected.add(uid);
    return {
      ...state,
      selectedUids: [...selected],
      selectionAnchorUid: uid,
      focusedUid: uid,
    };
  }

  return {
    ...state,
    selectedUids: [uid],
    selectionAnchorUid: uid,
    focusedUid: uid,
  };
}

export function setStudioExpansion(
  state: StudioWorkbenchState,
  uid: Uid,
  expanded: boolean,
): StudioWorkbenchState {
  const expandedUids = new Set(state.expandedUids);
  if (expanded) expandedUids.add(uid);
  else expandedUids.delete(uid);
  return { ...state, expandedUids };
}

export function revealStudioUid(
  state: StudioWorkbenchState,
  uid: Uid,
  parentByUid: ReadonlyMap<Uid, Uid | undefined>,
): StudioWorkbenchState {
  const expandedUids = new Set(state.expandedUids);
  let parentUid = parentByUid.get(uid);
  while (parentUid !== undefined) {
    expandedUids.add(parentUid);
    parentUid = parentByUid.get(parentUid);
  }
  return {
    ...state,
    selectedUids: [uid],
    selectionAnchorUid: uid,
    focusedUid: uid,
    expandedUids,
  };
}

export function reconcileStudioWorkbench(
  state: StudioWorkbenchState,
  availableUids: ReadonlySet<Uid>,
  visibleUids: readonly Uid[],
): StudioWorkbenchState {
  const selectedUids = state.selectedUids.filter((uid) => availableUids.has(uid));
  const expandedUids = new Set([...state.expandedUids].filter((uid) => availableUids.has(uid)));
  const focusedUid = state.focusedUid !== undefined && availableUids.has(state.focusedUid)
    ? state.focusedUid
    : visibleUids[0];
  const selectionAnchorUid = state.selectionAnchorUid !== undefined && availableUids.has(state.selectionAnchorUid)
    ? state.selectionAnchorUid
    : selectedUids[0];
  return {
    selectedUids,
    expandedUids,
    ...(focusedUid === undefined ? {} : { focusedUid }),
    ...(selectionAnchorUid === undefined ? {} : { selectionAnchorUid }),
  };
}
