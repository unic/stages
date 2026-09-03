import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { stages } from "../../core/dist/index.js";
import { StagesField, useStagesCollection, useStagesWizard } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("React field binding renders an opaque view and emits through the core controller", async (context) => {
  const dom = new JSDOM("<main id='root'></main>");
  const globals = ["window", "document", "navigator", "IS_REACT_ACT_ENVIRONMENT"];
  const previousGlobals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
  const root = dom.window.document.querySelector("#root");
  const reactRoot = createRoot(root);
  context.after(async () => {
    await act(async () => reactRoot.unmount());
    for (const name of globals) {
      const descriptor = previousGlobals.get(name);
      if (descriptor === undefined) delete globalThis[name];
      else Object.defineProperty(globalThis, name, descriptor);
    }
  });
  let emitInput;
  function TextView({ field, props, emit }) {
    emitInput = (value) => emit("input", value);
    return createElement("label", null, props.label, createElement("input", { value: field.value, readOnly: true }));
  }
  const fields = {
    text: {
      view: TextView,
      initialValue: "",
      reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
        ? { value: event.payload }
        : undefined,
    },
  };
  let controller;
  controller = stages({
    schema: {
      id: "react-form",
      version: 1,
      nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
    },
    fields,
    value: { name: "Ada" },
    onChange: ({ value }) => controller.update({ value }),
  });

  await act(async () => {
    reactRoot.render(createElement(StagesField, { controller, path: ["name"] }));
  });
  assert.equal(root.querySelector("input").value, "Ada");
  await act(async () => {
    emitInput("Grace");
    await tick();
  });
  assert.equal(controller.getSnapshot().value.name, "Grace");
  assert.equal(root.querySelector("input").value, "Grace");
});

test("React collection binding keeps stable row commands across moves", async (context) => {
  const dom = new JSDOM("<main id='root'></main>");
  const globals = ["window", "document", "navigator", "IS_REACT_ACT_ENVIRONMENT"];
  const previousGlobals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
  const root = dom.window.document.querySelector("#root");
  const reactRoot = createRoot(root);
  context.after(async () => {
    await act(async () => reactRoot.unmount());
    for (const name of globals) {
      const descriptor = previousGlobals.get(name);
      if (descriptor === undefined) delete globalThis[name];
      else Object.defineProperty(globalThis, name, descriptor);
    }
  });

  let controller;
  controller = stages({
    schema: {
      id: "react-collection",
      version: 1,
      nodes: [{ kind: "collection", id: "items", itemKey: (item) => item.id, nodes: [] }],
    },
    fields: {},
    value: { items: [{ id: "a" }, { id: "b" }] },
    onChange: ({ value }) => controller.update({ value }),
  });
  let binding;
  function List() {
    binding = useStagesCollection(controller, ["items"]);
    return createElement("ol", null, binding.items.map((item) =>
      createElement("li", { key: item.key, "data-key": item.key }, item.value.id)));
  }

  await act(async () => {
    reactRoot.render(createElement(List));
  });
  const savedFirst = binding.items[0];
  assert.deepEqual([...root.querySelectorAll("li")].map((item) => item.textContent), ["a", "b"]);

  await act(async () => {
    savedFirst.moveTo(1);
    await tick();
  });
  assert.deepEqual([...root.querySelectorAll("li")].map((item) => item.textContent), ["b", "a"]);

  await act(async () => {
    savedFirst.remove();
    await tick();
  });
  assert.deepEqual([...root.querySelectorAll("li")].map((item) => item.textContent), ["b"]);

  await act(async () => {
    binding.add({ id: "c" });
    await tick();
  });
  assert.deepEqual([...root.querySelectorAll("li")].map((item) => item.textContent), ["b", "c"]);
});

test("React wizard binding exposes stages and guarded navigation capabilities", async (context) => {
  const dom = new JSDOM("<main id='root'></main>");
  const globals = ["window", "document", "navigator", "IS_REACT_ACT_ENVIRONMENT"];
  const previousGlobals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
  const root = dom.window.document.querySelector("#root");
  const reactRoot = createRoot(root);
  context.after(async () => {
    await act(async () => reactRoot.unmount());
    for (const name of globals) {
      const descriptor = previousGlobals.get(name);
      if (descriptor === undefined) delete globalThis[name];
      else Object.defineProperty(globalThis, name, descriptor);
    }
  });

  const controller = stages({
    schema: {
      id: "react-wizard",
      version: 1,
      nodes: [{
        kind: "wizard",
        id: "flow",
        navigation: { nonLinear: true },
        stages: [
          { id: "first", nodes: [] },
          { id: "second", nodes: [] },
          { id: "third", nodes: [] },
        ],
      }],
    },
    fields: {},
    value: { flow: { first: {}, second: {}, third: {} } },
  });
  let binding;
  function Wizard() {
    binding = useStagesWizard(controller, ["flow"]);
    return createElement("output", null, `${binding.activeStage}:${binding.stages.map(({ id }) => id).join(",")}`);
  }

  await act(async () => {
    reactRoot.render(createElement(Wizard));
  });
  assert.equal(root.textContent, "first:first,second,third");
  assert.equal(binding.canPrevious, false);
  assert.equal(binding.canNext, true);
  assert.equal(binding.canGo, true);
  assert.equal(binding.stages[0].active, true);
  assert.equal(binding.stages[0].validation.status, "valid");

  await act(async () => {
    binding.next();
    await tick();
  });
  assert.equal(root.textContent, "second:first,second,third");
  assert.equal(binding.canPrevious, true);

  await act(async () => {
    binding.go("third");
    await tick();
  });
  assert.equal(root.textContent, "third:first,second,third");
  assert.equal(binding.canNext, false);
});
