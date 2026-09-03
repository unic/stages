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

test("root validators participate in form validation and field events", async () => {
  let calls = 0;
  const schema = {
    id: "root-validation",
    version: 1,
    validators: [{
      id: "names-differ",
      on: ["input", "submit"],
      validate: ({ value, path, address, fieldValue }) => {
        calls += 1;
        assert.deepEqual(path, []);
        assert.deepEqual(address, []);
        assert.deepEqual(fieldValue, value);
        return value.first === value.last
          ? [{ id: "names-differ", code: "names-differ", path, severity: "error" }]
          : [];
      },
    }],
    nodes: [
      { kind: "field", id: "first", type: "text" },
      { kind: "field", id: "last", type: "text" },
    ],
  };
  let controller;
  controller = stages({
    schema,
    fields,
    value: { first: "Ada", last: "Lovelace" },
    onChange: ({ value }) => controller.update({ value }),
  });

  assert.equal((await controller.validate({ event: "submit" })).status, "valid");
  controller.dispatch({ name: "input", target: { kind: "field", path: ["last"] }, payload: "Ada" });
  await tick();

  assert.equal(calls, 2);
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  assert.deepEqual(controller.getSnapshot().validation.issues[0].path, []);
});

test("init validation policies run once during controller creation", async () => {
  let calls = 0;
  const controller = stages({
    schema: {
      id: "init-validation",
      version: 1,
      validators: [{
        id: "initial-check",
        on: "init",
        revealOn: "init",
        validate: ({ path, event }) => {
          calls += 1;
          assert.equal(event, "init");
          return [{ id: "initial-check", code: "initial-check", path, severity: "error" }];
        },
      }],
      nodes: [],
    },
    fields: {},
    value: { ready: false },
  });

  assert.equal(calls, 1);
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  assert.equal(controller.getSnapshot().validation.visibleIssues.length, 1);
  controller.update({ value: { ready: true } });
  await tick();
  assert.equal(calls, 1);
  assert.equal(controller.getSnapshot().validation.status, "unknown");
});

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

