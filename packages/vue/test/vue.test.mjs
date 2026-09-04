import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { stages } from "../../core/dist/index.js";

const dom = new JSDOM("<main id='root'></main>");
for (const name of ["window", "document", "navigator", "Element", "SVGElement"]) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
const { computed, createApp, defineComponent, effectScope, h, nextTick, ref } = await import("vue");
const { StagesField, useStages, useStagesCollection, useStagesWizard } = await import("../dist/index.js");
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function freshRoot() {
  document.body.innerHTML = "<main id='root'></main>";
  return document.querySelector("#root");
}

test("Vue controller ownership watches controlled input and destroys with its scope", async () => {
  const value = ref({ name: "Ada" });
  const scope = effectScope();
  let binding;
  scope.run(() => {
    binding = useStages(
      () => stages({ schema: { id: "vue-lifecycle", version: 1, nodes: [] }, fields: {}, value: value.value }),
      computed(() => ({ value: value.value })),
    );
  });
  assert.equal(binding.snapshot.value.value.name, "Ada");
  value.value = { name: "Grace" };
  await nextTick();
  assert.equal(binding.snapshot.value.value.name, "Grace");
  const revision = binding.snapshot.value.revision;
  scope.stop();
  binding.controller.update({ value: { name: "ignored" } });
  assert.equal(binding.controller.getSnapshot().revision, revision);
});

test("Vue field binding renders an opaque view and emits through the core controller", async () => {
  const root = freshRoot();
  let emitInput;
  const TextView = (binding) => {
    emitInput = (value) => binding.emit("input", value);
    return h("label", null, [binding.props.label, h("input", { value: binding.field.value, readonly: true })]);
  };
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
    schema: { id: "vue-form", version: 1, nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }] },
    fields,
    value: { name: "Ada" },
    onChange: ({ value }) => controller.update({ value }),
  });
  const app = createApp(defineComponent(() => () => h(StagesField, { controller, path: ["name"] })));
  try {
    app.mount(root);
    assert.equal(root.querySelector("input").value, "Ada");
    emitInput("Grace");
    await tick();
    await nextTick();
    assert.equal(controller.getSnapshot().value.name, "Grace");
    assert.equal(root.querySelector("input").value, "Grace");
  } finally {
    app.unmount();
  }
});

test("Vue collection and wizard bindings react to structural commands", async () => {
  const root = freshRoot();
  let controller;
  controller = stages({
    schema: {
      id: "vue-structure",
      version: 1,
      nodes: [{
        kind: "wizard",
        id: "flow",
        navigation: { nonLinear: true },
        stages: [
          { id: "first", nodes: [{ kind: "collection", id: "items", itemKey: (item) => item.id, nodes: [] }] },
          { id: "second", nodes: [] },
        ],
      }],
    },
    fields: {},
    value: { flow: { first: { items: [{ id: "a" }, { id: "b" }] }, second: {} } },
    onChange: ({ value }) => controller.update({ value }),
  });
  let collection;
  let wizard;
  const app = createApp(defineComponent(() => {
    collection = useStagesCollection(controller, ["flow", "first", "items"]);
    wizard = useStagesWizard(controller, ["flow"]);
    return () => h("output", null, `${wizard.value.activeStage}:${collection.value.items.map((item) => item.value.id).join(",")}`);
  }));
  try {
    app.mount(root);
    const savedFirst = collection.value.items[0];
    assert.equal(root.textContent, "first:a,b");
    savedFirst.moveTo(1);
    await tick();
    await nextTick();
    assert.equal(root.textContent, "first:b,a");
    savedFirst.remove();
    await tick();
    await nextTick();
    assert.equal(root.textContent, "first:b");
    collection.value.add({ id: "c" });
    await tick();
    await nextTick();
    assert.equal(root.textContent, "first:b,c");
    wizard.value.next();
    await tick();
    await nextTick();
    assert.equal(wizard.value.activeStage, "second");
  } finally {
    app.unmount();
  }
});
