import assert from "node:assert/strict";
import test from "node:test";
import { deepEqual } from "../dist/equality.js";

test("deep equality handles nested records, arrays, and primitive edge cases", () => {
  assert.equal(deepEqual({ nested: [{ value: Number.NaN }, -0] }, { nested: [{ value: Number.NaN }, -0] }), true);
  assert.equal(deepEqual({ nested: [{ value: 1 }] }, { nested: [{ value: 2 }] }), false);
  assert.equal(deepEqual([1], { 0: 1 }), false);
  assert.equal(deepEqual(-0, 0), false);
});

test("deep equality checks own keys and preserves the identity fast path", () => {
  const value = Object.create({ inherited: true });
  value.own = { stable: true };

  assert.equal(deepEqual(value, value), true);
  assert.equal(deepEqual(value, { own: { stable: true } }), true);
  assert.equal(deepEqual({ value: undefined }, {}), false);
});
