import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as authoring from '../dist/index.js';
import { stages, fieldEvent, formEvent } from '../../core/dist/index.js';
import { customBindings } from './fixtures/custom-bindings.mjs';
const descriptors = JSON.parse(readFileSync(new URL('./fixtures/custom-descriptors.json', import.meta.url)));
const options = customBindings(authoring, descriptors);
function unwrap(result) { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; }
function customProject() { return JSON.parse(readFileSync(new URL('./fixtures/custom-project-v1.json', import.meta.url))); }
function artifact() { return unwrap(authoring.projectPortableForm(customProject(), 'custom', undefined, { fieldDescriptors: descriptors, behaviors: [{ key: 'example/policy', version: 1, config: { maximum: 10000 } }] })); }

test('money, composite and optional numbers export with exact contracts and headless trusted semantics', async () => {
  const definition = artifact();
  assert.equal(authoring.serializePortableForm(definition), readFileSync(new URL('./fixtures/custom-form-v1.json', import.meta.url), 'utf8'));
  const loaded = unwrap(authoring.loadPortableForm(definition, options));
  const proposals = [];
  const controller = stages({ schema: loaded.schemaInput, fields: loaded.fields, value: loaded.initialValue, onChange: change => proposals.push(change.value) });
  try {
    assert.deepEqual(controller.getSnapshot().value, { money: { minorUnits: 0, currency: 'CHF' }, person: { given: '', family: '' }, optional: null });
    controller.dispatch(fieldEvent('input', ['optional'], { payload: '0' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(controller.getSnapshot().value.optional, null);
    assert.equal(proposals.at(-1).optional, 0);
    controller.update({ value: proposals.at(-1) });
    controller.dispatch(fieldEvent('input', ['optional'], { payload: '' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(proposals.at(-1).optional, null);
    controller.update({ value: proposals.at(-1) });
    const count = proposals.length;
    for (const draft of ['-', '0x12', 'Infinity', '1e9999']) controller.dispatch(fieldEvent('input', ['optional'], { payload: draft }));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(proposals.length, count);
    controller.update({ value: { ...loaded.initialValue, money: { minorUnits: 10001, currency: 'CHF' }, person: { given: ' Ada ', family: ' Lovelace ' } } });
    await controller.validate({ scope: 'form' });
    assert.equal(controller.getSnapshot().validation.status, 'invalid');
    controller.dispatch(formEvent('normalize'));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(proposals.at(-1).person, { given: 'Ada', family: 'Lovelace' });
    assert.equal(controller.getSnapshot().value.person.given, ' Ada ');
    controller.update({ value: { ...proposals.at(-1), money: { minorUnits: 1200, currency: 'EUR' } } });
    await controller.validate({ scope: 'form' });
    assert.equal(controller.getSnapshot().validation.status, 'valid');
  } finally { controller.destroy(); }
});

test('missing, wrong-version, duplicate or malformed bindings/descriptors fail explicitly', () => {
  const definition = artifact();
  assert.equal(authoring.loadPortableForm(definition).diagnostics[0].code, 'portable.missing-field-binding');
  assert.equal(authoring.loadPortableForm(definition, { fieldBindings: options.fieldBindings }).diagnostics[0].code, 'portable.missing-behavior-binding');
  assert.equal(authoring.loadPortableForm(definition, { ...options, fieldBindings: { resolve: ref => ({ ...ref, version: 99, field: {} }) } }).ok, false);
  assert.equal(authoring.loadPortableForm(definition, { ...options, behaviorBindings: { resolve: ref => ({ ...ref, version: 99, configure: () => ({}) }) } }).ok, false);
  for (const mutate of [d => { d.fieldDescriptors[0].value = { kind: 'mystery' }; }, d => { d.fieldDescriptors[0].emptyValue = []; }, d => { d.fieldDescriptors.push(d.fieldDescriptors[0]); }, d => { d.requirements.fields = []; }, d => { d.form.nodes.money.props.unexpected = true; }, d => { d.behaviors[0].config.maximum = 'bad'; }]) {
    const changed = structuredClone(definition); mutate(changed); assert.equal(authoring.loadPortableForm(changed, options).ok, false);
  }
  assert.throws(() => authoring.definePortableFieldBindings([{ key: 'a/b', version: 1, field: {} }, { key: 'a/b', version: 1, field: {} }]));
  assert.throws(() => authoring.definePortableBehaviorBindings([{ key: 'a/b', version: 1, configure() {} }, { key: 'a/b', version: 1, configure() {} }]));
});

test('view replacement preserves schema, callback identity, event values and transport', () => {
  const loaded = unwrap(authoring.loadPortableForm(artifact(), options));
  const views = Object.fromEntries(Object.values(loaded.fields).map(field => [field.view, { component: field.view }]));
  const native = authoring.bindPortableViews(loaded, views);
  const alternative = authoring.bindPortableViews(loaded, Object.fromEntries(Object.keys(views).map(key => [key, { otherComponent: key }])));
  const token = authoring.portableFieldToken(descriptors[0]);
  assert.equal(native.fields[token].reduce, alternative.fields[token].reduce);
  assert.equal(native.fields[token].validators, alternative.fields[token].validators);
  assert.notEqual(native.fields[token].view, alternative.fields[token].view);
  assert.equal(native.schemaInput, loaded.schemaInput);
  assert.equal(alternative.schema, loaded.schema);
  assert.throws(() => authoring.bindPortableViews(loaded, {}), /Missing view/);
  assert.deepEqual(loaded.initialValue, artifact().initialValue);
});

test('hybrid composition appends rules, rejects conflicts, preserves dynamic factories and assigns deployment identity', async () => {
  const input = structuredClone(artifact());
  input.form.nodes.optional.behavior = { presentWhen: { kind: 'reference', scope: 'context', path: ['show'] } };
  const base = unwrap(authoring.loadPortableForm(input, options));
  const hybrid = authoring.composePortableForm(base, { schemaId: 'deployment/custom', schemaVersion: 2, validators: [{ id: 'extra', on: 'submit', validate: () => [{ id: 'extra', code: 'extra', severity: 'error', path: [], message: 'Custom' }] }] });
  assert.equal(typeof hybrid.schemaInput, 'function');
  assert.equal(base.schema.id, 'custom');
  assert.equal(hybrid.schema.id, 'deployment/custom');
  assert.throws(() => authoring.composePortableForm(base, { schemaId: 'custom', schemaVersion: 1 }));
  assert.throws(() => authoring.composePortableForm(base, { schemaId: 'new', schemaVersion: 1, validators: [{ id: 'budget', on: 'submit', validate: () => [] }] }), /Duplicate/);
  const controller = stages({ schema: hybrid.schemaInput, fields: hybrid.fields, value: hybrid.initialValue, context: { show: false } });
  try {
    assert.equal(controller.getSnapshot().nodes.some(node => node.id === 'optional'), false);
    controller.update({ context: { show: true } });
    assert.equal(controller.getSnapshot().nodes.some(node => node.id === 'optional'), true);
    await controller.validate({ scope: 'form' });
    assert.equal(controller.getSnapshot().validation.issues.some(issue => issue.code === 'extra'), true);
  } finally { controller.destroy(); }
});

test('value contracts distinguish enum/array/object shapes and reject sparse or non-finite values', () => {
  const stringArray = { kind: 'array', items: { kind: 'string' } };
  assert.equal(authoring.matchesPortableValue(stringArray, ['a', 'b']), true);
  assert.equal(authoring.matchesPortableValue(stringArray, Array(2)), false);
  assert.equal(authoring.matchesPortableValue(stringArray, Object.assign(['a'], { extra: true })), false);
  assert.equal(authoring.matchesPortableValue({ kind: 'number' }, Infinity), false);
  assert.equal(authoring.matchesPortableValue({ kind: 'enum', values: [{ a: 1, b: 2 }] }, { b: 2, a: 1 }), true);
  assert.equal(authoring.matchesPortableValue({ kind: 'object', properties: { a: { kind: 'string' } } }, {}), false);
});

test('all behavior references resolve before configuration; teardown cancels hybrid async work', async () => {
  const input = structuredClone(artifact());
  input.behaviors.push({ key: 'example/missing', version: 1, config: {} });
  input.requirements.behaviors.push({ key: 'example/missing', version: 1 });
  let configured = 0;
  assert.equal(authoring.loadPortableForm(input, { fieldBindings: options.fieldBindings, behaviorBindings: authoring.definePortableBehaviorBindings([{ key: 'example/policy', version: 1, configure: () => { configured++; return {}; } }]) }).ok, false);
  assert.equal(configured, 0);
  let signal;
  let finish;
  const base = unwrap(authoring.loadPortableForm(artifact(), options));
  const hybrid = authoring.composePortableForm(base, { schemaId: 'cancel-test', schemaVersion: 1, validators: [{ id: 'wait', on: 'submit', validate: context => {
    signal = context.signal;
    return new Promise(resolve => { finish = resolve; });
  } }] });
  const controller = stages({ schema: hybrid.schemaInput, fields: hybrid.fields, value: hybrid.initialValue });
  const pending = controller.validate({ scope: 'form' });
  assert.equal(signal.aborted, false);
  controller.destroy();
  assert.equal(signal.aborted, true);
  finish([]);
  await pending;
});
