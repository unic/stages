import { stages } from "@stages/core";
import { describe, expect, it } from "vitest";
import { compileStudioValidators } from "./catalog";
import { studioValidationPresets } from "./presets";

describe("validation presets", () => {
  it.each(["number", "range", "checkbox", "choice", "date", "time", "collection", "form", "group", "unknown"])("excludes text formats from %s", (target) => {
    const keys = studioValidationPresets(target).map(({ key }) => key);
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("pattern");
    expect(keys.includes("range")).toBe(target === "number" || target === "range");
    expect(keys.includes("collection")).toBe(target === "collection");
  });

  it.each([
    ["email", "ada@example.com", "ada@example", "a@b@c.com"],
    ["url", "https://example.com/path", "example.com", "https://"],
    ["phone", "+41 (44) 123-45-67", "123", "call 123456789"],
    ["letters", "Zoë Müller", "Name123", "hello!"],
    ["digits", "00123", "12.3", "abc"],
  ])("validates %s through the runtime and preserves optional blanks", async (key, valid, invalid, otherInvalid) => {
    const preset = studioValidationPresets("text").find((entry) => entry.key === key)!;
    const compiled = compileStudioValidators([preset.create(`${key}.1`)]);
    expect(compiled.diagnostics).toEqual([]);
    for (const [value, expected] of [[valid, true], [invalid, false], [otherInvalid, false], ["", true]] as const) {
      const controller = stages({ schema: { id: "preset", version: 1, nodes: [{ kind: "field", id: "value", type: "text", validators: compiled.validators }] }, fields: { text: { view: "text", initialValue: "" } }, value: { value } });
      expect((await controller.validate({ event: "submit", reveal: true })).isValid).toBe(expected);
      controller.destroy();
    }
  });
});
