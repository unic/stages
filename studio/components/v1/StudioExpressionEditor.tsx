import { useId } from "react";
import { isSafeObjectKey } from "../../src/document/uid";
import { projectStudioExpression } from "../../src/expressions/serialization";
import type { StudioBinaryOperator, StudioExpression, StudioExpressionScope, StudioUnaryOperator } from "../../src/expressions/types";

export interface StudioExpressionReferenceOption {
  readonly scope: Exclude<StudioExpressionScope, "interface" | "item">;
  readonly path: readonly string[];
  readonly label: string;
}

interface StudioExpressionEditorProps {
  readonly expression: StudioExpression;
  readonly label: string;
  readonly references: readonly StudioExpressionReferenceOption[];
  readonly onChange: (expression: StudioExpression) => void;
}

const BINARY_OPERATORS: readonly StudioBinaryOperator[] = [
  "===", "!==", "<", "<=", ">", ">=", "&&", "||", "??", "+", "-", "*", "/", "%",
];

function initialExpression(kind: StudioExpression["kind"]): StudioExpression {
  const literal: StudioExpression = { kind: "literal", value: true };
  if (kind === "reference") return { kind, scope: "value", path: [] };
  if (kind === "unary") return { kind, operator: "!", operand: literal };
  if (kind === "binary") return { kind, operator: "===", left: { kind: "reference", scope: "value", path: [] }, right: literal };
  if (kind === "conditional") return { kind, condition: literal, whenTrue: { kind: "literal", value: true }, whenFalse: { kind: "literal", value: false } };
  return literal;
}

function parsePath(source: string): readonly string[] | undefined {
  const path = source.trim() === "" ? [] : source.split(".").map((segment) => segment.trim());
  return path.every((segment) => segment.length > 0 && isSafeObjectKey(segment)) ? path : undefined;
}

function LiteralEditor({ expression, onChange }: {
  readonly expression: Extract<StudioExpression, { readonly kind: "literal" }>;
  readonly onChange: (expression: StudioExpression) => void;
}) {
  const type = expression.value === null ? "null" : typeof expression.value;
  return <div className="studio-expression-editor__row">
    <label className="studio-field"><span>Value type</span><select value={type} onChange={(event) => {
      const next = event.currentTarget.value;
      onChange({ kind: "literal", value: next === "null" ? null : next === "boolean" ? true : next === "number" ? 0 : "" });
    }}><option value="boolean">Boolean</option><option value="number">Number</option><option value="string">Text</option><option value="null">Null</option></select></label>
    {type === "boolean" && <label className="studio-field"><span>Value</span><select value={String(expression.value)} onChange={(event) => onChange({ kind: "literal", value: event.currentTarget.value === "true" })}><option value="true">True</option><option value="false">False</option></select></label>}
    {type === "number" && <label className="studio-field"><span>Value</span><input className="ui-input" type="number" value={String(expression.value)} onChange={(event) => {
      const value = event.currentTarget.valueAsNumber;
      if (Number.isFinite(value)) onChange({ kind: "literal", value });
    }} /></label>}
    {type === "string" && <label className="studio-field"><span>Value</span><input className="ui-input" value={String(expression.value)} onChange={(event) => onChange({ kind: "literal", value: event.currentTarget.value })} /></label>}
  </div>;
}

