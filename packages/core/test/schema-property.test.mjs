import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSchema, stages } from "../dist/index.js";

const meta = {
  revision: 0,
  isDirty: false,
  touched: [],
  visited: [],
  activeWizards: new Map(),
  extensions: {},
};
const fields = { text: { view: "text", initialValue: "" } };

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

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function malformedNodes(caseNumber) {
  const valid = { kind: "field", id: "valid", type: "text" };
  switch (caseNumber % 18) {
    case 0: return [null];
    case 1: return [{ kind: "field", id: 42, type: "text" }];
    case 2: return [{ kind: "field", id: "__proto__", type: "text" }];
    case 3: return [{ kind: "mystery", id: "unknown" }];
    case 4: return [{ kind: "field", id: "missing-type" }];
    case 5: return [{ kind: "field", id: "unknown-type", type: "missing" }];
    case 6: return [{ kind: "field", id: "bad-props", type: "text", props: [] }];
    case 7: return [{ kind: "field", id: "bad-predicate", type: "text", when: "yes" }];
    case 8: return [{ kind: "group", id: "bad-group", nodes: {} }];
    case 9: return [{ kind: "collection", id: "missing-shape" }];
    case 10: return [{ kind: "collection", id: "both-shapes", nodes: [], variants: {} }];
    case 11: return [{ kind: "collection", id: "bad-variant", discriminator: "kind", variants: { broken: null } }];
    case 12: return [{ kind: "collection", id: "bad-range", min: 4, max: 2, nodes: [] }];
    case 13: return [{ kind: "collection", id: "bad-key", itemKey: "id", nodes: [] }];
    case 14: return [{ kind: "wizard", id: "bad-wizard", stages: {} }];
    case 15: return [{ kind: "wizard", id: "bad-stage", stages: [{ id: "first", nodes: {} }] }];
    case 16: return [valid, { ...valid }];
    default: return [{
      kind: "field",
      id: "bad-behavior",
      type: "text",
      transforms: [{ on: [], apply: "not-a-function" }],
      validators: [{ id: "validator", on: "submit", dependencies: [["constructor"]], validate: () => [] }],
    }];
  }
}

function wrappedMalformedNodes(seed) {
  const next = random(seed * 65537);
  let nodes = malformedNodes(seed);
  const depth = integer(next, 0, 4);
  for (let level = 0; level < depth; level += 1) {
    nodes = next() < 0.5
      ? [{ kind: "group", id: `group-${level}`, nodes }]
      : [{ kind: "wizard", id: `wizard-${level}`, stages: [{ id: `stage-${level}`, nodes }] }];
  }
  return nodes;
}

function verifyDiagnostics(diagnostics, label) {
  assert(diagnostics.length > 0, `missing diagnostics for ${label}`);
  for (const diagnostic of diagnostics) {
    assert.equal(typeof diagnostic.code, "string", `invalid diagnostic code for ${label}`);
    assert(diagnostic.code.startsWith("schema."), `unexpected diagnostic namespace for ${label}`);
    assert.equal(diagnostic.severity, "error", `invalid diagnostic severity for ${label}`);
    assert(Array.isArray(diagnostic.path), `invalid diagnostic path for ${label}`);
    assert(Array.isArray(diagnostic.address), `invalid diagnostic address for ${label}`);
  }
}

test("seeded malformed schema trees are diagnosed without throws or mutation", () => {
  for (let seed = 1; seed <= 1000; seed += 1) {
    const schema = deepFreeze({
      id: "malformed-properties",
      version: 1,
      nodes: wrappedMalformedNodes(seed),
    });
    const before = JSON.stringify(schema);
    const result = evaluateSchema({ schema, value: {}, context: {}, meta, fields });
    const label = `seed ${seed}, case ${seed % 18}`;

    assert.equal(JSON.stringify(schema), before, `normalization mutated input for ${label}`);
    assert.equal(result.schema, schema, `normalization replaced the schema envelope for ${label}`);
    verifyDiagnostics(result.diagnostics, label);
  }
});

test("seeded invalid dynamic revisions retain the last valid controller tree", async () => {
  const schema = ({ context }) => ({
    id: "dynamic-malformed-properties",
    version: 1,
    nodes: context.invalidSeed === undefined
      ? [{ kind: "field", id: "name", type: "text", props: { version: "valid" } }]
      : wrappedMalformedNodes(context.invalidSeed),
  });
  const controller = stages({ schema, fields, value: { name: "Ada" }, context: {} });

  for (let seed = 1; seed <= 180; seed += 1) {
    controller.update({ context: deepFreeze({ invalidSeed: seed }) });
    await Promise.resolve();
    await Promise.resolve();
    const snapshot = controller.getSnapshot();
    assert.equal(snapshot.nodes.length, 1, `last valid tree missing for seed ${seed}`);
    assert.equal(snapshot.nodes[0].kind, "field", `last valid kind changed for seed ${seed}`);
    assert.equal(snapshot.nodes[0].id, "name", `last valid identity changed for seed ${seed}`);
    assert.deepEqual(snapshot.nodes[0].props, { version: "valid" }, `last valid props changed for seed ${seed}`);
    verifyDiagnostics(snapshot.diagnostics, `dynamic seed ${seed}`);
  }

  controller.update({ context: {} });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(controller.getSnapshot().diagnostics, []);
  assert.equal(controller.getSnapshot().nodes[0].value, "Ada");
  controller.destroy();
});
