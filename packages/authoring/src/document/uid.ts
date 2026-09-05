import type { Uid } from "./types.js";

const UID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function isUid(value: unknown): value is Uid {
  return typeof value === "string" && UID_PATTERN.test(value) && !UNSAFE_KEYS.has(value);
}

export function toUid(value: string): Uid {
  if (!isUid(value)) throw new TypeError(`Invalid Studio UID: ${JSON.stringify(value)}`);
  return value;
}

/** Generation is injected so the document domain has no platform dependency. */
export function createUid(source: () => string): Uid {
  return toUid(source());
}

export function isSafeObjectKey(value: string): boolean {
  return !UNSAFE_KEYS.has(value);
}
