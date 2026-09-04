import { isSafeObjectKey, isStudioVariantCollection, isUid } from "../document";
import type { StudioFormDocument, StudioFragmentDefinition, StudioFragmentNodeOverride, StudioNode, StudioProjectDocument, Uid } from "../document";
import type {
  StudioCommand,
  StudioCommandFailure,
  StudioCommandFailureCode,
  StudioCommandResult,
} from "./types";

const UPDATE_KEYS = new Set([
  "runtimeId", "definition", "props", "presentation", "behavior", "legacy",
  "computed", "derivedProps", "validators", "min", "max", "initialRows", "itemKey",
  "discriminator", "initialVariantUid", "initialStageUid", "navigation",
  "fragmentUid", "overrides",
]);

export type StudioPlacementParentKind = StudioNode["kind"] | "root";

/** The current document-v1 structural compatibility matrix. */
export function canPlaceStudioNode(
  parentKind: StudioPlacementParentKind,
  childKind: StudioNode["kind"],
): boolean {
  if (parentKind === "field" || parentKind === "block") return false;
  if (parentKind === "wizard") return childKind === "stage";
  if (parentKind === "collection") return childKind !== "stage";
  return childKind !== "stage" && childKind !== "variant";
}

function fail(
  code: StudioCommandFailureCode,
  message: string,
  commandPath: readonly number[],
  details: { readonly formUid?: Uid; readonly entityUid?: Uid } = {},
): { readonly ok: false; readonly failure: StudioCommandFailure } {
  return { ok: false, failure: { code, message, commandPath, ...details } };
}

function children(node: StudioNode): readonly Uid[] {
  if (node.kind === "wizard") return node.stageUids;
  if (node.kind === "collection") return isStudioVariantCollection(node) ? node.variantUids : node.childUids;
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") return node.childUids;
  return [];
}

function withChildren(node: StudioNode, next: readonly Uid[]): StudioNode {
  if (node.kind === "wizard") return { ...node, stageUids: next };
  if (node.kind === "collection") return isStudioVariantCollection(node)
    ? { ...node, variantUids: next }
    : { ...node, childUids: next };
  if (node.kind === "group" || node.kind === "stage" || node.kind === "variant") {
    return { ...node, childUids: next };
  }
  return node;
}

function placementList(
  form: StudioFormDocument,
  parentUid: Uid | null,
  commandPath: readonly number[],
): { readonly ok: true; readonly list: readonly Uid[]; readonly parent?: StudioNode }
  | { readonly ok: false; readonly failure: StudioCommandFailure } {
  if (parentUid === null) return { ok: true, list: form.rootNodeUids };
  const parent = form.nodes[parentUid];
  if (!parent) return fail("command.invalid-parent", `Parent ${parentUid} does not exist.`, commandPath, {
    formUid: form.uid, entityUid: parentUid,
  });
  if (parent.kind === "field" || parent.kind === "block") {
    return fail("command.invalid-parent", `Node ${parentUid} cannot contain children.`, commandPath, {
      formUid: form.uid, entityUid: parentUid,
    });
  }
  return { ok: true, list: children(parent), parent };
}

function incompatiblePlacement(
  form: StudioFormDocument,
  parentUid: Uid | null,
  node: StudioNode,
  commandPath: readonly number[],
): { readonly ok: false; readonly failure: StudioCommandFailure } | undefined {
  const parentKind = parentUid === null ? "root" : form.nodes[parentUid]?.kind;
  const parent = parentUid === null ? undefined : form.nodes[parentUid];
  const collectionCompatible = parent?.kind !== "collection"
    || (isStudioVariantCollection(parent) ? node.kind === "variant" : node.kind !== "variant");
  if (parentKind !== undefined && canPlaceStudioNode(parentKind, node.kind) && collectionCompatible) return undefined;
  return fail(
    "command.incompatible-placement",
    `${node.kind} node ${node.uid} cannot be placed ${parentUid === null ? "at the form root" : `inside ${parentUid}`}.`,
    commandPath,
    { formUid: form.uid, entityUid: node.uid },
  );
}

function parentMap(form: StudioFormDocument): Map<Uid, Uid | null> {
  const output = new Map<Uid, Uid | null>();
  for (const uid of form.rootNodeUids) output.set(uid, null);
  for (const node of Object.values(form.nodes)) {
    for (const uid of children(node)) output.set(uid, node.uid);
  }
  return output;
}

function replacePlacement(
  form: StudioFormDocument,
  parentUid: Uid | null,
  list: readonly Uid[],
): StudioFormDocument {
  if (parentUid === null) return { ...form, rootNodeUids: list };
  const parent = form.nodes[parentUid];
  if (!parent) return form;
  return { ...form, nodes: { ...form.nodes, [parentUid]: withChildren(parent, list) } };
}

function replaceForm(project: StudioProjectDocument, form: StudioFormDocument): StudioProjectDocument {
  return { ...project, forms: { ...project.forms, [form.uid]: form } };
}

function projectHasUid(project: StudioProjectDocument, uid: Uid): boolean {
  return project.project.uid === uid
    || project.forms[uid] !== undefined
    || project.fragments[uid] !== undefined
    || Object.values(project.forms).some((form) => form.nodes[uid] !== undefined || form.scenarios.some((scenario) => scenario.uid === uid))
    || Object.values(project.fragments).some((fragment) => fragment.nodes[uid] !== undefined);
}

