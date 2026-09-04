import { stages, type ValidationContext } from "@stages/core";
import { describe, expect, it, vi } from "vitest";
import { compileStudioForm } from "../compiler";
import { toUid, validateStudioProject, type StudioFormDocument, type StudioValidatorSpec } from "../document";
import { compileStudioValidators, firstVisibleErrorPath, focusFirstVisibleValidationError } from "./index";

const formUid = toUid("form_validation");
const nameUid = toUid("field_name");
const ageUid = toUid("field_age");
const confirmationUid = toUid("field_confirmation");
const guestsUid = toUid("collection_guests");

function form(): StudioFormDocument {
  return {
    uid: formUid,
    title: "Validation",
    runtime: { schemaId: "validation", schemaVersion: 1 },
    rootNodeUids: [nameUid, ageUid, confirmationUid, guestsUid],
    nodes: {
      [nameUid]: {
        uid: nameUid, kind: "field", runtimeId: "name", definition: { key: "text", version: 1 }, props: { label: "Name" },
        validators: [
          { id: "name.required", kind: "required", on: ["input", "submit"], revealOn: ["blur", "submit"], message: { default: "Name required", translations: { de: "Name erforderlich" } } },
          { id: "name.length", kind: "length", min: 3, severity: "warning", message: "Use three characters." },
          { id: "name.pattern", kind: "pattern", pattern: "^[A-Z]", message: "Start uppercase." },
        ],
      },
      [ageUid]: { uid: ageUid, kind: "field", runtimeId: "age", definition: { key: "number", version: 1 }, props: { label: "Age" }, validators: [{ id: "age.range", kind: "range", min: 18, max: 120 }] },
      [confirmationUid]: {
        uid: confirmationUid, kind: "field", runtimeId: "confirmation", definition: { key: "text", version: 1 }, props: { label: "Confirmation" },
        validators: [{ id: "confirmation.match", kind: "comparison", operator: "===", other: { kind: "reference", scope: "value", path: ["name"] }, dependencies: [["age"]] }],
      },
      [guestsUid]: { uid: guestsUid, kind: "collection", runtimeId: "guests", childUids: [], validators: [{ id: "guests.aggregate", kind: "collection", min: 1, uniqueBy: ["email"] }] },
    },
    validators: [{ id: "form.enabled", kind: "comparison", operator: "===", other: { kind: "literal", value: null }, when: { kind: "reference", scope: "context", path: ["validateForm"] }, issuePath: ["name"], message: "Form required." }],
    scenarios: [],
    settings: {},
  };
}

describe("Studio synchronous validation", () => {
  it("compiles the catalog at field, node, and form scope with dependencies", async () => {
    const compiled = compileStudioForm(form());
    expect(compiled.diagnostics).toEqual([]);
    const confirmation = compiled.schema.nodes[2];
    expect(confirmation?.validators?.[0]?.dependencies).toEqual([["age"], ["name"]]);
    const controller = stages({
      schema: compiled.schema,
      fields: compiled.fields,
      value: { name: "", age: 12, confirmation: "different", guests: [{ email: "same" }, { email: "same" }] },
      context: { locale: "de", validateForm: true },
    });
    const result = await controller.validate({ event: "submit", reveal: true });
    expect(result.isValid).toBe(false);
    expect(result.issues.map(({ id }) => id)).toEqual([
      "form.enabled", "name.required", "age.range", "confirmation.match", "guests.aggregate",
    ]);
    expect(result.issues.find(({ id }) => id === "name.required")?.message).toBe("Name erforderlich");
    expect(firstVisibleErrorPath(result)).toEqual(["name"]);
    controller.destroy();
  });

  it("reports duplicate IDs and invalid patterns without emitting malformed core configs", () => {
    const specs: StudioValidatorSpec[] = [
      { id: "same", kind: "required" },
      { id: "same", kind: "length", min: 1 },
      { id: "pattern", kind: "pattern", pattern: "[" },
    ];
    const result = compileStudioValidators(specs);
    expect(result.validators).toHaveLength(1);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(["compiler.duplicate-validator-id", "compiler.invalid-validator-pattern"]);
  });

  it("rejects malformed persisted policies before compilation", () => {
    const candidate = {
      format: "stages-studio", formatVersion: 1,
      project: { uid: toUid("project_validation"), title: "Validation", defaultLocale: "en" },
      forms: { [formUid]: { ...form(), validators: [{ id: "bad", kind: "required", on: [] }] } },
      fragments: {}, resources: {},
    };
    const result = validateStudioProject(candidate, { supportedDefinitions: { text: [1], number: [1] } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "document.invalid-validator-events" }));
  });

  it("keeps applicability deterministic and honors disabled opt-in", () => {
    const compiled = compileStudioValidators([
      { id: "conditional", kind: "required", when: { kind: "literal", value: false } },
      { id: "disabled", kind: "required", includeDisabled: true },
    ]).validators;
    const context = {
      value: {}, fieldValue: "", parentValue: {}, context: {}, path: ["field"], address: [], event: "submit",
      fieldState: { disabled: true, focused: false, touched: false, visited: false },
      meta: { revision: 0, isDirty: false, touched: [], visited: [], activeWizards: new Map(), extensions: {} },
      signal: { aborted: false, onCancel: () => () => {} },
    } as ValidationContext<unknown, unknown>;
    expect(compiled[0]?.when?.(context)).toBe(false);
    expect(compiled[1]?.includeDisabled).toBe(true);
  });

  it("focuses the first visible enabled invalid control", () => {
    document.body.innerHTML = `<div hidden><input aria-invalid="true"></div><input id="first" aria-invalid="true"><input id="second" aria-invalid="true">`;
    const focus = vi.spyOn(document.querySelector<HTMLInputElement>("#first")!, "focus");
    expect(focusFirstVisibleValidationError(document)).toBe(true);
    expect(focus).toHaveBeenCalledOnce();
  });
});
