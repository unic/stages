import { compileStudioForm, createEmptyStudioScenarioValue, expandStudioFragments } from './compiler/compiler.js';
import type { CompiledStudioForm, StudioDiagnostic } from './compiler/types.js';
import type { JsonValue, StudioDefinitionRef, StudioDocumentDiagnostic, StudioFormDocument, StudioNode, StudioProjectDocument, StudioResourceCatalog, Uid } from './document/types.js';
import { DEFAULT_STUDIO_DOCUMENT_LIMITS, inspectJsonSafety, isPlainRecord, validateStudioProject } from './document/validation.js';
import { serializeStudioProject } from './document/serialization.js';
import type { StudioAsyncServiceBindings } from './registry/services.js';
import { defineStudioAsyncServiceBindings } from './registry/services.js';
import { STUDIO_SUPPORTED_DEFINITIONS } from './registry/index.js';

export interface PortableRequirements {
  readonly capabilities: readonly ['stages.standard@1'];
  readonly services: readonly StudioDefinitionRef[];
}

/** Resolved production graph. No scenario answers, project history, or fragment links. */
export interface PortableFormDefinition {
  readonly format: 'stages-portable-form';
  readonly formatVersion: 1;
  readonly form: Omit<StudioFormDocument, 'scenarios'>;
  readonly defaultLocale: string;
  readonly resources: StudioResourceCatalog;
  readonly initialValue: JsonValue;
  readonly requirements: PortableRequirements;
}

export type PortableDiagnostic = StudioDocumentDiagnostic | StudioDiagnostic;
export type PortableResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly PortableDiagnostic[] };
export interface PortableLoadOptions {
  /** Trusted implementations only. Each resolved binding must match key and version. */
  readonly serviceBindings?: StudioAsyncServiceBindings;
}
export interface LoadedPortableForm extends CompiledStudioForm {
  readonly definition: PortableFormDefinition;
  readonly initialValue: JsonValue;
}

function failure(code: string, message: string, propertyPath: readonly (string | number)[] = []): PortableResult<never> {
  return { ok: false, diagnostics: [{ code, message, propertyPath, severity: 'error', source: 'document' }] };
}

function requirements(form: Omit<StudioFormDocument, 'scenarios'>): PortableRequirements {
  const services = new Map<string, StudioDefinitionRef>();
  for (const owner of [form, ...Object.values(form.nodes)]) {
    for (const rule of 'validators' in owner ? owner.validators ?? [] : []) {
      if (rule.kind === 'service') services.set(`${rule.service.key}@${rule.service.version}`, rule.service);
    }
  }
  return { capabilities: ['stages.standard@1'], services: [...services.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : a.version - b.version) };
}

function projectFor(form: unknown, defaultLocale: unknown, resources: unknown): unknown {
  const record = isPlainRecord(form) ? form : {};
  // Choose a project UID that cannot collide with any portable graph identity.
  const identities = new Set([record['uid'], ...Object.keys(isPlainRecord(record['nodes']) ? record['nodes'] : {})]);
  let uid = 'portable_project';
  while (identities.has(uid)) uid += '_';
  return { format: 'stages-studio', formatVersion: 1, project: { uid, title: 'Portable form', defaultLocale },
    forms: { [String(record['uid'])]: { ...record, scenarios: [] } }, fragments: {}, resources };
}

