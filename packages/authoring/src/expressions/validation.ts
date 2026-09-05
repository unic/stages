import { isSafeObjectKey } from "../document/uid.js";
import {
  STUDIO_EXPRESSION_LIMITS,
  type StudioExpression,
  type StudioExpressionLimits,
  type StudioExpressionResult,
} from "./types.js";

const BINARY_OPERATORS = new Set(["+", "-", "*", "/", "%", "===", "!==", "<", "<=", ">", ">=", "&&", "||", "??"]);
const SCOPES = new Set(["value", "row", "context", "extension", "metadata", "event", "interface", "item"]);
const NODE_KEYS = Object.freeze({
  literal: new Set(["kind", "value"]),
  reference: new Set(["kind", "scope", "path"]),
  unary: new Set(["kind", "operator", "operand"]),
  binary: new Set(["kind", "operator", "left", "right"]),
  conditional: new Set(["kind", "condition", "whenTrue", "whenFalse"]),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.size && keys.every((key) => allowed.has(key) && isSafeObjectKey(key));
}

export function validateStudioExpression(
  value: unknown,
  options: { readonly limits?: Partial<StudioExpressionLimits> } = {},
): StudioExpressionResult<StudioExpression> {
  const limits = { ...STUDIO_EXPRESSION_LIMITS, ...options.limits };
  let nodes = 0;
  const ancestors = new Set<object>();
  const visit = (current: unknown, depth: number): StudioExpressionResult<StudioExpression> => {
    if (++nodes > limits.maxNodes || depth > limits.maxDepth) return { ok: false, code: "expression.limit", message: "Expression exceeds its node or depth limit." };
    if (!isRecord(current) || ancestors.has(current)) {
      return { ok: false, code: "expression.invalid", message: "Expression nodes must be acyclic plain objects." };
    }
    ancestors.add(current);
    const kind = current["kind"];
    if (kind === "literal") {
      if (!hasOnlyKeys(current, NODE_KEYS.literal)) return { ok: false, code: "expression.invalid", message: "Expression literal has unknown properties." };
      const literal = current["value"];
      if (literal !== null && typeof literal !== "boolean" && typeof literal !== "number" && typeof literal !== "string") {
        return { ok: false, code: "expression.invalid", message: "Expression literals must be JSON scalar values." };
      }
      if (typeof literal === "number" && !Number.isFinite(literal)) {
        return { ok: false, code: "expression.invalid", message: "Expression numbers must be finite." };
      }
      if (typeof literal === "string" && literal.length > limits.maxStringLength) {
        return { ok: false, code: "expression.limit", message: "Expression string exceeds its length limit." };
      }
    } else if (kind === "reference") {
      if (!hasOnlyKeys(current, NODE_KEYS.reference)) return { ok: false, code: "expression.invalid", message: "Expression reference has unknown properties." };
      const path = current["path"];
      if (!SCOPES.has(String(current["scope"])) || !Array.isArray(path)
        || path.length > limits.maxPathSegments
        || !path.every((segment) => typeof segment === "string" && segment.length > 0 && isSafeObjectKey(segment))) {
        return { ok: false, code: "expression.invalid", message: "Expression reference has an invalid scope or unsafe path." };
      }
    } else if (kind === "unary") {
      if (!hasOnlyKeys(current, NODE_KEYS.unary)) return { ok: false, code: "expression.invalid", message: "Unary expression has unknown properties." };
      if (current["operator"] !== "!" && current["operator"] !== "-") {
        return { ok: false, code: "expression.invalid", message: "Expression uses an unknown unary operator." };
      }
      const child = visit(current["operand"], depth + 1);
      if (!child.ok) return child;
    } else if (kind === "binary") {
      if (!hasOnlyKeys(current, NODE_KEYS.binary)) return { ok: false, code: "expression.invalid", message: "Binary expression has unknown properties." };
      if (!BINARY_OPERATORS.has(String(current["operator"]))) {
        return { ok: false, code: "expression.invalid", message: "Expression uses an unknown binary operator." };
      }
      const left = visit(current["left"], depth + 1);
      if (!left.ok) return left;
      const right = visit(current["right"], depth + 1);
      if (!right.ok) return right;
    } else if (kind === "conditional") {
      if (!hasOnlyKeys(current, NODE_KEYS.conditional)) return { ok: false, code: "expression.invalid", message: "Conditional expression has unknown properties." };
      for (const childValue of [current["condition"], current["whenTrue"], current["whenFalse"]]) {
        const child = visit(childValue, depth + 1);
        if (!child.ok) return child;
      }
    } else {
      return { ok: false, code: "expression.invalid", message: "Expression uses an unknown node kind." };
    }
    ancestors.delete(current);
    return { ok: true, value: current as unknown as StudioExpression };
  };
  const result = visit(value, 1);
  if (!result.ok) return result;
  return { ok: true, value: value as StudioExpression };
}

export function isStudioExpression(value: unknown): value is StudioExpression {
  return validateStudioExpression(value).ok;
}
