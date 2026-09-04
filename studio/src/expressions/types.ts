export type StudioExpression =
  | { readonly kind: "literal"; readonly value: boolean | null | number | string }
  | {
    readonly kind: "reference";
    readonly scope: "interface" | "item" | "value";
    readonly path: readonly string[];
  }
  | { readonly kind: "unary"; readonly operator: "!" | "-"; readonly operand: StudioExpression }
  | {
    readonly kind: "binary";
    readonly operator: "+" | "-" | "*" | "/" | "%" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "&&" | "||";
    readonly left: StudioExpression;
    readonly right: StudioExpression;
  }
  | {
    readonly kind: "conditional";
    readonly condition: StudioExpression;
    readonly whenTrue: StudioExpression;
    readonly whenFalse: StudioExpression;
  };