function remapDetachedNode(
  source: StudioNode,
  targetUid: Uid,
  uidMap: Readonly<Record<Uid, Uid>>,
  override?: StudioFragmentNodeOverride,
): StudioNode {
  let copy = withChildren({
    ...source,
    uid: targetUid,
    ...(override?.runtimeId === undefined || source.kind === "block" ? {} : { runtimeId: override.runtimeId }),
    ...(override?.props === undefined || (source.kind !== "field" && source.kind !== "block") ? {} : { props: { ...source.props, ...override.props } }),
    ...(override?.presentation === undefined ? {} : { presentation: { ...source.presentation, ...override.presentation } }),
  }, children(source).map((uid) => uidMap[uid] ?? uid));
  if (copy.kind === "wizard" && copy.initialStageUid !== undefined) copy = { ...copy, initialStageUid: uidMap[copy.initialStageUid] ?? copy.initialStageUid };
  if (copy.kind === "collection" && isStudioVariantCollection(copy) && copy.initialVariantUid !== undefined) copy = { ...copy, initialVariantUid: uidMap[copy.initialVariantUid] ?? copy.initialVariantUid };
  return copy;
}

function fragmentAsForm(fragment: StudioFragmentDefinition): StudioFormDocument {
  return {
    uid: fragment.uid,
    title: fragment.title,
    runtime: { schemaId: fragment.uid, schemaVersion: fragment.version },
    rootNodeUids: fragment.rootNodeUids,
    nodes: fragment.nodes,
    scenarios: [],
    settings: {},
  };
}

function fragmentDependencyFailure(
  project: StudioProjectDocument,
  commandPath: readonly number[],
): StudioCommandFailure | undefined {
  const visiting = new Set<Uid>();
  const visited = new Set<Uid>();
  const visit = (uid: Uid): StudioCommandFailure | undefined => {
    if (visiting.has(uid)) return fail("command.invariant", `Fragment graph contains a cycle through ${uid}.`, commandPath, { entityUid: uid }).failure;
    if (visited.has(uid)) return undefined;
    const fragment = project.fragments[uid];
    if (!fragment) return fail("command.fragment-not-found", `Fragment ${uid} does not exist.`, commandPath, { entityUid: uid }).failure;
    visiting.add(uid);
    for (const node of Object.values(fragment.nodes)) if (node.kind === "fragment") {
      const failure = visit(node.fragmentUid);
      if (failure) return failure;
    }
    visiting.delete(uid);
    visited.add(uid);
    return undefined;
  };
  for (const uid of Object.keys(project.fragments) as Uid[]) {
    const failure = visit(uid);
    if (failure) return failure;
  }
  return undefined;
}

function subtreeUids(form: StudioFormDocument, rootUid: Uid): Uid[] {
  const output: Uid[] = [];
  const stack = [rootUid];
  while (stack.length > 0) {
    const uid = stack.pop();
    if (!uid) continue;
    output.push(uid);
    const node = form.nodes[uid];
    if (node) stack.push(...[...children(node)].reverse());
  }
  return output;
}

