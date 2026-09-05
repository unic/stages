import type { FieldDefinition, StagesSchema, StagesSchemaInput } from '@stages/core';
import type { JsonObject, JsonValue, StudioDefinitionRef } from './document/types.js';
import { inspectJsonSafety, isPlainRecord } from './document/validation.js';
import { STUDIO_SUPPORTED_DEFINITIONS } from './registry/index.js';

/** Accepted values and transport are JSON; drafts belong to the view. */
export type PortableValueContract =
  | { readonly kind: 'string' | 'boolean' | 'number' | 'null' }
  | { readonly kind: 'enum'; readonly values: readonly JsonValue[] }
  | { readonly kind: 'array'; readonly items: PortableValueContract }
  | { readonly kind: 'object'; readonly properties: Readonly<Record<string, PortableValueContract>> }
  | { readonly kind: 'nullable'; readonly value: PortableValueContract };

export interface PortableFieldDescriptor extends StudioDefinitionRef {
  readonly displayName: string;
  readonly value: PortableValueContract;
  readonly emptyValue: JsonValue;
  readonly props: Readonly<Record<string, PortableValueContract>>;
  readonly defaultProps: JsonObject;
  readonly input: { readonly draft: 'string' | 'json'; readonly parsing: string; readonly formatting: string };
  readonly accessibility: { readonly role: string; readonly keyboard: readonly string[]; readonly label: string; readonly description: string };
}

/** Trusted semantics only. Framework components are registered separately by view token. */
export interface PortableFieldBinding extends StudioDefinitionRef {
  readonly field: Omit<FieldDefinition<unknown, JsonObject, string>, 'view' | 'initialValue'>;
}
export interface PortableFieldBindings {
  readonly resolve: (reference: StudioDefinitionRef) => PortableFieldBinding | undefined;
}

export function definePortableFieldBindings(bindings: readonly PortableFieldBinding[]): PortableFieldBindings {
  const entries = new Map<string, PortableFieldBinding>();
  for (const binding of bindings) {
    const key = portableFieldToken(binding);
    if (entries.has(key)) throw new Error(`Duplicate field binding ${key}.`);
    entries.set(key, Object.freeze({ ...binding, field: Object.freeze({ ...binding.field }) }));
  }
  return Object.freeze({ resolve: (reference: StudioDefinitionRef) => entries.get(portableFieldToken(reference)) });
}

/** Stable token for any adapter's component map; view choice never enters the artifact. */
export function portableFieldToken(reference: StudioDefinitionRef): string {
  return `${reference.key}@${reference.version}`;
}

export function matchesPortableValue(contract: PortableValueContract, value: unknown): boolean {
  switch (contract.kind) {
    case 'null': return value === null;
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    case 'nullable': return value === null || matchesPortableValue(contract.value, value);
    case 'enum': return contract.values.some(option => equalJson(option, value));
    case 'array': return Array.isArray(value) && Object.keys(value).length === value.length && Array.from(value).every(item => matchesPortableValue(contract.items, item));
    case 'object': return isPlainRecord(value) && Object.keys(value).length === Object.keys(contract.properties).length
      && Object.entries(contract.properties).every(([key, child]) => Object.hasOwn(value, key) && matchesPortableValue(child, value[key]));
  }
}
function equalJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left)) return Array.isArray(right) && left.length === right.length && left.every((item, index) => equalJson(item, right[index]));
  return isPlainRecord(left) && isPlainRecord(right) && Object.keys(left).length === Object.keys(right).length
    && Object.entries(left).every(([key, value]) => Object.hasOwn(right, key) && equalJson(value, right[key]));
}
function validContract(value: unknown, depth = 0): value is PortableValueContract {
  if (depth > 32 || !isPlainRecord(value)) return false;
  const kind = value['kind'];
  const keys = Object.keys(value);
  if (['string', 'boolean', 'number', 'null'].includes(String(kind))) return keys.length === 1;
  if (keys.length !== 2) return false;
  if (kind === 'nullable') return validContract(value['value'], depth + 1);
  if (kind === 'array') return validContract(value['items'], depth + 1);
  if (kind === 'enum') return Array.isArray(value['values']) && value['values'].length > 0;
  return kind === 'object' && isPlainRecord(value['properties']) && Object.values(value['properties']).every(child => validContract(child, depth + 1));
}

