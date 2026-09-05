import type { JsonObject, StudioDefinitionRef } from './document/types.js';
import type { PortableComposition } from './hybrid.js';

export interface PortableBehaviorReference extends StudioDefinitionRef {
  readonly config: JsonObject;
}
export interface PortableBehaviorBinding extends StudioDefinitionRef {
  /** Trusted configuration factory. The returned rules use the public core contract. */
  readonly configure: (config: JsonObject, form?: import('./document/types.js').StudioFormDocument) => Pick<PortableComposition, 'validators' | 'transforms' | 'nodes'>;
}
export interface PortableBehaviorBindings {
  readonly resolve: (reference: StudioDefinitionRef) => PortableBehaviorBinding | undefined;
}
export function definePortableBehaviorBindings(bindings: readonly PortableBehaviorBinding[]): PortableBehaviorBindings {
  const entries = new Map<string, PortableBehaviorBinding>();
  for (const binding of bindings) {
    const token = `${binding.key}@${binding.version}`;
    if (entries.has(token)) throw new Error(`Duplicate behavior binding ${token}.`);
    entries.set(token, Object.freeze({ ...binding }));
  }
  return Object.freeze({ resolve: (reference: StudioDefinitionRef) => entries.get(`${reference.key}@${reference.version}`) });
}

export function validPortableBehaviorReferences(value: unknown): value is readonly PortableBehaviorReference[] {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every(item => {
    if (item === null || typeof item !== 'object' || Object.keys(item).sort().join(',') !== 'config,key,version'
      || typeof item.key !== 'string' || !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]+$/.test(item.key)
      || !Number.isSafeInteger(item.version) || item.version < 1 || item.config === null || typeof item.config !== 'object' || Array.isArray(item.config)) return false;
    const key = `${item.key}@${item.version}`;
    if (keys.has(key)) return false;
    keys.add(key); return true;
  });
}
