import assert from "node:assert/strict";
import test from "node:test";
import { reduceCollectionCommand } from "../dist/index.js";

test("collection commands are immutable and deterministic", () => {
  const first = Object.freeze({ id: "a" });
  const second = Object.freeze({ id: "b" });
  const source = Object.freeze([first, second]);

  const added = reduceCollectionCommand(source, { name: "collection:add", item: { id: "c" }, index: 1 });
  assert.equal(added.accepted, true);
  assert.deepEqual(added.value.map(({ id }) => id), ["a", "c", "b"]);
  assert.deepEqual(source.map(({ id }) => id), ["a", "b"]);

  const moved = reduceCollectionCommand(source, { name: "collection:move", from: 0, to: 1 });
  assert.equal(moved.accepted, true);
  assert.deepEqual(moved.value, [second, first]);

  const sorted = reduceCollectionCommand(source, { name: "collection:sort", order: [1, 0] });
  assert.equal(sorted.accepted, true);
  assert.deepEqual(sorted.value, [second, first]);
});

test("collection commands reject constraints, bad indexes, and no-ops", () => {
  assert.deepEqual(
    reduceCollectionCommand([1], { name: "collection:add", item: 2 }, { max: 1 }),
    { accepted: false, code: "collection.max", message: "Collection already contains the maximum of 1 items." },
  );
  assert.equal(reduceCollectionCommand([1], { name: "collection:remove", index: 0 }, { min: 1 }).accepted, false);
  assert.equal(reduceCollectionCommand([1], { name: "collection:move", from: 0, to: 0 }).accepted, false);
  assert.equal(reduceCollectionCommand([1, 2], { name: "collection:sort", order: [0, 0] }).accepted, false);
});
