import assert from "node:assert/strict";
import test from "node:test";
import { getFieldDefinition } from "../dist/fields.js";

test("field definitions are read only from object registries", () => {
  const text = { view: "input", initialValue: "" };

  assert.equal(getFieldDefinition({ text }, "text"), text);
  assert.equal(getFieldDefinition({ text }, "missing"), undefined);
  assert.equal(getFieldDefinition(null, "text"), undefined);
  assert.equal(getFieldDefinition("text", "text"), undefined);
});
