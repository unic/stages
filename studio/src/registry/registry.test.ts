import { fieldEvent } from "@stages/core";
import { describe, expect, it } from "vitest";
import { toUid, type JsonObject } from "../document";
import {
  STUDIO_FIELD_DEFINITIONS,
  createStudioFieldNode,
  migrateStudioFieldReference,
  validateStudioFieldProps,
  type StudioAuthoringFieldDefinition,
} from "./index";

function expectRuntimeContract<TKey extends keyof typeof STUDIO_FIELD_DEFINITIONS, TValue extends boolean | number | string>(
  definition: StudioAuthoringFieldDefinition<TKey, TValue>,
): void {
  const initial = typeof definition.runtime.initialValue === "function"
    ? definition.runtime.initialValue()
    : definition.runtime.initialValue;
  expect(initial).toEqual(definition.value.emptyValue);
  expect(definition.runtime.reduce?.({
    value: definition.value.emptyValue as never,
    event: fieldEvent("input", ["value"], { payload: definition.value.emptyValue }),
    path: ["value"],
  })).toEqual({ value: definition.value.emptyValue });
}

describe("Studio authoring field registry", () => {
  it.each(Object.values(STUDIO_FIELD_DEFINITIONS).map((definition) => [definition.key, definition] as const))(
    "%s owns runtime, prop, accessibility, and current-version migration contracts",
    (key, definition) => {
      expect(definition.version).toBe(1);
      expect(definition.props.some(({ key: propKey }) => propKey === "label")).toBe(true);
      expect(definition.accessibility.keyboard.length).toBeGreaterThan(0);
      expect(definition.accessibility.labelProp).toBe("label");
      expect(migrateStudioFieldReference({ key, version: 1 }, { label: "Name" })).toEqual({
        definition: { key, version: 1 }, props: { label: "Name" },
      });
    },
  );

  it("applies every definition's typed runtime contract", () => {
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.text);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.textarea);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.number);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.choice);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.checkbox);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.date);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.email);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.tel);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.url);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.password);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.time);
    expectRuntimeContract(STUDIO_FIELD_DEFINITIONS.range);

  });

  it("migrates legacy select and calendar references to canonical definitions", () => {
    const props = { label: "When?" } satisfies JsonObject;
    expect(migrateStudioFieldReference({ key: "select", version: 1 }, props)).toEqual({
      definition: { key: "choice", version: 1 }, props,
    });
    expect(migrateStudioFieldReference({ key: "calendar", version: 1 }, props)).toEqual({
      definition: { key: "date", version: 1 }, props,
    });
    expect(migrateStudioFieldReference({ key: "missing", version: 1 }, props)).toBeUndefined();
  });

  it("validates typed props and creates fields from metadata defaults", () => {
    const number = STUDIO_FIELD_DEFINITIONS.number;
    expect(validateStudioFieldProps(number, { label: "Guests", min: 10, max: 2 })).toEqual([
      { key: "max", message: "Maximum must be greater than or equal to minimum." },
    ]);
    expect(validateStudioFieldProps(number, { label: "Guests", step: "often" })).toEqual([
      { key: "step", message: "Step must be a finite number." },
    ]);
    expect(createStudioFieldNode(number, { uid: toUid("field_guests"), runtimeId: "guests" })).toEqual({
      uid: "field_guests",
      kind: "field",
      runtimeId: "guests",
      definition: { key: "number", version: 1 },
      props: { label: "", helpText: "", placeholder: "" },
    });
  });
});
