import type { DataPath, NodeAddress } from "@stages/core";

export function studioRuntimePathKey(path: DataPath): string {
  return JSON.stringify(path);
}

export function studioRuntimeAddressKey(address: NodeAddress): string {
  return JSON.stringify(address);
}
