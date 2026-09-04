import type { FieldDefinition } from "./types.js";

export function getFieldDefinition(
  fields: unknown,
  type: string,
): FieldDefinition<unknown, unknown, unknown> | undefined {
  if (fields === null || typeof fields !== "object") return undefined;
  return (fields as Readonly<Record<string, FieldDefinition<unknown, unknown, unknown>>>)[type];
}
