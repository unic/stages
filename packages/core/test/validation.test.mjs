import assert from "node:assert/strict";
import test from "node:test";
import { stages } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const fields = {
  text: {
    view: "text",
    initialValue: "",
    reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
      ? { value: event.payload }
      : undefined,
  },
};

test("event and reveal policies keep issue execution separate from presentation", async () => {
  const schema = {
    id: "presentation",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [{
        id: "required",
        on: ["input", "blur"],
        revealOn: "blur",
        validate: ({ fieldValue, path }) => fieldValue
          ? []
          : [{ id: "required", code: "required", path, severity: "error" }],
      }],
    }],
  };
  let controller;
  controller = stages({ schema, fields, value: { name: "" }, onChange: ({ value }) => controller.update({ value }) });
  assert.equal(controller.getSnapshot().validation.status, "unknown");

  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "" });
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  assert.equal(controller.getSnapshot().validation.visibleIssues.length, 0);
  assert.equal(controller.getSnapshot().nodes[0].state.visibleIssues.length, 0);

  controller.dispatch({ name: "blur", target: { kind: "field", path: ["name"] } });
  await tick();
  assert.equal(controller.getSnapshot().validation.visibleIssues.length, 1);
  assert.equal(controller.getSnapshot().nodes[0].state.visibleIssues.length, 1);

  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Ada" });
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "valid");
  assert.equal(controller.getSnapshot().validation.isValid, true);
});

test("dependency changes selectively invalidate current validator results", async () => {
  const valid = () => [];
  const schema = {
    id: "dependencies",
    version: 1,
    nodes: [
      { kind: "field", id: "a", type: "text", validators: [{ id: "a", on: "submit", validate: valid }] },
      {
        kind: "field",
        id: "b",
        type: "text",
        validators: [{ id: "b", on: "submit", dependencies: [["a"]], validate: valid }],
      },
      { kind: "field", id: "c", type: "text", validators: [{ id: "c", on: "submit", validate: valid }] },
    ],
  };
  const controller = stages({ schema, fields, value: { a: "one", b: "two", c: "three", unrelated: 0 } });
  assert.equal((await controller.validate({ event: "submit" })).status, "valid");

  controller.update({ value: { a: "one", b: "two", c: "three", unrelated: 1 } });
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "valid");

  controller.update({ value: { a: "changed", b: "two", c: "three", unrelated: 1 } });
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "unknown");
  assert.equal(controller.getSnapshot().validation.unknownCount, 2);
});

test("field events run only target and dependency-affected validators", async () => {
  const calls = { a: 0, b: 0, c: 0 };
  const schema = {
    id: "event-dependencies",
    version: 1,
    nodes: [
      {
        kind: "field",
        id: "a",
        type: "text",
        validators: [{ id: "a", on: "input", validate: () => { calls.a += 1; return []; } }],
      },
      {
        kind: "field",
        id: "b",
        type: "text",
        validators: [{
          id: "b",
          on: "input",
          dependencies: [["a"]],
          validate: () => { calls.b += 1; return []; },
        }],
      },
      {
        kind: "field",
        id: "c",
        type: "text",
        validators: [{ id: "c", on: "input", validate: () => { calls.c += 1; return []; } }],
      },
    ],
  };
  let controller;
  controller = stages({
    schema,
    fields,
    value: { a: "", b: "", c: "" },
    onChange: ({ value }) => controller.update({ value }),
  });
  controller.dispatch({ name: "input", target: { kind: "field", path: ["a"] }, payload: "changed" });
  await tick();

  assert.deepEqual(calls, { a: 1, b: 1, c: 0 });
  assert.equal(controller.getSnapshot().validation.unknownCount, 1);
});

test("inapplicable conditional validators are excluded instead of unknown", async () => {
  const schema = {
    id: "conditional-validation",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [{
        id: "required",
        on: "submit",
        when: ({ value }) => value.required,
        validate: ({ path }) => [{ id: "required", code: "required", path, severity: "error" }],
      }],
    }],
  };
  const controller = stages({ schema, fields, value: { name: "", required: true } });
  assert.equal((await controller.validate({ event: "submit" })).status, "invalid");

  controller.update({ value: { name: "", required: false } });
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "valid");
  assert.equal(controller.getSnapshot().validation.unknownCount, 0);
});

test("structurally removed validators cannot leak cached results when re-added", async () => {
  const validator = { id: "stable", on: "submit", validate: () => [] };
  const schema = ({ value }) => ({
    id: "structural-validation",
    version: 1,
    nodes: value.include
      ? [{ kind: "field", id: "name", type: "text", validators: [validator] }]
      : [],
  });
  const controller = stages({ schema, fields, value: { name: "", include: true } });
  assert.equal((await controller.validate({ event: "submit" })).status, "valid");

  controller.update({ value: { name: "", include: false } });
  await tick();
  controller.update({ value: { name: "", include: true } });
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "unknown");
});

