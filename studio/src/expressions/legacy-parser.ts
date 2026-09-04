import type { StudioExpression } from "./types";
import { isSafeObjectKey } from "../document/uid";

interface Token { readonly type: "identifier" | "number" | "operator" | "string"; readonly value: string; }
export type LegacyExpressionParseResult =
  | { readonly ok: true; readonly value: StudioExpression }
  | { readonly ok: false; readonly reason: string };

const ROOTS = Object.freeze({ data: "value", interfaceState: "context", itemData: "row" } as const);
const PRECEDENCE: Readonly<Record<string, number>> = Object.freeze({
  "??": 1, "||": 2, "&&": 3, "===": 4, "!==": 4, "<": 5, "<=": 5, ">": 5, ">=": 5,
  "+": 6, "-": 6, "*": 7, "/": 7, "%": 7,
});
const BINARY = new Set(Object.keys(PRECEDENCE));

function tokenize(source: string): Token[] | undefined {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const whitespace = /^\s+/.exec(rest);
    if (whitespace) { index += whitespace[0].length; continue; }
    const number = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(rest);
    if (number) { tokens.push({ type: "number", value: number[0] }); index += number[0].length; continue; }
    const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(rest);
    if (identifier) { tokens.push({ type: "identifier", value: identifier[0] }); index += identifier[0].length; continue; }
    const string = /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/.exec(rest);
    if (string) { tokens.push({ type: "string", value: string[0] }); index += string[0].length; continue; }
    const operator = /^(?:===|!==|&&|\|\||\?\?|<=|>=|[!+\-*/%<>()?.:])/.exec(rest);
    if (!operator) return undefined;
    tokens.push({ type: "operator", value: operator[0] });
    index += operator[0].length;
  }
  return tokens;
}

function parseString(token: string): string | undefined {
  if (token.startsWith('"')) {
    try { return JSON.parse(token) as string; } catch { return undefined; }
  }
  const body = token.slice(1, -1);
  if (body.includes("\\") || body.includes("\n") || body.includes("\r")) return undefined;
  return body;
}

export function parseLegacyExpression(source: string): LegacyExpressionParseResult {
  const tokens = tokenize(source);
  if (!tokens || tokens.length === 0) return { ok: false, reason: "Expression contains unsupported syntax." };
  let position = 0;
  const peek = (): Token | undefined => tokens[position];
  const take = (): Token | undefined => tokens[position++];

  const parsePrimary = (): StudioExpression | undefined => {
    const token = take();
    if (!token) return undefined;
    if (token.type === "operator" && (token.value === "!" || token.value === "-")) {
      const operand = parsePrimary();
      return operand ? { kind: "unary", operator: token.value, operand } : undefined;
    }
    if (token.type === "operator" && token.value === "(") {
      const inner = parseBinary(0);
      if (!inner || take()?.value !== ")") return undefined;
      return inner;
    }
    if (token.type === "number") return { kind: "literal", value: Number(token.value) };
    if (token.type === "string") {
      const value = parseString(token.value);
      return value === undefined ? undefined : { kind: "literal", value };
    }
    if (token.type !== "identifier") return undefined;
    if (token.value === "true" || token.value === "false") return { kind: "literal", value: token.value === "true" };
    if (token.value === "null") return { kind: "literal", value: null };
    const scope = ROOTS[token.value as keyof typeof ROOTS];
    if (!scope) return undefined;
    const path: string[] = [];
    while (peek()?.value === ".") {
      take();
      const segment = take();
      if (!segment || segment.type !== "identifier" || !isSafeObjectKey(segment.value)) return undefined;
      path.push(segment.value);
    }
    return { kind: "reference", scope, path };
  };

  const parseBinary = (minimum: number): StudioExpression | undefined => {
    let left = parsePrimary();
    if (!left) return undefined;
    while (true) {
      const operator = peek()?.value;
      if (!operator || !BINARY.has(operator) || (PRECEDENCE[operator] ?? -1) < minimum) break;
      take();
      const right = parseBinary((PRECEDENCE[operator] ?? 0) + 1);
      if (!right) return undefined;
      left = { kind: "binary", operator: operator as Extract<StudioExpression, { kind: "binary" }>["operator"], left, right };
    }
    if (minimum === 0 && peek()?.value === "?") {
      take();
      const whenTrue = parseBinary(0);
      if (!whenTrue || take()?.value !== ":") return undefined;
      const whenFalse = parseBinary(0);
      if (!whenFalse) return undefined;
      left = { kind: "conditional", condition: left, whenTrue, whenFalse };
    }
    return left;
  };

  const value = parseBinary(0);
  return value && position === tokens.length
    ? { ok: true, value }
    : { ok: false, reason: "Expression contains unsupported syntax." };
}
