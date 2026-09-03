import assert from "node:assert/strict";
import test from "node:test";
import {
  getAtPath,
  reduceCollectionCommand,
  removeAtPath,
  setAtPath,
} from "../dist/index.js";

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function integer(next, minimum, maximum) {
  return minimum + Math.floor(next() * (maximum - minimum + 1));
}

function generatedValue(next, depth) {
  if (depth === 0 || next() < 0.35) {
    const primitives = [null, false, true, integer(next, -1000, 1000), `value-${integer(next, 0, 9999)}`];
    return primitives[integer(next, 0, primitives.length - 1)];
  }
  const length = integer(next, 1, 4);
  if (next() < 0.5) {
    return Array.from({ length }, () => generatedValue(next, depth - 1));
  }
  return Object.fromEntries(Array.from(
    { length },
    (_, index) => [`key${index}`, generatedValue(next, depth - 1)],
  ));
}

function leafPaths(value, prefix = []) {
  if (value === null || typeof value !== "object") return [prefix];
  const entries = Array.isArray(value)
    ? value.map((child, index) => [index, child])
    : Object.entries(value);
  return entries.flatMap(([segment, child]) => leafPaths(child, [...prefix, segment]));
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mutableSet(value, path, nextValue) {
  let parent = value;
  for (const segment of path.slice(0, -1)) parent = parent[segment];
  parent[path.at(-1)] = nextValue;
}

function mutableRemove(value, path) {
  let parent = value;
  for (const segment of path.slice(0, -1)) parent = parent[segment];
  const segment = path.at(-1);
  if (Array.isArray(parent)) parent.splice(segment, 1);
  else delete parent[segment];
}

test("seeded path properties preserve immutability, values, and unrelated identity", () => {
  for (let seed = 1; seed <= 500; seed += 1) {
    const next = random(seed);
    const source = deepFreeze({
      target: generatedValue(next, 4),
      untouched: { seed, token: `stable-${seed}` },
    });
    const candidates = leafPaths(source.target, ["target"]);
    const path = candidates[integer(next, 0, candidates.length - 1)];
    const replacement = `replacement-${seed}`;
    const before = clone(source);

    const changed = setAtPath(source, path, replacement);
    const expectedChange = clone(source);
    mutableSet(expectedChange, path, replacement);
    assert.deepEqual(changed, expectedChange, `set mismatch for seed ${seed}`);
    assert.deepEqual(source, before, `set mutated input for seed ${seed}`);
    assert.equal(getAtPath(changed, path), replacement, `set lookup mismatch for seed ${seed}`);
    assert.equal(changed.untouched, source.untouched, `set copied unrelated branch for seed ${seed}`);
    assert.equal(setAtPath(source, path, getAtPath(source, path)), source, `equal set copied seed ${seed}`);

    const removed = removeAtPath(source, path);
    const expectedRemoval = clone(source);
    mutableRemove(expectedRemoval, path);
    assert.deepEqual(removed, expectedRemoval, `remove mismatch for seed ${seed}`);
    assert.deepEqual(source, before, `remove mutated input for seed ${seed}`);
    assert.equal(removed.untouched, source.untouched, `remove copied unrelated branch for seed ${seed}`);
  }
});

function shuffledIndexes(length, next) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const target = integer(next, 0, index);
    [indexes[index], indexes[target]] = [indexes[target], indexes[index]];
  }
  return indexes;
}

