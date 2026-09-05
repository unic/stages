import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { loadPortableForm, validatePortableSubmission, composePortableForm, definePortableFieldBindings } from '../dist/index.js';
import { stages, fieldEvent, formEvent } from '../../core/dist/index.js';
const contact = JSON.parse(readFileSync(new URL('./fixtures/contact-form-v1.json', import.meta.url)));
const number = (uid, computed) => ({ uid, runtimeId: uid, kind: 'field', definition: { key: 'number', version: 1 }, props: { label: uid }, ...(computed ? { computed } : {}) });
const ref = name => ({ kind: 'reference', scope: 'value', path: [name] });
const plus = (left, right) => ({ kind: 'binary', operator: '+', left, right });
const definition = () => ({ ...contact, form: { ...contact.form, nodes: { a: number('a'), b: number('b', plus(ref('a'), { kind: 'literal', value: 1 })), c: number('c', plus(ref('b'), ref('a'))) }, rootNodeUids: ['c', 'b', 'a'] }, initialValue: { a: 1, b: 2, c: 3 } });
test('computed dependencies are ordered, proposals are controlled and submissions reject forged values', async () => {
  const source = definition();
  const loaded = loadPortableForm(source); assert.equal(loaded.ok, true);
  let proposal;
  const controller = stages({ schema: loaded.value.schemaInput, fields: loaded.value.fields, value: source.initialValue, onChange: change => { proposal = change.value; } });
  try {
    controller.dispatch(fieldEvent('input', ['a'], { payload: 4 })); await Promise.resolve();
    assert.deepEqual(controller.getSnapshot().value, source.initialValue);
    assert.deepEqual(proposal, { a: 4, b: 5, c: 9 });
    controller.update({ value: proposal });
    assert.equal((await controller.validate()).isValid, true);
    controller.update({ value: { a: 4, b: 0, c: 0 } });
    assert.equal((await controller.validate()).isValid, false);
    controller.dispatch(formEvent('recompute')); await Promise.resolve();
    assert.deepEqual(proposal, { a: 4, b: 5, c: 9 });
    assert.equal((await validatePortableSubmission({ definition: source, revision: 'computed-1' }, { a: 4, b: 0, c: 0 })).status, 'rejected');
    assert.equal((await validatePortableSubmission({ definition: source, revision: 'computed-1' }, proposal)).status, 'accepted');
  } finally { controller.destroy(); }
});
test('computed cycles and unavailable scopes fail with exact properties', () => {
  const cycle = definition(); cycle.form.nodes.a.computed = ref('c');
  assert(loadPortableForm(cycle).diagnostics.some(issue => issue.code === 'compiler.computed-cycle'));
  const scope = definition(); scope.form.nodes.a.computed = { kind: 'reference', scope: 'event', path: [] };
  assert(loadPortableForm(scope).diagnostics.some(issue => issue.code === 'compiler.computed-scope'));
});
test('scoped bindings preserve factories and reject unknown targets and duplicate rules', () => {
  const loaded = loadPortableForm(contact).value;
  assert.throws(() => composePortableForm(loaded, { schemaId: 'other', schemaVersion: 1, nodes: { absent: { validators: [] } } }));
  assert.throws(() => composePortableForm(loaded, { schemaId: 'other', schemaVersion: 1, nodes: { name: { validators: [{ id: 'required.1', on: 'submit', validate: () => [] }] } } }));
  assert.throws(() => composePortableForm(loaded, { schemaId: 'other', schemaVersion: 1, nodes: { name: { navigation: {} } } }));
});
test('row computed values follow collection occurrences and accepted sibling changes', async () => {
  const source = definition();
  source.form.nodes = {
    rows: { uid: 'rows', kind: 'collection', runtimeId: 'rows', childUids: ['a', 'b'] },
    a: number('a'), b: number('b', plus({ kind: 'reference', scope: 'row', path: ['a'] }, { kind: 'literal', value: 1 })),
  };
  source.form.rootNodeUids = ['rows']; source.initialValue = { rows: [{ a: 1, b: 2 }, { a: 5, b: 6 }] };
  const loaded = loadPortableForm(source); assert.equal(loaded.ok, true);
  let proposal;
  const controller = stages({ schema: loaded.value.schemaInput, fields: loaded.value.fields, value: source.initialValue, onChange: change => { proposal = change.value; } });
  try {
    controller.dispatch(fieldEvent('input', ['rows', 1, 'a'], { payload: 10 })); await Promise.resolve();
    assert.deepEqual(proposal, { rows: [{ a: 1, b: 2 }, { a: 10, b: 11 }] });
    controller.update({ value: proposal });
    assert.equal((await controller.validate()).isValid, true);
  } finally { controller.destroy(); }
});
test('indexed dependencies order collection computations before their consumers', async () => {
  const source = definition();
  source.form.nodes = {
    c: number('c', { kind: 'reference', scope: 'value', path: ['rows', '0', 'b'] }),
    rows: { uid: 'rows', kind: 'collection', runtimeId: 'rows', childUids: ['a', 'b'] },
    a: number('a'), b: number('b', plus({ kind: 'reference', scope: 'row', path: ['a'] }, { kind: 'literal', value: 1 })),
  };
  source.form.rootNodeUids = ['c', 'rows']; source.initialValue = { c: 2, rows: [{ a: 1, b: 2 }] };
  const loaded = loadPortableForm(source); assert.equal(loaded.ok, true);
  let proposal;
  const controller = stages({ schema: loaded.value.schemaInput, fields: loaded.value.fields, value: source.initialValue, onChange: change => { proposal = change.value; } });
  try {
    controller.dispatch(fieldEvent('input', ['rows', 0, 'a'], { payload: 10 })); await Promise.resolve();
    assert.deepEqual(proposal, { c: 11, rows: [{ a: 10, b: 11 }] });
  } finally { controller.destroy(); }
  source.form.validators = [{ id: 'portable.computed', kind: 'required' }];
  assert(loadPortableForm(source).diagnostics.some(issue => issue.code === 'compiler.computed-conflict'));
});

test('structured computed results compare JSON values rather than object identity', async () => {
  const descriptor = { key: 'example/object', version: 1, displayName: 'Object', value: { kind: 'object', properties: { text: { kind: 'string' } } }, emptyValue: { text: '' }, props: {}, defaultProps: {}, input: { draft: 'json', parsing: 'JSON', formatting: 'JSON' }, accessibility: { role: 'textbox', label: 'Label', description: 'Description', keyboard: ['Tab'] } };
  const node = id => ({ uid: id, runtimeId: id, kind: 'field', definition: { key: descriptor.key, version: 1 }, props: {} });
  const source = { ...contact, form: { ...contact.form, nodes: { source: node('source'), mirror: { ...node('mirror'), computed: ref('source') } }, rootNodeUids: ['source', 'mirror'] }, fieldDescriptors: [descriptor], requirements: { ...contact.requirements, fields: [{ key: descriptor.key, version: 1 }] }, initialValue: { source: { text: 'equal' }, mirror: { text: 'equal' } } };
  const fieldBindings = definePortableFieldBindings([{ key: descriptor.key, version: 1, field: {} }]);
  const deployment = { definition: source, revision: 'structured-computed-1', fieldBindings };
  assert.equal((await validatePortableSubmission(deployment, source.initialValue)).status, 'accepted');
  assert.equal((await validatePortableSubmission(deployment, { source: { text: 'new' }, mirror: { text: 'old' } })).status, 'rejected');
});
