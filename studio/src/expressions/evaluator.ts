import { isSafeObjectKey } from "../document/uid";
import { validateStudioExpression } from "./validation";
import {
  STUDIO_EXPRESSION_LIMITS,
  type StudioBinaryOperator,
  type StudioExpression,
  type StudioExpressionContext,
  type StudioExpressionLimits,
  type StudioExpressionResult,
  type StudioExpressionScope,
} from "./types";

function fail(code: "expression.missing-reference" | "expression.type" | "expression.arithmetic" | "expression.limit", message: string): StudioExpressionResult<never> {
  return { ok: false, code, message };
}

function scopeValue(scope: StudioExpressionScope, context: StudioExpressionContext): unknown {
  if (scope === "value") return context.value;
  if (scope === "row" || scope === "item") return context.row;
  if (scope === "context" || scope === "interface") return context.context;
  if (scope === "extension") return context.extensions;
  if (scope === "event") return context.event;
  return context.metadata;
}

function ownAtPath(root: unknown, path: readonly string[]): StudioExpressionResult<unknown> {
  let value = root;
  for (const segment of path) {
    if (!isSafeObjectKey(segment) || value === null || typeof value !== "object"
      || !Object.prototype.hasOwnProperty.call(value, segment)) {
      return fail("expression.missing-reference", `Reference path ${path.join(".")} does not exist.`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, segment);
    if (!descriptor || !("value" in descriptor)) {
      return fail("expression.missing-reference", `Reference path ${path.join(".")} is not a data property.`);
    }
    value = descriptor.value;
  }
  return { ok: true, value };
}

function numeric(operator: StudioBinaryOperator, left: unknown, right: unknown): StudioExpressionResult<number> {
  if (typeof left !== "number" || typeof right !== "number" || !Number.isFinite(left) || !Number.isFinite(right)) {
    return fail("expression.type", `${operator} requires finite numbers.`);
  }
  if ((operator === "/" || operator === "%") && right === 0) return fail("expression.arithmetic", "Division by zero is not allowed.");
  const value = operator === "+" ? left + right
    : operator === "-" ? left - right
      : operator === "*" ? left * right
        : operator === "/" ? left / right
          : left % right;
  return Number.isFinite(value) ? { ok: true, value } : fail("expression.arithmetic", "Arithmetic result is not finite.");
}

export function evaluateStudioExpression(
  expression: StudioExpression,
  context: StudioExpressionContext,
  options: { readonly limits?: Partial<StudioExpressionLimits> } = {},
): StudioExpressionResult<unknown> {
  const limits = { ...STUDIO_EXPRESSION_LIMITS, ...options.limits };
  const valid = validateStudioExpression(expression, { limits });
  if (!valid.ok) return valid;
  let steps = 0;
  const evaluate = (node: StudioExpression): StudioExpressionResult<unknown> => {
    if (++steps > limits.maxEvaluationSteps) return fail("expression.limit", "Expression exceeded its evaluation-step limit.");
    if (node.kind === "literal") return { ok: true, value: node.value };
    if (node.kind === "reference") return ownAtPath(scopeValue(node.scope, context), node.path);
    if (node.kind === "unary") {
      const operand = evaluate(node.operand);
      if (!operand.ok) return operand;
      if (node.operator === "!") return typeof operand.value === "boolean"
        ? { ok: true, value: !operand.value }
        : fail("expression.type", "! requires a boolean.");
      return typeof operand.value === "number" && Number.isFinite(operand.value)
        ? { ok: true, value: -operand.value }
        : fail("expression.type", "Unary - requires a finite number.");
    }
    if (node.kind === "conditional") {
      const condition = evaluate(node.condition);
      if (!condition.ok) return condition;
      if (typeof condition.value !== "boolean") return fail("expression.type", "A conditional requires a boolean condition.");
      return evaluate(condition.value ? node.whenTrue : node.whenFalse);
    }
    const left = evaluate(node.left);
    if (!left.ok) return left;
    if (node.operator === "&&" || node.operator === "||") {
      if (typeof left.value !== "boolean") return fail("expression.type", `${node.operator} requires booleans.`);
      if (node.operator === "&&" && !left.value) return { ok: true, value: false };
      if (node.operator === "||" && left.value) return { ok: true, value: true };
    }
    if (node.operator === "??" && left.value !== null && left.value !== undefined) return left;
    const right = evaluate(node.right);
    if (!right.ok) return right;
    if (node.operator === "&&" || node.operator === "||") return typeof right.value === "boolean"
      ? right
      : fail("expression.type", `${node.operator} requires booleans.`);
    if (node.operator === "??") return right;
    if (node.operator === "===" || node.operator === "!==") {
      return { ok: true, value: node.operator === "===" ? left.value === right.value : left.value !== right.value };
    }
    if (["<", "<=", ">", ">="].includes(node.operator)) {
      if ((typeof left.value !== "number" || typeof right.value !== "number")
        && (typeof left.value !== "string" || typeof right.value !== "string")) {
        return fail("expression.type", `${node.operator} requires two numbers or two strings.`);
      }
      const a = left.value as number | string;
      const b = right.value as number | string;
      return { ok: true, value: node.operator === "<" ? a < b : node.operator === "<=" ? a <= b : node.operator === ">" ? a > b : a >= b };
    }
    if (node.operator === "+" && typeof left.value === "string" && typeof right.value === "string") {
      if (left.value.length + right.value.length > limits.maxStringLength) return fail("expression.limit", "Expression string result exceeds its length limit.");
      return { ok: true, value: left.value + right.value };
    }
    return numeric(node.operator, left.value, right.value);
  };
  return evaluate(valid.value);
}
