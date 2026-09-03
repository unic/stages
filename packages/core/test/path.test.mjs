import assert from "node:assert/strict";
import test from "node:test";
import { applyPatches, getAtPath, removeAtPath, setAtPath } from "../dist/index.js";

test("path writes preserve unchanged branches and never mutate input", () => {
  const profile = Object.freeze({ name: "Ada", city: "Bern" });
  const source = Object.freeze({ profile, untouched: Object.freeze({ stable: true }) });
  const next = setAtPath(source, ["profile", "name"], "Grace");

  assert.deepEqual(next, { profile: { name: "Grace", city: "Bern" }, untouched: { stable: true } });
  assert.equal(next.untouched, source.untouched);
  assert.notEqual(next.profile, source.profile);
  assert.equal(source.profile.name, "Ada");
});

test("patches support array segments and safe removal", () => {
  const source = { rows: [{ name: "one" }, { name: "two" }], keep: true };
  const changed = applyPatches(source, [
    { op: "set", path: ["rows", 1, "name"], value: "second" },
    { op: "remove", path: ["rows", 0] },
  ]);

  assert.equal(getAtPath(changed, ["rows", 0, "name"]), "second");
  assert.equal(changed.keep, true);
  assert.equal(removeAtPath(source, ["missing"]), source);
  assert.throws(() => setAtPath(source, ["__proto__", "polluted"], true), /Unsafe path segment/);
});
