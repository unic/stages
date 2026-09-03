import assert from "node:assert/strict";
import test from "node:test";
import { fieldEvent, formEvent, nodeEvent, stages } from "../dist/index.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("0.x value-processing patterns migrate to reducers, transforms, and explicit events", async () => {
  const fields = {
    currency: {
      view: "currency",
      initialValue: 0,
      reduce: ({ event }) => {
        if (event.name !== "input" || typeof event.payload !== "string") return undefined;
        const filtered = event.payload.replace(/[^0-9.-]/g, "");
        const parsed = Number(filtered);
        return { value: Number.isFinite(parsed) ? parsed : 0 };
      },
    },
    integer: {
      view: "integer",
      initialValue: 0,
      reduce: ({ event }) => event.name === "input" && typeof event.payload === "number"
        ? { value: Math.trunc(event.payload) }
        : undefined,
    },
    text: {
      view: "text",
      initialValue: "",
      reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
        ? { value: event.payload }
        : undefined,
    },
  };
  const schema = {
    id: "processing-migration",
    version: 1,
    transforms: [
      {
        on: "input",
        when: ({ path }) => path[0] === "quantity" || path[0] === "price",
        apply: ({ value }) => [{
          op: "set",
          path: ["total"],
          value: Number(value.quantity) * Number(value.price),
        }],
      },
      {
        on: "input",
        when: ({ path }) => path[0] === "country",
        apply: () => [{ op: "remove", path: ["region"] }],
      },
      {
        on: "promotion:apply",
        apply: ({ value, event }) => [{
          op: "set",
          path: ["total"],
          value: value.total * (1 - Number(event.payload) / 100),
        }],
      },
    ],
    nodes: [
      { kind: "field", id: "quantity", type: "integer" },
      {
        kind: "field",
        id: "price",
        type: "currency",
        transforms: [{
          on: "blur",
          apply: ({ path, fieldValue }) => [{
            op: "set",
            path,
            value: Number(Number(fieldValue).toFixed(2)),
          }],
        }],
      },
      {
        kind: "field",
        id: "customer",
        type: "text",
        transforms: [{
          on: "blur",
          apply: ({ path, fieldValue }) => [{
            op: "set",
            path,
            value: typeof fieldValue === "string" ? fieldValue.trim() : fieldValue,
          }],
        }],
      },
      { kind: "field", id: "country", type: "text" },
      { kind: "field", id: "region", type: "text" },
      { kind: "field", id: "total", type: "currency" },
      {
        kind: "collection",
        id: "lines",
        itemKey: (item) => item.id,
        nodes: [{ kind: "field", id: "label", type: "text" }],
      },
    ],
  };
  let controller;
  controller = stages({
    schema,
    fields,
    value: {
      quantity: 2,
      price: 3,
      customer: " Ada ",
      country: "CH",
      region: "Zurich",
      total: 6,
      lines: [{ id: "b", label: "B" }, { id: "a", label: "A" }],
    },
    onChange: ({ value }) => controller.update({ value }),
  });

  controller.dispatch(fieldEvent("input", ["price"], { payload: "CHF 12.345" }));
  await tick();
  assert.equal(controller.getSnapshot().value.price, 12.345);
  assert.equal(controller.getSnapshot().value.total, 24.69);

  controller.dispatch(fieldEvent("blur", ["price"]));
  controller.dispatch(fieldEvent("blur", ["customer"]));
  await tick();
  assert.equal(controller.getSnapshot().value.price, 12.35);
  assert.equal(controller.getSnapshot().value.customer, "Ada");

  controller.dispatch(fieldEvent("input", ["country"], { payload: "US", source: "adapter" }));
  await tick();
  assert.equal(Object.prototype.hasOwnProperty.call(controller.getSnapshot().value, "region"), false);

  controller.dispatch(formEvent("promotion:apply", { payload: 10, source: "user" }));
  await tick();
  assert.equal(controller.getSnapshot().value.total, 22.221);

  controller.dispatch(nodeEvent("collection:sort", [{ kind: "node", id: "lines" }], {
    payload: { order: [1, 0] },
  }));
  await tick();
  assert.deepEqual(controller.getSnapshot().value.lines.map(({ id }) => id), ["a", "b"]);
  assert.deepEqual(
    controller.getSnapshot().nodes.at(-1).nodes.map(({ id }) => id),
    ["a", "b"],
  );
});
