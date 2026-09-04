import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSchema } from "../dist/schema.js";
import { buildSnapshotNodes } from "../dist/snapshot.js";

const fields = { text: { view: "input", initialValue: "" } };
const meta = {
  revision: 0,
  isDirty: false,
  touched: [],
  visited: [],
  activeWizards: new Map(),
  extensions: {},
};
const interaction = {
  focused: new Set(),
  touched: new Set(),
  visited: new Set(),
  activeWizards: new Map(),
};

function snapshots(nodes, value, baseline, previousNodes = [], issues = []) {
  return buildSnapshotNodes({
    nodes,
    value,
    baseline,
    fields,
    interaction,
    issues,
    visibleIssues: issues,
    validationByAddress: new Map(),
    previousNodes,
  });
}

test("snapshot fields derive state and associate issues by exact path", () => {
  const value = { first: "changed", nested: { first: "unrelated" } };
  const result = evaluateSchema({
    schema: { id: "fields", version: 1, nodes: [{ kind: "field", id: "first", type: "text" }] },
    value,
    context: {},
    meta,
    fields,
  });
  const issue = { id: "required", code: "required", path: ["first"], severity: "error" };
  const unrelated = { id: "nested", code: "nested", path: ["nested", "first"], severity: "error" };
  const [field] = snapshots(result.nodes, value, { first: "initial" }, [], [issue, unrelated]);

  assert.equal(field.kind, "field");
  assert.equal(field.view, "input");
  assert.equal(field.initialValue, "initial");
  assert.equal(field.state.dirty, true);
  assert.deepEqual(field.state.issues, [issue]);
});

test("snapshot construction recursively reuses unchanged node references", () => {
  const baseline = { first: "one", second: "two" };
  const result = evaluateSchema({
    schema: {
      id: "sharing",
      version: 1,
      nodes: [
        { kind: "field", id: "first", type: "text" },
        { kind: "field", id: "second", type: "text" },
      ],
    },
    value: baseline,
    context: {},
    meta,
    fields,
  });
  const previous = snapshots(result.nodes, baseline, baseline);
  const next = snapshots(result.nodes, { ...baseline, first: "changed" }, baseline, previous);

  assert.notEqual(next[0], previous[0]);
  assert.equal(next[1], previous[1]);
});
