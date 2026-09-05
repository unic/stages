import { isStudioVariantCollection, type StudioFormDocument, type Uid } from "../document";

type StructurePath = readonly (string | Readonly<{ row: true }> | Readonly<{ variant: string }>)[];

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, child: unknown) => child !== null && typeof child === "object" && !Array.isArray(child)
    ? Object.fromEntries(Object.entries(child).sort(([left], [right]) => left.localeCompare(right)))
    : child);
}

/** A conservative data/state structure inventory of an already expanded form. */
export function studioStructuralContract(form: StudioFormDocument): ReadonlyMap<string, string> | undefined {
  const entries = new Map<string, string>();
  const visited = new Set<Uid>();
  const visit = (uids: readonly Uid[], parent: StructurePath): boolean => {
    for (const uid of uids) {
      const node = form.nodes[uid];
      if (node === undefined || visited.has(uid) || node.kind === "fragment") return false;
      visited.add(uid);
      if (node.kind === "block") continue;
      const path: StructurePath = [...parent, node.kind === "variant" ? { variant: node.runtimeId } : node.runtimeId];
      const key = canonical(path);
      if (entries.has(key)) return false;
      const presence = node.behavior?.presentWhen;
      entries.set(key, canonical({
        kind: node.kind,
        presence: presence?.kind === "literal" && presence.value === true ? undefined : presence,
        ...(node.kind === "field" ? { definition: node.definition } : {}),
        ...(node.kind === "collection" ? {
          discriminator: isStudioVariantCollection(node) ? node.discriminator : undefined,
          itemKey: node.itemKey?.kind === "property" ? node.itemKey.property : undefined,
        } : {}),
      }));
      if (node.kind === "field") continue;
      const children = node.kind === "wizard" ? node.stageUids
        : node.kind === "collection" && isStudioVariantCollection(node) ? node.variantUids
          : node.childUids;
      if (!visit(children, node.kind === "collection" ? [...path, { row: true }] : path)) return false;
    }
    return true;
  };
  return visit(form.rootNodeUids, []) ? entries : undefined;
}
