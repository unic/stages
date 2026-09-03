import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { createElement } from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils.js";
import { stages } from "../../core/dist/index.js";
import { StagesField } from "../dist/index.js";

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
