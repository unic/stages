import { describe, expect, it, vi } from "vitest";
import {
  evaluateStudioExpression,
  isStudioExpression,
  parseLegacyExpression,
  parseStudioExpression,
  projectStudioExpression,
  serializeStudioExpression,
  studioExpressionDependencies,
  validateStudioExpression,
  type StudioExpression,
} from ".";

function legacy(source: string): StudioExpression {
  const result = parseLegacyExpression(source);
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

describe("Studio expressions", () => {
  it("evaluates safe equivalents of the POC visibility and computed-value examples", () => {
    const visibility = legacy("!!interfaceState.showAdvanced");
    expect(evaluateStudioExpression(visibility, { value: {}, extensions: { legacyInterfaceState: { showAdvanced: true } } })).toEqual({ ok: true, value: true });

    const computed = legacy("data.summed !== null ? data.summed.num1 + data.summed.num2 : 0");
    expect(evaluateStudioExpression(computed, { value: { summed: { num1: 4, num2: 7 } } })).toEqual({ ok: true, value: 11 });
    expect(evaluateStudioExpression(computed, { value: { summed: null } })).toEqual({ ok: true, value: 0 });
  });

  it("reads every declared scope through own properties only", () => {
    const inherited = Object.create({ secret: "not-readable" }) as Record<string, unknown>;
    inherited["own"] = "readable";
    const context = {
      value: { title: "Launch" }, row: { price: 12 }, context: inherited,
      extensions: { flags: { beta: true } }, metadata: { revision: 3 },
    };
    for (const [scope, path, value] of [
      ["value", ["title"], "Launch"], ["row", ["price"], 12], ["context", ["own"], "readable"],
      ["extension", ["flags", "beta"], true], ["metadata", ["revision"], 3],
    ] as const) {
      expect(evaluateStudioExpression({ kind: "reference", scope, path }, context)).toEqual({ ok: true, value });
    }
    expect(evaluateStudioExpression({ kind: "reference", scope: "context", path: ["secret"] }, context)).toEqual(expect.objectContaining({ ok: false, code: "expression.missing-reference" }));
    expect(isStudioExpression({ kind: "reference", scope: "value", path: ["constructor"] })).toBe(false);
  });

  it("short-circuits, enforces operand types, and bounds arithmetic and work", () => {
    const missing: StudioExpression = { kind: "reference", scope: "value", path: ["missing"] };
    expect(evaluateStudioExpression({ kind: "binary", operator: "&&", left: { kind: "literal", value: false }, right: missing }, { value: {} })).toEqual({ ok: true, value: false });
    expect(evaluateStudioExpression({ kind: "binary", operator: "/", left: { kind: "literal", value: 2 }, right: { kind: "literal", value: 0 } }, { value: {} })).toEqual(expect.objectContaining({ ok: false, code: "expression.arithmetic" }));
    expect(evaluateStudioExpression({ kind: "binary", operator: "+", left: { kind: "literal", value: true }, right: { kind: "literal", value: 1 } }, { value: {} })).toEqual(expect.objectContaining({ ok: false, code: "expression.type" }));
    expect(evaluateStudioExpression({ kind: "unary", operator: "!", operand: { kind: "literal", value: true } }, { value: {} }, { limits: { maxEvaluationSteps: 1 } })).toEqual(expect.objectContaining({ ok: false, code: "expression.limit" }));
  });

  it("serializes canonically, projects readable text, and reports stable dependencies", () => {
    const expression: StudioExpression = {
      kind: "binary", operator: "+",
      left: { kind: "reference", scope: "row", path: ["quantity"] },
      right: { kind: "reference", scope: "row", path: ["price"] },
    };
    const serialized = serializeStudioExpression(expression);
    expect(serialized).toEqual({ ok: true, value: "{\"kind\":\"binary\",\"operator\":\"+\",\"left\":{\"kind\":\"reference\",\"scope\":\"row\",\"path\":[\"quantity\"]},\"right\":{\"kind\":\"reference\",\"scope\":\"row\",\"path\":[\"price\"]}}" });
    if (serialized.ok) expect(parseStudioExpression(serialized.value)).toEqual({ ok: true, value: expression });
    expect(projectStudioExpression(expression)).toBe("row.quantity + row.price");
    expect(studioExpressionDependencies({ kind: "binary", operator: "+", left: expression, right: expression })).toEqual([
      { scope: "row", path: ["quantity"] }, { scope: "row", path: ["price"] },
    ]);
  });

  it("rejects cycles, unknown fields, unsafe trees, and configured depth limits", () => {
    const cyclic: Record<string, unknown> = { kind: "unary", operator: "!" };
    cyclic["operand"] = cyclic;
    expect(validateStudioExpression(cyclic)).toEqual(expect.objectContaining({ ok: false, code: "expression.invalid" }));
    expect(validateStudioExpression({ kind: "literal", value: true, execute: "fetch('/')" })).toEqual(expect.objectContaining({ ok: false, code: "expression.invalid" }));
    expect(validateStudioExpression({ kind: "unary", operator: "!", operand: { kind: "literal", value: true } }, { limits: { maxDepth: 1 } })).toEqual(expect.objectContaining({ ok: false, code: "expression.limit" }));
    expect(parseStudioExpression("not json")).toEqual(expect.objectContaining({ ok: false, code: "expression.invalid" }));
  });

  it("does not mutate inputs or trigger ambient network work", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const expression = Object.freeze({ kind: "reference", scope: "value", path: Object.freeze(["count"]) }) as StudioExpression;
    const value = Object.freeze({ count: 2 });
    expect(evaluateStudioExpression(expression, { value })).toEqual({ ok: true, value: 2 });
    expect(value).toEqual({ count: 2 });
    expect(fetchSpy).not.toHaveBeenCalled();
    const accessor = {} as Record<string, unknown>;
    const getter = vi.fn(() => 3);
    Object.defineProperty(accessor, "count", { enumerable: true, get: getter });
    expect(evaluateStudioExpression({ kind: "reference", scope: "value", path: ["count"] }, { value: accessor })).toEqual(expect.objectContaining({ ok: false, code: "expression.missing-reference" }));
    expect(getter).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
