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

test("collection events create defaults, enforce constraints, and expose capabilities", async () => {
  const collectionFields = {
    text: { view: "text", initialValue: "" },
  };
  const collectionSchema = {
    id: "people",
    version: 1,
    nodes: [{
      kind: "collection",
      id: "people",
      min: 1,
      max: 2,
      itemKey: (item) => item.id,
      nodes: [{ kind: "field", id: "name", type: "text" }],
    }],
  };
  const changes = [];
  let controller;
  controller = stages({
    schema: collectionSchema,
    fields: collectionFields,
    value: { people: [{ id: "existing", name: "Ada" }] },
    onChange: (change) => {
      changes.push(change);
      const people = change.value.people.map((person, index) => person.id === undefined ? { ...person, id: `generated-${index}` } : person);
      controller.update({ value: { people } });
    },
  });
  const target = { kind: "node", address: [{ kind: "node", id: "people" }] };
  controller.dispatch({ name: "collection:add", target });
  await tick();

  assert.deepEqual(controller.getSnapshot().value.people, [
    { id: "existing", name: "Ada" },
    { id: "generated-1", name: "" },
  ]);
  const collection = controller.getSnapshot().nodes[0];
  assert.equal(collection.size, 2);
  assert.equal(collection.canAdd, false);
  assert.equal(collection.canRemove, true);
  assert.equal(collection.nodes[1].kind, "row");

  controller.dispatch({ name: "collection:add", target });
  await tick();
  assert.equal(changes.length, 1);
  assert.equal(controller.getSnapshot().diagnostics.at(-1).code, "collection.max");

  controller.dispatch({ name: "collection:remove", target, payload: { index: 1 } });
  await tick();
  controller.dispatch({ name: "collection:remove", target, payload: { index: 0 } });
  await tick();
  assert.equal(changes.length, 2);
  assert.equal(controller.getSnapshot().value.people.length, 1);
  assert.equal(controller.getSnapshot().diagnostics.at(-1).code, "collection.min");
});

test("union collection add writes its discriminator and variant defaults", async () => {
  const collectionFields = { text: { view: "text", initialValue: "" } };
  const schema = {
    id: "contacts",
    version: 1,
    nodes: [{
      kind: "collection",
      id: "contacts",
      discriminator: "kind",
      variants: {
        person: { nodes: [{ kind: "field", id: "name", type: "text" }] },
        company: { nodes: [{ kind: "field", id: "companyName", type: "text" }] },
      },
    }],
  };
  let controller;
  controller = stages({
    schema,
    fields: collectionFields,
    value: { contacts: [] },
    onChange: ({ value }) => controller.update({ value }),
  });
  controller.dispatch({
    name: "collection:add",
    target: { kind: "node", address: [{ kind: "node", id: "contacts" }] },
    payload: { variant: "company" },
  });
  await tick();

  assert.deepEqual(controller.getSnapshot().value.contacts, [{ kind: "company", companyName: "" }]);
});

test("nested wizard navigation changes metadata without proposing domain values", async () => {
  const wizardSchema = {
    id: "nested-wizard",
    version: 1,
    nodes: [{
      kind: "group",
      id: "account",
      nodes: [{
        kind: "wizard",
        id: "flow",
        initialStage: "intro",
        navigation: {
          nonLinear: true,
          guard: (value, _from, to) => to !== "confirm" || value.allowConfirm,
        },
        stages: [
          { id: "intro", nodes: [] },
          { id: "details", nodes: [] },
          { id: "confirm", nodes: [] },
        ],
      }],
    }],
  };
  let changes = 0;
  const controller = stages({
    schema: wizardSchema,
    fields: {},
    value: { allowConfirm: false, account: { flow: { intro: {}, details: {}, confirm: {} } } },
    onChange: () => { changes += 1; },
  });
  const address = [{ kind: "node", id: "account" }, { kind: "node", id: "flow" }];
  const wizard = () => controller.getSnapshot().nodes[0].nodes[0];
  assert.equal(wizard().activeStage, "intro");
  assert.equal(wizard().nodes[0].active, true);

  controller.dispatch({ name: "wizard:next", target: { kind: "node", address } });
  await tick();
  assert.equal(wizard().activeStage, "details");
  assert.equal(wizard().canPrevious, true);

  controller.dispatch({ name: "wizard:go", target: { kind: "node", address }, payload: { stage: "confirm" } });
  await tick();
  assert.equal(wizard().activeStage, "details");
  assert.equal(controller.getSnapshot().diagnostics.at(-1).code, "wizard.navigation-rejected");
  assert.equal(changes, 0);

  controller.update({ value: { allowConfirm: true, account: { flow: { intro: {}, details: {}, confirm: {} } } } });
  await tick();
  controller.dispatch({ name: "wizard:go", target: { kind: "node", address }, payload: "confirm" });
  await tick();
  assert.equal(wizard().activeStage, "confirm");

  const recreated = stages({ schema: wizardSchema, fields: {}, state: controller.serialize() });
  assert.equal(recreated.getSnapshot().nodes[0].nodes[0].activeStage, "confirm");
});

