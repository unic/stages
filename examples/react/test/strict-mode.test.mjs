import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { StrictMode, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { stages } from "@stages/core";
import { StagesField, useStages } from "@stages/react";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("useStages survives Strict Mode effect replay and destroys after unmount", async (context) => {
  const dom = new JSDOM("<main id='root'></main>");
  const globals = ["window", "document", "navigator", "IS_REACT_ACT_ENVIRONMENT"];
  const previousGlobals = new Map(globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
  context.after(() => {
    for (const name of globals) {
      const descriptor = previousGlobals.get(name);
      if (descriptor === undefined) delete globalThis[name];
      else Object.defineProperty(globalThis, name, descriptor);
    }
  });

  function TextView({ field, emit }) {
    return createElement("button", { type: "button", onClick: () => emit("input", "Grace") }, field.value);
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
  const schema = {
    id: "strict-mode",
    version: 1,
    nodes: [{ kind: "field", id: "name", type: "text" }],
  };
  let activeController;
  let acceptedChanges = 0;

  function App() {
    const [value, setValue] = useState({ name: "Ada" });
    const result = useStages(
      () => stages({
        schema,
        fields,
        value: { name: "Ada" },
        onChange: ({ value: proposed }) => {
          acceptedChanges += 1;
          setValue(proposed);
        },
      }),
      { value },
    );
    activeController = result.controller;
    return createElement(StagesField, { controller: result.controller, path: ["name"] });
  }

  const root = createRoot(dom.window.document.querySelector("#root"));
  await act(async () => {
    root.render(createElement(StrictMode, null, createElement(App)));
    await tick();
  });
  assert.equal(dom.window.document.querySelector("button").textContent, "Ada");

  await act(async () => {
    dom.window.document.querySelector("button").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await tick();
  });
  assert.equal(activeController.getSnapshot().value.name, "Grace");
  assert.equal(dom.window.document.querySelector("button").textContent, "Grace");
  assert.equal(acceptedChanges, 1);

  await act(async () => {
    root.unmount();
    await tick();
  });
  activeController.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Ignored" });
  await tick();
  assert.equal(acceptedChanges, 1);
});