test("wizard validation gates unknown, pending, invalid, warning, and hidden-stage navigation", async () => {
  const wizardAddress = [{ kind: "node", id: "flow" }];
  const firstAddress = [...wizardAddress, { kind: "node", id: "first" }];
  const secondAddress = [...wizardAddress, { kind: "node", id: "second" }];
  const createController = (firstValidator, secondValidator = undefined, wizardOptions = {}) => stages({
    schema: {
      id: `navigation-matrix-${firstValidator.id}`,
      version: 1,
      nodes: [{
        kind: "wizard",
        id: "flow",
        navigation: { validateCurrent: true, nonLinear: true },
        ...wizardOptions,
        stages: [
          {
            id: "first",
            nodes: [{ kind: "field", id: "firstValue", type: "text", validators: [firstValidator] }],
          },
          {
            id: "second",
            nodes: [{
              kind: "field",
              id: "secondValue",
              type: "text",
              ...(secondValidator === undefined ? {} : { validators: [secondValidator] }),
            }],
          },
          { id: "hidden", when: false, nodes: [] },
        ],
      }],
    },
    fields,
    value: { flow: { first: { firstValue: "" }, second: { secondValue: "" }, hidden: {} } },
  });
  const valid = (id) => ({ id, on: "submit", validate: () => [] });

  const unknown = createController(valid("unknown"));
  unknown.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(unknown.getSnapshot().nodes[0].activeStage, "first");
  assert.equal(unknown.getSnapshot().diagnostics.at(-1).code, "wizard.navigation-rejected");
  unknown.destroy();

  let finishPending;
  const pending = createController({
    id: "pending",
    on: "submit",
    validate: () => new Promise((resolve) => { finishPending = resolve; }),
  });
  const pendingValidation = pending.validate({ scope: { address: firstAddress }, event: "submit" });
  assert.equal(pending.getSnapshot().nodes[0].nodes[0].validation.status, "pending");
  pending.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(pending.getSnapshot().nodes[0].activeStage, "first");
  finishPending([]);
  assert.equal((await pendingValidation).status, "valid");
  pending.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(pending.getSnapshot().nodes[0].activeStage, "second");
  pending.destroy();

  const invalid = createController(valid("first-valid"), {
    id: "second-invalid",
    on: "submit",
    validate: ({ path }) => [{ id: "second-invalid", code: "invalid", path, severity: "error" }],
  });
  assert.equal((await invalid.validate({ scope: { address: firstAddress }, event: "submit" })).status, "valid");
  invalid.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal((await invalid.validate({ scope: { address: secondAddress }, event: "submit" })).status, "invalid");
  invalid.dispatch({ name: "wizard:previous", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(invalid.getSnapshot().nodes[0].activeStage, "second");
  invalid.destroy();

  const warning = createController({
    id: "warning",
    on: "submit",
    validate: ({ path }) => [{ id: "warning", code: "warning", path, severity: "warning" }],
  });
  const warningValidation = await warning.validate({ scope: { address: firstAddress }, event: "submit" });
  assert.equal(warningValidation.status, "valid");
  assert.equal(warningValidation.issues.length, 1);
  warning.dispatch({ name: "wizard:next", target: { kind: "node", address: wizardAddress } });
  await tick();
  assert.equal(warning.getSnapshot().nodes[0].activeStage, "second");
  warning.destroy();

  const hidden = createController(valid("hidden-target"));
  assert.equal((await hidden.validate({ scope: { address: firstAddress }, event: "submit" })).status, "valid");
  hidden.dispatch({ name: "wizard:go", target: { kind: "node", address: wizardAddress }, payload: "hidden" });
  await tick();
  assert.equal(hidden.getSnapshot().nodes[0].activeStage, "first");
  assert.deepEqual(hidden.getSnapshot().nodes[0].visibleStageIds, ["first", "second"]);
  assert.equal(hidden.getSnapshot().diagnostics.at(-1).code, "wizard.navigation-rejected");
  hidden.destroy();
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

test("disabled fields validate only through explicit opt-in", async () => {
  const calls = { excluded: 0, included: 0 };
  const controller = stages({
    schema: {
      id: "disabled-validation",
      version: 1,
      nodes: [
        {
          kind: "field",
          id: "excluded",
          type: "text",
          disabled: true,
          validators: [{
            id: "excluded",
            on: "submit",
            validate: () => {
              calls.excluded += 1;
              return [];
            },
          }],
        },
        {
          kind: "field",
          id: "included",
          type: "text",
          disabled: true,
          validators: [{
            id: "included",
            on: "submit",
            includeDisabled: true,
            validate: ({ path }) => {
              calls.included += 1;
              return [{ id: "included", code: "included", path, severity: "error" }];
            },
          }],
        },
      ],
    },
    fields,
    value: { excluded: "", included: "" },
  });

  const result = await controller.validate({ event: "submit" });
  assert.deepEqual(calls, { excluded: 0, included: 1 });
  assert.equal(result.status, "invalid");
  assert.equal(result.unknownCount, 0);
  assert.deepEqual(result.issues.map(({ id }) => id), ["included"]);
});

test("malformed sync and async validator results become deterministic issues", async () => {
  const controller = stages({
    schema: {
      id: "invalid-validator-results",
      version: 1,
      nodes: [{
        kind: "field",
        id: "name",
        type: "text",
        validators: [
          { id: "sync", on: "submit", validate: () => undefined },
          {
            id: "async",
            on: "submit",
            validate: async () => [{ id: "bad", code: "bad", path: [], severity: "fatal" }],
          },
        ],
      }],
    },
    fields,
    value: { name: "" },
  });

  const result = await controller.validate({ event: "submit" });
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.issues.map(({ id }) => id), ["sync.rejected", "async.rejected"]);
  assert.deepEqual(result.issues.map(({ code }) => code), ["validator-rejected", "validator-rejected"]);
  assert.match(result.issues[0].message, /array of issues/);
  assert.match(result.issues[1].message, /malformed issue/);
});

test("validation failure issues customize presentation without weakening failure semantics", async () => {
  const failures = [];
  const schema = {
    id: "custom-failure-issues",
    version: 1,
    nodes: [
      {
        kind: "field",
        id: "conditional",
        type: "text",
        validators: [{
          id: "conditional.failure",
          on: "submit",
          when: () => { throw new Error("condition exploded"); },
          validate: () => [],
        }],
      },
      {
        kind: "field",
        id: "sync",
        type: "text",
        validators: [{
          id: "sync.failure",
          on: "submit",
          validate: () => { throw new Error("sync exploded"); },
        }],
      },
      {
        kind: "field",
        id: "async",
        type: "text",
        validators: [{
          id: "async.failure",
          on: "submit",
          validate: async () => { throw new Error("async exploded"); },
        }],
      },
    ],
  };
  const controller = stages({
    schema,
    fields,
    value: { conditional: "", sync: "", async: "" },
    validationFailureIssue: (failure) => {
      failures.push(failure);
      return {
        code: `localized-${failure.kind}`,
        message: `Localized ${failure.validatorId}`,
        meta: { event: failure.event, addressDepth: failure.address.length },
      };
    },
  });

  failures.length = 0;
  const result = await controller.validate({ event: "submit", reveal: true });
  assert.equal(result.status, "invalid");
  assert.equal(result.isValid, false);
  assert.deepEqual(result.issues.map(({ id }) => id), [
    "conditional.failure.when-failed",
    "sync.failure.rejected",
    "async.failure.rejected",
  ]);
  assert.deepEqual(result.issues.map(({ code }) => code), [
    "localized-when",
    "localized-validate",
    "localized-validate",
  ]);
  assert.deepEqual(result.issues.map(({ path }) => path), [["conditional"], ["sync"], ["async"]]);
  assert(result.issues.every(({ severity }) => severity === "error"));
  assert.deepEqual(result.issues.map(({ meta }) => meta), [
    { event: "submit", addressDepth: 1 },
    { event: "submit", addressDepth: 1 },
    { event: "submit", addressDepth: 1 },
  ]);
  assert.deepEqual(failures.map(({ kind, validatorId, event }) => ({ kind, validatorId, event })), [
    { kind: "when", validatorId: "conditional.failure", event: "submit" },
    { kind: "validate", validatorId: "sync.failure", event: "submit" },
    { kind: "validate", validatorId: "async.failure", event: "submit" },
  ]);
});

test("a broken validation failure issue factory falls back deterministically", async () => {
  const controller = stages({
    schema: {
      id: "broken-failure-issue",
      version: 1,
      nodes: [{
        kind: "field",
        id: "name",
        type: "text",
        validators: [{
          id: "broken",
          on: "submit",
          validate: () => { throw new Error("validator exploded"); },
        }],
      }],
    },
    fields,
    value: { name: "" },
    validationFailureIssue: () => [],
  });

  const result = await controller.validate({ event: "submit" });
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.issues.map(({ id, code, path, severity }) => ({ id, code, path, severity })), [{
    id: "broken.rejected",
    code: "validator-rejected",
    path: ["name"],
    severity: "error",
  }]);
  assert.equal(controller.getSnapshot().diagnostics.at(-1).code, "validation.failure-issue-failed");
});

test("registry field validators are reusable, path-aware, and independently keyed", async () => {
  const calls = [];
  const intrinsicFields = {
    text: {
      view: "text",
      initialValue: "",
      reduce: ({ event }) => event.name === "input" ? { value: event.payload } : undefined,
      validators: [{
        id: "required",
        validate: (value, props) => {
          calls.push([value, props.label]);
          return value === "" ? [{ id: "required", code: "required", severity: "error" }] : [];
        },
      }],
    },
  };
  const schema = {
    id: "intrinsic-field-validation",
    version: 1,
    nodes: [
      {
        kind: "field",
        id: "first",
        type: "text",
        props: { label: "First" },
        validators: [{
          id: "required",
          on: "init",
          validate: ({ path }) => [{ id: "configured", code: "configured", path, severity: "warning" }],
        }],
      },
      { kind: "field", id: "second", type: "text", props: { label: "Second" } },
    ],
  };
  let controller;
  controller = stages({
    schema,
    fields: intrinsicFields,
    value: { first: "", second: "" },
    onChange: ({ value }) => controller.update({ value }),
  });

  assert.deepEqual(calls, [["", "First"], ["", "Second"]]);
  assert.deepEqual(controller.getSnapshot().validation.issues.map(({ id, path }) => [id, path]), [
    ["configured", ["first"]],
    ["required", ["first"]],
    ["required", ["second"]],
  ]);

  const revealed = await controller.validate({ reveal: true });
  assert.equal(revealed.visibleIssues.length, 3);
  controller.dispatch({ name: "input", target: { kind: "field", path: ["first"] }, payload: "Ada" });
  await tick();
  assert.equal(controller.getSnapshot().nodes[0].state.issues.length, 0);
  assert.deepEqual(controller.getSnapshot().nodes[1].state.issues.map(({ id }) => id), ["required"]);
});