/** Internal shared validator, called before resolving executable host bindings. */
export function validPortableDescriptors(input: unknown): input is readonly PortableFieldDescriptor[] {
  if (!Array.isArray(input) || inspectJsonSafety(input, 1_000_000).length) return false;
  const seen = new Set<string>();
  return input.every(item => {
    if (!isPlainRecord(item) || Object.keys(item).sort().join(',') !== 'accessibility,defaultProps,displayName,emptyValue,input,key,props,value,version') return false;
    if (typeof item['key'] !== 'string' || !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]+$/.test(item['key']) || Object.hasOwn(STUDIO_SUPPORTED_DEFINITIONS, item['key'])
      || !Number.isSafeInteger(item['version']) || Number(item['version']) < 1 || typeof item['displayName'] !== 'string') return false;
    const token = `${item['key']}@${item['version']}`;
    if (seen.has(token)) return false;
    seen.add(token);
    const input = item['input'];
    const accessibility = item['accessibility'];
    return validContract(item['value']) && matchesPortableValue(item['value'], item['emptyValue'])
      && isPlainRecord(item['props']) && Object.values(item['props']).every(child => validContract(child))
      && matchesPortableValue({ kind: 'object', properties: item['props'] as Record<string, PortableValueContract> }, item['defaultProps'])
      && isPlainRecord(input) && Object.keys(input).length === 3 && ['string', 'json'].includes(String(input['draft'])) && typeof input['parsing'] === 'string' && typeof input['formatting'] === 'string'
      && isPlainRecord(accessibility) && Object.keys(accessibility).length === 4 && typeof accessibility['role'] === 'string' && typeof accessibility['label'] === 'string' && typeof accessibility['description'] === 'string'
      && Array.isArray(accessibility['keyboard']) && accessibility['keyboard'].every(key => typeof key === 'string');
  });
}

export interface ResolvedPortableField {
  readonly descriptor: PortableFieldDescriptor;
  readonly runtime: FieldDefinition<unknown, JsonObject, string>;
}
export function resolvePortableFields(descriptors: readonly PortableFieldDescriptor[], bindings?: PortableFieldBindings, inspectOnly = false): readonly ResolvedPortableField[] {
  if (!validPortableDescriptors(descriptors)) throw new TypeError('Invalid portable field descriptors.');
  const own = <T>(value: T): T => {
    if (value !== null && typeof value === 'object') {
      for (const child of Object.values(value)) own(child);
      Object.freeze(value);
    }
    return value;
  };
  return Object.freeze(descriptors.map(source => {
    const descriptor = own(JSON.parse(JSON.stringify(source)) as PortableFieldDescriptor);
    const binding = inspectOnly ? { ...descriptor, field: {} } : bindings?.resolve(descriptor);
    if (!binding || binding.key !== descriptor.key || binding.version !== descriptor.version) throw new Error(`Supply trusted field binding ${portableFieldToken(descriptor)}.`);
    const runtime: FieldDefinition<unknown, JsonObject, string> = {
      ...binding.field,
      view: portableFieldToken(descriptor), initialValue: () => JSON.parse(JSON.stringify(descriptor.emptyValue)) as JsonValue,
      reduce: context => {
        const result = binding.field.reduce?.(context);
        if (result && 'value' in result && !matchesPortableValue(descriptor.value, result.value)) throw new TypeError(`Invalid accepted value for ${portableFieldToken(descriptor)}.`);
        return result;
      },
    };
    return Object.freeze({ descriptor, runtime: Object.freeze(runtime) });
  }));
}

export type PortableViewFields<TView> = {
  readonly [TKey in keyof import('./compiler/types.js').StudioFieldRegistry]: Omit<import('./compiler/types.js').StudioFieldRegistry[TKey], 'view'> & { readonly view: TView };
};
export type PortableViewForm<TView> = Omit<import('./portable.js').LoadedPortableForm, 'schema' | 'schemaInput' | 'fields'> & {
  readonly schema: StagesSchema<unknown, PortableViewFields<TView>, unknown>;
  readonly schemaInput: StagesSchemaInput<unknown, PortableViewFields<TView>, unknown>;
  readonly fields: PortableViewFields<TView>;
};
/** Bind opaque view tokens while preserving semantic identity and compatible schema/field types. */
export function bindPortableViews<TView>(loaded: import('./portable.js').LoadedPortableForm, views: Readonly<Record<string, TView>>): PortableViewForm<TView> {
  const fields = Object.freeze(Object.fromEntries(Object.entries(loaded.fields).map(([key, field]) => {
    if (!Object.hasOwn(views, field.view)) throw new Error(`Missing view binding ${field.view}.`);
    return [key, Object.freeze({ ...field, view: views[field.view] })];
  }))) as PortableViewFields<TView>;
  // Views do not occur in node configuration; value/prop contracts are unchanged.
  return { ...loaded, fields, schema: loaded.schema as PortableViewForm<TView>['schema'], schemaInput: loaded.schemaInput as PortableViewForm<TView>['schemaInput'] };
}
