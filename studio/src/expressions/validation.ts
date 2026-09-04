import type { StudioExpression } from "./types";
import { isSafeObjectKey } from "../document/uid";

const BINARY_OPERATORS = new Set(["+", "-", "*", "/", "%", "===", "!==", "<", "<=", ">", ">=", "&&", "||"]);
const SCOPES = new Set(["interface", "item", "value"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isStudioExpression(value: unknown): value is StudioExpression {
  const stack: unknown[] = [value];
  let visited = 0;
  while (stack.length > 0) {
    if (visited++ > 1_000) return false;
    const current = stack.pop();
    if (!isRecord(current)) return false;
    if (current["kind"] === "literal") {
      const literal = current["value"];
      if (literal !== null && typeof literal !== "boolean" && typeof literal !== "number" && typeof literal !== "string") return false;
    } else if (current["kind"] === "reference") {
      if (!SCOPES.has(String(current["scope"])) || !Array.isArray(current["path"])
        || !current["path"].every((segment) => typeof segment === "string" && isSafeObjectKey(segment))) return false;
    } else if (current["kind"] === "unary") {
      if (current["operator"] !== "!" && current["operator"] !== "-") return false;
      stack.push(current["operand"]);
    } else if (current["kind"] === "binary") {
      if (!BINARY_OPERATORS.has(String(current["operator"]))) return false;
      stack.push(current["left"], current["right"]);
    } else if (current["kind"] === "conditional") {
      stack.push(current["condition"], current["whenTrue"], current["whenFalse"]);
    } else return false;
  }
  return true;
}