test("errors take precedence over pending status while preserving counts", async () => {
  let release;
  const schema = {
    id: "pending-with-error",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [
        {
          id: "sync-error",
          on: "submit",
          validate: ({ path }) => [{ id: "sync-error", code: "error", path, severity: "error" }],
        },
        {
          id: "async-check",
          on: "submit",
          validate: () => new Promise((resolve) => { release = resolve; }),
        },
      ],
    }],
  };
  const controller = stages({ schema, fields, value: { name: "" } });
  const pending = controller.validate({ event: "submit" });
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  assert.equal(controller.getSnapshot().validation.pendingCount, 1);
  assert.equal(controller.getSnapshot().nodes[0].state.validating, true);
  release([]);
  const result = await pending;
  assert.equal(result.status, "invalid");
  assert.equal(result.pendingCount, 0);
  assert.equal(controller.getSnapshot().nodes[0].state.validating, false);
});

test("out-of-order event validation cannot publish a superseded result", async () => {
  const releases = new Map();
  const schema = {
    id: "event-race",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [{
        id: "remote",
        on: "input",
        revealOn: "input",
        validate: ({ fieldValue, path }) => new Promise((resolve) => {
          releases.set(fieldValue, () => resolve([
            { id: String(fieldValue), code: String(fieldValue), path, severity: "error" },
          ]));
        }),
      }],
    }],
  };
  let controller;
  controller = stages({ schema, fields, value: { name: "" }, onChange: ({ value }) => controller.update({ value }) });
  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "first" });
  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "second" });
  releases.get("second")();
  releases.get("first")();
  await tick();

  assert.equal(controller.getSnapshot().value.name, "second");
  assert.deepEqual(controller.getSnapshot().validation.issues.map(({ id }) => id), ["second"]);
});

test("stage validity is scoped and gates wizard navigation", async () => {
  const schema = {
    id: "stage-validity",
    version: 1,
    nodes: [{
      kind: "wizard",
      id: "flow",
      navigation: { validateCurrent: true },
      stages: [
        {
          id: "first",
          nodes: [{
            kind: "field",
            id: "name",
            type: "text",
            validators: [{
              id: "name.required",
              on: ["input", "submit"],
              validate: ({ fieldValue, path }) => fieldValue
                ? []
                : [{ id: "name.required", code: "required", path, severity: "error" }],
            }],
          }],
        },
        {
          id: "second",
          nodes: [{
            kind: "field",
            id: "note",
            type: "text",
            validators: [{ id: "note.checked", on: "submit", validate: () => [] }],
          }],
        },
      ],
    }],
  };
  let controller;
  controller = stages({
    schema,
    fields,
    value: { flow: { first: { name: "" }, second: { note: "" } } },
    onChange: ({ value }) => controller.update({ value }),
  });
  const wizardAddress = [{ kind: "node", id: "flow" }];
  const firstAddress = [...wizardAddress, { kind: "node", id: "first" }];
  const wizard = () => controller.getSnapshot().nodes[0];
  assert.equal(wizard().nodes[0].validation.status, "unknown");

  controller.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(wizard().activeStage, "first");

  const firstValidation = await controller.validate({ scope: { address: firstAddress }, event: "submit" });
  assert.equal(firstValidation.status, "invalid");
  assert.equal(wizard().nodes[0].validation.status, "invalid");
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  assert.equal(controller.getSnapshot().validation.unknownCount, 1);

  controller.dispatch({ name: "input", target: { kind: "field", path: ["flow", "first", "name"] }, payload: "Ada" });
  controller.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(wizard().activeStage, "second");
  assert.equal(wizard().nodes[0].validation.status, "valid");
});

test("pending validators are cooperatively cancelled when dependencies change", async () => {
  let cancellations = 0;
  const schema = {
    id: "cooperative-cancellation",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [{
        id: "remote",
        on: "submit",
        validate: ({ signal }) => new Promise((resolve) => {
          signal.onCancel(() => {
            cancellations += 1;
            resolve([]);
          });
        }),
      }],
    }],
  };
  const controller = stages({ schema, fields, value: { name: "first" } });
  const pending = controller.validate({ event: "submit" });
  assert.equal(controller.getSnapshot().nodes[0].state.validating, true);

  controller.update({ value: { name: "second" } });
  const result = await pending;
  assert.equal(cancellations, 1);
  assert.equal(result.status, "unknown");
  assert.equal(controller.getSnapshot().nodes[0].state.validating, false);
});

test("superseding validation and controller teardown cancel per-instance work", () => {
  let cancellations = 0;
  const schema = {
    id: "superseded-cancellation",
    version: 1,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      validators: [{
        id: "remote",
        on: "input",
        validate: ({ signal }) => new Promise((resolve) => {
          signal.onCancel(() => {
            cancellations += 1;
            resolve([]);
          });
        }),
      }],
    }],
  };
  const controller = stages({ schema, fields, value: { name: "" } });
  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "first" });
  controller.dispatch({ name: "input", target: { kind: "field", path: ["name"] }, payload: "second" });
  assert.equal(cancellations, 1);
  controller.destroy();
  assert.equal(cancellations, 2);
});
