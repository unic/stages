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

const fields = {
  text: {
    view: "text",
    initialValue: "",
    reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
      ? { value: event.payload }
      : undefined,
  },
};

const wrapperKinds = ["group", "collection", "variant", "wizard"];

function sequencesThrough(maxDepth) {
  const output = [];
  let current = [[]];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    current = current.flatMap((sequence) => wrapperKinds.map((kind) => [...sequence, kind]));
    output.push(...current);
  }
  return output;
}

function wrap(kind, depth, inner) {
  const id = `${kind}-${depth}`;
  const nodeAddress = { kind: "node", id };
  if (kind === "group") {
    return {
      node: { kind: "group", id, nodes: [inner.node] },
      value: { [id]: inner.value },
      path: [id, ...inner.path],
      address: [nodeAddress, ...inner.address],
    };
  }

  const rowId = `row-${kind}-${depth}`;
  if (kind === "collection") {
    return {
      node: { kind: "collection", id, itemKey: () => rowId, nodes: [inner.node] },
      value: { [id]: [inner.value] },
      path: [id, 0, ...inner.path],
      address: [nodeAddress, { kind: "row", id: rowId }, ...inner.address],
    };
  }
  if (kind === "variant") {
    return {
      node: {
        kind: "collection",
        id,
        itemKey: () => rowId,
        discriminator: "variant",
        variants: { entry: { nodes: [inner.node] } },
      },
      value: { [id]: [{ variant: "entry", ...inner.value }] },
      path: [id, 0, ...inner.path],
      address: [nodeAddress, { kind: "row", id: rowId }, ...inner.address],
    };
  }

  const stageId = `stage-${depth}`;
  return {
    node: { kind: "wizard", id, stages: [{ id: stageId, nodes: [inner.node] }] },
    value: { [id]: { [stageId]: inner.value } },
    path: [id, stageId, ...inner.path],
    address: [nodeAddress, { kind: "node", id: stageId }, ...inner.address],
  };
}

function fixture(sequence) {
  let current = {
    node: {
      kind: "field",
      id: "leaf",
      type: "text",
      validators: [{
        id: "required",
        on: "submit",
        validate: ({ fieldValue, path }) => fieldValue === ""
          ? [{ id: "required", code: "required", path, severity: "error" }]
          : [],
      }],
    },
    value: { leaf: "Ada" },
    path: ["leaf"],
    address: [{ kind: "node", id: "leaf" }],
  };
  for (let index = sequence.length - 1; index >= 0; index -= 1) {
    current = wrap(sequence[index], index, current);
  }
  return current;
}

function normalizedLeaf(node) {
  return node.config.kind === "field" ? node : normalizedLeaf(node.children[0]);
}

function snapshotLeaf(node) {
  if (node.kind === "field") return node;
  const child = node.nodes[0];
  if (child.kind === "row" || child.kind === "stage") return snapshotLeaf(child.nodes[0]);
  return snapshotLeaf(child);
}

test("every structural nesting permutation and a deep mixed tree preserve runtime contracts", async () => {
  const sequences = sequencesThrough(3);
  assert.equal(sequences.length, 84);
  const deepSequence = Array.from({ length: 32 }, (_, index) => wrapperKinds[index % wrapperKinds.length]);

  for (const sequence of [...sequences, deepSequence]) {
    const label = sequence.join(" > ");
    const built = fixture(sequence);
    const schema = { id: `nesting-${sequence.join("-")}`, version: 1, nodes: [built.node] };
    const evaluated = evaluateSchema({ schema, value: built.value, context: {}, meta, fields });
    assert.deepEqual(evaluated.diagnostics, [], `${label}: schema diagnostics`);
    const evaluatedField = normalizedLeaf(evaluated.nodes[0]);
    assert.deepEqual(evaluatedField.path, built.path, `${label}: evaluated path`);
    assert.deepEqual(evaluatedField.address, built.address, `${label}: evaluated address`);

    let controller;
    controller = stages({
      schema,
      fields,
      value: built.value,
      onChange: ({ value }) => controller.update({ value }),
    });
    let field = snapshotLeaf(controller.getSnapshot().nodes[0]);
    assert.deepEqual(field.path, built.path, `${label}: snapshot path`);
    assert.deepEqual(field.address, built.address, `${label}: snapshot address`);
    assert.equal(field.value, "Ada", `${label}: initial field value`);

    controller.dispatch({
      name: "input",
      target: { kind: "field", path: built.path },
      payload: "Grace",
    });
    await Promise.resolve();
    field = snapshotLeaf(controller.getSnapshot().nodes[0]);
    assert.equal(field.value, "Grace", `${label}: dispatched field value`);
    assert.equal(
      (await controller.validate({ scope: { path: built.path }, event: "submit" })).isValid,
      true,
      `${label}: scoped validation`,
    );

    const state = controller.serialize();
    controller.destroy();
    const recreated = stages({ schema, fields, state });
    field = snapshotLeaf(recreated.getSnapshot().nodes[0]);
    assert.equal(field.value, "Grace", `${label}: recreated field value`);
    assert.deepEqual(field.address, built.address, `${label}: recreated address`);
    recreated.destroy();
  }
});