/** Validate untrusted JSON data before any host binding is resolved. Does not execute rules. */
export function validatePortableForm(input: unknown): PortableResult<PortableFormDefinition> {
  const limits = DEFAULT_STUDIO_DOCUMENT_LIMITS;
  const safety = inspectJsonSafety(input, limits.maxBytes, limits.maxJsonDepth);
  if (safety.length) return { ok: false, diagnostics: safety };
  if (!isPlainRecord(input) || input['format'] !== 'stages-portable-form') return failure('portable.invalid-format', 'Expected a stages-portable-form object.', ['format']);
  if (input['formatVersion'] !== 1) return failure('portable.unsupported-version', 'Only portable format version 1 is supported.', ['formatVersion']);
  const allowed = new Set(['format', 'formatVersion', 'form', 'defaultLocale', 'resources', 'initialValue', 'requirements']);
  if (Object.keys(input).some(key => !allowed.has(key))) return failure('portable.unknown-property', 'The portable envelope contains an unknown property. Export a production projection.');
  if (!Object.hasOwn(input, 'initialValue')) return failure('portable.missing-initial-value', 'An explicit production initialValue is required.', ['initialValue']);
  const formInput = input['form'];
  if (isPlainRecord(formInput) && Object.hasOwn(formInput, 'scenarios')) return failure('portable.scenarios', 'Scenario answers are not production defaults.', ['form', 'scenarios']);
  const checked = validateStudioProject(projectFor(formInput, input['defaultLocale'], input['resources']), { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS });
  if (!checked.ok) return checked;
  const form = Object.values(checked.value.forms)[0]!;
  const formKeys = new Set(['uid', 'title', 'runtime', 'rootNodeUids', 'nodes', 'validators', 'events', 'transforms', 'settings']);
  if (!isPlainRecord(formInput) || Object.keys(formInput).some(key => !formKeys.has(key)) || Object.keys(form.settings).some(key => key !== 'theme')) return failure('portable.unknown-property', 'Portable forms contain runtime structure and optional theme settings only.', ['form']);
  if (Object.values(form.nodes).some(node => node.kind === 'fragment' || node.legacy !== undefined)) return failure('portable.unresolved-graph', 'Resolve fragments and remove legacy metadata before deployment.', ['form', 'nodes']);
  if (Object.keys(checked.value.resources).some(key => key !== 'locales')) return failure('portable.unsupported-resource', 'Version 1 production resources support localization only; extension codecs require a future portable contract.', ['resources']);
  const required = requirements(form);
  const supplied = input['requirements'];
  if (!isPlainRecord(supplied) || canonical(supplied) !== canonical(required)) return failure('portable.requirements-mismatch', 'Requirements must exactly list stages.standard@1 and every referenced service key/version. Re-export the definition.', ['requirements']);
  // Own a deep immutable copy; callers cannot mutate a compiled definition later.
  return { ok: true, value: freeze(JSON.parse(JSON.stringify(input)) as PortableFormDefinition) };
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function canonical(value: unknown): string {
  const sort = (item: unknown): unknown => Array.isArray(item) ? item.map(sort)
    : item !== null && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => [key, sort(child)])) : item;
  return JSON.stringify(sort(value));
}

function compile(definition: PortableFormDefinition, options: PortableLoadOptions, inspectOnly = false): PortableResult<LoadedPortableForm> {
  const bindings = [];
  for (const reference of definition.requirements.services) {
    const binding = inspectOnly ? { ...reference, invoke: async () => ({ status: 'success' as const }) } : options.serviceBindings?.resolve(reference);
    if (!binding || binding.key !== reference.key || binding.version !== reference.version) return failure('portable.missing-service-binding', `Supply the trusted service binding ${reference.key}@${reference.version}.`, ['requirements', 'services']);
    bindings.push(binding);
  }
  const compiled = compileStudioForm({ ...definition.form, scenarios: [] }, {}, {
    serviceBindings: defineStudioAsyncServiceBindings(bindings),
    localization: { defaultLocale: definition.defaultLocale, resources: definition.resources },
  });
  if (compiled.diagnostics.some(item => item.severity === 'error')) return { ok: false, diagnostics: compiled.diagnostics };
  return { ok: true, value: { ...compiled, definition, initialValue: definition.initialValue } };
}

/** Parse, validate, resolve exact trusted bindings, and compile. Never invokes a service. */
export function loadPortableForm(input: unknown, options: PortableLoadOptions = {}): PortableResult<LoadedPortableForm> {
  let parsed = input;
  if (typeof input === 'string') {
    if (input.length > DEFAULT_STUDIO_DOCUMENT_LIMITS.maxBytes) return failure('portable.size-limit', 'Portable JSON exceeds the input limit.');
    try { parsed = JSON.parse(input) as unknown; }
    catch { return failure('portable.invalid-json', 'Portable input must contain valid JSON.'); }
  }
  const checked = validatePortableForm(parsed);
  return checked.ok ? compile(checked.value, options) : checked;
}

