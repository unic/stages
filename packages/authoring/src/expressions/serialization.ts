import type { StudioExpression, StudioExpressionDependency, StudioExpressionResult } from "./types.js";
import { validateStudioExpression } from "./validation.js";

export function serializeStudioExpression(expression: StudioExpression): StudioExpressionResult<string> {
  const valid = validateStudioExpression(expression);
  if (!valid.ok) return valid;
  const canonical = (node: StudioExpression): unknown => {
    if (node.kind === "literal") return { kind: node.kind, value: node.value };
    if (node.kind === "reference") return { kind: node.kind, scope: node.scope, path: [...node.path] };
    if (node.kind === "unary") return { kind: node.kind, operator: node.operator, operand: canonical(node.operand) };
    if (node.kind === "binary") return { kind: node.kind, operator: node.operator, left: canonical(node.left), right: canonical(node.right) };
    return { kind: node.kind, condition: canonical(node.condition), whenTrue: canonical(node.whenTrue), whenFalse: canonical(node.whenFalse) };
  };
  return { ok: true, value: JSON.stringify(canonical(valid.value)) };
}

export function parseStudioExpression(source: string): StudioExpressionResult<StudioExpression> {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    return { ok: false, code: "expression.invalid", message: "Expression is not valid JSON." };
  }
  return validateStudioExpression(value);
}

export function studioExpressionDependencies(expression: StudioExpression): readonly StudioExpressionDependency[] {
  const dependencies = new Map<string, StudioExpressionDependency>();
  const stack = [expression];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.kind === "reference") {
      const key = `${node.scope}\u0000${node.path.join("\u0000")}`;
      if (!dependencies.has(key)) dependencies.set(key, Object.freeze({ scope: node.scope, path: Object.freeze([...node.path]) }));
    } else if (node.kind === "unary") stack.push(node.operand);
    else if (node.kind === "binary") stack.push(node.right, node.left);
    else if (node.kind === "conditional") stack.push(node.whenFalse, node.whenTrue, node.condition);
  }
  return Object.freeze([...dependencies.values()]);
}

const PRECEDENCE: Readonly<Record<string, number>> = { "??": 1, "||": 2, "&&": 3, "===": 4, "!==": 4, "<": 5, "<=": 5, ">": 5, ">=": 5, "+": 6, "-": 6, "*": 7, "/": 7, "%": 7 };

export function projectStudioExpression(expression: StudioExpression, parentPrecedence = 0): string {
  if (expression.kind === "literal") return typeof expression.value === "string" ? JSON.stringify(expression.value) : String(expression.value);
  if (expression.kind === "reference") {
    const scope = expression.scope === "item" ? "row" : expression.scope === "interface" ? "context" : expression.scope;
    return expression.path.length === 0 ? scope : `${scope}.${expression.path.join(".")}`;
  }
  if (expression.kind === "unary") return `${expression.operator}${projectStudioExpression(expression.operand, 8)}`;
  if (expression.kind === "conditional") {
    const text = `${projectStudioExpression(expression.condition, 1)} ? ${projectStudioExpression(expression.whenTrue, 1)} : ${projectStudioExpression(expression.whenFalse, 1)}`;
    return parentPrecedence > 0 ? `(${text})` : text;
  }
  const precedence = PRECEDENCE[expression.operator] ?? 0;
  const text = `${projectStudioExpression(expression.left, precedence)} ${expression.operator} ${projectStudioExpression(expression.right, precedence + 1)}`;
  return precedence < parentPrecedence ? `(${text})` : text;
}
