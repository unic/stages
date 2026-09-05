import type { DataPath, NodeAddress } from "@stages/core";
import type { StudioSourceMap, StudioSourceMapEntry, StudioSourceVariant } from "./types.js";

export function studioRuntimePathKey(path: DataPath): string {
  return JSON.stringify(path);
}

export function studioRuntimeAddressKey(address: NodeAddress): string {
  return JSON.stringify(address);
}


function matchesVariant(variant: StudioSourceVariant, path: DataPath, value: unknown): boolean {
  let position = 0;
  for (const segment of variant.collectionPath) {
    while (typeof path[position] === "number") position += 1;
    if (path[position] !== segment) return false;
    position += 1;
  }
  // A collection definition alone does not identify a runtime row.
  if (typeof path[position] !== "number") return false;
  let row = value;
  for (const segment of path.slice(0, position + 1)) {
    if (row === null || typeof row !== "object" || !Object.hasOwn(row, segment)) return false;
    row = (row as Record<string | number, unknown>)[segment];
  }
  return row !== null && typeof row === "object" && Object.hasOwn(row, variant.discriminator)
    && (row as Record<string, unknown>)[variant.discriminator] === variant.variantId;
}

/** Resolve one occurrence using accepted value data, without executing schema callbacks. */
export function resolveStudioSourceEntry(
  sourceMap: StudioSourceMap,
  path: DataPath,
  value: unknown,
  address?: NodeAddress,
): StudioSourceMapEntry | undefined {
  const addressCandidates = address === undefined ? undefined
    : sourceMap.entriesByAddress.get(studioRuntimeAddressKey(address))
      ?? sourceMap.entriesByAddress.get(studioRuntimeAddressKey(address.filter((segment) => segment.kind !== "row")));
  const candidates = addressCandidates
    ?? sourceMap.entriesByPath.get(studioRuntimePathKey(path))
    ?? sourceMap.entriesByPath.get(studioRuntimePathKey(path.filter((segment) => typeof segment !== "number")));
  const matching = candidates?.filter((entry) => entry.variants?.every((variant) => matchesVariant(variant, path, value)) ?? true);
  return matching?.length === 1 ? matching[0] : undefined;
}
