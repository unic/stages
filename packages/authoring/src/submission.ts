import { stages, type NodeConfig, type ValidationIssue } from '@stages/core';
import type { JsonValue, Uid } from './document/types.js';
import type { StudioFieldRegistry } from './compiler/types.js';
import { isPlainRecord } from './document/validation.js';
import { isSafeObjectKey } from './document/uid.js';
import { matchesPortableValue } from './fields.js';
import { loadPortableForm, validatePortableForm, type PortableFormDefinition, type PortableLoadOptions } from './portable.js';
import { studioFieldDefinition } from './registry/index.js';
import { defineStudioAsyncServiceBindings } from './registry/services.js';

/** Server-owned deployment. Never construct this from the submitted request. */
export interface PortableSubmissionDeployment extends PortableLoadOptions {
  readonly definition: PortableFormDefinition;
  /** Host-assigned immutable revision covering artifact, bindings, and acceptance policy. */
  readonly revision: string;
}
export interface PortableSubmissionOptions {
  readonly context?: unknown;
  readonly signal?: {
    readonly aborted: boolean;
    addEventListener(type: 'abort', listener: () => void, options?: { readonly once?: boolean }): void;
    removeEventListener(type: 'abort', listener: () => void): void;
  };
  /** Positive milliseconds; defaults to 10,000. Cannot interrupt synchronous host code. */
  readonly timeoutMs?: number;
}
export interface PortableSubmissionIdentity {
  readonly revision: string;
  readonly schemaId: string;
  readonly schemaVersion: number;
}
export type PortableSubmissionResult =
  | { readonly status: 'accepted'; readonly identity: PortableSubmissionIdentity; readonly value: JsonValue; readonly issues: readonly ValidationIssue[] }
  | { readonly status: 'rejected'; readonly identity: PortableSubmissionIdentity; readonly phase: 'decode' | 'validation'; readonly issues: readonly ValidationIssue[] }
  | { readonly status: 'unavailable'; readonly identity: PortableSubmissionIdentity; readonly reason: 'configuration' | 'execution' | 'timeout' | 'cancelled'; readonly issues: readonly ValidationIssue[] };

// Structural host contracts keep Node/DOM ambient types out of the public package.
const timers = globalThis as unknown as {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
};
const MAX_ITEMS = 10_000;
const MAX_BYTES = 1_000_000;
const MAX_DEPTH = 64;
const MAX_ROWS = 1_000;
type Path = readonly (string | number)[];
function issue(code: string, path: Path = []): ValidationIssue {
  return { id: code, code, path, severity: 'error' };
}

/** Clone only data properties; reject sparse arrays, accessors, prototypes and unsafe keys. */
function transport(input: unknown): JsonValue {
  let items = 0;
  let bytes = 0;
  const ancestors = new Set<object>();
  const copy = (value: unknown, depth: number): JsonValue => {
    if (++items > MAX_ITEMS || depth > MAX_DEPTH) throw new Error('submission.limit');
    if (value === null || typeof value === 'boolean') { bytes += 5; return value; }
    if (typeof value === 'number' && Number.isFinite(value)) { bytes += 24; return value; }
    if (typeof value === 'string') {
      // Conservative UTF-8/escaping bound, also avoids allocating a large serialization.
      bytes += value.length * 6 + 2;
      if (bytes > MAX_BYTES) throw new Error('submission.limit');
      return value;
    }
    if (value === null || typeof value !== 'object' || (!Array.isArray(value) && !isPlainRecord(value)) || ancestors.has(value)) throw new Error('submission.non-json');
    ancestors.add(value);
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_ITEMS || (Array.isArray(value) && (value.length > MAX_ITEMS || keys.length !== value.length + 1))) throw new Error('submission.non-json');
    const result: Record<string, JsonValue> = {};
    const array: JsonValue[] = [];
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      if (typeof key !== 'string' || !isSafeObjectKey(key)) throw new Error('submission.non-json');
      const property = Object.getOwnPropertyDescriptor(value, key);
      if (!property || !('value' in property) || !property.enumerable) throw new Error('submission.non-json');
      bytes += key.length * 6 + 4;
      if (bytes > MAX_BYTES) throw new Error('submission.limit');
      const child = copy(property.value, depth + 1);
      if (Array.isArray(value)) {
        if (key !== String(array.length)) throw new Error('submission.non-json');
        array.push(child);
      } else result[key] = child;
    }
    ancestors.delete(value);
    return Array.isArray(value) ? array : result;
  };
  const result = copy(input, 0);
  if (bytes > MAX_BYTES) throw new Error('submission.limit');
  return result;
}

