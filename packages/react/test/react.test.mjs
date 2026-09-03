import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { createElement } from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils.js";
import { stages } from "../../core/dist/index.js";
import { StagesField, useStagesCollection } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("React field binding renders an opaque view and emits through the core controller", async (context) => {
  const dom = new JSDOM("<main id='root'></main>");
  const globals = ["window", "document", "navigator"];
  const previousGlobals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  context.after(() => {
    ReactDOM.unmountComponentAtNode(root);
    for (const name of globals) {
      const descriptor = previousGlobals.get(name);
      if (descriptor === undefined) delete globalThis[name];
      else Object.defineProperty(globalThis, name, descriptor);
    }
  });
  const root = dom.window.document.querySelector("#root");
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
    ReactDOM.render(createElement(StagesField, { controller, path: ["name"] }), root);
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
  const globals = ["window", "document", "navigator"];
  const previousGlobals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  const root = dom.window.document.querySelector("#root");
  context.after(() => {
    ReactDOM.unmountComponentAtNode(root);
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
    ReactDOM.render(createElement(List), root);
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
