import { isSafeObjectKey, isUid } from "../document";
import type { StudioFormDocument, StudioNode, StudioProjectDocument, Uid } from "../document";
import type {
  StudioCommand,
  StudioCommandFailure,
  StudioCommandFailureCode,
  StudioCommandResult,
} from "./types";

const UPDATE_KEYS = new Set([
  "runtimeId", "definition", "props", "presentation", "behavior", "legacy",
  "computed", "validators", "min", "max", "initialRows",
]);

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
  if (node.kind === "group" || node.kind === "collection" || node.kind === "stage") return node.childUids;
  return [];
}

function withChildren(node: StudioNode, next: readonly Uid[]): StudioNode {
  if (node.kind === "wizard") return { ...node, stageUids: next };
  if (node.kind === "group" || node.kind === "collection" || node.kind === "stage") {
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
  const form = project.forms[command.formUid];
  if (!form) return fail("command.form-not-found", `Form ${command.formUid} does not exist.`, commandPath, {
    formUid: command.formUid,
  });

  if (command.type === "node.insert") {
    if (form.nodes[command.node.uid]) return fail("command.uid-conflict", `UID ${command.node.uid} is already in use.`, commandPath, {
      formUid: form.uid, entityUid: command.node.uid,
    });
    const placement = placementList(form, command.parentUid, commandPath);
    if (!placement.ok) return placement;
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > placement.list.length) {
      return fail("command.index-out-of-bounds", `Insert index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
    }
    const list = [...placement.list];
    list.splice(command.index, 0, command.node.uid);
    const withNode = { ...form, nodes: { ...form.nodes, [command.node.uid]: command.node } };
    const next = replacePlacement(withNode, command.parentUid, list);
    return commit(project, next, [command.node.uid, ...(command.parentUid ? [command.parentUid] : [])], commandPath);
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
    const nextNode = { ...node, ...command.changes } as StudioNode;
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
  if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index > placement.list.length) {
    return fail("command.index-out-of-bounds", `Duplicate index ${command.index} is out of bounds.`, commandPath, { formUid: form.uid });
  }
  const nodes = { ...form.nodes } as Record<Uid, StudioNode>;
  for (const sourceUid of sourceUids) {
    const source = form.nodes[sourceUid];
    const targetUid = command.uidMap[sourceUid];
    if (!source || !targetUid) continue;
    let copy = withChildren({ ...source, uid: targetUid }, children(source).map((uid) => command.uidMap[uid] as Uid));
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
