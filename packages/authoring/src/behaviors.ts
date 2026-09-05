import type { JsonObject, StudioDefinitionRef } from './document/types.js';
import type { PortableComposition } from './hybrid.js';

export interface PortableBehaviorReference extends StudioDefinitionRef {
  readonly config: JsonObject;
}
export interface PortableBehaviorBinding extends StudioDefinitionRef {
  /** Trusted configuration factory. The returned rules use the public core contract. */
  readonly configure: (config: JsonObject) => Pick<PortableComposition, 'validators' | 'transforms'>;
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
