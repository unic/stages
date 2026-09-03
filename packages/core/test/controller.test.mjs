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

test("controllers have independent batches and metadata", async () => {
  const firstChanges = [];
  const secondChanges = [];
  const first = stages({ schema, fields, value: { count: 0 }, onChange: (change) => firstChanges.push(change) });
  const second = stages({ schema, fields, value: { count: 0 }, onChange: (change) => secondChanges.push(change) });

  first.dispatch({ name: "focus", target: { kind: "field", path: ["count"] } });
  first.dispatch({ name: "input", target: { kind: "field", path: ["count"] }, payload: 7 });
  await tick();

  assert.equal(firstChanges.length, 1);
  assert.equal(secondChanges.length, 0);
  assert.equal(first.getSnapshot().nodes[0].state.focused, true);
  assert.equal(second.getSnapshot().nodes[0].state.focused, false);
});

test("conditional nodes retain metadata while structural removals discard it", async () => {
  const dynamicSchema = ({ context }) => ({
    id: "dynamic",
    version: 1,
    nodes: context.include
      ? [{ kind: "field", id: "count", type: "number", when: ({ value }) => value.show }]
      : [],
  });
  const controller = stages({
    schema: dynamicSchema,
    fields,
    value: { show: true, count: 0 },
    context: { include: true },
  });

  controller.dispatch({ name: "focus", target: { kind: "field", path: ["count"] } });
  controller.dispatch({ name: "blur", target: { kind: "field", path: ["count"] } });
  await tick();
  controller.update({ value: { show: false, count: 0 } });
  await tick();
  assert.equal(controller.getSnapshot().nodes.length, 0);

  controller.update({ value: { show: true, count: 0 } });
  await tick();
  assert.equal(controller.getSnapshot().nodes[0].state.touched, true);

  controller.update({ context: { include: false } });
  await tick();
  controller.update({ context: { include: true } });
  await tick();
  assert.equal(controller.getSnapshot().nodes[0].state.touched, false);
});

test("external updates make pending validation results stale", async () => {
  let release;
  const delayedSchema = {
    id: "delayed",
    version: 1,
    nodes: [{
      kind: "field",
      id: "count",
      type: "number",
      validators: [{
        id: "delayed-check",
        on: "submit",
        validate: () => new Promise((resolve) => { release = resolve; }),
      }],
    }],
  };
  const controller = stages({ schema: delayedSchema, fields, value: { count: 0 } });
  const pending = controller.validate({ event: "submit" });
  controller.update({ value: { count: 1 } });
  release([{ id: "old", code: "old", path: ["count"], severity: "error" }]);
  const result = await pending;

  assert.equal(result.status, "unknown");
  assert.equal(controller.getSnapshot().validation.status, "unknown");
});

test("selector subscribers skip structurally shared unaffected fields", async () => {
  const twoFieldSchema = {
    id: "two-fields",
    version: 1,
    nodes: [
      { kind: "field", id: "first", type: "number" },
      { kind: "field", id: "second", type: "number" },
    ],
  };
  let controller;
  controller = stages({
    schema: twoFieldSchema,
    fields,
    value: { first: 0, second: 0 },
    onChange: ({ value }) => controller.update({ value }),
  });
  const originalSecond = controller.getSnapshot().nodes[1];
  let secondChanges = 0;
  controller.subscribeSelector(
    (snapshot) => snapshot.nodes[1],
    () => { secondChanges += 1; },
  );

  controller.dispatch({ name: "input", target: { kind: "field", path: ["first"] }, payload: 4 });
  await tick();

  assert.equal(controller.getSnapshot().nodes[1], originalSecond);
  assert.equal(secondChanges, 0);
});

test("one hundred batched events publish once and reevaluate dynamics once", async () => {
  let factoryCalls = 0;
  let changes = 0;
  let notifications = 0;
  let controller;
  const factory = () => {
    factoryCalls += 1;
    return { id: "batched", version: 1, nodes: [{ kind: "field", id: "count", type: "number" }] };
  };
  controller = stages({
    schema: factory,
    fields,
    value: { count: 0 },
    onChange: ({ value }) => {
      changes += 1;
      controller.update({ value });
    },
  });
  controller.subscribe(() => { notifications += 1; });
  factoryCalls = 0;

  controller.batch(() => {
    for (let index = 1; index <= 100; index += 1) {
      controller.dispatch({ name: "input", target: { kind: "field", path: ["count"] }, payload: index });
    }
  });
  await tick();

  assert.equal(controller.getSnapshot().value.count, 100);
  assert.equal(changes, 1);
  assert.equal(notifications, 1);
  assert.equal(factoryCalls, 1);
});

test("async validation preserves declaration order and converts rejections", async () => {
  let releaseFirst;
  let releaseSecond;
  const asyncSchema = {
    id: "async-order",
    version: 1,
    nodes: [{
      kind: "field",
      id: "count",
      type: "number",
      validators: [
        {
          id: "first",
          on: "submit",
          validate: ({ path }) => new Promise((resolve) => {
            releaseFirst = () => resolve([{ id: "first", code: "first", path, severity: "warning" }]);
          }),
        },
        {
          id: "second",
          on: "submit",
          validate: ({ path }) => new Promise((resolve) => {
            releaseSecond = () => resolve([{ id: "second", code: "second", path, severity: "warning" }]);
          }),
        },
        {
          id: "failure",
          on: "submit",
          validate: async () => { throw new Error("service unavailable"); },
        },
      ],
    }],
  };
  const controller = stages({ schema: asyncSchema, fields, value: { count: 1 } });
  const pending = controller.validate({ event: "submit" });
  releaseSecond();
  releaseFirst();
  const result = await pending;

  assert.deepEqual(result.issues.map(({ id }) => id), ["first", "second", "failure.rejected"]);
  assert.equal(result.issues[2].code, "validator-rejected");
  assert.equal(result.issues[2].message, "service unavailable");
  assert.equal(result.status, "invalid");
});
