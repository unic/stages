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

test("revealed validation state survives recreation while focus remains ephemeral", async () => {
  const fields = { text: { view: "text", initialValue: "" } };
  const schema = {
    id: "revealed-validation",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [{
        id: "required",
        on: ["init", "blur"],
        revealOn: "blur",
        validate: ({ path }) => [{ id: "required", code: "required", path, severity: "error" }],
      }],
    }],
  };
  const original = stages({ schema, fields, value: { name: "" } });
  assert.equal(original.getSnapshot().validation.visibleIssues.length, 0);

  original.dispatch({ name: "focus", target: { kind: "field", path: ["name"] } });
  original.dispatch({ name: "blur", target: { kind: "field", path: ["name"] } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(original.getSnapshot().validation.visibleIssues.length, 1);

  const serialized = original.serialize();
  assert.deepEqual(serialized.meta.revealedValidation, [[{ kind: "node", id: "name" }]]);
  const recreated = stages({ schema, fields, state: serialized });
  assert.equal(recreated.getSnapshot().validation.status, "invalid");
  assert.equal(recreated.getSnapshot().validation.visibleIssues.length, 1);
  assert.equal(recreated.getSnapshot().nodes[0].state.focused, false);
  assert.equal(recreated.getSnapshot().nodes[0].state.touched, true);

  recreated.dispatch({ name: "reset", target: { kind: "form" } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(recreated.serialize().meta.revealedValidation, []);
  assert.equal(recreated.getSnapshot().validation.visibleIssues.length, 0);
  assert.equal(recreated.getSnapshot().nodes[0].state.touched, false);
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

test("registered extension namespaces drive dynamics and round-trip through codecs", async () => {
  const extensionCodecs = {
    draft: {
      encode: (value) => ({ updatedAt: value.updatedAt.toISOString() }),
      decode: (value) => ({ updatedAt: new Date(value.updatedAt) }),
    },
  };
  const schema = {
    id: "extension-state",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      deriveProps: ({ meta }) => ({ updatedAt: meta.extensions.draft.updatedAt.toISOString() }),
    }],
  };
  const fields = { text: { view: "text", initialValue: "" } };
  const original = stages({
    schema,
    fields,
    value: { name: "Ada" },
    extensionCodecs,
    extensions: { draft: { updatedAt: new Date("2026-01-02T03:04:05.000Z") } },
  });
  assert.deepEqual(original.getSnapshot().nodes[0].props, { updatedAt: "2026-01-02T03:04:05.000Z" });

  original.update({ extensions: { draft: { updatedAt: new Date("2026-02-03T04:05:06.000Z") } } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(original.getSnapshot().nodes[0].props, { updatedAt: "2026-02-03T04:05:06.000Z" });
  const serialized = original.serialize();
  assert.deepEqual(serialized.meta.extensions, { draft: { updatedAt: "2026-02-03T04:05:06.000Z" } });

  const recreated = stages({ schema, fields, state: serialized, extensionCodecs });
  assert.deepEqual(recreated.getSnapshot().nodes[0].props, { updatedAt: "2026-02-03T04:05:06.000Z" });
});

test("extension persistence rejects unsafe, unregistered, and failing codecs", () => {
  assert.throws(
    () => stages({
      schema: emptySchema,
      fields: {},
      value: {},
      extensionCodecs: { constructor: { encode: (value) => value, decode: (value) => value } },
    }),
    /Invalid extension namespace/,
  );
  assert.throws(
    () => stages({ schema: emptySchema, fields: {}, value: {}, extensions: { rogue: true } }),
    /is not registered/,
  );
  assert.throws(
    () => stages({ schema: emptySchema, fields: {}, value: {}, extensions: { toString: true } }),
    /is not registered/,
  );

  const failing = stages({
    schema: emptySchema,
    fields: {},
    value: {},
    extensionCodecs: {
      draft: {
        encode: () => { throw new Error("encode exploded"); },
        decode: (value) => value,
      },
    },
    extensions: { draft: true },
  });
  assert.throws(
    () => failing.serialize(),
    (error) => error instanceof SerializationError
      && error.code === "extension.encode"
      && /encode exploded/.test(error.message),
  );

  const state = {
    format: "stages",
    formatVersion: 1,
    schema: { id: "persistence", version: 1 },
    value: {},
    baseline: {},
    meta: { extensions: { draft: true } },
  };
  assert.throws(
    () => stages({
      schema: emptySchema,
      fields: {},
      state,
      extensionCodecs: {
        draft: {
          encode: (value) => value,
          decode: () => { throw new Error("decode exploded"); },
        },
      },
    }),
    (error) => error instanceof SerializationError
      && error.code === "extension.decode"
      && /decode exploded/.test(error.message),
  );
});
