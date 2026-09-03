import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { stages } from "../packages/core/dist/index.js";

// source:start performance-budgets
const budgets = Object.freeze({
  initialization: Object.freeze({
    fields: 1000,
    maximumFactoryEvaluations: 2,
    maximumResolverEvaluationsPerField: 2,
    maximumMilliseconds: 750,
  }),
  batch: Object.freeze({
    fields: 500,
    events: 1000,
    maximumFactoryEvaluations: 1,
    maximumResolverEvaluationsPerField: 1,
    maximumChangeCallbacks: 1,
    maximumNotifications: 1,
    maximumMilliseconds: 1500,
  }),
  selectors: Object.freeze({
    fields: 1000,
    maximumChangedSelectors: 1,
    maximumNotifications: 1,
    maximumMilliseconds: 1500,
  }),
  totalMaximumMilliseconds: 3000,
});
// source:end performance-budgets

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const numberField = {
  view: "number",
  initialValue: 0,
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
    ? { value: event.payload }
    : undefined,
};
const fields = { number: numberField };

function fieldNodes(count, extra = () => ({})) {
  return Array.from({ length: count }, (_, index) => ({
    kind: "field",
    id: `field${index}`,
    type: "number",
    ...extra(index),
  }));
}

function fieldValue(count) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => [`field${index}`, index]));
}

function assertWithinBudget(name, elapsed, maximum) {
  assert(
    elapsed <= maximum,
    `${name} exceeded its ${maximum}ms budget: ${elapsed.toFixed(2)}ms.`,
  );
}

function measureInitialization() {
  let factoryCalls = 0;
  let resolverCalls = 0;
  const nodes = fieldNodes(budgets.initialization.fields, () => ({
    deriveProps: () => {
      resolverCalls += 1;
      return {};
    },
  }));
  const started = performance.now();
  const controller = stages({
    schema: () => {
      factoryCalls += 1;
      return { id: "performance-initialization", version: 1, nodes };
    },
    fields,
    value: fieldValue(budgets.initialization.fields),
  });
  const elapsed = performance.now() - started;

  assert.equal(controller.getSnapshot().nodes.length, budgets.initialization.fields);
  assert(
    factoryCalls >= 1 && factoryCalls <= budgets.initialization.maximumFactoryEvaluations,
    "Initialization exceeded its schema factory evaluation budget.",
  );
  assert(
    resolverCalls >= budgets.initialization.fields
      && resolverCalls <= budgets.initialization.fields * budgets.initialization.maximumResolverEvaluationsPerField,
    "Initialization exceeded its resolver evaluation budget.",
  );
  assertWithinBudget("Initialization", elapsed, budgets.initialization.maximumMilliseconds);
  controller.destroy();
  return elapsed;
}

async function measureBatch() {
  let factoryCalls = 0;
  let resolverCalls = 0;
  let changes = 0;
  let notifications = 0;
  const nodes = fieldNodes(budgets.batch.fields, () => ({
    deriveProps: () => {
      resolverCalls += 1;
      return {};
    },
  }));
  let controller;
  controller = stages({
    schema: () => {
      factoryCalls += 1;
      return { id: "performance-batch", version: 1, nodes };
    },
    fields,
    value: fieldValue(budgets.batch.fields),
    onChange: ({ value }) => {
      changes += 1;
      controller.update({ value });
    },
  });
  controller.subscribe(() => { notifications += 1; });
  factoryCalls = 0;
  resolverCalls = 0;

  const started = performance.now();
  controller.batch(() => {
    for (let index = 1; index <= budgets.batch.events; index += 1) {
      controller.dispatch({
        name: "input",
        target: { kind: "field", path: ["field0"] },
        payload: index,
      });
    }
  });
  await settle();
  const elapsed = performance.now() - started;

  assert.equal(controller.getSnapshot().value.field0, budgets.batch.events);
  assert.equal(changes, budgets.batch.maximumChangeCallbacks, "Batch must use its one controlled change callback.");
  assert.equal(notifications, budgets.batch.maximumNotifications, "Batch must use its one general notification.");
  assert.equal(factoryCalls, budgets.batch.maximumFactoryEvaluations, "Batch must use one schema evaluation.");
  assert.equal(
    resolverCalls,
    budgets.batch.fields * budgets.batch.maximumResolverEvaluationsPerField,
    "Batch must resolve each active field once.",
  );
  assertWithinBudget("Batched dispatch", elapsed, budgets.batch.maximumMilliseconds);
  controller.destroy();
  return elapsed;
}

async function measureSelectors() {
  const nodes = fieldNodes(budgets.selectors.fields);
  let notifications = 0;
  let changedSelectors = 0;
  let controller;
  controller = stages({
    schema: { id: "performance-selectors", version: 1, nodes },
    fields,
    value: fieldValue(budgets.selectors.fields),
    onChange: ({ value }) => controller.update({ value }),
  });
  controller.subscribe(() => { notifications += 1; });
  for (let index = 0; index < budgets.selectors.fields; index += 1) {
    controller.subscribeSelector(
      (snapshot) => snapshot.nodes[index],
      () => { changedSelectors += 1; },
    );
  }

  const started = performance.now();
  controller.dispatch({ name: "input", target: { kind: "field", path: ["field0"] }, payload: -1 });
  await settle();
  const elapsed = performance.now() - started;

  assert.equal(controller.getSnapshot().value.field0, -1);
  assert.equal(notifications, budgets.selectors.maximumNotifications, "Field update must publish once.");
  assert.equal(changedSelectors, budgets.selectors.maximumChangedSelectors, "Exactly one field selector must publish.");
  assertWithinBudget("Selector fan-out", elapsed, budgets.selectors.maximumMilliseconds);
  controller.destroy();
  return elapsed;
}

const totalStarted = performance.now();
const initialization = measureInitialization();
const batch = await measureBatch();
const selectors = await measureSelectors();
const total = performance.now() - totalStarted;
assertWithinBudget("Combined performance gate", total, budgets.totalMaximumMilliseconds);

console.log(JSON.stringify({
  budgets,
  measuredMilliseconds: {
    initialization: Number(initialization.toFixed(2)),
    batch: Number(batch.toFixed(2)),
    selectors: Number(selectors.toFixed(2)),
    total: Number(total.toFixed(2)),
  },
}, null, 2));
