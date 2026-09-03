import assert from "node:assert/strict";
import test from "node:test";
import { getAtPath, stages } from "../dist/index.js";

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

function verifySnapshot(snapshot, expectedValue, showExtra, label) {
  assert.deepEqual(snapshot.value, expectedValue, `canonical value mismatch at ${label}`);
  assert.equal(snapshot.diagnostics.length, 0, `unexpected diagnostics at ${label}`);
  assert.equal(snapshot.nodes.some((node) => node.id === "extra"), showExtra, `dynamic schema mismatch at ${label}`);

  const addresses = new Set();
  const visit = (nodes) => {
    for (const node of nodes) {
      const address = JSON.stringify(node.address);
      assert(!addresses.has(address), `duplicate address ${address} at ${label}`);
      addresses.add(address);
      assert.equal(node.state.visible, true, `dormant node leaked into snapshot at ${label}`);
      if (node.kind === "field") {
        assert.deepEqual(node.value, getAtPath(expectedValue, node.path), `field value mismatch at ${label}`);
      } else {
        visit(node.nodes);
      }
    }
  };
  visit(snapshot.nodes);

  const collection = snapshot.nodes.find((node) => node.id === "items");
  assert.equal(collection?.kind, "collection", `collection missing at ${label}`);
  assert.equal(collection.size, expectedValue.items.length, `collection size mismatch at ${label}`);
  assert.equal(collection.nodes.length, expectedValue.items.length, `row count mismatch at ${label}`);
}

test("seeded controller transactions preserve controlled and dynamic-schema invariants", async () => {
  const fields = {
    number: {
      view: "number",
      initialValue: 0,
      reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
        ? { value: event.payload }
        : undefined,
    },
    toggle: {
      view: "toggle",
      initialValue: false,
      reduce: ({ event }) => event.name === "input" && typeof event.payload === "boolean"
        ? { value: event.payload }
        : undefined,
    },
  };
  const baseNodes = [
    { kind: "field", id: "count", type: "number" },
    { kind: "field", id: "enabled", type: "toggle" },
    {
      kind: "collection",
      id: "items",
      min: 1,
      itemKey: (item) => item.id,
      nodes: [{ kind: "field", id: "score", type: "number" }],
    },
  ];
  const extraNode = { kind: "field", id: "extra", type: "number" };
  const collectionTarget = { kind: "node", address: [{ kind: "node", id: "items" }] };

  for (let seed = 1; seed <= 20; seed += 1) {
    const next = random(seed * 104729);
    let model = deepFreeze({
      count: 0,
      enabled: false,
      extra: seed,
      items: [{ id: `initial-${seed}`, score: seed }],
    });
    let context = deepFreeze({ showExtra: seed % 2 === 0 });
    let factoryCalls = 0;
    let notifications = 0;
    const changes = [];
    let controller;
    controller = stages({
      schema: ({ context: currentContext }) => {
        factoryCalls += 1;
        return {
          id: "controller-properties",
          version: 1,
          nodes: currentContext.showExtra ? [...baseNodes, extraNode] : baseNodes,
        };
      },
      fields,
      value: model,
      context,
      onChange: (change) => {
        changes.push(change);
        controller.update({ value: change.value });
      },
    });
    controller.subscribe(() => { notifications += 1; });
    factoryCalls = 0;

    for (let step = 0; step < 60; step += 1) {
      const operation = integer(next, 0, 8);
      const before = model;
      const beforeSerialized = JSON.stringify(before);
      const changesBefore = changes.length;
      const notificationsBefore = notifications;
      factoryCalls = 0;
      let expectsChange = false;

      if (operation === 0) {
        const count = integer(next, -1000, 1000);
        model = deepFreeze({ ...model, count });
        expectsChange = count !== before.count;
        controller.dispatch({ name: "input", target: { kind: "field", path: ["count"] }, payload: count });
      } else if (operation === 1) {
        const enabled = !model.enabled;
        model = deepFreeze({ ...model, enabled });
        expectsChange = true;
        controller.dispatch({ name: "input", target: { kind: "field", path: ["enabled"] }, payload: enabled });
      } else if (operation === 2) {
        const finalCount = integer(next, -1000, 1000);
        model = deepFreeze({ ...model, count: finalCount });
        expectsChange = finalCount !== before.count;
        controller.batch(() => {
          for (let offset = 2; offset >= 0; offset -= 1) {
            controller.dispatch({
              name: "input",
              target: { kind: "field", path: ["count"] },
              payload: finalCount - offset,
            });
          }
        });
      } else if (operation === 3) {
        model = deepFreeze({ ...model, count: integer(next, -1000, 1000) });
        controller.update({ value: model });
      } else if (operation === 4) {
        context = deepFreeze({ showExtra: !context.showExtra });
        controller.update({ context });
      } else if (operation === 5) {
        controller.dispatch({ name: "focus", target: { kind: "field", path: ["count"] } });
        controller.dispatch({ name: "blur", target: { kind: "field", path: ["count"] } });
      } else if (operation === 6) {
        const item = deepFreeze({ id: `item-${seed}-${step}`, score: integer(next, -100, 100) });
        model = deepFreeze({ ...model, items: [...model.items, item] });
        expectsChange = true;
        controller.dispatch({ name: "collection:add", target: collectionTarget, payload: { value: item } });
      } else if (operation === 7 && model.items.length > 1) {
        const index = integer(next, 0, model.items.length - 1);
        model = deepFreeze({ ...model, items: model.items.filter((_, itemIndex) => itemIndex !== index) });
        expectsChange = true;
        controller.dispatch({ name: "collection:remove", target: collectionTarget, payload: { index } });
      } else if (model.items.length > 1) {
        const from = integer(next, 0, model.items.length - 1);
        let to = integer(next, 0, model.items.length - 2);
        if (to >= from) to += 1;
        const items = model.items.slice();
        const [item] = items.splice(from, 1);
        items.splice(to, 0, item);
        model = deepFreeze({ ...model, items });
        expectsChange = true;
        controller.dispatch({ name: "collection:move", target: collectionTarget, payload: { from, to } });
      } else {
        const item = deepFreeze({ id: `fallback-${seed}-${step}`, score: step });
        model = deepFreeze({ ...model, items: [...model.items, item] });
        expectsChange = true;
        controller.dispatch({ name: "collection:add", target: collectionTarget, payload: { value: item } });
      }

      await Promise.resolve();
      await Promise.resolve();
      const label = `seed ${seed}, step ${step}, operation ${operation}`;
      assert.equal(JSON.stringify(before), beforeSerialized, `input mutated at ${label}`);
      assert(factoryCalls <= 1, `schema factory ran ${factoryCalls} times at ${label}`);
      assert.equal(changes.length - changesBefore, expectsChange ? 1 : 0, `proposal count mismatch at ${label}`);
      if (expectsChange) assert.deepEqual(changes.at(-1).value, model, `proposal value mismatch at ${label}`);
      assert.equal(notifications - notificationsBefore, 1, `notification count mismatch at ${label}`);
      verifySnapshot(controller.getSnapshot(), model, context.showExtra, label);
    }
    controller.destroy();
  }
});
