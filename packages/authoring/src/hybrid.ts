import type { StagesSchemaInput, TransformConfig, ValidatorConfig } from '@stages/core';
import type { LoadedPortableForm } from './portable.js';
import type { StudioFieldRegistry } from './compiler/types.js';

export interface PortableComposition {
  /** Immutable deployment identity for these host semantics; must differ from the source schema ID. */
  readonly schemaId: string;
  readonly schemaVersion: number;
  /** Appended after portable rules. Validator IDs may not shadow existing rules. Dependencies use core paths. */
  readonly validators?: readonly ValidatorConfig<unknown, unknown>[];
  readonly transforms?: readonly TransformConfig<unknown, unknown>[];
}

/** Compose trusted JS rules without mutating the artifact or bypassing dynamic schema factories. */
export function composePortableForm(loaded: LoadedPortableForm, composition: PortableComposition): LoadedPortableForm {
  if (!composition.schemaId.trim() || composition.schemaId === loaded.schema.id || !Number.isSafeInteger(composition.schemaVersion) || composition.schemaVersion < 1) {
    throw new Error('Hybrid composition requires a distinct deployment schema ID and a positive integer version.');
  }
  return extendPortableForm(loaded, composition);
}

export function extendPortableForm(loaded: LoadedPortableForm, composition: PortableComposition): LoadedPortableForm {
  const append = <T extends { readonly id: string }>(portable: readonly T[] = [], custom: readonly T[] = []): readonly T[] => {
    const ids = new Set<string>();
    return Object.freeze([...portable, ...custom].map(rule => {
      if (ids.has(rule.id)) throw new Error(`Duplicate hybrid rule ID ${rule.id}.`);
      ids.add(rule.id);
      return rule;
    }));
  };
  const validators = append(loaded.schema.validators, composition.validators);
  const transforms = Object.freeze([...(loaded.schema.transforms ?? []), ...(composition.transforms ?? [])]);
  const extend = (schema: typeof loaded.schema): typeof loaded.schema => ({ ...schema, id: composition.schemaId, version: composition.schemaVersion, validators, transforms });
  const original = loaded.schemaInput;
  const schema = extend(loaded.schema);
  const schemaInput: StagesSchemaInput<unknown, StudioFieldRegistry, unknown> = typeof original === 'function'
    ? context => extend(original(context)) : schema;
  return { ...loaded, schema, schemaInput };
}
