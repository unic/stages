import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as api from '../dist/index.js';
import { stages, fieldEvent } from '../../core/dist/index.js';
const contact = JSON.parse(readFileSync(new URL('./fixtures/contact-form-v1.json', import.meta.url)));
const identities = { bindingId: 'app-build-sha256:abc', policyId: 'all-values-v1' };
const codec = { encode: value => value, decode: value => value };
const create = (definition = contact, options = {}) => api.createPortableRelease(definition, { ...identities, ...options });
const load = release => api.loadPortableRelease(release, identities);
const decision = (changes, state = 'compatible') => ({ changes, state, rationale: 'Reviewed installed consumer fixture.' });

test('release identity is deterministic, immutable and covers presentation, behavior, bindings and policy', async () => {
  const first = await create();
  assert.equal(first.id, (await create(JSON.parse(api.serializePortableForm(contact)))).id);
  assert.equal(Object.isFrozen(first.definition.form.nodes), true);
  assert.equal(api.serializePortableForm(first.definition), readFileSync(new URL('./fixtures/contact-form-v1.json', import.meta.url), 'utf8'));
  for (const options of [{ bindingId: 'new-build' }, { policyId: 'policy-v2' }]) assert.notEqual(first.id, (await create(contact, options)).id);
  const label = structuredClone(contact); label.form.title = 'A new title';
  assert.deepEqual(api.comparePortableReleases(first, { ...identities, definition: label }), ['presentation']);
  await assert.rejects(create(label, { previous: first }), /compatibility/);
  const second = await create(label, { previous: first, compatibility: decision(['presentation']) });
  assert.notEqual(first.id, second.id);
  assert.equal(second.previous, first.id);
  const changed = structuredClone(contact); changed.form.nodes.name.validators = [];
  assert.deepEqual(api.comparePortableReleases(first, { ...identities, definition: changed }), ['behavior']);
  await assert.rejects(create(changed, { previous: first, compatibility: decision(['presentation']) }), /compatibility/);
  assert.notEqual((await create(changed, { previous: first, compatibility: decision(['behavior']) })).id, first.id);
  const forged = structuredClone(first); forged.definition.form.title = 'tampered';
  await assert.rejects(load(forged), /integrity/);
  await assert.rejects(api.loadPortableRelease(first, { ...identities, bindingId: 'wrong' }), /bindings/);
  await assert.rejects(load({ ...first, compiler: 'future' }), /version/);
  await assert.rejects(load({ ...first, extra: true }), /property/);
  const mutable = structuredClone(first);
  const loading = load(mutable); mutable.definition.form.title = 'changed during hash';
  assert.equal((await loading).definition.form.title, contact.form.title);
});

test('shape changes require version and explicit migration/reset; behavioral changes retain value version', async () => {
  const first = await create();
  const next = structuredClone(contact); next.form.nodes.name.runtimeId = 'fullName';
  await assert.rejects(create(next, { previous: first, compatibility: decision(['shape', 'behavior'], 'migrate') }), /shape/);
  next.form.runtime.schemaVersion = 2;
  const second = await create(next, { previous: first, compatibility: decision(['shape', 'behavior'], 'migrate') });
  assert.equal(second.definition.form.runtime.schemaVersion, 2);
  const regressed = structuredClone(next); regressed.form.runtime.schemaVersion = 1;
  await assert.rejects(create(regressed, { previous: second, compatibility: decision(['shape'], 'migrate') }), /lineage/);
});

