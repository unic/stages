import { canPlaceStudioNode } from "../commands/engine";
import type { StudioCommand } from "../commands/types";
import { isStudioVariantCollection, type StudioFormDocument, type StudioNode, type Uid } from "../document/types";

export type StudioMoveDirection = "bottom" | "down" | "in" | "out" | "top" | "up";

export interface StudioNodePlacement {
  readonly parentUid: Uid | null;
  readonly index: number;
  readonly siblings: readonly Uid[];
}

function children(node: StudioNode): readonly Uid[] {
  if (node.kind === "wizard") return node.stageUids;
  if (node.kind === "collection") return isStudioVariantCollection(node) ? node.variantUids : node.childUids;
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") return node.childUids;
  return [];
}

export function locateStudioNode(form: StudioFormDocument, uid: Uid): StudioNodePlacement | undefined {
  const rootIndex = form.rootNodeUids.indexOf(uid);
  if (rootIndex >= 0) return { parentUid: null, index: rootIndex, siblings: form.rootNodeUids };
  for (const node of Object.values(form.nodes)) {
    const siblings = children(node);
    const index = siblings.indexOf(uid);
    if (index >= 0) return { parentUid: node.uid, index, siblings };
  }
  return undefined;
}

export function createStudioRelativeMoveCommand(
  form: StudioFormDocument,
  uid: Uid,
  direction: StudioMoveDirection,
): StudioCommand | undefined {
  const placement = locateStudioNode(form, uid);
  if (!placement) return undefined;
  if (direction === "in") {
    const previousUid = placement.siblings[placement.index - 1];
    const previous = previousUid === undefined ? undefined : form.nodes[previousUid];
    if (!previous || !canPlaceStudioNode(previous.kind, form.nodes[uid]!.kind)) return undefined;
    return {
      type: "node.move",
      formUid: form.uid,
      uid,
      parentUid: previous.uid,
      index: children(previous).length,
    };
  }
  if (direction === "out") {
    if (placement.parentUid === null) return undefined;
    const parentPlacement = locateStudioNode(form, placement.parentUid);
    if (!parentPlacement) return undefined;
    return {
      type: "node.move",
      formUid: form.uid,
      uid,
      parentUid: parentPlacement.parentUid,
      index: parentPlacement.index + 1,
    };
  }
  const lastIndex = placement.siblings.length - 1;
  const index = direction === "top" ? 0
    : direction === "bottom" ? lastIndex
      : direction === "up" ? Math.max(0, placement.index - 1)
        : Math.min(lastIndex, placement.index + 1);
  if (index === placement.index) return undefined;
  return { type: "node.move", formUid: form.uid, uid, parentUid: placement.parentUid, index };
}

export function createStudioDropCommand(
  form: StudioFormDocument,
  uid: Uid,
  targetUid: Uid,
): StudioCommand | undefined {
  if (uid === targetUid) return undefined;
  const source = form.nodes[uid];
  const target = form.nodes[targetUid];
  if (!source || !target) return undefined;
  const targetChildren = children(target);
  if (targetChildren.length > 0 || target.kind === "group" || target.kind === "collection" || target.kind === "wizard" || target.kind === "stage") {
    if (canPlaceStudioNode(target.kind, source.kind)) {
      return { type: "node.move", formUid: form.uid, uid, parentUid: target.uid, index: targetChildren.length };
    }
  }
  const placement = locateStudioNode(form, targetUid);
  if (!placement) return undefined;
  return { type: "node.move", formUid: form.uid, uid, parentUid: placement.parentUid, index: placement.index };
}