function decode(definition: PortableFormDefinition, value: JsonValue): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fail = (code: string, path: Path) => { if (issues.length < 100) issues.push(issue(code, path)); };
  const scope = (uids: readonly Uid[], input: unknown, path: Path, discriminator?: string): void => {
    if (!isPlainRecord(input)) { fail('submission.object', path); return; }
    const allowed = new Set(discriminator === undefined ? [] : [discriminator]);
    for (const uid of uids) {
      const node = definition.form.nodes[uid]!;
      if (node.kind === 'block') continue;
      if (node.kind === 'variant' || node.kind === 'fragment') throw new Error('Unsupported submission graph.');
      allowed.add(node.runtimeId);
      const childPath = [...path, node.runtimeId];
      if (!Object.hasOwn(input, node.runtimeId)) { fail('submission.missing', childPath); continue; }
      const child = input[node.runtimeId];
      if (node.kind === 'field') {
        const descriptor = definition.fieldDescriptors?.find(item => item.key === node.definition.key && item.version === node.definition.version);
        const contract = descriptor?.value ?? studioFieldDefinition(node.definition)?.value;
        if (!contract || !matchesPortableValue(contract, child)) fail('submission.type', childPath);
        else if (node.definition.key === 'choice' && child !== '' && !String(node.props['options'] ?? '').split('\n').map(option => option.trim()).filter(Boolean).includes(String(child))) fail('submission.choice', childPath);
      } else if (node.kind === 'collection') {
        if (!Array.isArray(child)) { fail('submission.array', childPath); continue; }
        if (child.length < (node.min ?? 0) || child.length > Math.min(node.max ?? MAX_ROWS, MAX_ROWS)) { fail('submission.collection-size', childPath); continue; }
        child.forEach((row: unknown, index: number) => {
          const rowPath = [...childPath, index];
          if (node.variantUids !== undefined) {
            const variant = isPlainRecord(row) ? node.variantUids.map(id => definition.form.nodes[id]).find(item => item?.kind === 'variant' && item.runtimeId === row[node.discriminator]) : undefined;
            if (!variant || variant.kind !== 'variant') fail('submission.discriminator', [...rowPath, node.discriminator]);
            else scope(variant.childUids, row, rowPath, node.discriminator);
          } else scope(node.childUids, row, rowPath);
        });
      } else scope(node.kind === 'wizard' ? node.stageUids : node.childUids, child, childPath);
    }
    for (const key of Object.keys(input)) if (!allowed.has(key)) fail('submission.unknown-property', [...path, key]);
  };
  scope(definition.form.rootNodeUids, value, []);
  return issues;
}

// The compiler's base schema contains the full graph before presentWhen factories.
// Reuse its exact rules and bindings while making every occurrence eligible.
function submissionNodes(nodes: readonly NodeConfig<unknown, StudioFieldRegistry>[]): readonly NodeConfig<unknown, StudioFieldRegistry>[] {
  return nodes.map(node => {
    const common = { ...node, when: true, disabled: false };
    if (common.kind === 'group') return { ...common, nodes: submissionNodes(common.nodes) };
    if (common.kind === 'collection') return common.nodes !== undefined
      ? { ...common, nodes: submissionNodes(common.nodes) }
      : { ...common, variants: Object.fromEntries(Object.entries(common.variants).map(([id, variant]) => [id, { ...variant, nodes: submissionNodes(variant.nodes) }])) };
    if (common.kind === 'wizard') return { ...common, stages: common.stages.map(stage => ({ ...stage, when: true, disabled: false, nodes: submissionNodes(stage.nodes) })) };
    return common;
  });
}

