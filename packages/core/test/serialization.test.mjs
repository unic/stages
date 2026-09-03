import assert from "node:assert/strict";
import test from "node:test";
import {
  encodeJson,
  migrateSerializedState,
  SerializationError,
  stages,
  validateSerializedState,
} from "../dist/index.js";

const emptySchema = { id: "persistence", version: 1, nodes: [] };

test("JSON encoding rejects unsupported values with precise paths", () => {
  assert.throws(
    () => encodeJson({ nested: { created: new Date() } }),
    (error) => error instanceof SerializationError
      && error.code === "json.object"
      && JSON.stringify(error.path) === JSON.stringify(["nested", "created"]),
  );
  const cyclic = { child: {} };
  cyclic.child.parent = cyclic;
  assert.throws(() => encodeJson(cyclic), /Cyclic value at \["child","parent"\]/);

  const unsafe = Object.create(null);
  unsafe.constructor = "bad";
  assert.throws(() => encodeJson({ nested: unsafe }), /Unsafe object key "constructor" at \["nested","constructor"\]/);
});

test("serialized envelopes are validated before controller recreation", () => {
  assert.throws(
    () => stages({ schema: emptySchema, fields: {}, state: { format: "other" } }),
    (error) => error instanceof SerializationError && error.code === "state.format",
  );
  assert.throws(
    () => validateSerializedState({
      format: "stages",
      formatVersion: 1,
      schema: { id: "persistence", version: 1 },
      value: {},
      baseline: {},
      meta: [],
    }),
    (error) => error instanceof SerializationError && error.code === "state.meta",
  );
});

test("a value codec round-trips non-JSON domain values", () => {
  const codec = {
    encode: (value) => ({ created: value.created.toISOString() }),
    decode: (value) => ({ created: new Date(value.created) }),
  };
  const original = stages({
    schema: emptySchema,
    fields: {},
    value: { created: new Date("2025-01-02T03:04:05.000Z") },
    codec,
  });
  const serialized = original.serialize();
  assert.deepEqual(serialized.value, { created: "2025-01-02T03:04:05.000Z" });

  const recreated = stages({ schema: emptySchema, fields: {}, state: serialized, codec });
  assert.equal(recreated.getSnapshot().value.created instanceof Date, true);
  assert.equal(recreated.getSnapshot().value.created.toISOString(), "2025-01-02T03:04:05.000Z");
});

test("ordered migrations upgrade value and baseline before recreation", () => {
  const state = {
    format: "stages",
    formatVersion: 1,
    schema: { id: "profile", version: 1 },
    value: { first: "Ada" },
    baseline: { first: "Initial" },
    meta: {},
  };
  const migrations = [{
    schemaId: "profile",
    fromVersion: 1,
    toVersion: 2,
    migrate: (current) => ({
      ...current,
      schema: { id: "profile", version: 2 },
      value: { name: current.value.first },
      baseline: { name: current.baseline.first },
    }),
  }];
  const controller = stages({
    schema: { id: "profile", version: 2, nodes: [] },
    fields: {},
    state,
    migrations,
  });

  assert.deepEqual(controller.getSnapshot().value, { name: "Ada" });
  assert.deepEqual(controller.serialize().baseline, { name: "Initial" });
});

test("migration chains reject ambiguity and invalid output versions", () => {
  const state = validateSerializedState({
    format: "stages",
    formatVersion: 1,
    schema: { id: "profile", version: 1 },
    value: {},
    baseline: {},
    meta: {},
  });
  const identity = (current) => current;
  assert.throws(
    () => migrateSerializedState(state, [
      { schemaId: "profile", fromVersion: 1, toVersion: 2, migrate: identity },
      { schemaId: "profile", fromVersion: 1, toVersion: 3, migrate: identity },
    ]),
    (error) => error instanceof SerializationError && error.code === "migration.ambiguous",
  );
  assert.throws(
    () => migrateSerializedState(state, [
      { schemaId: "profile", fromVersion: 1, toVersion: 2, migrate: identity },
    ]),
    (error) => error instanceof SerializationError && error.code === "migration.output",
  );
  assert.throws(
    () => migrateSerializedState(state, [{
      schemaId: "profile",
      fromVersion: 1,
      toVersion: 2,
      migrate: () => { throw new Error("broken migration"); },
    }]),
    (error) => error instanceof SerializationError
      && error.code === "migration.failed"
      && /broken migration/.test(error.message),
  );
});
