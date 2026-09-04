import assert from "node:assert/strict";
import test from "node:test";
import { fieldEvent, formEvent, nodeEvent, stages } from "@stages/core";
import {
  EVENT_LAUNCH_AGENDA_ADDRESS,
  EVENT_LAUNCH_TICKETS_ADDRESS,
  EVENT_LAUNCH_WIZARD_ADDRESS,
  createAgendaItem,
  createEventLaunchFields,
  createEventLaunchSchema,
  defaultEventLaunchContext,
  defaultEventLaunchValue,
  eventLaunchValueCodec,
} from "../dist/index.js";

const fields = createEventLaunchFields({ text: "text", textarea: "textarea", choice: "choice", number: "number", money: "money", checkbox: "checkbox" });
const schema = createEventLaunchSchema();
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const clone = (value) => structuredClone(value);

function createHarness(options = {}) {
  const changes = [];
  let controller;
  const context = { ...defaultEventLaunchContext, validationDelayMs: options.delay ?? 5 };
  const config = {
    schema,
    fields,
    context,
    onChange(change) {
      changes.push(change);
      controller.update({ value: change.value });
    },
    ...(options.codec === undefined ? {} : { codec: options.codec }),
  };
  controller = options.state === undefined
    ? stages({ ...config, value: clone(options.value ?? defaultEventLaunchValue) })
    : stages({ ...config, state: options.state });
  return { controller, changes, context };
}

function wizard(controller) {
  const node = controller.getSnapshot().nodes[0];
  assert.equal(node.kind, "wizard");
  return node;
}

function rows(controller, collectionId) {
  const visit = (nodes) => {
    for (const node of nodes) {
      if (node.kind !== "field") {
        if (node.kind === "collection" && node.id === collectionId) return node.nodes.filter((child) => child.kind === "row");
        const nested = visit(node.nodes);
        if (nested !== undefined) return nested;
      }
    }
    return undefined;
  };
  return visit(controller.getSnapshot().nodes) ?? [];
}

test("controlled changes stay proposals until the owner accepts them", async () => {
  const changes = [];
  const controller = stages({ schema, fields, context: { ...defaultEventLaunchContext, validationDelayMs: 0 }, value: clone(defaultEventLaunchValue), onChange: (change) => changes.push(change) });
  controller.dispatch(fieldEvent("input", ["launch", "basics", "identity", "title"], { payload: "Proposed title" }));
  await tick();
  assert.equal(changes.length, 1);
  assert.equal(controller.getSnapshot().value.launch.basics.identity.title, defaultEventLaunchValue.launch.basics.identity.title);
  controller.update({ value: changes[0].value });
  assert.equal(controller.getSnapshot().value.launch.basics.identity.title, "Proposed title");
  controller.destroy();
});

test("the example codec keeps empty numeric draft values durable", () => {
  const value = clone(defaultEventLaunchValue);
  value.launch.tickets.tiers[0].price = undefined;
  const { controller } = createHarness({ value, codec: eventLaunchValueCodec });
  const state = controller.serialize();
  assert.equal(state.value.launch.tickets.tiers[0].price, null);
  const restored = createHarness({ state, codec: eventLaunchValueCodec }).controller;
  assert.equal(restored.getSnapshot().value.launch.tickets.tiers[0].price, undefined);
  restored.destroy();
  controller.destroy();
});

test("the conference template is one ordered transaction", async () => {
  const { controller, changes } = createHarness();
  controller.dispatch(formEvent("apply-template"));
  await tick();
  assert.equal(changes.length, 1);
  assert.equal(changes[0].events[0].name, "apply-template");
  assert.deepEqual(changes[0].patches.map((patch) => patch.path.at(-1)), ["title", "slug", "description", "startsAt", "endsAt", "deliveryMode", "items"]);
  assert.equal(controller.getSnapshot().value.launch.basics.identity.title, "Product Systems Conference");
  controller.destroy();
});

test("value and context changes reconcile visible and active stages without losing dormant values", async () => {
  const { controller, context, changes } = createHarness();
  assert.deepEqual(wizard(controller).visibleStageIds, ["basics", "venue", "streaming", "agenda", "tickets", "review"]);
  controller.dispatch(fieldEvent("input", ["launch", "basics", "deliveryMode"], { payload: "virtual" }));
  controller.dispatch(fieldEvent("input", ["launch", "basics", "accessModel"], { payload: "free" }));
  await tick();
  assert.deepEqual(wizard(controller).visibleStageIds, ["basics", "streaming", "agenda", "review"]);
  assert.equal(controller.getSnapshot().value.launch.venue.name, "Kraftwerk");
  const changesBeforeContext = changes.length;
  controller.update({ context: { ...context, requiresDataProcessingAgreement: true } });
  assert.deepEqual(wizard(controller).visibleStageIds, ["basics", "streaming", "agenda", "compliance", "review"]);
  assert.equal(changes.length, changesBeforeContext);
  controller.destroy();
});

