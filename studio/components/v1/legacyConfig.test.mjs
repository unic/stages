import assert from "node:assert/strict";
import test from "node:test";
import { convertLegacyConfig, prepareStudioValue, studioPresentationKey } from "./legacyConfig.mjs";

const fieldTypes = ["text", "number"];

test("converts nested groups, collections, wizards and validation without mutating input", () => {
  const config = [{
    id: "profile",
    type: "group",
    label: "Profile",
    fields: [{
      id: "contacts",
      type: "collection",
      min: 1,
      fields: [{
        id: "flow",
        type: "wizard",
        stages: [{ id: "details", label: "Details", fields: [
          { id: "name", type: "text", label: "Name", isRequired: true, options: [{ value: "Ada" }] },
        ] }],
      }],
    }],
  }];
  const before = structuredClone(config);
  const result = convertLegacyConfig(config, { fieldTypes });

  const field = result.schema.nodes[0].nodes[0].nodes[0].stages[0].nodes[0];
  assert.equal(field.kind, "field");
  assert.equal(field.validators[0].validate({ fieldValue: "", path: ["name"] })[0].code, "required");
  assert.deepEqual(config, before);
  assert.equal(Object.isFrozen(config[0].fields[0].fields[0].stages[0].fields[0].options), false);
  assert.ok(Object.isFrozen(result.schema.nodes[0]));
  assert.equal(result.presentation["node:profile"].label, "Profile");
  assert.equal(result.presentation["node:profile/node:contacts/node:flow/node:details"].label, "Details");
});

test("expands fieldsets and removes the duplicated root group", () => {
  const result = convertLegacyConfig(
    [{ id: "billing", type: "fieldset", fieldset: "address" }],
    {
      fieldTypes,
      fieldsets: [{ id: "address", config: [{
        id: "address",
        type: "group",
        fields: [{ id: "city", type: "text" }],
      }] }],
    },
  );
  assert.equal(result.schema.nodes[0].id, "billing");
  assert.deepEqual(result.schema.nodes[0].nodes.map((node) => node.id), ["city"]);
  assert.equal(result.presentation["node:billing"].fieldsetId, "address");
  assert.equal(result.presentation["node:billing/node:city"].fieldsetId, "address");
});

test("reports invalid compatibility expressions and retains supported visibility expressions", () => {
  const result = convertLegacyConfig([
    { id: "total", type: "number", computedValue: "data.a + data.b" },
    { id: "broken", type: "number", computedValue: "data.}" },
    { id: "conditional", type: "text", isRendered: "data.show === true" },
    { id: "mystery", type: "missing" },
  ], { fieldTypes });

  assert.deepEqual(result.diagnostics.map(({ code }) => code), [
    "studio.computed-value.invalid",
    "studio.field-type.unknown",
  ]);
  assert.equal(result.schema.nodes[2].when({ path: ["conditional"], fieldValue: "", value: { show: true } }), true);
  assert.equal(result.schema.nodes[2].when({ path: ["conditional"], fieldValue: "", value: { show: false } }), false);
});

test("normalizes runtime row addresses for presentation lookup", () => {
  assert.equal(studioPresentationKey([
    { kind: "node", id: "items" },
    { kind: "row", id: "row-1" },
    { kind: "node", id: "name" },
  ]), "node:items/node:name");
});

test("prepares collection and wizard containers without mutating persisted data", () => {
  const schema = convertLegacyConfig([{
    id: "flow",
    type: "wizard",
    stages: [{ id: "details", fields: [{
      id: "items",
      type: "collection",
      min: 1,
      fields: [{ id: "name", type: "text", defaultValue: "New" }],
    }] }],
  }], { fieldTypes }).schema;
  const value = {};
  const prepared = prepareStudioValue(schema, value);

  assert.deepEqual(prepared, { flow: { details: { items: [{ name: "New" }] } } });
  assert.deepEqual(value, {});
  assert.equal(prepareStudioValue(schema, prepared), prepared);
});

test("converts and prepares discriminated legacy collection variants", () => {
  const schema = convertLegacyConfig([{
    id: "validation",
    type: "collection",
    fields: {
      email: [{ id: "strong", type: "text", defaultValue: "yes" }],
      phone: [{ id: "country", type: "text" }],
    },
  }], { fieldTypes });

  assert.equal(schema.schema.nodes[0].discriminator, "__typename");
  assert.deepEqual(Object.keys(schema.schema.nodes[0].variants), ["email", "phone"]);
  assert.deepEqual(schema.presentation["node:validation"].variants, ["email", "phone"]);
  assert.deepEqual(
    prepareStudioValue(schema.schema, { validation: [{ __typename: "email" }] }),
    { validation: [{ __typename: "email", strong: "yes" }] },
  );
});

test("migrates root and nested collection computed values to v1 transforms", () => {
  const converted = convertLegacyConfig([
    { id: "base", type: "number", defaultValue: 4 },
    { id: "double", type: "number", computedValue: "data.base * 2" },
    { id: "quadruple", type: "number", computedValue: "data.double * 2" },
    {
      id: "lines",
      type: "collection",
      fields: [
        { id: "quantity", type: "number" },
        { id: "price", type: "number" },
        { id: "total", type: "number", computedValue: "itemData.quantity * itemData.price" },
      ],
    },
  ], { fieldTypes });
  const value = prepareStudioValue(converted.schema, {
    lines: [
      { quantity: 2, price: 3 },
      { quantity: 4, price: 5 },
    ],
  });

  assert.deepEqual(value, {
    base: 4,
    double: 8,
    quadruple: 16,
    lines: [
      { quantity: 2, price: 3, total: 6 },
      { quantity: 4, price: 5, total: 20 },
    ],
  });
  assert.deepEqual(
    converted.schema.transforms[0].apply({ value: { ...value, base: 7 } }),
    [
      { op: "set", path: ["double"], value: 14 },
      { op: "set", path: ["quadruple"], value: 28 },
    ],
  );
});
