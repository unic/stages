import assert from "node:assert/strict";
import test from "node:test";
import { stages } from "../dist/index.js";

const fields = {
  number: {
    view: "number",
    initialValue: 0,
    reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
      ? { value: event.payload }
      : undefined,
  },
};

const schema = {
  id: "counter",
  version: 1,
  nodes: [{
    kind: "field",
    id: "count",
    type: "number",
    validators: [{
      id: "positive",
      on: "submit",
      validate: ({ fieldValue, path }) => fieldValue > 0
        ? []
        : [{ id: "positive", code: "positive", path, severity: "error" }],
    }],
  }],
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("a batch proposes once and remains controlled until accepted", async () => {
  const changes = [];
  let notifications = 0;
  const controller = stages({ schema, fields, value: { count: 0 }, onChange: (change) => changes.push(change) });
  controller.subscribe(() => { notifications += 1; });

  controller.batch(() => {
    controller.dispatch({ name: "input", target: { kind: "field", path: ["count"] }, payload: 1 });
    controller.dispatch({ name: "input", target: { kind: "field", path: ["count"] }, payload: 2 });
  });
  await tick();

  assert.equal(changes.length, 1);
  assert.equal(changes[0].value.count, 2);
  assert.equal(changes[0].events.length, 2);
  assert.equal(controller.getSnapshot().value.count, 0);
  assert.equal(notifications, 1);

  controller.update({ value: changes[0].value });
  await tick();
  assert.equal(controller.getSnapshot().value.count, 2);
  assert.equal(notifications, 2);
});

test("synchronous acceptance and validation are deterministic", async () => {
  let controller;
  let notifications = 0;
  controller = stages({
    schema,
    fields,
    value: { count: 0 },
    onChange: ({ value }) => controller.update({ value }),
  });
  controller.subscribe(() => { notifications += 1; });
  controller.dispatch({ name: "input", target: { kind: "field", path: ["count"] }, payload: 3 });
  await tick();

  assert.equal(controller.getSnapshot().value.count, 3);
  assert.equal(notifications, 1);
  assert.deepEqual(await controller.validate({ event: "submit", reveal: true }), {
    status: "valid",
    isValid: true,
    issues: [],
    visibleIssues: [],
    pendingCount: 0,
    unknownCount: 0,
  });
});

test("serialization rejects values that JSON would silently lose", () => {
  const controller = stages({ schema, fields, value: { count: Number.NaN } });
  assert.throws(() => controller.serialize(), /Non-finite number at \["count"\]/);
});