/** Strict authoritative validation; UI visibility/editability never grants an exemption. */
export async function validatePortableSubmission(
  deployment: PortableSubmissionDeployment,
  input: unknown,
  options: PortableSubmissionOptions = {},
): Promise<PortableSubmissionResult> {
  const identity: PortableSubmissionIdentity = { revision: deployment.revision, schemaId: deployment.definition.form.runtime.schemaId, schemaVersion: deployment.definition.form.runtime.schemaVersion };
  const unavailable = (reason: 'configuration' | 'execution' | 'timeout' | 'cancelled'): PortableSubmissionResult => ({ status: 'unavailable', identity, reason, issues: [] });
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!deployment.revision.trim() || !Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647) return unavailable('configuration');
  if (options.signal?.aborted) return unavailable('cancelled');
  let controller: ReturnType<typeof stages> | undefined;
  let timer: unknown;
  let onAbort: (() => void) | undefined;
  let executionFailed = false;
  let serviceRejected = false;
  let phase: 'configuration' | 'execution' = 'configuration';
  const started = Date.now();
  try {
    // Validate original capabilities before constructing the server policy projection.
    const checked = validatePortableForm(deployment.definition);
    if (!checked.ok) return unavailable('configuration');
    let value: JsonValue;
    try { value = transport(input); }
    catch (error) { return { status: 'rejected', identity, phase: 'decode', issues: [issue(error instanceof Error && error.message === 'submission.limit' ? 'submission.limit' : 'submission.non-json')] }; }
    const issues = decode(checked.value, value);
    if (issues.length) return { status: 'rejected', identity, phase: 'decode', issues };
    const services = defineStudioAsyncServiceBindings(checked.value.requirements.services.map(reference => {
      const binding = deployment.serviceBindings?.resolve(reference);
      if (!binding || binding.key !== reference.key || binding.version !== reference.version) throw new Error('Missing service binding.');
      return { ...reference, async invoke(request: Parameters<typeof binding.invoke>[0]) {
        try {
          const result = await binding.invoke(request);
          if (!result || (result.status !== 'success' && result.status !== 'failure')) throw new Error('Invalid service result.');
          if (result.status === 'failure') serviceRejected = true;
          return result;
        } catch (error) { executionFailed = true; throw error; }
      } };
    }));
    const loaded = loadPortableForm(checked.value, { ...deployment, serviceBindings: services });
    if (!loaded.ok) return unavailable('configuration');
    phase = 'execution';
    controller = stages({ schema: { ...loaded.value.schema, nodes: submissionNodes(loaded.value.schema.nodes) }, fields: loaded.value.fields, value: value as unknown, context: options.context,
      onDiagnostic: () => { executionFailed = true; },
      validationFailureIssue: () => { executionFailed = true; return { code: 'submission.execution' }; },
    });
    const deadline = new Promise<PortableSubmissionResult>(resolve => {
      onAbort = () => resolve(unavailable('cancelled'));
      options.signal?.addEventListener('abort', onAbort, { once: true });
      if (options.signal?.aborted) onAbort();
      timer = timers.setTimeout(() => resolve(unavailable('timeout')), Math.max(0, timeoutMs - (Date.now() - started)));
    });
    const validation = controller.validate({ scope: 'form', event: 'submit', reveal: true }).then(snapshot => {
      if (options.signal?.aborted) return unavailable('cancelled');
      if (Date.now() - started >= timeoutMs) return unavailable('timeout');
      if (executionFailed || snapshot.status === 'pending' || snapshot.status === 'unknown' || snapshot.pendingCount > 0 || snapshot.unknownCount > 0) return unavailable('execution');
      if (!snapshot.isValid || serviceRejected) return { status: 'rejected' as const, identity, phase: 'validation' as const, issues: snapshot.issues };
      return { status: 'accepted' as const, identity, value, issues: snapshot.issues };
    });
    return await Promise.race([validation, deadline]);
  } catch { return unavailable(phase); }
  finally {
    if (timer !== undefined) timers.clearTimeout(timer);
    if (onAbort) options.signal?.removeEventListener('abort', onAbort);
    controller?.destroy();
  }
}
