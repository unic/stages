import assert from "node:assert/strict";
import test from "node:test";
import "@angular/compiler";
import { stages } from "../../core/dist/index.js";
import {
  StagesFieldComponent,
  collectionSignal,
  fieldSignal,
  stagesSignal,
  wizardSignal,
} from "../dist/index.js";

function destroyScope() {
  const callbacks = [];
  return {
    ref: {
      destroyed: false,
      onDestroy(callback) {
        callbacks.push(callback);
        return () => callbacks.splice(callbacks.indexOf(callback), 1);
      },
    },
    destroy() {
      this.ref.destroyed = true;
      for (const callback of callbacks.splice(0)) callback();
    },
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("Angular signals follow controller snapshots and unsubscribe with DestroyRef", async () => {
  const scope = destroyScope();
  const TextView = class {};
  let controller;
  controller = stages({
    schema: { id: "angular-field", version: 1, nodes: [{ kind: "field", id: "name", type: "text" }] },
    fields: {
      text: {
        view: TextView,
        initialValue: "",
        reduce: ({ event }) => event.name === "input" ? { value: event.payload } : undefined,
      },
    },
    value: { name: "Ada" },
    onChange: ({ value }) => controller.update({ value }),
  });
  const snapshot = stagesSignal(controller, scope.ref);
  const field = fieldSignal(controller, ["name"], scope.ref);
  assert.equal(snapshot().value.name, "Ada");
  assert.equal(field().value, "Ada");
  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Grace" });
  await tick();
  assert.equal(snapshot().value.name, "Grace");
  assert.equal(field().value, "Grace");
  const revision = snapshot().revision;
  scope.destroy();
  controller.update({ value: { name: "unobserved" } });
  assert.equal(snapshot().revision, revision);
  assert.equal(typeof StagesFieldComponent.ɵcmp, "object");
});

test("Angular collection and wizard signals expose stable structural commands", async () => {
  const scope = destroyScope();
  let controller;
  controller = stages({
    schema: {
      id: "angular-structure",
      version: 1,
      nodes: [{
        kind: "wizard",
        id: "flow",
        stages: [
          { id: "first", nodes: [{ kind: "collection", id: "items", itemKey: (item) => item.id, nodes: [] }] },
          { id: "second", nodes: [] },
        ],
      }],
    },
    fields: {},
    value: { flow: { first: { items: [{ id: "a" }, { id: "b" }] }, second: {} } },
    onChange: ({ value }) => controller.update({ value }),
  });
  const collection = collectionSignal(controller, ["flow", "first", "items"], scope.ref);
  const wizard = wizardSignal(controller, ["flow"], scope.ref);
  const savedFirst = collection().items[0];
  savedFirst.moveTo(1);
  await tick();
  assert.deepEqual(collection().items.map((item) => item.value.id), ["b", "a"]);
  savedFirst.remove();
  await tick();
  collection().add({ id: "c" });
  await tick();
  assert.deepEqual(collection().items.map((item) => item.value.id), ["b", "c"]);
  wizard().next();
  await tick();
  assert.equal(wizard().activeStage, "second");
  scope.destroy();
});
