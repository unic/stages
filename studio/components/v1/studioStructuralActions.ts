import type { Dispatch, SetStateAction } from "react";
import { copyStudioNodes, createStudioCutCommand, createStudioPasteCommand, type StudioNodeClipboard } from "../../src/commands/clipboard";
import { canPlaceStudioNode } from "../../src/commands/engine";
import { dispatchStudioCommand } from "../../src/commands/history";
import type { StudioCommand, StudioHistoryState } from "../../src/commands/types";
import { toUid } from "../../src/document/uid";
import { isStudioVariantCollection, type StudioFormDocument, type StudioNode, type Uid } from "../../src/document/types";
import {
  createStudioDropCommand,
  createStudioRelativeMoveCommand,
  locateStudioNode,
  type StudioMoveDirection,
  type StudioDropPosition,
  type StudioWorkbenchState,
} from "../../src/editor";

export interface StudioEditorNavigationState {
  readonly activeFormUid?: Uid;
  readonly clipboard?: StudioNodeClipboard;
  readonly workbench: StudioWorkbenchState;
}

interface StructuralActionOptions {
  readonly history: StudioHistoryState;
  readonly form: StudioFormDocument;
  readonly navigation: StudioEditorNavigationState;
  readonly replaceHistory: (history: StudioHistoryState) => void;
  readonly setNavigation: Dispatch<SetStateAction<StudioEditorNavigationState>>;
  readonly setStatus: Dispatch<SetStateAction<string>>;
}

function nodeChildren(node: StudioNode): readonly Uid[] {
  if (node.kind === "wizard") return node.stageUids;
  if (node.kind === "collection") return isStudioVariantCollection(node) ? node.variantUids : node.childUids;
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") return node.childUids;
  return [];
}

function nodeLabel(form: StudioFormDocument, uid: Uid): string {
  const node = form.nodes[uid];
  if (!node) return uid;
  const configured = (node.kind === "field" || node.kind === "block" ? node.props["label"] : undefined)
    ?? node.presentation?.["label"];
  if (typeof configured === "string" && configured.length > 0) return configured;
  return node.kind === "block" ? node.definition.key : node.runtimeId;
}

function nextProjectUid(project: StudioHistoryState["present"], seed: string, reserved: Set<string> = new Set()): Uid {
  const used = new Set<string>([project.project.uid]);
  for (const form of Object.values(project.forms)) {
    used.add(form.uid);
    form.scenarios.forEach(({ uid }) => used.add(uid));
    Object.keys(form.nodes).forEach((uid) => used.add(uid));
  }
  const prefix = seed.slice(0, 116);
  let suffix = 1;
  let candidate = `${prefix}_copy`;
  while (used.has(candidate) || reserved.has(candidate)) { suffix += 1; candidate = `${prefix}_copy_${suffix}`; }
  reserved.add(candidate);
  return toUid(candidate);
}

function uniqueSiblingRuntimeId(
  form: StudioFormDocument,
  parentUid: Uid | null,
  seed: string,
  reserved: Set<string> = new Set(),
): string {
  const siblingUids = parentUid === null ? form.rootNodeUids : nodeChildren(form.nodes[parentUid]!);
  const used = new Set(siblingUids.flatMap((uid) => {
    const node = form.nodes[uid];
    return node === undefined || node.kind === "block" ? [] : [node.runtimeId];
  }));
  let suffix = 1;
  let candidate = seed;
  while (used.has(candidate) || reserved.has(candidate)) { suffix += 1; candidate = `${seed}${suffix}`; }
  reserved.add(candidate);
  return candidate;
}

