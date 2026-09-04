import { describe, expect, it } from "vitest";
import { parseLegacyExpression } from "./legacy-parser";

describe("legacy expression parser", () => {
  it("parses the shipped visibility expression into a safe AST", () => {
    expect(parseLegacyExpression("!!interfaceState.showAdvanced")).toEqual({
      ok: true,
      value: {
        kind: "unary",
        operator: "!",
        operand: {
          kind: "unary",
          operator: "!",
          operand: { kind: "reference", scope: "extension", path: ["legacyInterfaceState", "showAdvanced"] },
        },
      },
    });
  });

  it("parses conditional arithmetic without evaluating it", () => {
    const result = parseLegacyExpression("data.summed ? data.summed.num1 + data.summed.num2 : 0");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("conditional");
      expect(JSON.stringify(result.value)).toContain('"operator":"+"');
    }
  });

  it("rejects calls, computed access, assignment, and unknown roots", () => {
    for (const source of ["alert(1)", "data[key]", "data.value = 1", "globalThis.secret"]) {
      expect(parseLegacyExpression(source).ok).toBe(false);
    }
  });
});