function invariantFailure(form: StudioFormDocument, commandPath: readonly number[]): StudioCommandFailure | undefined {
  const seen = new Set<Uid>();
  const visiting = new Set<Uid>();
  const runtimeIds = (uids: readonly Uid[], parentUid?: Uid): StudioCommandFailure | undefined => {
    const ids = new Set<string>();
    for (const uid of uids) {
      const node = form.nodes[uid];
      if (!node || node.kind === "block") continue;
      if (!isSafeObjectKey(node.runtimeId) || node.runtimeId.length === 0 || node.runtimeId.length > 128) {
        return fail("command.invariant", `Node ${uid} has an invalid runtime ID.`, commandPath, {
          formUid: form.uid, entityUid: uid,
        }).failure;
      }
      if (ids.has(node.runtimeId)) return fail(
        "command.invariant",
        `Sibling runtime ID ${node.runtimeId} is duplicated${parentUid ? ` under ${parentUid}` : " at the form root"}.`,
        commandPath,
        { formUid: form.uid, entityUid: uid },
      ).failure;
      ids.add(node.runtimeId);
    }
    return undefined;
  };
  const rootIds = runtimeIds(form.rootNodeUids);
  if (rootIds) return rootIds;
  const walk = (uid: Uid, parentKind: StudioNode["kind"] | "root"): StudioCommandFailure | undefined => {
    const node = form.nodes[uid];
    if (!node) return fail("command.invariant", `Reference ${uid} does not resolve.`, commandPath, {
      formUid: form.uid, entityUid: uid,
    }).failure;
    if (visiting.has(uid)) return fail("command.invariant", `Node graph contains a cycle at ${uid}.`, commandPath, {
      formUid: form.uid, entityUid: uid,
    }).failure;
    if (seen.has(uid)) return fail("command.invariant", `Node ${uid} has more than one parent.`, commandPath, {
      formUid: form.uid, entityUid: uid,
    }).failure;
    if ((node.kind === "stage") !== (parentKind === "wizard")) return fail(
      "command.invariant",
      node.kind === "stage" ? `Stage ${uid} must be a wizard child.` : `Wizard children must be stages; received ${uid}.`,
      commandPath,
      { formUid: form.uid, entityUid: uid },
    ).failure;
    if (node.kind === "variant" && parentKind !== "collection") return fail(
      "command.invariant",
      `Variant ${uid} must be a discriminated collection child.`,
      commandPath,
      { formUid: form.uid, entityUid: uid },
    ).failure;
    if (node.kind === "collection") {
      const isDiscriminated = isStudioVariantCollection(node);
      if (isDiscriminated !== (node.discriminator !== undefined)) return fail(
        "command.invariant", `Collection ${uid} must define exactly one homogeneous or discriminated shape.`, commandPath,
        { formUid: form.uid, entityUid: uid },
      ).failure;
      const invalidChild = children(node).find((childUid) => (
        form.nodes[childUid]?.kind === "variant"
      ) !== isDiscriminated);
      if (invalidChild !== undefined) return fail(
        "command.invariant",
        isDiscriminated
          ? `Discriminated collection children must be variants; received ${invalidChild}.`
          : `Homogeneous collection children cannot be variants; received ${invalidChild}.`,
        commandPath,
        { formUid: form.uid, entityUid: invalidChild },
      ).failure;
      if (node.min !== undefined && node.max !== undefined && node.min > node.max) return fail(
        "command.invariant", `Collection ${uid} has min greater than max.`, commandPath,
        { formUid: form.uid, entityUid: uid },
      ).failure;
      if (node.initialRows !== undefined
        && node.max !== undefined && node.initialRows > node.max) return fail(
        "command.invariant", `Collection ${uid} initial rows cannot exceed max.`, commandPath,
        { formUid: form.uid, entityUid: uid },
      ).failure;
      if (isDiscriminated && node.initialVariantUid !== undefined && !node.variantUids.includes(node.initialVariantUid)) return fail(
        "command.invariant", `Collection ${uid} initial variant must reference one of its variants.`, commandPath,
        { formUid: form.uid, entityUid: uid },
      ).failure;
      if (isDiscriminated && (node.initialRows ?? 0) > 0 && node.initialVariantUid === undefined) return fail(
        "command.invariant", `Collection ${uid} requires an initial variant when it creates initial rows.`, commandPath,
        { formUid: form.uid, entityUid: uid },
      ).failure;
    }
    if (node.kind === "wizard" && node.initialStageUid !== undefined && !node.stageUids.includes(node.initialStageUid)) return fail(
      "command.invariant", `Wizard ${uid} initial stage must reference one of its stages.`, commandPath,
      { formUid: form.uid, entityUid: uid },
    ).failure;
    seen.add(uid);
    visiting.add(uid);
    const childIds = runtimeIds(children(node), uid);
    if (childIds) return childIds;
    for (const childUid of children(node)) {
      const childFailure = walk(childUid, node.kind);
      if (childFailure) return childFailure;
    }
    visiting.delete(uid);
    return undefined;
  };
  for (const uid of form.rootNodeUids) {
    const failure = walk(uid, "root");
    if (failure) return failure;
  }
  for (const key of Object.keys(form.nodes)) {
    if (!isUid(key) || !seen.has(key)) return fail("command.invariant", `Node ${key} is unreachable.`, commandPath, {
      formUid: form.uid, ...(isUid(key) ? { entityUid: key } : {}),
    }).failure;
    if (form.nodes[key]?.uid !== key) return fail("command.invariant", `Node key ${key} does not match its UID.`, commandPath, {
      formUid: form.uid, entityUid: key,
    }).failure;
  }
  return undefined;
}

function commit(
  project: StudioProjectDocument,
  form: StudioFormDocument,
  affectedUids: readonly Uid[],
  commandPath: readonly number[],
): StudioCommandResult {
  const failure = invariantFailure(form, commandPath);
  if (failure) return { ok: false, failure };
  return { ok: true, document: replaceForm(project, form), affectedUids: [...new Set(affectedUids)], changed: true };
}

