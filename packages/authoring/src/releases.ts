import type { SerializedStagesState } from '@stages/core';
import { inspectJsonSafety, isPlainRecord } from './document/validation.js';
import { loadPortableForm, serializePortableForm, validatePortableForm, type LoadedPortableForm, type PortableFormDefinition, type PortableLoadOptions } from './portable.js';

/** Independent of document format and application value/schema versions. */
const COMPILER = 'stages.authoring@1.0.0-alpha.0/standard@1';
export type PortableReleaseChange = 'shape' | 'behavior' | 'presentation' | 'bindings';
export interface PortableCompatibilityDecision {
  readonly changes: readonly PortableReleaseChange[];
  readonly state: 'compatible' | 'migrate' | 'reset';
  readonly rationale: string;
}
export interface PortableRelease {
  readonly format: 'stages-portable-release';
  readonly formatVersion: 1;
  readonly compiler: string;
  readonly id: string;
  /** Immutable host build identity covering all trusted implementation code. */
  readonly bindingId: string;
  /** Immutable host acceptance/resource policy identity. */
  readonly policyId: string;
  readonly definition: PortableFormDefinition;
  readonly previous?: string;
  readonly compatibility?: PortableCompatibilityDecision;
}
export interface PortableReleaseOptions {
  readonly bindingId: string;
  readonly policyId: string;
  readonly previous?: PortableRelease;
  readonly compatibility?: PortableCompatibilityDecision;
}
export interface LoadedPortableRelease extends LoadedPortableForm {
  readonly release: PortableRelease;
}
export interface PortableSavedState {
  readonly format: 'stages-portable-state';
  readonly formatVersion: 1;
  readonly releaseId: string;
  readonly state: SerializedStagesState;
}
export interface PortableStateMigration {
  readonly from: PortableRelease;
  readonly to: PortableRelease;
  readonly baseline: 'preserve' | 'migrate' | 'reset';
  /** Every input/output top-level metadata key needs an explicit policy. */
  readonly metadata: Readonly<Record<string, 'preserve' | 'migrate' | 'reset'>>;
  readonly migrate: (state: SerializedStagesState) => SerializedStagesState;
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, child: unknown) => child !== null && typeof child === 'object' && !Array.isArray(child)
    ? Object.fromEntries(Object.entries(child).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : child);
}
function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function immutable<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(immutable);
    Object.freeze(value);
  }
  return value;
}
function requireSafe(value: unknown): void {
  if (inspectJsonSafety(value, 5 * 1024 * 1024, 100).length) throw new TypeError('portable.release-json: Expected bounded JSON data.');
}
function requireIdentity(value: string): void {
  if (typeof value !== 'string' || !value.trim() || value.length > 512) throw new TypeError('portable.release-identity: Supply a nonempty immutable host identity (at most 512 characters).');
}
async function digest(value: unknown): Promise<string> {
  // Web Crypto is available in supported browsers and Node 24; no Node/DOM import.
  const platform = globalThis as unknown as {
    crypto: { subtle: { digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> } };
    TextEncoder: new () => { encode(value: string): Uint8Array };
  };
  const bytes = new platform.TextEncoder().encode(canonical(value));
  const hash = await platform.crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${[...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

/** Conservative classification: props can affect trusted behavior and are not presentation-only. */
export function comparePortableReleases(before: PortableRelease, after: Pick<PortableRelease, 'definition' | 'bindingId' | 'policyId'>): readonly PortableReleaseChange[] {
  const project = (definition: PortableFormDefinition) => {
    const presentation: unknown[] = [definition.form.title, definition.form.settings, definition.defaultLocale, definition.resources];
    const nodes = Object.fromEntries(Object.entries(definition.form.nodes).map(([uid, node]) => {
      const { presentation: appearance, ...semantic } = node;
      presentation.push([uid, appearance]);
      return [uid, semantic];
    }));
    const { title: _title, settings: _settings, runtime: _runtime, ...form } = definition.form;
    const shape = Object.fromEntries(Object.entries(nodes).map(([uid, node]) => [uid, Object.fromEntries(Object.entries(node).filter(([key]) =>
      ['kind', 'runtimeId', 'definition', 'childUids', 'stageUids', 'variantUids', 'discriminator', 'itemKey'].includes(key)))]));
    return { presentation, shape: [definition.form.rootNodeUids, shape, definition.fieldDescriptors?.map(item => [item.key, item.version, item.value]) ?? []],
      behavior: [{ ...form, nodes }, definition.initialValue, definition.fieldDescriptors ?? [], definition.behaviors ?? []] };
  };
  const left = project(before.definition), right = project(after.definition);
  const changes: PortableReleaseChange[] = [];
  if (canonical(left.shape) !== canonical(right.shape) || canonical(before.definition.form.runtime) !== canonical(after.definition.form.runtime)) changes.push('shape');
  if (canonical(left.behavior) !== canonical(right.behavior) || before.policyId !== after.policyId) changes.push('behavior');
  if (canonical(left.presentation) !== canonical(right.presentation)) changes.push('presentation');
  if (before.bindingId !== after.bindingId || canonical(before.definition.requirements) !== canonical(after.definition.requirements)) changes.push('bindings');
  return Object.freeze(changes);
}

/** Additive wrapper: old portable v1 artifacts retain their exact serialized bytes. */
export async function createPortableRelease(definition: PortableFormDefinition, options: PortableReleaseOptions): Promise<PortableRelease> {
  requireSafe(options);
  options = copy(options);
  const checked = validatePortableForm(definition);
  if (!checked.ok) throw new TypeError(`portable.release-definition: ${checked.diagnostics.map(item => item.code).join(', ')}`);
  requireIdentity(options.bindingId); requireIdentity(options.policyId);
  if (options.previous) {
    await verifyRelease(options.previous);
    const changes = comparePortableReleases(options.previous, { definition: checked.value, ...options });
    const decision = options.compatibility;
    if (!decision || !['compatible', 'migrate', 'reset'].includes(decision.state) || !decision.rationale.trim() || canonical([...decision.changes].sort()) !== canonical([...changes].sort())) {
      throw new TypeError('portable.release-compatibility: Declare exactly the classified changes, state policy, and rationale.');
    }
    const oldSchema = options.previous.definition.form.runtime, nextSchema = checked.value.form.runtime;
    if (oldSchema.schemaId !== nextSchema.schemaId || nextSchema.schemaVersion < oldSchema.schemaVersion) throw new TypeError('portable.release-lineage: Keep the schema ID and never regress its version.');
    if (changes.includes('shape') && (nextSchema.schemaVersion <= oldSchema.schemaVersion || decision.state === 'compatible')) throw new TypeError('portable.release-shape: Shape changes require a schema version bump and migration/reset policy.');
  } else if (options.compatibility) throw new TypeError('portable.release-compatibility: A compatibility decision needs a previous release.');
  const body = { format: 'stages-portable-release' as const, formatVersion: 1 as const, compiler: COMPILER,
    bindingId: options.bindingId, policyId: options.policyId, definition: checked.value,
    ...(options.previous ? { previous: options.previous.id, compatibility: options.compatibility! } : {}) };
  requireSafe(body);
  return immutable({ ...copy(body), id: await digest(body) });
}

async function verifyRelease(input: PortableRelease): Promise<void> {
  requireSafe(input);
  if (!isPlainRecord(input) || input.format !== 'stages-portable-release' || input.formatVersion !== 1 || input.compiler !== COMPILER) throw new TypeError('portable.release-version: Unsupported release/compiler contract.');
  const allowed = ['format', 'formatVersion', 'compiler', 'id', 'bindingId', 'policyId', 'definition', 'previous', 'compatibility'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new TypeError('portable.release-property: Unknown release property.');
  requireIdentity(input.bindingId); requireIdentity(input.policyId);
  if (input.previous !== undefined) {
    const decision = input.compatibility;
    if (typeof input.previous !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(input.previous) || !decision
      || !['compatible', 'migrate', 'reset'].includes(decision.state) || typeof decision.rationale !== 'string' || !decision.rationale.trim()
      || !Array.isArray(decision.changes) || new Set(decision.changes).size !== decision.changes.length
      || decision.changes.some(change => !['shape', 'behavior', 'presentation', 'bindings'].includes(change))) throw new TypeError('portable.release-compatibility: Invalid release decision.');
  } else if (input.compatibility !== undefined) throw new TypeError('portable.release-compatibility: Decision without a previous release.');
  const { id, ...body } = input;
  if (id !== await digest(body)) throw new TypeError('portable.release-integrity: Release content does not match its identity.');
  const checked = validatePortableForm(input.definition);
  if (!checked.ok) throw new TypeError('portable.release-definition: Invalid definition.');
}

/** The host must select an approved release; a content hash is not authentication. */
export async function loadPortableRelease(release: PortableRelease, options: PortableLoadOptions & Pick<PortableReleaseOptions, 'bindingId' | 'policyId'>): Promise<LoadedPortableRelease> {
  // Snapshot before awaiting hashing: concurrent caller mutation cannot change the loaded contract.
  requireSafe(release);
  const owned = immutable(copy(release));
  await verifyRelease(owned);
  if (owned.bindingId !== options.bindingId || owned.policyId !== options.policyId) throw new TypeError('portable.release-bindings: Host binding/policy identity mismatch.');
  const loaded = loadPortableForm(owned.definition, options);
  if (!loaded.ok) throw new TypeError(`portable.release-load: ${loaded.diagnostics.map(item => item.code).join(', ')}`);
  return { ...loaded.value, release: owned };
}

function checkedState(input: SerializedStagesState, release: PortableRelease): SerializedStagesState {
  requireSafe(input);
  if (!isPlainRecord(input) || input.format !== 'stages' || input.formatVersion !== 1 || !isPlainRecord(input.schema) || !isPlainRecord(input.meta)
    || !Object.hasOwn(input, 'value') || !Object.hasOwn(input, 'baseline') || Object.keys(input).sort().join(',') !== 'baseline,format,formatVersion,meta,schema,value'
    || input.schema.id !== release.definition.form.runtime.schemaId || input.schema.version !== release.definition.form.runtime.schemaVersion) throw new TypeError('portable.state-schema: State does not match the release schema.');
  return copy(input);
}
/** Wrap a controller's accepted serialize() output, never a speculative proposal. */
export function savePortableState(loaded: LoadedPortableRelease, state: SerializedStagesState): PortableSavedState {
  return immutable({ format: 'stages-portable-state', formatVersion: 1, releaseId: loaded.release.id, state: checkedState(state, loaded.release) });
}

/** Ordered full-envelope migration. Failure never mutates the recoverable input. */
export async function migratePortableState(input: PortableSavedState, target: LoadedPortableRelease, migrations: readonly PortableStateMigration[] = []): Promise<PortableSavedState> {
  requireSafe(input);
  if (input.format !== 'stages-portable-state' || input.formatVersion !== 1 || Object.keys(input).sort().join(',') !== 'format,formatVersion,releaseId,state') throw new TypeError('portable.state-format: Unsupported saved state.');
  let current = copy(input);
  const seen = new Set<string>();
  while (current.releaseId !== target.release.id) {
    if (seen.has(current.releaseId) || seen.size >= 100) throw new TypeError('portable.state-cycle: Migration cycle or chain limit.');
    seen.add(current.releaseId);
    const matches = migrations.filter(item => item.from.id === current.releaseId);
    if (matches.length !== 1) throw new TypeError('portable.state-migration: Exactly one migration is required for each release transition.');
    const step = matches[0]!;
    await verifyRelease(step.from); await verifyRelease(step.to);
    if (step.to.previous !== step.from.id || step.to.compatibility?.state === 'reset') throw new TypeError('portable.state-lineage: Transition must follow a declared non-reset release.');
    const before = checkedState(current.state, step.from);
    const after = checkedState(step.migrate(copy(before)), step.to);
    if (canonical(after) !== canonical(checkedState(step.migrate(copy(before)), step.to))) throw new TypeError('portable.state-determinism: Migration output differs between runs.');
    if (!['preserve', 'migrate', 'reset'].includes(step.baseline)) throw new TypeError('portable.state-baseline: Declare a baseline policy.');
    if (step.baseline === 'preserve' && canonical(before.baseline) !== canonical(after.baseline)) throw new TypeError('portable.state-baseline: Preserve policy changed the baseline.');
    if (step.baseline === 'reset' && canonical(after.baseline) !== canonical(after.value)) throw new TypeError('portable.state-baseline: Reset baseline must equal migrated value.');
    for (const key of new Set([...Object.keys(before.meta), ...Object.keys(after.meta)])) {
      const policy = step.metadata[key];
      if (!policy || !['preserve', 'migrate', 'reset'].includes(policy)) throw new TypeError(`portable.state-metadata: Declare a policy for ${key}.`);
      if (policy === 'preserve' && canonical(before.meta[key]) !== canonical(after.meta[key])) throw new TypeError(`portable.state-metadata: Preserve policy changed ${key}.`);
      if (policy === 'reset' && Object.hasOwn(after.meta, key)) throw new TypeError(`portable.state-metadata: Reset must omit ${key}.`);
    }
    current = { ...current, releaseId: step.to.id, state: after };
  }
  return savePortableState(target, current.state);
}

/** Stable serialization for artifact registries and review diffs. */
export function serializePortableRelease(release: PortableRelease): string {
  return serializePortableForm(release as unknown as PortableFormDefinition);
}

export interface PortableReleaseCache {
  /** Cache standard compilation; executable host bindings are configured freshly per load. */
  load(release: PortableRelease, options: PortableLoadOptions & Pick<PortableReleaseOptions, 'bindingId' | 'policyId'>): Promise<LoadedPortableRelease>;
  clear(): void;
}

function detached<T>(value: T): T {
  if (Array.isArray(value)) return value.map(detached) as T;
  if (value instanceof Map) return new Map([...value].map(([key, item]) => [key, detached(item)])) as T;
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, detached(item)])) as T;
  return value;
}
function detachedCompilation(loaded: LoadedPortableRelease): LoadedPortableRelease {
  const result = detached(loaded);
  const schemaInput = loaded.schemaInput;
  return { ...result, definition: loaded.definition, release: loaded.release, initialValue: loaded.initialValue,
    schemaInput: typeof schemaInput === 'function' ? context => detached(schemaInput(context)) : result.schemaInput };
}

/** Bounded owner-created LRU. No global cache and no reuse of arbitrary host closures. */
export function createPortableReleaseCache(capacity = 16): PortableReleaseCache {
  if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 64) throw new TypeError('portable.release-cache: Capacity must be between 1 and 64.');
  const entries = new Map<string, LoadedPortableRelease>();
  return {
    async load(release, options) {
      requireSafe(release);
      const owned = immutable(copy(release));
      await verifyRelease(owned);
      if (owned.bindingId !== options.bindingId || owned.policyId !== options.policyId) throw new TypeError('portable.release-bindings: Host binding/policy identity mismatch.');
      // Host fields, services and behavior factories can own mutable closures. Never share them.
      if (owned.definition.requirements.services.length || owned.definition.fieldDescriptors?.length || owned.definition.behaviors?.length) return loadPortableRelease(owned, options);
      let compiled = entries.get(owned.id);
      if (!compiled) {
        const result = loadPortableForm(owned.definition);
        if (!result.ok) throw new TypeError(`portable.release-load: ${result.diagnostics.map(item => item.code).join(', ')}`);
        compiled = { ...result.value, release: owned };
      }
      entries.delete(owned.id);
      entries.set(owned.id, compiled);
      if (entries.size > capacity) entries.delete(entries.keys().next().value!);
      return detachedCompilation(compiled);
    },
    clear() { entries.clear(); },
  };
}
