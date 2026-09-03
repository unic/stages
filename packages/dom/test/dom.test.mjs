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

test("native fields compose descriptions, required state, and issue severity semantics", async () => {
  const dom = new JSDOM("<main id='root'></main>");
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const schema = {
    id: "dom-accessibility",
    version: 1,
    nodes: [
      {
        kind: "field",
        id: "email",
        type: "text",
        props: {
          label: "Email",
          description: "We only use this for account notices.",
          inputType: "email",
          required: true,
          autocomplete: "email",
        },
        validators: [
          {
            id: "email.warning",
            on: "submit",
            revealOn: "submit",
            validate: ({ path }) => [{ id: "email.warning", code: "unusual", path, severity: "warning" }],
          },
          {
            id: "email.required",
            on: "submit",
            revealOn: "submit",
            validate: ({ path }) => [{ id: "email.required", code: "required", path, severity: "error" }],
          },
        ],
      },
      {
        kind: "field",
        id: "nickname",
        type: "text",
        props: { label: "Nickname", description: "Optional public name." },
        validators: [{
          id: "nickname.warning",
          on: "submit",
          revealOn: "submit",
          validate: ({ path }) => [{ id: "nickname.warning", code: "short", path, severity: "warning" }],
        }],
      },
    ],
  };
  const controller = stages({ schema, fields, value: { email: "", nickname: "A" } });
  mountStages(root, controller);
  await controller.validate({ event: "submit", reveal: true });
  await tick();

  const [email, nickname] = root.querySelectorAll("input");
  const emailLabel = root.querySelectorAll("label")[0];
  const emailDescription = root.querySelector(`#${email.id}-description`);
  const emailIssues = root.querySelector(`#${email.id}-issues`);
  assert.equal(emailLabel.htmlFor, email.id);
  assert.equal(email.type, "email");
  assert.equal(email.required, true);
  assert.equal(email.getAttribute("aria-required"), "true");
  assert.equal(email.getAttribute("autocomplete"), "email");
  assert.equal(emailDescription.textContent, "We only use this for account notices.");
  assert.equal(emailIssues.getAttribute("role"), "alert");
  assert.equal(email.getAttribute("aria-invalid"), "true");
  assert.equal(email.getAttribute("aria-errormessage"), emailIssues.id);
  assert.equal(email.getAttribute("aria-describedby"), `${emailDescription.id} ${emailIssues.id}`);

  const nicknameDescription = root.querySelector(`#${nickname.id}-description`);
  const nicknameIssues = root.querySelector(`#${nickname.id}-issues`);
  assert.equal(nicknameIssues.getAttribute("role"), "status");
  assert.equal(nickname.getAttribute("aria-invalid"), null);
  assert.equal(nickname.getAttribute("aria-errormessage"), null);
  assert.equal(nickname.getAttribute("aria-describedby"), `${nicknameDescription.id} ${nicknameIssues.id}`);
});

test("collection rows receive collision-safe control and label IDs", () => {
  const dom = new JSDOM("<main id='root'></main>");
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const controller = stages({
    schema: {
      id: "dom-row-ids",
      version: 1,
      nodes: [{
        kind: "collection",
        id: "people",
        itemKey: (item) => item.id,
        nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
      }],
    },
    fields,
    value: { people: [{ id: "a-b", name: "Ada" }, { id: "a_b", name: "Grace" }] },
  });
  mountStages(root, controller);

  const inputs = [...root.querySelectorAll("input")];
  const labels = [...root.querySelectorAll("label")];
  assert.equal(inputs.length, 2);
  assert.equal(new Set(inputs.map(({ id }) => id)).size, 2);
  assert.deepEqual(labels.map(({ htmlFor }) => htmlFor), inputs.map(({ id }) => id));
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

test("first-issue focus skips errors in unmounted wizard stages", async () => {
  const dom = new JSDOM("<main id='root'></main>", { pretendToBeVisual: true });
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const issue = (id) => ({
    id,
    on: "submit",
    revealOn: "submit",
    validate: ({ path }) => [{ id, code: "required", path, severity: "error" }],
  });
  const controller = stages({
    schema: {
      id: "dom-wizard-focus",
      version: 1,
      nodes: [{
        kind: "wizard",
        id: "flow",
        initialStage: "second",
        stages: [
          { id: "first", nodes: [{ kind: "field", id: "hidden", type: "text", validators: [issue("hidden.required")] }] },
          { id: "second", nodes: [{ kind: "field", id: "visible", type: "text", validators: [issue("visible.required")] }] },
        ],
      }],
    },
    fields,
    value: { flow: { first: { hidden: "" }, second: { visible: "" } } },
  });
  const mounted = mountStages(root, controller);

  await controller.validate({ event: "submit", reveal: true });
  assert.equal(root.querySelectorAll("input").length, 1);
  assert.equal(mounted.focusFirstIssue(), true);
  assert.equal(dom.window.document.activeElement, root.querySelector("input"));
});

test("focus commands skip disabled controls and rendered inactive stages", async () => {
  const dom = new JSDOM("<main id='root'></main>", { pretendToBeVisual: true });
  const root = dom.window.document.querySelector("#root");
  const fields = createDomFields();
  const issue = (id) => ({
    id,
    on: "submit",
    revealOn: "submit",
    validate: ({ path }) => [{ id, code: "required", path, severity: "error" }],
  });
  const controller = stages({
    schema: {
      id: "dom-hidden-focus",
      version: 1,
      nodes: [
        { kind: "field", id: "disabled", type: "text", disabled: true, validators: [issue("disabled.required")] },
        {
          kind: "wizard",
          id: "flow",
          initialStage: "second",
          stages: [
            { id: "first", nodes: [{ kind: "field", id: "hidden", type: "text", validators: [issue("hidden.required")] }] },
            { id: "second", nodes: [{ kind: "field", id: "visible", type: "text", validators: [issue("visible.required")] }] },
          ],
        },
      ],
    },
    fields,
    value: { disabled: "", flow: { first: { hidden: "" }, second: { visible: "" } } },
  });
  const mounted = mountStages(root, controller, { renderInactiveStages: true });
  await controller.validate({ event: "submit", reveal: true });
  await tick();

  assert.equal(mounted.focus(["disabled"]), false);
  assert.equal(mounted.focus(["flow", "first", "hidden"]), false);
  assert.equal(mounted.focusFirstIssue(), true);
  assert.equal(dom.window.document.activeElement, root.querySelector("[data-stages-id='second'] input"));
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
