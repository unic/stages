import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { stages, fieldEvent } from '../../core/dist/index.js';
import { loadPortableForm, projectPortableForm, serializePortableForm, validatePortableForm, definePortableServiceBindings } from '../dist/index.js';
import { compileStudioForm, toUid } from '../dist/studio.js';
const project = JSON.parse(readFileSync(new URL('./fixtures/contact-project-v1.json', import.meta.url), 'utf8'));
function unwrap(result) { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; }
function definition() { return unwrap(projectPortableForm(project, toUid('contact'))); }

test('contact project projection is deterministic, immutable, and excludes answers/unrelated resources', () => {
  const value = definition();
  assert.equal(serializePortableForm(value), readFileSync(new URL('./fixtures/contact-form-v1.json', import.meta.url), 'utf8'));
  assert.equal(serializePortableForm(value), serializePortableForm(definition()));
  assert.equal(Object.isFrozen(value.form.nodes.name), true);
  assert.equal('scenarios' in value.form, false);
  assert.equal(serializePortableForm(value).includes('Private answer'), false);
  assert.equal(serializePortableForm(value).includes('private resource'), false);
  assert.equal(value.initialValue.name, '');
  const legacy = structuredClone(project);
  legacy.forms.contact.settings = { legacyFormMetadata: { secret: 'private' } };
  assert.deepEqual(unwrap(projectPortableForm(legacy, toUid('contact'))).form.settings, {});
  assert.equal(loadPortableForm({ ...value, form: { ...value.form, settings: legacy.forms.contact.settings } }).ok, false);
  assert.equal(unwrap(projectPortableForm(project, toUid('contact'), null)).initialValue, null);
  assert.deepEqual(value.requirements, { capabilities: ['stages.standard@1'], services: [] });
});

test('required, comparison, conditions, localized messages and controlled ownership match Studio', async () => {
  const portable = unwrap(loadPortableForm(serializePortableForm(definition())));
  const preview = compileStudioForm(project.forms.contact, {}, { localization: { defaultLocale: 'en', resources: project.resources } });
  const values = [
    { name: '', email: '', confirm: '', subscribe: false, company: '' },
    { name: 'Ada', email: 'ada@example.com', confirm: 'wrong', subscribe: false, company: '' },
    { name: 'Ada', email: 'ada@example.com', confirm: 'ada@example.com', subscribe: true, company: '' },
    { name: 'Ada', email: 'ada@example.com', confirm: 'ada@example.com', subscribe: true, company: 'Company' },
  ];
  const results = [];
  for (const compiled of [preview, portable]) {
    const proposals = [];
    const controller = stages({ schema: compiled.schemaInput, fields: compiled.fields, value: values[0], context: { locale: 'de' }, onChange: change => proposals.push(change.value) });
    try {
      const states = [];
      for (const value of values) {
        controller.update({ value });
        await controller.validate({ scope: 'form', event: 'submit' });
        states.push(controller.getSnapshot().validation);
      }
      assert.equal(states[0].issues.some(issue => issue.message === 'Name ist erforderlich'), true);
      assert.deepEqual(states.map(state => state.status), ['invalid', 'invalid', 'invalid', 'valid']);
      results.push(states);
      controller.dispatch(fieldEvent('input', ['name'], { payload: '' }));
      await Promise.resolve();
      assert.equal(controller.getSnapshot().value.name, 'Ada');
      controller.update({ value: proposals.at(-1) });
      assert.equal(controller.getSnapshot().value.name, '');
    } finally { controller.destroy(); }
  }
  assert.deepEqual(results[0], results[1]);
});

test('rejects malformed/unsafe inputs, versions, forged requirements and unsupported capabilities', () => {
  for (const input of ['{', null, { ...definition(), formatVersion: 2 }, { ...definition(), initialValue: undefined }, { ...definition(), requirements: { capabilities: ['unknown@1'], services: [] } }]) assert.equal(loadPortableForm(input).ok, false);
  const cyclic = {}; cyclic.self = cyclic;
  assert.equal(validatePortableForm(cyclic).ok, false);
  const altered = JSON.parse(serializePortableForm(definition()));
  altered.form.nodes.name.computed = { kind: 'literal', value: 1 };
  assert.equal(loadPortableForm(altered).diagnostics.some(item => item.code === 'compiler.unsupported-computed'), true);
  altered.form.nodes.name.definition.version = 99;
  assert.equal(loadPortableForm(altered).ok, false);
});

test('requirements include exact service references; resolution never invokes them and does not silently omit rules', async () => {
  const source = structuredClone(project);
  source.forms.contact.nodes.name.validators.push({ kind: 'service', service: { key: 'contact/check', version: 2 } });
  const artifact = unwrap(projectPortableForm(source, toUid('contact')));
  assert.deepEqual(artifact.requirements.services, [{ key: 'contact/check', version: 2 }]);
  assert.equal(loadPortableForm(artifact).diagnostics[0].code, 'portable.missing-service-binding');
  assert.equal(loadPortableForm(artifact, { serviceBindings: { resolve: () => ({ key: 'contact/check', version: 1, invoke: async () => ({ status: 'success' }) }) } }).ok, false);
  let calls = 0;
  const bindings = definePortableServiceBindings([{ key: 'contact/check', version: 2, invoke: async () => { calls++; return { status: 'failure', message: 'Unavailable' }; } }]);
  const loaded = unwrap(loadPortableForm(artifact, { serviceBindings: bindings }));
  assert.equal(calls, 0);
  const controller = stages({ schema: loaded.schemaInput, fields: loaded.fields, value: loaded.initialValue, onChange() {} });
  try { await controller.validate({ scope: 'form' }); assert.equal(calls, 1); assert.equal(controller.getSnapshot().validation.status, 'invalid'); }
  finally { controller.destroy(); }
  assert.throws(() => definePortableServiceBindings([{ key: 'x', version: 1, invoke() {} }, { key: 'x', version: 1, invoke() {} }]));
});

test('resolves fragments with bounded expansion, preserves defaults, and rejects cycles/reserved parameters', () => {
  const source = structuredClone(project);
  source.fragments.part = { uid: 'part', title: 'Part', version: 1, parameters: [], rootNodeUids: ['part_name'], nodes: { part_name: { ...source.forms.contact.nodes.name, uid: 'part_name', runtimeId: 'nestedName' } } };
  source.forms.contact.nodes.section = { uid: 'section', kind: 'fragment', runtimeId: 'section', fragmentUid: 'part' };
  source.forms.contact.rootNodeUids.push('section');
  const artifact = unwrap(projectPortableForm(source, toUid('contact')));
  assert.equal(Object.values(artifact.form.nodes).some(node => node.kind === 'fragment'), false);
  assert.deepEqual(artifact.initialValue.section, { nestedName: '' });
  assert.equal(loadPortableForm(artifact).ok, true);
  source.fragments.part.parameters.push('reserved');
  assert.equal(projectPortableForm(source, toUid('contact')).ok, false);
  source.fragments.part.parameters = [];
  source.fragments.part.nodes.loop = { uid: 'loop', kind: 'fragment', runtimeId: 'loop', fragmentUid: 'part' };
  source.fragments.part.rootNodeUids.push('loop');
  assert.equal(projectPortableForm(source, toUid('contact')).ok, false);
});
