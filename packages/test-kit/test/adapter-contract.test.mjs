import assert from "node:assert/strict";
import test from "node:test";
import { stages } from "../../core/dist/index.js";
import { bindAdapter } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const fields = {
  text: {
    view: "opaque-framework-token",
    initialValue: "",
    reduce: ({ event }) => event.name === "input" ? { value: event.payload } : undefined,
  },
};
const schema = {
  id: "adapter-contract",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text" }],
};

function controlledController() {
  let controller;
  controller = stages({
    schema,
    fields,
    value: { name: "Ada" },
    onChange: ({ value }) => controller.update({ value }),
  });
  return controller;
}

test("Vue-style refs consume snapshots without a core-specific integration", async () => {
  const snapshotRef = { value: undefined };
  const adapter = bindAdapter(controlledController(), (snapshot) => { snapshotRef.value = snapshot; });
  adapter.emit({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Vue" });
  await tick();

  assert.equal(snapshotRef.value.value.name, "Vue");
  assert.equal(snapshotRef.value.nodes[0].view, "opaque-framework-token");
  adapter.destroy();
});

test("Angular-style change detection consumes the identical contract", async () => {
  class AngularFixture {
    snapshot;
    checks = 0;
    render(snapshot) {
      this.snapshot = snapshot;
      this.checks += 1;
    }
  }
  const fixture = new AngularFixture();
  const adapter = bindAdapter(controlledController(), (snapshot) => fixture.render(snapshot));
  adapter.emit({ name: "input", target: { kind: "field", path: ["name"] }, payload: "Angular" });
  await tick();

  assert.equal(fixture.snapshot.value.name, "Angular");
  assert.equal(fixture.checks, 2);
  adapter.destroy();
});
