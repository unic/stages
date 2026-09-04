import { isStudioVariantCollection, type StudioNode, type StudioProjectDocument, type Uid } from "../document/types";

export interface StudioOutlineItem {
  readonly uid: Uid;
  readonly formUid: Uid;
  readonly kind: "form" | StudioNode["kind"];
  readonly label: string;
  readonly children: readonly Uid[];
}

export interface StudioOutlineModel {
  readonly roots: readonly Uid[];
  readonly items: ReadonlyMap<Uid, StudioOutlineItem>;
  readonly parentByUid: ReadonlyMap<Uid, Uid | undefined>;
}

function childUids(node: StudioNode): readonly Uid[] {
  if (node.kind === "wizard") return node.stageUids;
  if (node.kind === "collection") return isStudioVariantCollection(node) ? node.variantUids : node.childUids;
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") return node.childUids;
  return [];
}

function nodeLabel(node: StudioNode): string {
  const configured = (node.kind === "field" || node.kind === "block" ? node.props["label"] : undefined)
    ?? node.presentation?.["label"];
  if (typeof configured === "string" && configured.length > 0) return configured;
  return node.kind === "block" ? node.definition.key : node.runtimeId;
}

export function createStudioOutlineModel(project: StudioProjectDocument): StudioOutlineModel {
  const items = new Map<Uid, StudioOutlineItem>();
  const parentByUid = new Map<Uid, Uid | undefined>();
  const roots: Uid[] = [];
  for (const form of Object.values(project.forms)) {
    roots.push(form.uid);
    items.set(form.uid, { uid: form.uid, formUid: form.uid, kind: "form", label: form.title, children: form.rootNodeUids });
    parentByUid.set(form.uid, undefined);
    for (const node of Object.values(form.nodes)) {
      items.set(node.uid, {
        uid: node.uid,
        formUid: form.uid,
        kind: node.kind,
        label: nodeLabel(node),
        children: childUids(node),
      });
      for (const childUid of childUids(node)) parentByUid.set(childUid, node.uid);
    }
    for (const rootUid of form.rootNodeUids) parentByUid.set(rootUid, form.uid);
  }
  return { roots, items, parentByUid };
}

export function visibleStudioOutlineUids(
  model: StudioOutlineModel,
  expandedUids: ReadonlySet<Uid>,
): readonly Uid[] {
  const visible: Uid[] = [];
  const visit = (uid: Uid) => {
    const item = model.items.get(uid);
    if (!item) return;
    visible.push(uid);
    if (expandedUids.has(uid)) item.children.forEach(visit);
  };
  model.roots.forEach(visit);
  return visible;
}