function modelCollection(current, command, constraints) {
  if (command.name === "collection:add") {
    if (current.length >= constraints.max) return { accepted: false };
    const index = command.index ?? current.length;
    if (!Number.isSafeInteger(index) || index < 0 || index > current.length) return { accepted: false };
    const value = current.slice();
    value.splice(index, 0, command.item);
    return { accepted: true, value };
  }
  if (command.name === "collection:remove") {
    if (current.length <= constraints.min) return { accepted: false };
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index >= current.length) return { accepted: false };
    const value = current.slice();
    value.splice(command.index, 1);
    return { accepted: true, value };
  }
  if (command.name === "collection:replace") {
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index >= current.length) return { accepted: false };
    if (Object.is(current[command.index], command.item)) return { accepted: false };
    const value = current.slice();
    value[command.index] = command.item;
    return { accepted: true, value };
  }
  if (command.name === "collection:duplicate") {
    if (current.length >= constraints.max) return { accepted: false };
    if (!Number.isSafeInteger(command.index) || command.index < 0 || command.index >= current.length) return { accepted: false };
    const toIndex = command.toIndex ?? command.index + 1;
    if (!Number.isSafeInteger(toIndex) || toIndex < 0 || toIndex > current.length) return { accepted: false };
    const value = current.slice();
    value.splice(toIndex, 0, current[command.index]);
    return { accepted: true, value };
  }
  if (command.name === "collection:move") {
    if (![command.from, command.to].every((index) => Number.isSafeInteger(index) && index >= 0 && index < current.length)) {
      return { accepted: false };
    }
    if (command.from === command.to) return { accepted: false };
    const value = current.slice();
    const [item] = value.splice(command.from, 1);
    value.splice(command.to, 0, item);
    return { accepted: true, value };
  }
  const unique = new Set(command.order);
  if (command.order.length !== current.length || unique.size !== current.length
    || command.order.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= current.length)
    || command.order.every((index, position) => index === position)) {
    return { accepted: false };
  }
  return { accepted: true, value: command.order.map((index) => current[index]) };
}

test("seeded collection command sequences match a mutable reference model", () => {
  const constraints = { min: 1, max: 9 };
  let itemId = 100;
  for (let seed = 1; seed <= 40; seed += 1) {
    const next = random(seed * 7919);
    let current = deepFreeze(Array.from({ length: 4 }, (_, index) => ({ id: `${seed}-${index}` })));

    for (let step = 0; step < 100; step += 1) {
      const index = integer(next, -2, current.length + 2);
      const item = deepFreeze({ id: `new-${itemId}` });
      itemId += 1;
      const commandKind = integer(next, 0, 5);
      const command = commandKind === 0
        ? { name: "collection:add", item, ...(next() < 0.7 ? { index } : {}) }
        : commandKind === 1
          ? { name: "collection:remove", index }
          : commandKind === 2
            ? { name: "collection:replace", index, item: next() < 0.15 ? current[index] : item }
            : commandKind === 3
              ? { name: "collection:duplicate", index, ...(next() < 0.7 ? { toIndex: integer(next, -2, current.length + 2) } : {}) }
              : commandKind === 4
                ? { name: "collection:move", from: index, to: integer(next, -2, current.length + 2) }
                : {
                    name: "collection:sort",
                    order: next() < 0.75
                      ? shuffledIndexes(current.length, next)
                      : Array.from({ length: integer(next, 0, current.length + 2) }, () => integer(next, -1, current.length)),
                  };
      const before = current.slice();
      const expected = modelCollection(current, command, constraints);
      const actual = reduceCollectionCommand(current, command, constraints);
      const replay = reduceCollectionCommand(current, command, constraints);
      const label = `seed ${seed}, step ${step}, ${command.name}`;

      assert.deepEqual(actual, replay, `non-deterministic result at ${label}`);
      assert.deepEqual(current, before, `input mutation at ${label}`);
      assert.equal(actual.accepted, expected.accepted, `acceptance mismatch at ${label}`);
      if (actual.accepted && expected.accepted) {
        assert.deepEqual(actual.value, expected.value, `value mismatch at ${label}`);
        assert.notEqual(actual.value, current, `accepted command reused input at ${label}`);
        assert(actual.value.length >= constraints.min && actual.value.length <= constraints.max, `constraint violation at ${label}`);
        current = deepFreeze(actual.value);
      }
    }
  }
});
