import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { stages } from "../../core/dist/index.js";
import { createDomFields, mountStages } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("DOM adapter renders native fields and returns events to the controlled owner", async () => {
  const dom = new JSDOM("<main id='root'></main>");
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const schema = {
    id: "dom-form",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      props: { label: "Name", placeholder: "Your name" },
    }],
  };
  let controller;
  controller = stages({
    schema,
    fields,
    value: { name: "Ada" },
    onChange: ({ value }) => controller.update({ value }),
  });
  let renders = 0;
  const mounted = mountStages(root, controller, { onRender: () => { renders += 1; } });
  const input = root.querySelector("input");
  assert.equal(root.querySelector("label").textContent, "Name");
  assert.equal(input.value, "Ada");
  assert.equal(input.placeholder, "Your name");

  input.value = "Grace";
  input.dispatchEvent(new dom.window.Event("input"));
  await tick();
  assert.equal(controller.getSnapshot().value.name, "Grace");
  assert.equal(root.querySelector("input").value, "Grace");
  assert.equal(renders, 2);

  mounted.destroy();
  controller.update({ value: { name: "Ignored by unmounted adapter" } });
  await tick();
  assert.equal(root.querySelector("input").value, "Grace");
});

test("DOM adapter renders visible validation issues with accessible relationships", async () => {
  const dom = new JSDOM("<main id='root'></main>");
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const schema = {
    id: "dom-validation",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      props: { label: "Name" },
      validators: [{
        id: "required",
        on: "blur",
        revealOn: "blur",
        validate: ({ path }) => [{ id: "required", code: "required", message: "Enter a name.", path, severity: "error" }],
      }],
    }],
  };
  const controller = stages({ schema, fields, value: { name: "" } });
  mountStages(root, controller);
  root.querySelector("input").dispatchEvent(new dom.window.Event("blur"));
  await tick();

  const input = root.querySelector("input");
  const issues = root.querySelector("[role='alert']");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.equal(input.getAttribute("aria-describedby"), issues.id);
  assert.equal(issues.textContent, "Enter a name.");
});

test("DOM adapter focuses fields and preserves focus across controller renders", async () => {
  const dom = new JSDOM("<main id='root'></main>", { pretendToBeVisual: true });
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const required = (id) => ({
    id,
    on: "submit",
    revealOn: "submit",
    validate: ({ path }) => [{ id, code: "required", path, severity: "error" }],
  });
  const controller = stages({
    schema: {
      id: "dom-focus",
      version: 1,
      nodes: [
        { kind: "field", id: "first", type: "text", validators: [required("first.required")] },
        { kind: "field", id: "second", type: "text", validators: [required("second.required")] },
      ],
    },
    fields,
    value: { first: "", second: "" },
  });
  const mounted = mountStages(root, controller);

  assert.equal(mounted.focus(["second"]), true);
  await tick();
  assert.equal(dom.window.document.activeElement, root.querySelectorAll("input")[1]);
  assert.equal(controller.getSnapshot().nodes[1].state.focused, true);

  await controller.validate({ event: "submit", reveal: true });
  await tick();
  assert.equal(mounted.focusFirstIssue(), true);
  await tick();
  assert.equal(dom.window.document.activeElement, root.querySelectorAll("input")[0]);
  assert.equal(controller.getSnapshot().nodes[0].state.focused, true);
  assert.equal(controller.getSnapshot().nodes[1].state.focused, false);

  mounted.destroy();
  assert.equal(mounted.focus(["first"]), false);
});

test("DOM view tokens can render arbitrary custom controls", () => {
  const dom = new JSDOM("<main id='root'></main>");
  const root = dom.window.document.querySelector("#root");
  const customView = {
    render({ document, field }) {
      const output = document.createElement("output");
      output.textContent = `Map: ${field.value.lat},${field.value.lng}`;
      return output;
    },
  };
  const controller = stages({
    schema: { id: "custom-dom", version: 1, nodes: [{ kind: "field", id: "location", type: "map" }] },
    fields: { map: { view: customView } },
    value: { location: { lat: 47, lng: 8 } },
  });
  mountStages(root, controller);
  assert.equal(root.querySelector("output").textContent, "Map: 47,8");
});