test("rejected collection commands do not run transforms or propose changes", async () => {
  const schema = {
    id: "rejected-command",
    version: 1,
    transforms: [{
      on: "collection:remove",
      apply: () => [{ op: "set", path: ["transformed"], value: true }],
    }],
    nodes: [{ kind: "collection", id: "items", min: 1, nodes: [] }],
  };
  let changes = 0;
  const controller = stages({
    schema,
    fields: {},
    value: { items: [{}], transformed: false },
    onChange: () => { changes += 1; },
  });
  controller.dispatch({
    name: "collection:remove",
    target: { kind: "node", address: [{ kind: "node", id: "items" }] },
    payload: { index: 0 },
  });
  await tick();

  assert.equal(changes, 0);
  assert.equal(controller.getSnapshot().value.transformed, false);
});

test("engine row keys and touched state follow rows through moves and recreation", async () => {
  const rowFields = {
    text: {
      view: "text",
      initialValue: "",
      reduce: ({ event }) => event.name === "input" ? { value: event.payload } : undefined,
    },
  };
  const schema = {
    id: "stable-rows",
    version: 1,
    nodes: [{
      kind: "collection",
      id: "items",
      nodes: [{ kind: "field", id: "name", type: "text" }],
    }],
  };
  let controller;
  controller = stages({
    schema,
    fields: rowFields,
    value: { items: [{ name: "first" }, { name: "second" }] },
    onChange: ({ value }) => controller.update({ value }),
  });
  const collectionAddress = [{ kind: "node", id: "items" }];
  const initialRows = controller.getSnapshot().nodes[0].nodes;
  const firstKey = initialRows[0].id;
  const secondKey = initialRows[1].id;
  controller.dispatch({ name: "focus", target: { kind: "field", path: ["items", 0, "name"] } });
  controller.dispatch({ name: "blur", target: { kind: "field", path: ["items", 0, "name"] } });
  await tick();

  controller.dispatch({
    name: "collection:move",
    target: { kind: "node", address: collectionAddress },
    payload: { from: 0, to: 1 },
  });
  await tick();
  const movedRows = controller.getSnapshot().nodes[0].nodes;
  assert.deepEqual(movedRows.map(({ id }) => id), [secondKey, firstKey]);
  assert.equal(movedRows[0].nodes[0].state.touched, false);
  assert.equal(movedRows[1].nodes[0].state.touched, true);

  const recreated = stages({ schema, fields: rowFields, state: controller.serialize() });
  const recreatedRows = recreated.getSnapshot().nodes[0].nodes;
  assert.deepEqual(recreatedRows.map(({ id }) => id), [secondKey, firstKey]);
  assert.equal(recreatedRows[1].nodes[0].state.touched, true);
});