/** Deterministic Studio project projection. Defaults never come from scenarios. */
export function projectPortableForm(project: StudioProjectDocument, formUid: Uid, initialValue?: JsonValue): PortableResult<PortableFormDefinition> {
  const safety = inspectJsonSafety(project, DEFAULT_STUDIO_DOCUMENT_LIMITS.maxBytes);
  if (safety.length) return { ok: false, diagnostics: safety };
  if (!project.forms?.[formUid]) return failure('portable.missing-form', `Form ${formUid} does not exist.`);
  const checked = validateStudioProject({ ...project, forms: { [formUid]: project.forms[formUid] } }, { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS });
  if (!checked.ok) return checked;
  const source = checked.value.forms[formUid];
  if (!source) return failure('portable.missing-form', `Form ${formUid} does not exist.`);
  // Bound expansion before allocating a potentially exponential fragment graph.
  let count = 0;
  const visit = (nodes: Readonly<Record<Uid, StudioNode>>, active: readonly Uid[]): boolean => {
    for (const node of Object.values(nodes)) {
      if (++count > DEFAULT_STUDIO_DOCUMENT_LIMITS.maxNodesPerForm) return false;
      if (node.kind === 'fragment') {
        const fragment = checked.value.fragments[node.fragmentUid];
        if (!fragment || active.includes(fragment.uid) || fragment.parameters?.length) return false;
        if (!visit(fragment.nodes, [...active, fragment.uid])) return false;
      }
    }
    return true;
  };
  if (!visit(source.nodes, [])) return failure('portable.fragment-expansion', 'Resolve missing/cyclic/parameterized fragments or reduce the expanded graph to at most 1000 nodes.');
  const expanded = expandStudioFragments(source, checked.value.fragments);
  if (expanded.diagnostics.some(item => item.severity === 'error')) return { ok: false, diagnostics: expanded.diagnostics };
  const { scenarios: _scenarios, ...form } = expanded.form;
  const nodes = Object.fromEntries(Object.entries(form.nodes).map(([uid, node]) => {
    const { legacy: _legacy, ...portable } = node;
    return [uid, portable];
  })) as Readonly<Record<Uid, StudioNode>>;
  const portableForm = {
    uid: form.uid, title: form.title, runtime: form.runtime, rootNodeUids: form.rootNodeUids, nodes,
    ...(form.validators === undefined ? {} : { validators: form.validators }),
    ...(form.events === undefined ? {} : { events: form.events }),
    ...(form.transforms === undefined ? {} : { transforms: form.transforms }),
    settings: form.settings['theme'] === undefined ? {} : { theme: form.settings['theme'] },
  };
  // Include only referenced messages; unrelated resource data stays in the project.
  const keys = new Set<string>();
  for (const owner of [form, ...Object.values(nodes)]) {
    if ('localizedProps' in owner) for (const key of Object.values(owner.localizedProps ?? {})) keys.add(key);
    for (const rule of 'validators' in owner ? owner.validators ?? [] : []) if (typeof rule.message === 'object' && rule.message.key) keys.add(rule.message.key);
  }
  const locales = Object.fromEntries(Object.entries(checked.value.resources.locales ?? {}).map(([locale, resource]) => [locale, {
    label: resource.label, messages: Object.fromEntries(Object.entries(resource.messages).filter(([key]) => keys.has(key))),
  }]));
  const definition = validatePortableForm({ format: 'stages-portable-form', formatVersion: 1, form: portableForm,
    defaultLocale: checked.value.project.defaultLocale, resources: Object.keys(locales).length ? { locales } : {},
    initialValue: initialValue === undefined ? createEmptyStudioScenarioValue(expanded.form) : initialValue, requirements: requirements(portableForm) });
  if (!definition.ok) return definition;
  const compiled = compile(definition.value, {}, true);
  return compiled.ok ? definition : compiled;
}

/** Stable key ordering and a trailing newline for checked-in deployment artifacts. */
export function serializePortableForm(definition: PortableFormDefinition): string {
  // Reuse the shared canonical serializer; its algorithm is independent of the envelope.
  return serializeStudioProject(definition as unknown as StudioProjectDocument);
}
