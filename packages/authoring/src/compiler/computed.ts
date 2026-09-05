import type { JsonValue } from '../document/types.js';
import { getAtPath, setAtPath, type DataPath, type StagesPatch, type TransformConfig, type ValidatorConfig } from '@stages/core';
import type { CompiledStudioForm } from './types.js';
import { resolveStudioSourceEntry } from './source-map.js';
import { evaluateStudioExpression } from '../expressions/evaluator.js';
import { studioExpressionDependencies } from '../expressions/serialization.js';
import { matchesPortableValue, type ResolvedPortableField } from '../fields.js';
import { studioFieldDefinition } from '../registry/index.js';

const computedTransforms = new WeakSet<object>();
export function orderedPortableTransforms(transforms: readonly TransformConfig<unknown, unknown>[]): readonly TransformConfig<unknown, unknown>[] {
  return [...transforms.filter(item => !computedTransforms.has(item)), ...transforms.filter(item => computedTransforms.has(item))];
}

/** Persisted computed values are proposals on events and consistency rules during validation. */
export function compileComputed(compiled: CompiledStudioForm, customFields: readonly ResolvedPortableField[]): CompiledStudioForm {
  if (compiled.diagnostics.some(item => item.severity === 'error')) return compiled;
  const entries = Object.values(compiled.expandedForm.nodes).flatMap(node => node.kind === 'field' && node.computed !== undefined
    ? [{ node, expression: node.computed, source: compiled.sourceMap.byUid.get(node.uid)! }] : []);
  if (!entries.length) return compiled;
  const diagnostics = [...compiled.diagnostics];
  const error = (code: string, message: string, uid: typeof compiled.expandedForm.uid) => diagnostics.push({ code, message, severity: 'error', source: 'compiler', formUid: compiled.expandedForm.uid, entityUid: uid, propertyPath: ['nodes', uid, 'computed'] });
  if (compiled.schema.validators?.some(rule => rule.id === 'portable.computed')) error('compiler.computed-conflict', 'The validator ID portable.computed is reserved for computed consistency.', entries[0]!.node.uid);
  const collectionPaths = new Set(Object.values(compiled.expandedForm.nodes).filter(node => node.kind === 'collection')
    .map(node => JSON.stringify(compiled.sourceMap.byUid.get(node.uid)?.runtimePath)));
  const references = (dependency: DataPath, target: DataPath): boolean => {
    let input = 0;
    for (let index = 0; index < target.length; index++) {
      if (collectionPaths.has(JSON.stringify(target.slice(0, index))) && /^\d+$/.test(String(dependency[input]))) input++;
      if (input === dependency.length) return true;
      if (dependency[input++] !== target[index]) return false;
    }
    return input === dependency.length;
  };
  const ordered: typeof entries = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (entry: typeof entries[number]): void => {
    if (visited.has(entry.node.uid)) return;
    if (visiting.has(entry.node.uid)) { error('compiler.computed-cycle', 'Computed dependencies must form an acyclic graph.', entry.node.uid); return; }
    visiting.add(entry.node.uid);
    for (const dependency of studioExpressionDependencies(entry.expression)) {
      if (!['value', 'row', 'context'].includes(dependency.scope)) { error('compiler.computed-scope', 'Computed values support value, current row and trusted context scopes.', entry.node.uid); continue; }
      const path = dependency.scope === 'row' ? [...entry.source.runtimePath.slice(0, -1), ...dependency.path] : dependency.path;
      if (dependency.scope !== 'context') for (const other of entries) {
        if (references(path, other.source.runtimePath)) visit(other);
      }
    }
    visiting.delete(entry.node.uid); visited.add(entry.node.uid); ordered.push(entry);
  };
  entries.forEach(visit);
  if (diagnostics.some(item => item.severity === 'error')) return { ...compiled, diagnostics };
  const paths = (root: unknown, template: DataPath, prefix: DataPath = []): DataPath[] => {
    if (!template.length) return [prefix];
    if (Array.isArray(root)) return root.flatMap((row, index) => paths(row, template, [...prefix, index]));
    const [key, ...rest] = template;
    return root !== null && typeof root === 'object' && Object.hasOwn(root, key!) ? paths(getAtPath(root, [key!]), rest, [...prefix, key!]) : [];
  };
  const calculate = (input: unknown, context: unknown): readonly StagesPatch[] => {
    let value = input;
    const patches: StagesPatch[] = [];
    for (const entry of ordered) for (const path of paths(value, entry.source.runtimePath)) {
      if (resolveStudioSourceEntry(compiled.sourceMap, path, value)?.uid !== entry.node.uid) continue;
      const result = evaluateStudioExpression(entry.expression, { value, row: getAtPath(value, path.slice(0, -1)), context });
      if (!result.ok) throw new Error(result.message);
      const contract = customFields.find(field => field.descriptor.key === entry.node.definition.key && field.descriptor.version === entry.node.definition.version)?.descriptor.value ?? studioFieldDefinition(entry.node.definition)?.value;
      if (!contract || !matchesPortableValue(contract, result.value)) throw new Error(`Computed value does not match ${entry.node.definition.key}.`);
      if (!matchesPortableValue({ kind: 'enum', values: [result.value as JsonValue] }, getAtPath(value, path))) {
        patches.push({ op: 'set', path, value: result.value });
        value = setAtPath(value, path, result.value);
      }
    }
    return patches;
  };
  const events = new Set(['input', 'blur', 'submit', 'recompute', 'collection:add', 'collection:remove', 'collection:replace', 'collection:move', 'collection:sort', 'collection:duplicate']);
  const addEvents = (on: string | readonly string[]) => { for (const name of typeof on === 'string' ? [on] : on) events.add(name); };
  for (const node of [compiled.expandedForm, ...Object.values(compiled.expandedForm.nodes)]) {
    if ('transforms' in node) node.transforms?.forEach(rule => addEvents(rule.on));
    if ('reducers' in node) node.reducers?.forEach(rule => addEvents(rule.on));
  }
  compiled.expandedForm.events?.forEach(event => events.add(event.name));
  const transform: TransformConfig<unknown, unknown> = { on: [...events], apply: ({ value, context }) => calculate(value, context) };
  computedTransforms.add(transform);
  const validator: ValidatorConfig<unknown, unknown> = { id: 'portable.computed', on: ['input', 'submit'], dependencies: [[]], validate: ({ value, context }) => calculate(value, context).map(patch => ({ id: 'portable.computed', code: 'computed.mismatch', severity: 'error', path: patch.path })) };
  const extend = (schema: typeof compiled.schema): typeof compiled.schema => ({ ...schema, transforms: [...(schema.transforms ?? []), transform], validators: [...(schema.validators ?? []), validator] });
  const original = compiled.schemaInput;
  return { ...compiled, schema: extend(compiled.schema), schemaInput: typeof original === 'function' ? context => extend(original(context)) : extend(original) };
}
