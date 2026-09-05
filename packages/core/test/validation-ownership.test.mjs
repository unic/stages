import assert from "node:assert/strict";
import test from "node:test";
import { stages, fieldEvent } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const fields = { text: { view: "text", initialValue: "", reduce: ({ event }) => event.name === "input" ? { value: event.payload } : undefined } };
const issue = (path) => [{ id: "invalid", code: "invalid", path, severity: "error" }];
const schema = (validate, on = "input") => ({ id: "ownership", version: 1, nodes: [{ kind: "field", id: "a", type: "text", validators: [{ id: "check", on, dependencies: [["b"]], validate }] }, { kind: "field", id: "b", type: "text" }] });

for (const on of ["input", "submit"]) test(`accepted validation survives delayed/rejected ${on} proposals`, async () => {
  let proposed;
  const value = { a: "ok", b: "ok" };
  const controller = stages({ schema: schema(({ value, path }) => value.a === value.b ? [] : issue(path), on), fields, value, onChange: (change) => { proposed = change.value; } });
  assert.equal((await controller.validate()).status, "valid");
  controller.dispatch(fieldEvent("input", ["b"], { payload: "different" }));
  assert.equal(controller.getSnapshot().validation.status, "valid");
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "valid");
  controller.update({ value });
  assert.equal(controller.getSnapshot().validation.status, "valid");
  controller.dispatch(fieldEvent("input", ["b"], { payload: "different" }));
  await tick();
  controller.update({ value: proposed });
  assert.equal(controller.getSnapshot().validation.status, on === "input" ? "invalid" : "unknown");
  assert.equal((await controller.validate()).status, "invalid");
  controller.destroy();
});

test("accepted async work survives speculation and promoted work can finish after acceptance", async () => {
  const pending = [];
  let proposed;
  const controller = stages({ schema: schema(({ signal, path }) => new Promise((resolve) => pending.push({ signal, resolve, path }))), fields, value: { a: "ok", b: "ok" }, onChange: ({ value }) => { proposed = value; } });
  const accepted = controller.validate();
  controller.dispatch(fieldEvent("input", ["b"], { payload: "new" }));
  await tick();
  assert.equal(pending.length, 2);
  assert.equal(pending[0].signal.aborted, false);
  assert.equal(controller.getSnapshot().validation.status, "pending");
  pending[0].resolve([]);
  await accepted;
  assert.equal(controller.getSnapshot().validation.status, "valid");
  controller.update({ value: proposed });
  assert.equal(controller.getSnapshot().validation.status, "pending");
  pending[1].resolve(issue(pending[1].path));
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  controller.destroy();
});

test("rejected async work is cancelled and cannot replace accepted issues", async () => {
  let release;
  let signal;
  const value = { a: "old", b: "old" };
  const controller = stages({ schema: schema((context) => context.value.b === "old" ? issue(context.path) : new Promise((resolve) => { release = resolve; signal = context.signal; })), fields, value });
  await controller.validate();
  controller.dispatch(fieldEvent("input", ["b"], { payload: "new" }));
  await tick();
  controller.update({ value });
  assert.equal(signal.aborted, true);
  release([]);
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  controller.destroy();
});

test("replacement, context changes, supersession and teardown discard proposal work", async () => {
  for (const action of ["replace", "context", "extensions", "schema", "supersede", "destroy"]) {
    const pending = [];
    const config = schema(({ signal, path, value }) => value.b === "ok" ? [] : new Promise((resolve) => pending.push({ signal, resolve, path })));
    const controller = stages({ schema: config, fields, value: { a: "ok", b: "ok" } });
    await controller.validate();
    controller.dispatch(fieldEvent("input", ["b"], { payload: "proposal" }));
    await tick();
    if (action === "replace") controller.update({ value: { a: "replacement", b: "other" } });
    if (action === "context") controller.update({ context: {} });
    if (action === "extensions") controller.update({ extensions: {} });
    if (action === "schema") controller.update({ schema: config });
    if (action === "supersede") controller.dispatch(fieldEvent("input", ["b"], { payload: "later" }));
    if (action === "destroy") controller.destroy();
    assert.equal(pending[0].signal.aborted, true, action);
    pending[0].resolve(issue(pending[0].path));
    await tick();
    assert.deepEqual(controller.getSnapshot().validation.issues, [], action);
    controller.destroy();
    for (const request of pending.slice(1)) request.resolve([]);
  }
});

test("batch validation and snapshots retain ownership without changing callback order", async () => {
  const order = [];
  const controller = stages({ schema: schema(({ value, path }) => { order.push(`validate:${value.b}`); return value.a === value.b ? [] : issue(path); }), fields, value: { a: "ok", b: "ok" }, onChange: ({ value }) => { order.push("change"); controller.update({ value }); } });
  await controller.validate();
  controller.batch(() => {
    controller.dispatch(fieldEvent("input", ["b"], { payload: "wrong" }));
    assert.equal(controller.getSnapshot().validation.status, "valid");
    controller.dispatch(fieldEvent("input", ["b"], { payload: "final" }));
    assert.equal(controller.getSnapshot().validation.status, "valid");
  });
  await tick();
  assert.deepEqual(order, ["validate:ok", "validate:wrong", "validate:final", "change"]);
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  controller.destroy();
});

test("explicit validation before acceptance cannot publish a proposal result", async () => {
  let proposed;
  const controller = stages({ schema: schema(({ value, path }) => value.a === value.b ? [] : issue(path)), fields, value: { a: "ok", b: "ok" }, onChange: ({ value }) => { proposed = value; } });
  await controller.validate();
  controller.dispatch(fieldEvent("input", ["b"], { payload: "wrong" }));
  assert.equal((await controller.validate()).status, "valid");
  controller.update({ value: proposed });
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  controller.destroy();
});

test("non-proposing events preserve synchronous cached validation through teardown", async () => {
  const controller = stages({ schema: schema(({ path }) => issue(path), "blur"), fields, value: { a: "ok", b: "ok" } });
  controller.dispatch(fieldEvent("blur", ["a"]));
  controller.destroy();
  assert.equal((await controller.validate()).status, "invalid");
});

test("async proposal results completed before acceptance remain private until accepted", async () => {
  let release;
  let proposed;
  const controller = stages({ schema: schema(({ value, path }) => value.b === "ok" ? [] : new Promise((resolve) => { release = () => resolve(issue(path)); })), fields, value: { a: "ok", b: "ok" }, onChange: ({ value }) => { proposed = value; } });
  await controller.validate();
  controller.dispatch(fieldEvent("input", ["b"], { payload: "wrong" }));
  await tick();
  release();
  await tick();
  assert.equal(controller.getSnapshot().validation.status, "valid");
  controller.update({ value: { ...proposed } });
  assert.equal(controller.getSnapshot().validation.status, "invalid");
  controller.destroy();
});
