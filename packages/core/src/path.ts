import type { DataPath, StagesPatch } from "./types.js";

const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

export function isSafePathSegment(segment: string | number): boolean {
  return typeof segment === "number"
    ? Number.isSafeInteger(segment) && segment >= 0
    : !unsafeKeys.has(segment);
}

export function assertSafePath(path: DataPath): void {
  for (const segment of path) {
    if (!isSafePathSegment(segment)) {
      throw new TypeError(`Unsafe path segment: ${String(segment)}`);
    }
  }
}

export function getAtPath(value: unknown, path: DataPath): unknown {
  let current = value;

  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Readonly<Record<string | number, unknown>>)[segment];
  }

  return current;
}

function copyContainer(value: unknown, nextSegment: string | number): unknown[] | Record<string, unknown> {
  if (Array.isArray(value)) return value.slice();
  if (value !== null && typeof value === "object") {
    return { ...(value as Readonly<Record<string, unknown>>) };
  }
  return typeof nextSegment === "number" ? [] : {};
}

export function setAtPath<TValue>(value: TValue, path: DataPath, nextValue: unknown): TValue {
  assertSafePath(path);
  if (path.length === 0) return nextValue as TValue;

  const segment = path[0];
  if (segment === undefined) return nextValue as TValue;
  const child = getAtPath(value, [segment]);
  const nextChild = setAtPath(child, path.slice(1), nextValue);
  if (Object.is(child, nextChild)) return value;

  const copy = copyContainer(value, segment);
  (copy as Record<string | number, unknown>)[segment] = nextChild;
  return copy as TValue;
}

export function removeAtPath<TValue>(value: TValue, path: DataPath): TValue {
  assertSafePath(path);
  if (path.length === 0) return undefined as TValue;

  const segment = path[0];
  if (segment === undefined || value === null || typeof value !== "object") return value;
  const child = getAtPath(value, [segment]);
  if (path.length > 1) {
    const nextChild = removeAtPath(child, path.slice(1));
    if (Object.is(child, nextChild)) return value;
    const copy = copyContainer(value, segment);
    (copy as Record<string | number, unknown>)[segment] = nextChild;
    return copy as TValue;
  }

  if (Array.isArray(value)) {
    if (typeof segment !== "number" || segment >= value.length) return value;
    const copy = value.slice();
    copy.splice(segment, 1);
    return copy as TValue;
  }

  if (!Object.prototype.hasOwnProperty.call(value, segment)) return value;
  const copy = { ...(value as Readonly<Record<string, unknown>>) };
  delete copy[String(segment)];
  return copy as TValue;
}

export function applyPatches<TValue>(value: TValue, patches: readonly StagesPatch[]): TValue {
  return patches.reduce<TValue>(
    (current, patch) =>
      patch.op === "set"
        ? setAtPath(current, patch.path, patch.value)
        : removeAtPath(current, patch.path),
    value,
  );
}

export function pathsEqual(left: DataPath, right: DataPath): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}
