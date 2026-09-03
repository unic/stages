import {
  applyPatches,
  assertSafePath,
  getAtPath,
  isSafePathSegment,
  pathsEqual,
  removeAtPath,
  setAtPath,
} from "@stages/core";

// source:start path-utilities
const source = {
  profile: { name: "Ada", city: "Bern" },
  rows: [{ id: "a" }, { id: "b" }],
  stable: { untouched: true },
};

const renamed = setAtPath(source, ["profile", "name"], "Grace");
// source.profile.name is still "Ada"; renamed.stable === source.stable.

const withoutFirstRow = removeAtPath(renamed, ["rows", 0]);
// Array removal uses splice semantics, so row "b" is now at index 0.

const patched = applyPatches(withoutFirstRow, [
  { op: "set", path: ["profile", "city"], value: "Zürich" },
  { op: "remove", path: ["profile", "name"] },
]);

const city = getAtPath(patched, ["profile", "city"]); // "Zürich"
const samePath = pathsEqual(["rows", 0], ["rows", 0]); // true
const safe = isSafePathSegment(0); // true
assertSafePath(["profile", "city"]); // returns void
// source:end path-utilities

void city;
void samePath;
void safe;