test('ordered full envelopes preserve accepted values, dirty baseline, interaction and extension state', async () => {
  const first = await create();
  const loaded = await load(first);
  const controller = stages({ schema: loaded.schemaInput, fields: loaded.fields, value: loaded.initialValue, codec,
    extensions: { draft: { revision: 7 } }, extensionCodecs: { draft: codec } });
  controller.update({ value: { ...loaded.initialValue, name: 'Accepted' } });
  controller.dispatch(fieldEvent('input', ['name'], { payload: 'Unaccepted' }));
  await controller.validate({ reveal: true });
  const saved = api.savePortableState(loaded, controller.serialize());
  controller.destroy();
  assert.equal(saved.state.value.name, 'Accepted');
  assert.equal(saved.state.baseline.name, '');
  const original = JSON.stringify(saved);
  const renamed = structuredClone(contact); renamed.form.nodes.name.runtimeId = 'fullName'; renamed.form.runtime.schemaVersion = 2;
  const second = await create(renamed, { previous: first, compatibility: decision(['shape', 'behavior'], 'migrate') });
  const thirdDefinition = structuredClone(renamed); thirdDefinition.form.title = 'Third';
  const third = await create(thirdDefinition, { previous: second, compatibility: decision(['presentation']) });
  const rename = value => { const { name, ...rest } = value; return { ...rest, fullName: name }; };
  const metadata = Object.fromEntries(Object.keys(saved.state.meta).map(key => [key, key === 'extensions' ? 'preserve' : 'reset']));
  const steps = [
    { from: first, to: second, baseline: 'migrate', metadata, migrate: state => ({ ...state, schema: { ...state.schema, version: 2 }, value: rename(state.value), baseline: rename(state.baseline), meta: { extensions: state.meta.extensions } }) },
    { from: second, to: third, baseline: 'preserve', metadata: { extensions: 'preserve' }, migrate: state => state },
  ];
  const target = await load(third);
  const migrated = await api.migratePortableState(saved, target, steps);
  assert.equal(migrated.state.value.fullName, 'Accepted');
  assert.equal(migrated.state.baseline.fullName, '');
  const restored = stages({ schema: target.schemaInput, fields: target.fields, state: migrated.state, codec, extensionCodecs: { draft: codec } });
  assert.equal(restored.getSnapshot().value.fullName, 'Accepted');
  assert.deepEqual(restored.serialize().meta.extensions, saved.state.meta.extensions);
  assert.equal(restored.getSnapshot().nodes.find(node => node.id === 'fullName').state.dirty, true);
  restored.destroy();
  await assert.rejects(api.migratePortableState(saved, target), /migration/);
  await assert.rejects(api.migratePortableState(saved, target, [steps[0], steps[0]]), /migration/);
  await assert.rejects(api.migratePortableState(saved, target, [{ ...steps[0], metadata: {} }, steps[1]]), /metadata/);
  await assert.rejects(api.migratePortableState(saved, target, [{ ...steps[0], baseline: 'preserve' }, steps[1]]), /baseline/);
  assert.equal(JSON.stringify(saved), original);
  assert.equal((await api.migratePortableState(saved, loaded)).releaseId, first.id);
  const result = await api.validatePortableSubmission({ definition: third.definition, revision: third.id }, { ...migrated.state.value, email: 'a@b.ch', confirm: 'a@b.ch', company: 'X' });
  assert.equal(result.status, 'accepted');
  assert.equal(result.identity.revision, third.id);
});

test('failed and nondeterministic migrations retain recoverable data; reset is explicit', async () => {
  const first = await create();
  const definition = structuredClone(contact); definition.form.title = 'Next';
  const next = await create(definition, { previous: first, compatibility: decision(['presentation']) });
  const saved = api.savePortableState(await load(first), { format: 'stages', formatVersion: 1, schema: { id: 'contact', version: 1 }, value: contact.initialValue, baseline: contact.initialValue, meta: { custom: 1 } });
  const target = await load(next);
  let runs = 0;
  const step = { from: first, to: next, baseline: 'preserve', metadata: { custom: 'preserve' }, migrate: state => state };
  await assert.rejects(api.migratePortableState(saved, target, [{ ...step, migrate: state => ({ ...state, value: { run: ++runs } }) }]), /determinism/);
  await assert.rejects(api.migratePortableState(saved, target, [{ ...step, migrate: () => { throw Error('failure'); } }]), /failure/);
  await assert.rejects(api.migratePortableState(saved, target, [{ ...step, migrate: state => ({ ...state, meta: { custom: 2 } }) }]), /metadata/);
  const reset = await create(definition, { previous: first, compatibility: decision(['presentation'], 'reset') });
  await assert.rejects(api.migratePortableState(saved, await load(reset), [{ ...step, to: reset }]), /lineage/);
  assert.equal(saved.state.meta.custom, 1);
});

test('checked historical release and full-state fixtures survive an ordered upgrade', async () => {
  const old = JSON.parse(readFileSync(new URL('./fixtures/contact-release-v1.json', import.meta.url)));
  const saved = JSON.parse(readFileSync(new URL('./fixtures/contact-state-v1.json', import.meta.url)));
  assert.equal(api.serializePortableRelease(old), api.serializePortableRelease(await create()));
  const nextDefinition = structuredClone(old.definition); nextDefinition.form.nodes.name.validators = [];
  const next = await create(nextDefinition, { previous: old, compatibility: decision(['behavior']) });
  const loaded = await load(next);
  const migrated = await api.migratePortableState(saved, loaded, [{ from: old, to: next, baseline: 'preserve',
    metadata: Object.fromEntries(Object.keys(saved.state.meta).map(key => [key, 'preserve'])), migrate: state => state }]);
  const restored = stages({ schema: loaded.schemaInput, fields: loaded.fields, state: migrated.state });
  assert.equal(restored.getSnapshot().value.name, 'Historical accepted value');
  assert.equal(restored.getSnapshot().nodes.find(node => node.id === 'name').state.dirty, true);
  restored.destroy();
});