function ReferenceEditor({ expression, references, onChange }: {
  readonly expression: Extract<StudioExpression, { readonly kind: "reference" }>;
  readonly references: readonly StudioExpressionReferenceOption[];
  readonly onChange: (expression: StudioExpression) => void;
}) {
  const listId = useId();
  const scope = expression.scope === "item" ? "row" : expression.scope === "interface" ? "context" : expression.scope;
  const options = references.filter((option) => option.scope === scope);
  return <div className="studio-expression-editor__row">
    <label className="studio-field"><span>Reference source</span><select value={scope} onChange={(event) => onChange({ kind: "reference", scope: event.currentTarget.value as StudioExpressionScope, path: [] })}>
      <option value="value">Form value</option><option value="row">Current row</option><option value="context">Context</option><option value="extension">Extension</option><option value="metadata">Metadata</option>
    </select></label>
    <label className="studio-field"><span>Reference path</span><input className="ui-input" list={listId} value={expression.path.join(".")} aria-invalid={expression.path.some((segment) => !isSafeObjectKey(segment))} onChange={(event) => {
      const path = parsePath(event.currentTarget.value);
      if (path) onChange({ kind: "reference", scope, path });
    }} /><datalist id={listId}>{options.map((option) => <option key={option.path.join(".")} value={option.path.join(".")}>{option.label}</option>)}</datalist></label>
  </div>;
}

function ExpressionNodeEditor({ expression, references, onChange, depth }: {
  readonly expression: StudioExpression;
  readonly references: readonly StudioExpressionReferenceOption[];
  readonly onChange: (expression: StudioExpression) => void;
  readonly depth: number;
}) {
  return <div className="studio-expression-editor__node" data-expression-depth={depth}>
    <label className="studio-field"><span>{depth === 0 ? "Expression" : "Part"}</span><select value={expression.kind} onChange={(event) => onChange(initialExpression(event.currentTarget.value as StudioExpression["kind"]))}>
      <option value="literal">Literal</option><option value="reference">Reference</option><option value="unary">Not / negate</option><option value="binary">Operation</option><option value="conditional">Conditional</option>
    </select></label>
    {expression.kind === "literal" && <LiteralEditor expression={expression} onChange={onChange} />}
    {expression.kind === "reference" && <ReferenceEditor expression={expression} references={references} onChange={onChange} />}
    {expression.kind === "unary" && <>
      <label className="studio-field"><span>Operator</span><select value={expression.operator} onChange={(event) => onChange({ ...expression, operator: event.currentTarget.value as StudioUnaryOperator })}><option value="!">Not (!)</option><option value="-">Negate (-)</option></select></label>
      <ExpressionNodeEditor expression={expression.operand} references={references} depth={depth + 1} onChange={(operand) => onChange({ ...expression, operand })} />
    </>}
    {expression.kind === "binary" && <>
      <label className="studio-field"><span>Operator</span><select value={expression.operator} onChange={(event) => onChange({ ...expression, operator: event.currentTarget.value as StudioBinaryOperator })}>{BINARY_OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select></label>
      <ExpressionNodeEditor expression={expression.left} references={references} depth={depth + 1} onChange={(left) => onChange({ ...expression, left })} />
      <ExpressionNodeEditor expression={expression.right} references={references} depth={depth + 1} onChange={(right) => onChange({ ...expression, right })} />
    </>}
    {expression.kind === "conditional" && <>
      <span className="studio-expression-editor__part-label">If</span><ExpressionNodeEditor expression={expression.condition} references={references} depth={depth + 1} onChange={(condition) => onChange({ ...expression, condition })} />
      <span className="studio-expression-editor__part-label">Then</span><ExpressionNodeEditor expression={expression.whenTrue} references={references} depth={depth + 1} onChange={(whenTrue) => onChange({ ...expression, whenTrue })} />
      <span className="studio-expression-editor__part-label">Otherwise</span><ExpressionNodeEditor expression={expression.whenFalse} references={references} depth={depth + 1} onChange={(whenFalse) => onChange({ ...expression, whenFalse })} />
    </>}
  </div>;
}

export function StudioExpressionEditor({ expression, label, references, onChange }: StudioExpressionEditorProps) {
  return <div className="studio-expression-editor" aria-label={label}>
    <ExpressionNodeEditor expression={expression} references={references} depth={0} onChange={onChange} />
    <output aria-label={`${label} text`} className="studio-expression-editor__projection">{projectStudioExpression(expression)}</output>
  </div>;
}
