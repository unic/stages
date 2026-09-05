import type { StagesExtensionCodec, StagesValueCodec } from "@stages/core";
import type { JsonValue, StudioDefinitionRef } from "../document/index.js";

export interface StudioValueCodecBinding {
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly codec: StagesValueCodec<unknown>;
}

export interface StudioExtensionCodecBinding extends StudioDefinitionRef {
  readonly codec: StagesExtensionCodec;
}

export interface StudioCodecBindings {
  resolveValue(schema: Readonly<{ schemaId: string; schemaVersion: number }>): StagesValueCodec<unknown> | undefined;
  resolveExtension(reference: StudioDefinitionRef): StagesExtensionCodec | undefined;
}

const jsonCodec = Object.freeze({
  encode: (value: unknown) => value as JsonValue,
  decode: (value: JsonValue) => value,
});

function definitionKey(reference: StudioDefinitionRef): string {
  return `${reference.key}@${reference.version}`;
}

function schemaKey(schema: Readonly<{ schemaId: string; schemaVersion: number }>): string {
  return `${schema.schemaId}@${schema.schemaVersion}`;
}

/** Builds exact-version codec lookups from trusted executable host bindings. */
export function defineStudioCodecBindings(input: Readonly<{
  values?: readonly StudioValueCodecBinding[];
  extensions?: readonly StudioExtensionCodecBinding[];
}>): StudioCodecBindings {
  const values = new Map<string, StagesValueCodec<unknown>>();
  const extensions = new Map<string, StagesExtensionCodec>();
  for (const binding of input.values ?? []) {
    const key = schemaKey(binding);
    if (values.has(key)) throw new TypeError(`Duplicate value codec binding ${key}.`);
    values.set(key, binding.codec);
  }
  for (const binding of input.extensions ?? []) {
    const key = definitionKey(binding);
    if (extensions.has(key)) throw new TypeError(`Duplicate extension codec binding ${key}.`);
    extensions.set(key, binding.codec);
  }
  return Object.freeze({
    resolveValue: (schema: Readonly<{ schemaId: string; schemaVersion: number }>) => values.get(schemaKey(schema)),
    resolveExtension: (reference: StudioDefinitionRef) => extensions.get(definitionKey(reference)),
  });
}

/** JSON-safe preview default. Applications can supply richer trusted bindings. */
export const STUDIO_PREVIEW_CODEC_BINDINGS: StudioCodecBindings = Object.freeze({
  resolveValue: () => jsonCodec,
  resolveExtension: (reference: StudioDefinitionRef) => definitionKey(reference) === "json@1" ? jsonCodec : undefined,
});
