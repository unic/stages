import type { StudioFormDocument, StudioNode, StudioProjectDocument, Uid } from "../document/types";
import { isUid } from "../document/uid";
import { isStudioVariantCollection } from "../document/types";
import type { StudioCommand, StudioCommandFailureCode } from "./types";

export interface StudioNodeClipboard {
  readonly sourceFormUid: Uid;
  readonly rootUids: readonly Uid[];
  readonly nodes: Readonly<Record<Uid, StudioNode>>;
  /** External reusable resources required before a paste can commit. */
  readonly dependencies: readonly Uid[];
}

export type StudioClipboardResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: StudioCommandFailureCode; readonly message: string; readonly entityUid?: Uid };

function children(node: StudioNode): readonly Uid[] {
  if (node.kind === "wizard") return node.stageUids;
  if (node.kind === "collection") return isStudioVariantCollection(node) ? node.variantUids : node.childUids;
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") return node.childUids;
  return [];
}

function documentOrder(form: StudioFormDocument): readonly Uid[] {
  const ordered: Uid[] = [];
  const visit = (uid: Uid) => {
    const node = form.nodes[uid];
    if (!node) return;
    ordered.push(uid);
    children(node).forEach(visit);
  };
  form.rootNodeUids.forEach(visit);
  return ordered;
}

export function copyStudioNodes(
  project: StudioProjectDocument,
  formUid: Uid,
  selectedUids: readonly Uid[],
): StudioClipboardResult<StudioNodeClipboard> {
  const form = project.forms[formUid];
  if (!form) return { ok: false, code: "command.form-not-found", message: `Form ${formUid} does not exist.` };
  const selected = new Set(selectedUids);
  if (selected.size === 0) return { ok: false, code: "command.node-not-found", message: "Copy requires at least one node." };
  for (const uid of selected) {
    if (!form.nodes[uid]) return { ok: false, code: "command.node-not-found", message: `Node ${uid} does not exist.`, entityUid: uid };
  }
  const included = new Set<Uid>();
  const roots: Uid[] = [];
  const visit = (uid: Uid) => {
    if (included.has(uid)) return;
    included.add(uid);
    const node = form.nodes[uid];
    if (node) children(node).forEach(visit);
  };
  const parentByUid = new Map<Uid, Uid>();
  for (const node of Object.values(form.nodes)) {
    for (const childUid of children(node)) parentByUid.set(childUid, node.uid);
  }
  for (const uid of documentOrder(form)) {
    if (!selected.has(uid)) continue;
    let ancestor = parentByUid.get(uid);
    let nestedSelection = false;
    while (ancestor !== undefined) {
      if (selected.has(ancestor)) { nestedSelection = true; break; }
      ancestor = parentByUid.get(ancestor);
    }
    if (!nestedSelection) { roots.push(uid); visit(uid); }
  }
  const nodes = {} as Record<Uid, StudioNode>;
  const dependencies = new Set<Uid>();
  for (const uid of included) {
    const node = form.nodes[uid];
    if (node) {
      nodes[uid] = structuredClone(node);
      if (node.kind === "fragment") dependencies.add(node.fragmentUid);
    }
  }
  return {
    ok: true,
    value: { sourceFormUid: formUid, rootUids: roots, nodes, dependencies: [...dependencies] },
  };
}

export function createStudioCutCommand(clipboard: StudioNodeClipboard): StudioCommand {
  return {
    type: "transaction",
    label: clipboard.rootUids.length === 1 ? "Cut node" : `Cut ${clipboard.rootUids.length} nodes`,
    commands: clipboard.rootUids.map((uid) => ({ type: "node.delete", formUid: clipboard.sourceFormUid, uid })),
  };
}

export function createStudioPasteCommand(
  clipboard: StudioNodeClipboard,
  destination: { readonly formUid: Uid; readonly parentUid: Uid | null; readonly index: number },
  uidMap: Readonly<Record<Uid, Uid>>,
  runtimeIdMap: Readonly<Partial<Record<Uid, string>>> = {},
): StudioClipboardResult<StudioCommand> {
  if (clipboard.dependencies.length > 0) return {
    ok: false,
    code: "command.unresolved-clipboard-dependency",
    message: `Clipboard has unresolved dependencies: ${clipboard.dependencies.join(", ")}.`,
    entityUid: clipboard.dependencies[0]!,
  };
  const sourceUids = Object.keys(clipboard.nodes) as Uid[];
  const targetUids = sourceUids.map((uid) => uidMap[uid]);
  if (sourceUids.some((uid) => !isUid(uidMap[uid])) || new Set(targetUids).size !== sourceUids.length) return {
    ok: false,
    code: "command.invalid-uid-map",
    message: "Paste requires one unique safe replacement UID for every copied node.",
  };
  const nodes = {} as Record<Uid, StudioNode>;
  for (const sourceUid of sourceUids) {
    const source = clipboard.nodes[sourceUid];
    const targetUid = uidMap[sourceUid];
    if (!source || !targetUid) continue;
    let copy: StudioNode;
    if (source.kind === "wizard") copy = {
      ...source,
      uid: targetUid,
      stageUids: source.stageUids.map((uid) => uidMap[uid] as Uid),
      ...(source.initialStageUid === undefined ? {} : { initialStageUid: uidMap[source.initialStageUid] as Uid }),
    };
    else if (source.kind === "collection" && isStudioVariantCollection(source)) copy = {
      ...source,
      uid: targetUid,
      variantUids: source.variantUids.map((uid) => uidMap[uid] as Uid),
      ...(source.initialVariantUid === undefined ? {} : { initialVariantUid: uidMap[source.initialVariantUid] as Uid }),
    };
    else if (source.kind === "group" || source.kind === "collection" || source.kind === "stage" || source.kind === "variant") {
      copy = { ...source, uid: targetUid, childUids: source.childUids.map((uid) => uidMap[uid] as Uid) };
    } else copy = { ...source, uid: targetUid };
    const runtimeId = runtimeIdMap[sourceUid];
    if (runtimeId !== undefined && copy.kind !== "block") copy = { ...copy, runtimeId };
    nodes[targetUid] = copy;
  }
  return {
    ok: true,
    value: {
      type: "node.insert-subtree",
      formUid: destination.formUid,
      parentUid: destination.parentUid,
      index: destination.index,
      rootUids: clipboard.rootUids.map((uid) => uidMap[uid] as Uid),
      nodes,
    },
  };
}