test("row key moves remain proposals until asynchronous controlled acceptance", async () => {
  const schema = {
    id: "controlled-row-keys",
    version: 1,
    nodes: [{ kind: "collection", id: "items", nodes: [] }],
  };
  let proposed;
  const controller = stages({
    schema,
    fields: {},
    value: { items: [{ id: "first" }, { id: "second" }] },
    onChange: ({ value }) => { proposed = value; },
  });
  const target = { kind: "node", address: [{ kind: "node", id: "items" }] };
  const initialKeys = controller.getSnapshot().nodes[0].nodes.map(({ id }) => id);
  controller.dispatch({ name: "collection:move", target, payload: { from: 0, to: 1 } });
  await tick();

  assert.deepEqual(controller.getSnapshot().value.items.map(({ id }) => id), ["first", "second"]);
  assert.deepEqual(controller.getSnapshot().nodes[0].nodes.map(({ id }) => id), initialKeys);

  controller.update({ value: proposed });
  await tick();
  assert.deepEqual(controller.getSnapshot().value.items.map(({ id }) => id), ["second", "first"]);
  assert.deepEqual(controller.getSnapshot().nodes[0].nodes.map(({ id }) => id), [initialKeys[1], initialKeys[0]]);
});

test("active wizard stages reconcile when dynamic stages become dormant", async () => {
  const schema = {
    id: "conditional-stages",
    version: 1,
    nodes: [{
      kind: "wizard",
      id: "flow",
      navigation: { nonLinear: true },
      stages: [
        { id: "first", nodes: [] },
        { id: "second", when: ({ value }) => value.showSecond, nodes: [] },
      ],
    }],
  };
  const controller = stages({
    schema,
    fields: {},
    value: { showSecond: true, flow: { first: {}, second: {} } },
  });
  const target = { kind: "node", address: [{ kind: "node", id: "flow" }] };
  controller.dispatch({ name: "wizard:go", target, payload: "second" });
  await tick();
  assert.equal(controller.getSnapshot().nodes[0].activeStage, "second");

  controller.update({ value: { showSecond: false, flow: { first: {}, second: {} } } });
  await tick();
  const wizard = controller.getSnapshot().nodes[0];
  assert.equal(wizard.activeStage, "first");
  assert.deepEqual(wizard.visibleStageIds, ["first"]);
  assert.equal(wizard.nodes.length, 1);
});

test("dynamic factory failures preserve the previous valid tree and recover", async () => {
  const diagnostics = [];
  const schema = ({ value }) => {
    if (value.fail) throw new Error("factory exploded");
    return {
      id: "resilient-factory",
      version: 1,
      nodes: [{ kind: "field", id: "count", type: "number" }],
    };
  };
  const controller = stages({
    schema,
    fields,
    value: { count: 1, fail: false },
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  });
  controller.update({ value: { count: 2, fail: true } });
  await tick();
  assert.equal(controller.getSnapshot().nodes[0].value, 2);
  assert.equal(controller.getSnapshot().diagnostics[0].code, "schema.factory-failed");
  assert.match(controller.getSnapshot().diagnostics[0].message, /factory exploded/);

  controller.update({ value: { count: 3, fail: false } });
  await tick();
  assert.equal(controller.getSnapshot().nodes[0].value, 3);
  assert.deepEqual(controller.getSnapshot().diagnostics, []);
  assert.equal(diagnostics.some(({ code }) => code === "schema.factory-failed"), true);
});

test("invalid resolver output and unstable root identity do not replace a valid schema", async () => {
  const resolverSchema = {
    id: "stable-resolver",
    version: 1,
    nodes: [{
      kind: "field",
      id: "count",
      type: "number",
      deriveProps: ({ value }) => {
        if (value.fail) throw new Error("props exploded");
        return { label: `Count ${value.count}` };
      },
    }],
  };
  const resolverController = stages({
    schema: resolverSchema,
    fields,
    value: { count: 1, fail: false },
  });
  resolverController.update({ value: { count: 2, fail: true } });
  await tick();
  assert.deepEqual(resolverController.getSnapshot().nodes[0].props, { label: "Count 1" });
  assert.equal(resolverController.getSnapshot().diagnostics[0].code, "schema.resolver-failed");

  const identityController = stages({
    schema: ({ value }) => ({
      id: value.changeIdentity ? "changed" : "stable",
      version: 1,
      nodes: [{ kind: "field", id: "count", type: "number" }],
    }),
    fields,
    value: { count: 1, changeIdentity: false },
  });
  identityController.update({ value: { count: 2, changeIdentity: true } });
  await tick();
  assert.equal(identityController.serialize().schema.id, "stable");
  assert.equal(identityController.getSnapshot().diagnostics[0].code, "schema.identity-changed");
});
