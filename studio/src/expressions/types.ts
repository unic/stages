export type StudioExpressionScope =
  | "value"
  | "row"
  | "context"
  | "extension"
  | "metadata"
  /** Retained so previously imported document-v1 drafts remain readable. */
  | "interface"
  /** Retained so previously imported document-v1 drafts remain readable. */
  | "item";

export type StudioUnaryOperator = "!" | "-";
export type StudioBinaryOperator =
  | "+" | "-" | "*" | "/" | "%"
  | "===" | "!==" | "<" | "<=" | ">" | ">="
  | "&&" | "||" | "??";

/** JSON-safe expression tree. It contains data and a closed operator set only. */
export type StudioExpression =
  | { readonly kind: "literal"; readonly value: boolean | null | number | string }
  | {
    readonly kind: "reference";
    readonly scope: StudioExpressionScope;
    readonly path: readonly string[];
  }
  | { readonly kind: "unary"; readonly operator: StudioUnaryOperator; readonly operand: StudioExpression }
  | {
    readonly kind: "binary";
    readonly operator: StudioBinaryOperator;
    readonly left: StudioExpression;
    readonly right: StudioExpression;
  }
  | {
    readonly kind: "conditional";
    readonly condition: StudioExpression;
    readonly whenTrue: StudioExpression;
    readonly whenFalse: StudioExpression;
  };

export interface StudioExpressionLimits {
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxPathSegments: number;
  readonly maxStringLength: number;
  readonly maxEvaluationSteps: number;
}

export const STUDIO_EXPRESSION_LIMITS: StudioExpressionLimits = Object.freeze({
  maxDepth: 24,
  maxNodes: 256,
  maxPathSegments: 32,
  maxStringLength: 16_384,
  maxEvaluationSteps: 512,
});

export interface StudioExpressionContext {
  readonly value: unknown;
  readonly row?: unknown;
  readonly context?: unknown;
  readonly extensions?: unknown;
  readonly metadata?: unknown;
}

export interface StudioExpressionDependency {
  readonly scope: StudioExpressionScope;
  readonly path: readonly string[];
}

export type StudioExpressionFailureCode =
  | "expression.invalid"
  | "expression.limit"
  | "expression.missing-reference"
  | "expression.type"
  | "expression.arithmetic";

export type StudioExpressionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: StudioExpressionFailureCode; readonly message: string };