test("async slug checks cancel stale work and retain the newest result", async () => {
  const { controller } = createHarness({ delay: 25 });
  controller.dispatch(fieldEvent("input", ["launch", "basics", "identity", "slug"], { payload: "stages-conf" }));
  controller.dispatch(fieldEvent("input", ["launch", "basics", "identity", "slug"], { payload: "available-event" }));
  await new Promise((resolve) => setTimeout(resolve, 45));
  const result = await controller.validate({ scope: { path: ["launch", "basics", "identity", "slug"] }, event: "submit", reveal: true });
  assert.equal(result.status, "valid");
  assert.equal(result.issues.some((entry) => entry.code === "slug-reserved"), false);
  controller.destroy();
});

test("wizard navigation is gated by scoped validation and the paid review guard", async () => {
  const { controller } = createHarness();
  controller.dispatch(nodeEvent("wizard:next", EVENT_LAUNCH_WIZARD_ADDRESS));
  await tick();
  assert.equal(wizard(controller).activeStage, "basics");
  controller.dispatch(fieldEvent("input", ["launch", "basics", "identity", "slug"], { payload: "available-event" }));
  await tick();
  const basics = wizard(controller).nodes.find((stage) => stage.id === "basics");
  assert.ok(basics);
  assert.equal((await controller.validate({ scope: { address: basics.address }, event: "submit", reveal: true })).isValid, true);
  controller.dispatch(nodeEvent("wizard:next", EVENT_LAUNCH_WIZARD_ADDRESS));
  await tick();
  assert.equal(wizard(controller).activeStage, "venue");
  controller.destroy();
});

test("agenda variants and standard collection commands preserve stable identity", async () => {
  const { controller } = createHarness();
  const original = rows(controller, "items").map((row) => row.id);
  controller.dispatch(nodeEvent("collection:add", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { value: createAgendaItem("workshop", "agenda-workshop-test") } }));
  await tick();
  const afterAdd = rows(controller, "items");
  assert.deepEqual(afterAdd.slice(0, 2).map((row) => row.id), original);
  assert.deepEqual(afterAdd[2].nodes.filter((node) => node.kind === "field").map((node) => node.id), ["title", "facilitator", "durationMinutes", "capacity"]);
  controller.dispatch(nodeEvent("collection:move", afterAdd[2].address, { payload: { to: 0 } }));
  await tick();
  assert.equal(rows(controller, "items")[0].id, afterAdd[2].id);
  const moved = rows(controller, "items")[0];
  controller.dispatch(nodeEvent("collection:replace", moved.address, { payload: { value: { id: "agenda-workshop-test", kind: "session", title: "Converted", speaker: "Ada", durationMinutes: 30 } } }));
  await tick();
  assert.equal(rows(controller, "items")[0].id, moved.id);
  controller.dispatch(nodeEvent("collection:sort", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { order: [1, 2, 0] } }));
  await tick();
  assert.equal(rows(controller, "items")[2].id, moved.id);
  controller.destroy();
});

test("ticket limits reject mutation and serialization restores metadata, rows, and active stage", async () => {
  const { controller, changes } = createHarness();
  controller.dispatch(nodeEvent("collection:remove", EVENT_LAUNCH_TICKETS_ADDRESS, { payload: { index: 0 } }));
  await tick();
  assert.equal(changes.length, 0);
  assert.equal(controller.getSnapshot().diagnostics.at(-1).code, "collection.min");
  controller.dispatch(fieldEvent("focus", ["launch", "basics", "identity", "title"]));
  controller.dispatch(fieldEvent("blur", ["launch", "basics", "identity", "title"]));
  await controller.validate({ scope: { path: ["launch", "basics", "identity", "slug"] }, event: "submit", reveal: true });
  const state = controller.serialize();
  const restored = createHarness({ state }).controller;
  assert.deepEqual(restored.serialize().meta.touched, state.meta.touched);
  assert.deepEqual(rows(restored, "items").map((row) => row.id), rows(controller, "items").map((row) => row.id));
  assert.equal(wizard(restored).activeStage, wizard(controller).activeStage);
  restored.destroy();
  controller.destroy();
});

test("full validation reports exact domain paths and excludes hidden paid-ticket failures", async () => {
  const value = clone(defaultEventLaunchValue);
  value.launch.basics.identity.slug = "available-event";
  value.launch.agenda.items.push({ id: "agenda-duplicate", kind: "session", title: "Opening keynote", speaker: "Grace", durationMinutes: 30 });
  value.launch.tickets.tiers[0].price = 0;
  const { controller } = createHarness({ value });
  const paid = await controller.validate({ scope: "form", event: "submit", reveal: true });
  assert.ok(paid.issues.some((entry) => entry.path.join(".") === "launch.agenda.items.2.title"));
  assert.ok(paid.issues.some((entry) => entry.path.join(".") === "launch.tickets.tiers.0.price"));
  controller.dispatch(fieldEvent("input", ["launch", "basics", "accessModel"], { payload: "free" }));
  await tick();
  const free = await controller.validate({ scope: "form", event: "submit", reveal: true });
  assert.equal(free.issues.some((entry) => entry.path.join(".").startsWith("launch.tickets")), false);
  controller.destroy();
});
