import type { NodeAddress } from "./types.js";

export function addressKey(address: NodeAddress): string {
  return address.map((segment) => `${segment.kind}:${segment.id.length}:${segment.id}`).join("/");
}

export function addressStartsWith(address: NodeAddress, prefix: NodeAddress): boolean {
  return prefix.length <= address.length && prefix.every((segment, index) => {
    const candidate = address[index];
    return candidate?.kind === segment.kind && candidate.id === segment.id;
  });
}

export function parseNodeAddress(value: unknown): NodeAddress | undefined {
  if (!Array.isArray(value)) return undefined;
  const address: Array<Readonly<{ kind: "node" | "row"; id: string }>> = [];
  for (const candidate of value) {
    if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return undefined;
    const record = candidate as Readonly<Record<string, unknown>>;
    const kind = record["kind"];
    const id = record["id"];
    if ((kind !== "node" && kind !== "row") || typeof id !== "string") return undefined;
    address.push({ kind, id });
  }
  return address;
}