test('bounded release cache isolates controllers, context and caller mutation; host factories are never shared', async () => {
  const first = await create();
  const cache = api.createPortableReleaseCache(1);
  const left = await cache.load(first, identities), right = await cache.load(first, identities);
  assert.notEqual(left.schema, right.schema);
  left.schema.nodes.splice(0);
  left.sourceMap.byUid.clear();
  assert.equal(right.schema.nodes.length, 5);
  assert(right.sourceMap.byUid.size > 0);
  const a = stages({ schema: right.schemaInput, fields: right.fields, value: right.initialValue, context: { locale: 'de' } });
  const fresh = await cache.load(first, identities);
  const b = stages({ schema: fresh.schemaInput, fields: fresh.fields, value: { ...fresh.initialValue, name: 'Ada' }, context: { locale: 'en' } });
  await Promise.all([a.validate({ reveal: true }), b.validate({ reveal: true })]);
  assert(a.getSnapshot().validation.issues.some(issue => issue.message === 'Name ist erforderlich'));
  assert(!b.getSnapshot().validation.issues.some(issue => issue.path?.[0] === 'name'));
  a.destroy(); b.destroy();
  const forged = structuredClone(first); forged.definition.form.title = 'poisoned cache key';
  await assert.rejects(cache.load(forged, identities), /integrity/);
  await assert.rejects(cache.load(first, { ...identities, policyId: 'wrong' }), /bindings/);
  const second = await create(contact, { bindingId: 'second' });
  await cache.load(second, { ...identities, bindingId: 'second' });
  assert.equal((await cache.load(first, identities)).schema.nodes.length, 5);
  cache.clear();
  assert.equal((await cache.load(first, identities)).schema.nodes.length, 5);
  assert.throws(() => api.createPortableReleaseCache(0), /capacity/i);
  const definition = structuredClone(contact);
  definition.behaviors = [{ key: 'app/counter', version: 1, config: {} }];
  definition.requirements.behaviors = [{ key: 'app/counter', version: 1 }];
  let factories = 0;
  const behaviorBindings = api.definePortableBehaviorBindings([{ key: 'app/counter', version: 1, configure() {
    factories++;
    let calls = 0;
    return { validators: [{ id: 'counter', on: 'submit', validate: () => ++calls === 1 ? [] : [{ code: 'shared-closure' }] }] };
  } }]);
  const custom = await create(definition);
  const run = async () => {
    const loaded = await cache.load(custom, { ...identities, behaviorBindings });
    const controller = stages({ schema: loaded.schemaInput, fields: loaded.fields, value: loaded.initialValue });
    try { return (await controller.validate({ event: 'submit' })).issues; } finally { controller.destroy(); }
  };
  const results = await Promise.all([run(), run()]);
  assert.equal(factories, 2);
  assert(results.every(issues => !issues.some(issue => issue.code === 'shared-closure')));
});

test('cached dynamic schemas return detached nodes for each owner and context', async () => {
  const definition = structuredClone(contact);
  definition.form.nodes.name.behavior = { presentWhen: { kind: 'reference', scope: 'context', path: ['show'] } };
  const release = await create(definition), cache = api.createPortableReleaseCache();
  const left = await cache.load(release, identities), right = await cache.load(release, identities);
  assert.equal(typeof left.schemaInput, 'function');
  const controller = stages({ schema: left.schemaInput, fields: left.fields, value: left.initialValue, context: { show: false } });
  const another = stages({ schema: right.schemaInput, fields: right.fields, value: right.initialValue, context: { show: true } });
  assert(!controller.getSnapshot().nodes.some(node => node.id === 'name'));
  assert(another.getSnapshot().nodes.some(node => node.id === 'name'));
  controller.update({ context: { show: true } });
  assert(controller.getSnapshot().nodes.some(node => node.id === 'name'));
  controller.destroy(); another.destroy();
});