export function createStudioStructuralActions({
  history, form, navigation, replaceHistory, setNavigation, setStatus,
}: StructuralActionOptions) {
  const dispatch = (
    command: StudioCommand | undefined,
    label: string,
    announcement: string,
    nextSelectedUids?: readonly Uid[],
  ): boolean => {
    if (command === undefined) { setStatus(`${label} is not available here.`); return false; }
    const result = dispatchStudioCommand(history, command, { label });
    if (!result.ok) { setStatus(result.failure.message); return false; }
    replaceHistory(result.history);
    if (nextSelectedUids !== undefined) setNavigation((current) => ({
      ...current,
      workbench: {
        ...current.workbench,
        selectedUids: nextSelectedUids,
        ...(nextSelectedUids[0] === undefined ? {} : {
          focusedUid: nextSelectedUids[0], selectionAnchorUid: nextSelectedUids[0],
        }),
      },
    }));
    setStatus(announcement);
    return true;
  };

  const moveNode = (uid: Uid, direction: StudioMoveDirection) => {
    dispatch(createStudioRelativeMoveCommand(form, uid, direction), `Move ${direction}`, `${nodeLabel(form, uid)} moved ${direction}.`);
  };
  const dropNode = (uid: Uid, targetUid: Uid, position?: StudioDropPosition) => {
    const relation = position === "inside" ? "inside" : position;
    dispatch(
      createStudioDropCommand(form, uid, targetUid, position),
      "Move node",
      `${nodeLabel(form, uid)} moved${relation === undefined ? " to" : ` ${relation}`} ${nodeLabel(form, targetUid)}.`,
    );
  };
  const copyNodes = (uids: readonly Uid[]): StudioNodeClipboard | undefined => {
    const copied = copyStudioNodes(history.present, form.uid, uids);
    if (!copied.ok) { setStatus(copied.message); return undefined; }
    setNavigation((current) => ({ ...current, clipboard: copied.value }));
    setStatus(copied.value.rootUids.length === 1 ? "Node copied." : `${copied.value.rootUids.length} nodes copied.`);
    return copied.value;
  };
  const cutNodes = (uids: readonly Uid[]) => {
    const copied = copyStudioNodes(history.present, form.uid, uids);
    if (!copied.ok) { setStatus(copied.message); return; }
    if (dispatch(createStudioCutCommand(copied.value), "Cut nodes", copied.value.rootUids.length === 1 ? "Node cut." : `${copied.value.rootUids.length} nodes cut.`, [])) {
      setNavigation((current) => ({ ...current, clipboard: copied.value }));
    }
  };
  const pasteNodes = (targetUid: Uid) => {
    const clipboard = navigation.clipboard;
    if (!clipboard) { setStatus("Clipboard is empty."); return; }
    const target = form.nodes[targetUid];
    if (!target) { setStatus("Paste target does not exist."); return; }
    const roots = clipboard.rootUids.flatMap((uid) => clipboard.nodes[uid] ? [clipboard.nodes[uid]] : []);
    const targetChildren = nodeChildren(target);
    const inside = roots.length === clipboard.rootUids.length && roots.every((node) => canPlaceStudioNode(target.kind, node!.kind));
    const placement = locateStudioNode(form, targetUid);
    const destination = inside
      ? { formUid: form.uid, parentUid: targetUid, index: targetChildren.length }
      : placement && { formUid: form.uid, parentUid: placement.parentUid, index: placement.index + 1 };
    if (!destination) { setStatus("Paste target is unavailable."); return; }
    const reservedUids = new Set<string>();
    const uidMap = {} as Record<Uid, Uid>;
    for (const sourceUid of Object.keys(clipboard.nodes) as Uid[]) uidMap[sourceUid] = nextProjectUid(history.present, sourceUid, reservedUids);
    const reservedRuntimeIds = new Set<string>();
    const runtimeIdMap = {} as Partial<Record<Uid, string>>;
    for (const rootUid of clipboard.rootUids) {
      const root = clipboard.nodes[rootUid];
      if (root && root.kind !== "block") runtimeIdMap[rootUid] = uniqueSiblingRuntimeId(form, destination.parentUid, `${root.runtimeId}Copy`, reservedRuntimeIds);
    }
    const paste = createStudioPasteCommand(clipboard, destination, uidMap, runtimeIdMap);
    if (!paste.ok) { setStatus(paste.message); return; }
    const pastedRoots = clipboard.rootUids.map((uid) => uidMap[uid]!);
    dispatch(paste.value, "Paste nodes", pastedRoots.length === 1 ? "Node pasted." : `${pastedRoots.length} nodes pasted.`, pastedRoots);
  };
  const groupNodes = (uids: readonly Uid[]) => {
    const placement = uids[0] === undefined ? undefined : locateStudioNode(form, uids[0]);
    if (!placement) { setStatus(uids.length === 0 ? "Select nodes to group." : "The selection cannot be grouped."); return; }
    const wrapperUid = nextProjectUid(history.present, "group");
    const command: StudioCommand = {
      type: "node.wrap", formUid: form.uid, uids,
      wrapper: {
        uid: wrapperUid, kind: "group", runtimeId: uniqueSiblingRuntimeId(form, placement.parentUid, "group"),
        childUids: [], presentation: { label: "Group" },
      },
    };
    if (dispatch(command, "Group nodes", uids.length === 1 ? "Node grouped." : `${uids.length} nodes grouped.`, [wrapperUid])) {
      setNavigation((current) => ({
        ...current,
        workbench: { ...current.workbench, expandedUids: new Set([...current.workbench.expandedUids, wrapperUid]) },
      }));
    }
  };
  const ungroupNode = (uid: Uid) => {
    const node = form.nodes[uid];
    dispatch(
      { type: "node.unwrap", formUid: form.uid, uid },
      "Ungroup node",
      `${nodeLabel(form, uid)} ungrouped.`,
      node === undefined ? [] : nodeChildren(node),
    );
  };
  const convertNode = (uid: Uid, targetKind: "collection" | "group" | "wizard") => {
    const node = form.nodes[uid];
    if (!node) return;
    const stageUid = targetKind === "wizard" ? nextProjectUid(history.present, `${uid}_stage`) : undefined;
    const command: StudioCommand = {
      type: "node.convert", formUid: form.uid, uid, targetKind,
      ...(targetKind === "collection" ? { collection: { min: 1, initialRows: 1 } } : {}),
      ...(stageUid === undefined ? {} : {
        stage: { uid: stageUid, kind: "stage", runtimeId: "step1", childUids: [], presentation: { label: "Step 1" } },
      }),
    };
    if (dispatch(command, `Convert to ${targetKind}`, `${nodeLabel(form, uid)} converted to ${targetKind}.`, [uid]) && stageUid !== undefined) {
      setNavigation((current) => ({
        ...current,
        workbench: { ...current.workbench, expandedUids: new Set([...current.workbench.expandedUids, uid, stageUid]) },
      }));
    }
  };
  return { moveNode, dropNode, copyNodes, cutNodes, pasteNodes, groupNodes, ungroupNode, convertNode };
}