function executeSingle(
  project: StudioProjectDocument,
  command: Exclude<StudioCommand, { readonly type: "transaction" }>,
  commandPath: readonly number[],
): StudioCommandResult {
  if (command.type === "fragment.update" || command.type === "fragment.node.update") {
    const fragment = project.fragments[command.fragmentUid];
    if (!fragment) return fail("command.fragment-not-found", `Fragment ${command.fragmentUid} does not exist.`, commandPath, { entityUid: command.fragmentUid });
    if (command.type === "fragment.update") {
      const keys = Object.keys(command.changes);
      if (keys.length === 0 || keys.every((key) => Object.is((fragment as unknown as Record<string, unknown>)[key], command.changes[key as keyof typeof command.changes]))) {
        return { ok: true, document: project, affectedUids: [], changed: false };
      }
      const next = { ...fragment, ...command.changes };
      if (typeof next.title !== "string" || !Number.isSafeInteger(next.version) || next.version < 1
        || !Array.isArray(next.parameters) || next.parameters.some((parameter) => !isSafeObjectKey(parameter))) {
        return fail("command.invalid-update", "Fragment metadata is invalid.", commandPath, { entityUid: fragment.uid });
      }
      return { ok: true, document: { ...project, fragments: { ...project.fragments, [fragment.uid]: next } }, affectedUids: [fragment.uid], changed: true };
    }
    const node = fragment.nodes[command.uid];
    if (!node) return fail("command.node-not-found", `Fragment node ${command.uid} does not exist.`, commandPath, { entityUid: command.uid });
    const keys = Object.keys(command.changes);
    if (keys.some((key) => !UPDATE_KEYS.has(key))) return fail("command.invalid-update", "Fragment node updates may change editable properties only.", commandPath, { entityUid: command.uid });
    const record = { ...node } as unknown as Record<string, unknown>;
    for (const key of keys) command.changes[key] === undefined ? delete record[key] : record[key] = command.changes[key];
    const nextFragment = { ...fragment, nodes: { ...fragment.nodes, [command.uid]: record as unknown as StudioNode } };
    const invariant = invariantFailure(fragmentAsForm(nextFragment), commandPath);
    if (invariant) return { ok: false, failure: invariant };
    const nextProject = { ...project, fragments: { ...project.fragments, [fragment.uid]: nextFragment } };
    const dependencyFailure = fragmentDependencyFailure(nextProject, commandPath);
    if (dependencyFailure) return { ok: false, failure: dependencyFailure };
    return { ok: true, document: nextProject, affectedUids: [fragment.uid, command.uid], changed: true };
  }

  if (command.type === "fragment.insert") return executeSingle(project, {
    type: "node.insert",
    formUid: command.formUid,
    parentUid: command.parentUid,
    index: command.index,
    node: command.instance,
  }, commandPath);

  const form = project.forms[command.formUid];
  if (!form) return fail("command.form-not-found", `Form ${command.formUid} does not exist.`, commandPath, {
    formUid: command.formUid,
  });

  if (command.type === "scenario.insert") {
    if (projectHasUid(project, command.scenario.uid)) return fail("command.uid-conflict", `UID ${command.scenario.uid} is already in use.`, commandPath, { formUid: form.uid, entityUid: command.scenario.uid });
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > form.scenarios.length) return fail("command.index-out-of-bounds", `Scenario index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
    const scenarios = [...form.scenarios];
    scenarios.splice(command.index, 0, command.scenario);
    return { ok: true, document: replaceForm(project, { ...form, scenarios }), affectedUids: [command.scenario.uid], changed: true };
  }

  if (command.type === "scenario.update") {
    const index = form.scenarios.findIndex(({ uid }) => uid === command.uid);
    if (index < 0) return fail("command.scenario-not-found", `Scenario ${command.uid} does not exist.`, commandPath, { formUid: form.uid, entityUid: command.uid });
    const keys = Object.keys(command.changes);
    if (keys.length === 0) return { ok: true, document: project, affectedUids: [], changed: false };
    const current = form.scenarios[index]!;
    const next = { ...current, ...command.changes };
    const scenarios = [...form.scenarios];
    scenarios[index] = next;
    return { ok: true, document: replaceForm(project, { ...form, scenarios }), affectedUids: [command.uid], changed: true };
  }

  if (command.type === "fragment.create") {
    if (projectHasUid(project, command.fragment.uid)) return fail("command.uid-conflict", `Fragment UID ${command.fragment.uid} is already in use.`, commandPath, { entityUid: command.fragment.uid });
    if (command.instance.fragmentUid !== command.fragment.uid || projectHasUid(project, command.instance.uid)) return fail("command.uid-conflict", "The new instance must reference the new fragment and use a free UID.", commandPath, { formUid: form.uid, entityUid: command.instance.uid });
    if (command.uids.length === 0 || new Set(command.uids).size !== command.uids.length) return fail("command.non-contiguous-selection", "Creating a fragment requires unique sibling nodes.", commandPath, { formUid: form.uid });
    const parents = parentMap(form);
    const parentUid = parents.get(command.uids[0]!);
    if (parentUid === undefined || command.uids.some((uid) => parents.get(uid) !== parentUid)) return fail("command.non-contiguous-selection", "Fragment roots must share a parent.", commandPath, { formUid: form.uid });
    const placement = placementList(form, parentUid, commandPath);
    if (!placement.ok) return placement;
    const selected = new Set(command.uids);
    const ordered = placement.list.filter((uid) => selected.has(uid));
    const index = placement.list.indexOf(ordered[0]!);
    if (ordered.length !== command.uids.length || placement.list.slice(index, index + ordered.length).some((uid) => !selected.has(uid))) return fail("command.non-contiguous-selection", "Fragment roots must be contiguous siblings.", commandPath, { formUid: form.uid });
    const movedUids = ordered.flatMap((uid) => subtreeUids(form, uid));
    const fragmentNodes = {} as Record<Uid, StudioNode>;
    const remainingNodes = { ...form.nodes } as Record<Uid, StudioNode>;
    for (const uid of movedUids) {
      const moved = form.nodes[uid];
      if (moved) fragmentNodes[uid] = moved;
      delete remainingNodes[uid];
    }
    const fragment: StudioFragmentDefinition = { ...command.fragment, rootNodeUids: ordered, nodes: fragmentNodes };
    const fragmentFailure = invariantFailure(fragmentAsForm(fragment), commandPath);
    if (fragmentFailure) return { ok: false, failure: fragmentFailure };
    const list = [...placement.list];
    list.splice(index, ordered.length, command.instance.uid);
    const withInstance = { ...form, nodes: { ...remainingNodes, [command.instance.uid]: command.instance } };
    const nextForm = replacePlacement(withInstance, parentUid, list);
    const formFailure = invariantFailure(nextForm, commandPath);
    if (formFailure) return { ok: false, failure: formFailure };
    return {
      ok: true,
      document: { ...replaceForm(project, nextForm), fragments: { ...project.fragments, [fragment.uid]: fragment } },
      affectedUids: [fragment.uid, command.instance.uid, ...movedUids, ...(parentUid ? [parentUid] : [])],
      changed: true,
    };
  }

  if (command.type === "fragment.detach") {
    const instance = form.nodes[command.uid];
    if (!instance) return fail("command.node-not-found", `Node ${command.uid} does not exist.`, commandPath, { formUid: form.uid, entityUid: command.uid });
    if (instance.kind !== "fragment") return fail("command.invalid-update", `Node ${command.uid} is not a fragment instance.`, commandPath, { formUid: form.uid, entityUid: command.uid });
    const fragment = project.fragments[instance.fragmentUid];
    if (!fragment) return fail("command.fragment-not-found", `Fragment ${instance.fragmentUid} does not exist.`, commandPath, { formUid: form.uid, entityUid: instance.fragmentUid });
    const sourceUids = Object.keys(fragment.nodes) as Uid[];
    const mapped = sourceUids.map((uid) => command.uidMap[uid]);
    if (sourceUids.some((uid) => !isUid(command.uidMap[uid])) || Object.keys(command.uidMap).length !== sourceUids.length || new Set(mapped).size !== sourceUids.length) return fail("command.invalid-uid-map", "Detach requires one unique replacement UID for every fragment node.", commandPath, { formUid: form.uid, entityUid: instance.uid });
    const conflict = mapped.find((uid) => uid !== undefined && projectHasUid(project, uid));
    if (conflict) return fail("command.uid-conflict", `UID ${conflict} is already in use.`, commandPath, { formUid: form.uid, entityUid: conflict });
    const nodes = { ...form.nodes } as Record<Uid, StudioNode>;
    for (const sourceUid of sourceUids) {
      const source = fragment.nodes[sourceUid];
      const targetUid = command.uidMap[sourceUid];
      if (source && targetUid) nodes[targetUid] = remapDetachedNode(source, targetUid, command.uidMap, instance.overrides?.[sourceUid]);
    }
    nodes[instance.uid] = {
      uid: instance.uid,
      kind: "group",
      runtimeId: instance.runtimeId,
      childUids: fragment.rootNodeUids.map((uid) => command.uidMap[uid]!).filter(Boolean),
      ...(instance.presentation === undefined ? {} : { presentation: instance.presentation }),
      ...(instance.behavior === undefined ? {} : { behavior: instance.behavior }),
      ...(instance.legacy === undefined ? {} : { legacy: instance.legacy }),
    };
    return commit(project, { ...form, nodes }, [instance.uid, ...mapped.filter((uid): uid is Uid => uid !== undefined)], commandPath);
  }

  if (command.type === "node.insert") {
    if (command.node.kind === "fragment" && project.fragments[command.node.fragmentUid] === undefined) return fail("command.fragment-not-found", `Fragment ${command.node.fragmentUid} does not exist.`, commandPath, { formUid: form.uid, entityUid: command.node.fragmentUid });
    if (projectHasUid(project, command.node.uid)) return fail("command.uid-conflict", `UID ${command.node.uid} is already in use.`, commandPath, {
      formUid: form.uid, entityUid: command.node.uid,
    });
    const placement = placementList(form, command.parentUid, commandPath);
    if (!placement.ok) return placement;
    const incompatible = incompatiblePlacement(form, command.parentUid, command.node, commandPath);
    if (incompatible) return incompatible;
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > placement.list.length) {
      return fail("command.index-out-of-bounds", `Insert index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
    }
    const list = [...placement.list];
    list.splice(command.index, 0, command.node.uid);
    const withNode = { ...form, nodes: { ...form.nodes, [command.node.uid]: command.node } };
    const next = replacePlacement(withNode, command.parentUid, list);
    return commit(project, next, [command.node.uid, ...(command.parentUid ? [command.parentUid] : [])], commandPath);
  }

  if (command.type === "node.insert-subtree") {
    if (command.rootUids.length === 0) return fail(
      "command.unresolved-clipboard-dependency", "A pasted subtree must contain at least one root.", commandPath, { formUid: form.uid },
    );
    const nodeEntries = Object.entries(command.nodes) as Array<[Uid, StudioNode]>;
    const malformed = nodeEntries.find(([uid, node]) => uid !== node.uid);
    const missingRoot = command.rootUids.find((uid) => command.nodes[uid] === undefined);
    const unresolvedChild = nodeEntries.flatMap(([, node]) => children(node)).find((uid) => command.nodes[uid] === undefined);
    const unresolvedFragmentUid = nodeEntries.flatMap(([, node]) => node.kind === "fragment" && project.fragments[node.fragmentUid] === undefined ? [node.fragmentUid] : [])[0];
    const unresolvedUid = missingRoot ?? unresolvedChild;
    if (malformed || missingRoot || unresolvedChild || unresolvedFragmentUid || new Set(command.rootUids).size !== command.rootUids.length) return fail(
      "command.unresolved-clipboard-dependency",
      "Pasted nodes must be a self-contained graph with matching UID keys and unique roots.",
      commandPath,
      {
        formUid: form.uid,
        ...(unresolvedUid === undefined && unresolvedFragmentUid === undefined ? {} : { entityUid: unresolvedUid ?? unresolvedFragmentUid }),
      },
    );
    const conflict = nodeEntries.find(([uid]) => form.nodes[uid] !== undefined)?.[0];
    if (conflict !== undefined) return fail("command.uid-conflict", `UID ${conflict} is already in use.`, commandPath, {
      formUid: form.uid, entityUid: conflict,
    });
    const placement = placementList(form, command.parentUid, commandPath);
    if (!placement.ok) return placement;
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > placement.list.length) {
      return fail("command.index-out-of-bounds", `Insert index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
    }
    for (const rootUid of command.rootUids) {
      const root = command.nodes[rootUid];
      if (!root) continue;
      const incompatible = incompatiblePlacement(form, command.parentUid, root, commandPath);
      if (incompatible) return incompatible;
    }
    const list = [...placement.list];
    list.splice(command.index, 0, ...command.rootUids);
    const withNodes = { ...form, nodes: { ...form.nodes, ...command.nodes } };
    const next = replacePlacement(withNodes, command.parentUid, list);
    return commit(
      project,
      next,
      [...nodeEntries.map(([uid]) => uid), ...(command.parentUid ? [command.parentUid] : [])],
      commandPath,
    );
  }

  if (command.type === "node.wrap") {
    if (command.uids.length === 0 || new Set(command.uids).size !== command.uids.length) return fail(
      "command.non-contiguous-selection", "Wrap requires one or more unique sibling nodes.", commandPath, { formUid: form.uid },
    );
    if (form.nodes[command.wrapper.uid]) return fail("command.uid-conflict", `UID ${command.wrapper.uid} is already in use.`, commandPath, {
      formUid: form.uid, entityUid: command.wrapper.uid,
    });
    const parents = parentMap(form);
    const firstUid = command.uids[0]!;
    const parentUid = parents.get(firstUid);
    if (parentUid === undefined || command.uids.some((uid) => !form.nodes[uid] || parents.get(uid) !== parentUid)) return fail(
      "command.non-contiguous-selection", "Wrapped nodes must exist under the same parent.", commandPath, { formUid: form.uid, entityUid: firstUid },
    );
    const placement = placementList(form, parentUid, commandPath);
    if (!placement.ok) return placement;
    const selected = new Set(command.uids);
    const ordered = placement.list.filter((uid) => selected.has(uid));
    const firstIndex = placement.list.indexOf(ordered[0]!);
    if (ordered.length !== command.uids.length || placement.list.slice(firstIndex, firstIndex + ordered.length).some((uid) => !selected.has(uid))) {
      return fail("command.non-contiguous-selection", "Wrapped nodes must be contiguous siblings.", commandPath, {
        formUid: form.uid, entityUid: firstUid,
      });
    }
    const wrapper = { ...command.wrapper, childUids: ordered };
    const incompatible = incompatiblePlacement(form, parentUid, wrapper, commandPath);
    if (incompatible) return incompatible;
    for (const uid of ordered) {
      const child = form.nodes[uid];
      if (child && !canPlaceStudioNode(wrapper.kind, child.kind)) return fail(
        "command.incompatible-placement", `${child.kind} node ${uid} cannot be wrapped in a ${wrapper.kind}.`, commandPath,
        { formUid: form.uid, entityUid: uid },
      );
    }
    const list = [...placement.list];
    list.splice(firstIndex, ordered.length, wrapper.uid);
    const withWrapper = { ...form, nodes: { ...form.nodes, [wrapper.uid]: wrapper } };
    const next = replacePlacement(withWrapper, parentUid, list);
    return commit(project, next, [wrapper.uid, ...ordered, ...(parentUid ? [parentUid] : [])], commandPath);
  }

  const node = form.nodes[command.uid];
  if (!node) return fail("command.node-not-found", `Node ${command.uid} does not exist.`, commandPath, {
    formUid: form.uid, entityUid: command.uid,
  });

  if (command.type === "node.delete") {
    const parents = parentMap(form);
    const parentUid = parents.get(command.uid);
    if (parentUid === undefined) return fail("command.invariant", `Node ${command.uid} is unreachable.`, commandPath, {
      formUid: form.uid, entityUid: command.uid,
    });
    const placement = placementList(form, parentUid, commandPath);
    if (!placement.ok) return placement;
    const removed = subtreeUids(form, command.uid);
    const nodes = { ...form.nodes } as Record<Uid, StudioNode>;
    for (const uid of removed) delete nodes[uid];
    const withoutNodes = { ...form, nodes };
    const next = replacePlacement(withoutNodes, parentUid, placement.list.filter((uid) => uid !== command.uid));
    return commit(project, next, [...removed, ...(parentUid ? [parentUid] : [])], commandPath);
  }

  if (command.type === "node.update") {
    const keys = Object.keys(command.changes);
    if (keys.some((key) => !UPDATE_KEYS.has(key))) return fail(
      "command.invalid-update",
      "Node updates may change editable properties only; use structural commands for identity, kind, and children.",
      commandPath,
      { formUid: form.uid, entityUid: command.uid },
    );
    if (keys.length === 0 || keys.every((key) => Object.is((node as unknown as Record<string, unknown>)[key], command.changes[key]))) {
      return { ok: true, document: project, affectedUids: [], changed: false };
    }
    const nextNodeRecord = { ...node } as unknown as Record<string, unknown>;
    for (const key of keys) {
      if (command.changes[key] === undefined) delete nextNodeRecord[key];
      else nextNodeRecord[key] = command.changes[key];
    }
    const nextNode = nextNodeRecord as unknown as StudioNode;
    if (nextNode.kind === "fragment" && project.fragments[nextNode.fragmentUid] === undefined) return fail("command.fragment-not-found", `Fragment ${nextNode.fragmentUid} does not exist.`, commandPath, { formUid: form.uid, entityUid: nextNode.fragmentUid });
    return commit(project, { ...form, nodes: { ...form.nodes, [command.uid]: nextNode } }, [command.uid], commandPath);
  }

  if (command.type === "node.move") {
    const parents = parentMap(form);
    const oldParentUid = parents.get(command.uid);
    if (oldParentUid === undefined) return fail("command.invariant", `Node ${command.uid} is unreachable.`, commandPath, {
      formUid: form.uid, entityUid: command.uid,
    });
    if (subtreeUids(form, command.uid).includes(command.parentUid as Uid)) return fail(
      "command.invalid-parent", "A node cannot move into its own subtree.", commandPath,
      { formUid: form.uid, entityUid: command.uid },
    );
    const oldPlacement = placementList(form, oldParentUid, commandPath);
    const newPlacement = placementList(form, command.parentUid, commandPath);
    if (!oldPlacement.ok) return oldPlacement;
    if (!newPlacement.ok) return newPlacement;
    const incompatible = incompatiblePlacement(form, command.parentUid, node, commandPath);
    if (incompatible) return incompatible;
    const destinationLength = newPlacement.list.length - (oldParentUid === command.parentUid ? 1 : 0);
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > destinationLength) {
      return fail("command.index-out-of-bounds", `Move index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
    }
    const oldIndex = oldPlacement.list.indexOf(command.uid);
    if (oldParentUid === command.parentUid && oldIndex === command.index) {
      return { ok: true, document: project, affectedUids: [], changed: false };
    }
    let next = replacePlacement(form, oldParentUid, oldPlacement.list.filter((uid) => uid !== command.uid));
    const destination = placementList(next, command.parentUid, commandPath);
    if (!destination.ok) return destination;
    const list = [...destination.list];
    list.splice(command.index, 0, command.uid);
    next = replacePlacement(next, command.parentUid, list);
    return commit(project, next, [command.uid, ...(oldParentUid ? [oldParentUid] : []), ...(command.parentUid ? [command.parentUid] : [])], commandPath);
  }

  if (command.type === "node.unwrap") {
    if (node.kind !== "group" && (node.kind !== "collection" || isStudioVariantCollection(node))) return fail(
      "command.incompatible-placement", "Only groups and homogeneous collections can be unwrapped without losing structure.", commandPath,
      { formUid: form.uid, entityUid: node.uid },
    );
    const parents = parentMap(form);
    const parentUid = parents.get(node.uid);
    if (parentUid === undefined) return fail("command.invariant", `Node ${node.uid} is unreachable.`, commandPath, {
      formUid: form.uid, entityUid: node.uid,
    });
    const placement = placementList(form, parentUid, commandPath);
    if (!placement.ok) return placement;
    for (const childUid of node.childUids) {
      const child = form.nodes[childUid];
      if (child) {
        const incompatible = incompatiblePlacement(form, parentUid, child, commandPath);
        if (incompatible) return incompatible;
      }
    }
    const index = placement.list.indexOf(node.uid);
    const list = [...placement.list];
    list.splice(index, 1, ...node.childUids);
    const nodes = { ...form.nodes } as Record<Uid, StudioNode>;
    delete nodes[node.uid];
    const next = replacePlacement({ ...form, nodes }, parentUid, list);
    return commit(project, next, [node.uid, ...node.childUids, ...(parentUid ? [parentUid] : [])], commandPath);
  }

  if (command.type === "node.convert") {
    if (node.kind !== "group" && node.kind !== "collection" && node.kind !== "wizard") return fail(
      "command.incompatible-placement", "Only groups, collections, and wizards can be converted.", commandPath,
      { formUid: form.uid, entityUid: node.uid },
    );
    if (node.kind === command.targetKind) return { ok: true, document: project, affectedUids: [], changed: false };
    if (node.kind === "collection" && isStudioVariantCollection(node)) return fail(
      "command.incompatible-placement", "A discriminated collection cannot be converted without choosing how to preserve its variants.", commandPath,
      { formUid: form.uid, entityUid: node.uid },
    );
    let childUids: readonly Uid[];
    const nodes = { ...form.nodes } as Record<Uid, StudioNode>;
    const affected: Uid[] = [node.uid];
    if (node.kind === "wizard") {
      if (node.stageUids.length !== 1) return fail(
        "command.incompatible-placement", "A wizard must contain exactly one stage for lossless conversion.", commandPath,
        { formUid: form.uid, entityUid: node.uid },
      );
      const stageUid = node.stageUids[0]!;
      const stage = form.nodes[stageUid];
      if (!stage || stage.kind !== "stage") return fail(
        "command.invariant", `Wizard stage ${stageUid} does not resolve.`, commandPath,
        { formUid: form.uid, entityUid: stageUid },
      );
      childUids = stage.childUids;
      delete nodes[stageUid];
      affected.push(stageUid, ...childUids);
    } else childUids = node.childUids;

    const base = {
      uid: node.uid,
      runtimeId: node.runtimeId,
      ...(node.presentation === undefined ? {} : { presentation: node.presentation }),
      ...(node.behavior === undefined ? {} : { behavior: node.behavior }),
      ...(node.legacy === undefined ? {} : { legacy: node.legacy }),
    };
    let converted: StudioNode;
    if (command.targetKind === "group") converted = { ...base, kind: "group", childUids };
    else if (command.targetKind === "collection") converted = {
      ...base,
      kind: "collection",
      childUids,
      ...(command.collection?.min === undefined ? {} : { min: command.collection.min }),
      ...(command.collection?.max === undefined ? {} : { max: command.collection.max }),
      ...(command.collection?.initialRows === undefined ? {} : { initialRows: command.collection.initialRows }),
    };
    else {
      if (node.kind === "wizard" || command.stage === undefined) return fail(
        "command.incompatible-placement", "Converting to a wizard requires one new stage.", commandPath,
        { formUid: form.uid, entityUid: node.uid },
      );
      if (form.nodes[command.stage.uid]) return fail("command.uid-conflict", `UID ${command.stage.uid} is already in use.`, commandPath, {
        formUid: form.uid, entityUid: command.stage.uid,
      });
      const stage = { ...command.stage, childUids };
      nodes[stage.uid] = stage;
      affected.push(stage.uid, ...childUids);
      converted = { ...base, kind: "wizard", stageUids: [stage.uid] };
    }
    nodes[node.uid] = converted;
    return commit(project, { ...form, nodes }, affected, commandPath);
  }

  const sourceUids = subtreeUids(form, command.uid);
  const mappedValues = Object.values(command.uidMap);
  if (sourceUids.some((uid) => !command.uidMap[uid]) || Object.keys(command.uidMap).length !== sourceUids.length
    || mappedValues.some((uid) => !isUid(uid)) || new Set(mappedValues).size !== mappedValues.length) {
    return fail("command.invalid-uid-map", "Duplicate requires one unique safe replacement UID for every subtree node.", commandPath, {
      formUid: form.uid, entityUid: command.uid,
    });
  }
  const conflict = mappedValues.find((uid) => form.nodes[uid]);
  if (conflict) return fail("command.uid-conflict", `UID ${conflict} is already in use.`, commandPath, {
    formUid: form.uid, entityUid: conflict,
  });
  const placement = placementList(form, command.parentUid, commandPath);
  if (!placement.ok) return placement;
  const rootCopySource = form.nodes[command.uid];
  if (rootCopySource) {
    const incompatible = incompatiblePlacement(form, command.parentUid, rootCopySource, commandPath);
    if (incompatible) return incompatible;
  }
  if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > placement.list.length) {
    return fail("command.index-out-of-bounds", `Duplicate index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
  }
  const nodes = { ...form.nodes } as Record<Uid, StudioNode>;
  for (const sourceUid of sourceUids) {
    const source = form.nodes[sourceUid];
    const targetUid = command.uidMap[sourceUid];
    if (!source || !targetUid) continue;
    let copy = withChildren({ ...source, uid: targetUid }, children(source).map((uid) => command.uidMap[uid] as Uid));
    if (copy.kind === "wizard" && copy.initialStageUid !== undefined) {
      copy = { ...copy, initialStageUid: command.uidMap[copy.initialStageUid] ?? copy.initialStageUid };
    } else if (copy.kind === "collection" && isStudioVariantCollection(copy) && copy.initialVariantUid !== undefined) {
      copy = { ...copy, initialVariantUid: command.uidMap[copy.initialVariantUid] ?? copy.initialVariantUid };
    }
    if (sourceUid === command.uid && command.rootRuntimeId !== undefined && copy.kind !== "block") {
      copy = { ...copy, runtimeId: command.rootRuntimeId };
    }
    nodes[targetUid] = copy;
  }
  const rootCopyUid = command.uidMap[command.uid];
  if (!rootCopyUid) return fail("command.invalid-uid-map", "Duplicate root UID mapping is missing.", commandPath, { formUid: form.uid });
  const list = [...placement.list];
  list.splice(command.index, 0, rootCopyUid);
  const next = replacePlacement({ ...form, nodes }, command.parentUid, list);
  return commit(project, next, [...mappedValues, ...(command.parentUid ? [command.parentUid] : [])], commandPath);
}

export function executeStudioCommand(
  project: StudioProjectDocument,
  command: StudioCommand,
): StudioCommandResult {
  if (command.type !== "transaction") return executeSingle(project, command, []);
  if (command.commands.length === 0) return fail("command.empty-transaction", "A transaction must contain at least one command.", []);
  let current = project;
  let changed = false;
  const affected = new Set<Uid>();
  for (let index = 0; index < command.commands.length; index += 1) {
    const child = command.commands[index];
    if (!child) continue;
    const result = child.type === "transaction"
      ? executeStudioCommand(current, child)
      : executeSingle(current, child, []);
    if (!result.ok) return {
      ok: false,
      failure: { ...result.failure, commandPath: [index, ...result.failure.commandPath] },
    };
    current = result.document;
    changed ||= result.changed;
    result.affectedUids.forEach((uid) => affected.add(uid));
  }
  return { ok: true, document: current, affectedUids: [...affected], changed };
}
