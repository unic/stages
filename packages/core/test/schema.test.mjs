import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSchema } from "../dist/index.js";

const meta = {
  revision: 0,
  isDirty: false,
  touched: [],
  visited: [],
  activeWizards: new Map(),
  extensions: {},
};

const fields = { text: { view: "input", initialValue: "" } };

test("dynamic schemas and resolvers recursively derive paths and stable row addresses", () => {
  let factoryCalls = 0;
  const value = { enabled: true, people: [{ id: "a", identity: { name: "Ada" } }] };
  const schema = ({ value: current }) => {
    factoryCalls += 1;
    return {
      id: "people-form",
      version: 1,
      nodes: current.enabled ? [{
        kind: "collection",
        id: "people",
        itemKey: (item) => item.id,
        nodes: [{
          kind: "group",
          id: "identity",
          nodes: [{
            kind: "field",
            id: "name",
            type: "text",
            props: { label: "Name" },
            deriveProps: ({ fieldValue }) => ({ length: fieldValue.length }),
          }],
        }],
      }] : [],
    };
  };

  const result = evaluateSchema({ schema, value, context: {}, meta, fields });
  const field = result.nodes[0].children[0].children[0];

  assert.equal(factoryCalls, 1);
  assert.deepEqual(field.path, ["people", 0, "identity", "name"]);
  assert.deepEqual(field.address, [
    { kind: "node", id: "people" },
    { kind: "row", id: "a" },
    { kind: "node", id: "identity" },
    { kind: "node", id: "name" },
  ]);
  assert.deepEqual(field.props, { label: "Name", length: 3 });
  assert.equal(result.nodes[0].branches[0].kind, "row");
  assert.equal(result.nodes[0].branches[0].id, "a");
  assert.deepEqual(result.diagnostics, []);
});

test("wizard stages remain explicit recursive branches", () => {
  const result = evaluateSchema({
    schema: {
      id: "wizard-form",
      version: 1,
      nodes: [{
        kind: "wizard",
        id: "flow",
        stages: [{
          id: "details",
          nodes: [{ kind: "field", id: "name", type: "text" }],
        }],
      }],
    },
    value: { flow: { details: { name: "Ada" } } },
    context: {},
    meta,
    fields,
  });

  assert.equal(result.nodes[0].branches[0].kind, "stage");
  assert.deepEqual(result.nodes[0].branches[0].path, ["flow", "details"]);
  assert.deepEqual(result.nodes[0].branches[0].children[0].path, ["flow", "details", "name"]);
});

test("evaluation does not mutate frozen schema or values", () => {
  const field = Object.freeze({ kind: "field", id: "name", type: "text", props: Object.freeze({ label: "Name" }) });
  const nodes = Object.freeze([field]);
  const schema = Object.freeze({ id: "frozen", version: 1, nodes });
  const value = Object.freeze({ name: "Ada" });

  const result = evaluateSchema({ schema, value, context: Object.freeze({}), meta, fields });

  assert.equal(result.nodes[0].config, field);
  assert.deepEqual(result.nodes[0].props, { label: "Name" });
  assert.equal(value.name, "Ada");
});

test("normalization reports unsafe, duplicate, and unknown schema entries", () => {
  const result = evaluateSchema({
    schema: {
      id: "invalid",
      version: 1,
      nodes: [
        { kind: "field", id: "same", type: "missing" },
        { kind: "field", id: "same", type: "text" },
        { kind: "field", id: "__proto__", type: "text" },
      ],
    },
    value: {},
    context: {},
    meta,
    fields,
  });

  assert.deepEqual(result.diagnostics.map(({ code }) => code), [
    "schema.unknown-field",
    "schema.duplicate-id",
    "schema.unsafe-id",
  ]);
});

test("normalization rejects malformed transforms, validators, and resolver output", () => {
  const result = evaluateSchema({
    schema: {
      id: "invalid-behavior",
      version: 1,
      transforms: [{ on: "", apply: () => [] }],
      validators: [
        { id: "duplicate", on: "submit", validate: () => [] },
        { id: "duplicate", on: "submit", validate: () => [] },
      ],
      nodes: [
        {
          kind: "field",
          id: "bad-validator",
          type: "text",
          validators: [{ id: "bad", on: [], validate: () => [] }],
        },
        {
          kind: "field",
          id: "bad-props",
          type: "text",
          deriveProps: () => [],
        },
      ],
    },
    value: { "bad-validator": "", "bad-props": "" },
    context: {},
    meta,
    fields,
  });

  assert.deepEqual(result.diagnostics.map(({ code }) => code), [
    "schema.invalid-transform",
    "schema.invalid-validator",
    "schema.invalid-validator",
    "schema.resolver-failed",
  ]);
  assert.deepEqual(result.schema.transforms, []);
  assert.deepEqual(result.schema.validators, []);
  assert.deepEqual(result.nodes, []);
});

test("normalization diagnoses malformed structural node payloads without throwing", () => {
  const result = evaluateSchema({
    schema: {
      id: "invalid-structure",
      version: 1,
      nodes: [
        { kind: "unknown", id: "unknown" },
        { kind: "group", id: "group", nodes: {} },
        { kind: "collection", id: "bad-nodes", nodes: {} },
        { kind: "collection", id: "bad-variants", discriminator: "kind", variants: null },
        {
          kind: "collection",
          id: "bad-variant",
          discriminator: "kind",
          variants: { broken: { nodes: {} } },
        },
        {
          kind: "collection",
          id: "missing-discriminator",
          variants: { valid: { nodes: [] } },
        },
        { kind: "collection", id: "empty-variants", discriminator: "kind", variants: {} },
        { kind: "collection", id: "invalid-key-config", itemKey: "id", nodes: [] },
        { kind: "wizard", id: "bad-wizard", stages: {} },
        { kind: "wizard", id: "bad-stage", stages: [{ id: "stage", nodes: {} }] },
        { kind: "collection", id: "bad-key", itemKey: () => 42, nodes: [] },
      ],
    },
    value: { "bad-key": [{}] },
    context: {},
    meta,
    fields,
  });

  assert.deepEqual(result.diagnostics.map(({ code }) => code), [
    "schema.invalid-kind",
    "schema.invalid-nodes",
    "schema.collection-shape",
    "schema.collection-shape",
    "schema.invalid-variant",
    "schema.unsafe-discriminator",
    "schema.invalid-variant",
    "schema.item-key",
    "schema.invalid-wizard",
    "schema.invalid-stage",
    "schema.item-key-failed",
  ]);
});

test("normalization rejects malformed registry field validators", () => {
  const result = evaluateSchema({
    schema: {
      id: "invalid-field-definition",
      version: 1,
      nodes: [{ kind: "field", id: "name", type: "broken" }],
    },
    value: { name: "" },
    context: {},
    meta,
    fields: {
      broken: {
        view: "broken",
        validators: [
          { id: "same", validate: () => [] },
          { id: "same", validate: () => [] },
        ],
      },
    },
  });

  assert.deepEqual(result.diagnostics.map(({ code }) => code), ["schema.invalid-field-definition"]);
  assert.deepEqual(result.nodes, []);
});
