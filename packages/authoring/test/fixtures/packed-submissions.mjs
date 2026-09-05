import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as api from '@stages/authoring';
import { customBindings } from './custom-bindings.mjs';

const contact = JSON.parse(readFileSync(new URL('./contact-form-v1.json', import.meta.url), 'utf8'));
const custom = JSON.parse(readFileSync(new URL('./custom-form-v1.json', import.meta.url), 'utf8'));
const deployment = { definition: contact, revision: 'contact-production-1' };
const valid = { name: 'Ada', email: 'ada@example.com', confirm: 'ada@example.com', subscribe: false, company: 'Company' };
const submit = (value, options) => api.validatePortableSubmission(deployment, value, options);
const accepted = await submit(valid);
assert.equal(accepted.status, 'accepted');
assert.deepEqual(accepted.value, valid);
assert.notEqual(accepted.value, valid);
assert.deepEqual(accepted.identity, { revision: 'contact-production-1', schemaId: 'contact', schemaVersion: 1 });
for (const value of [null, [], {}, { ...valid, name: null }, { ...valid, subscribe: 'false' }, { ...valid, admin: true }, { ...valid, value: valid }, { ...valid, company: '' }, { ...valid, confirm: 'forged' }]) {
  assert.equal((await submit(value)).status, 'rejected');
}
const missing = { ...valid }; delete missing.company;
assert.equal((await submit(missing)).status, 'rejected');
const german = await submit({ ...valid, name: '' }, { context: { locale: 'de' } });
assert.equal(german.issues.some(issue => issue.message === 'Name ist erforderlich'), true);
for (const behavior of [{ disabled: true }, { when: { kind: 'literal', value: false } }, { presentWhen: { kind: 'literal', value: false } }]) {
  const definition = structuredClone(contact);
  definition.form.nodes.name.behavior = behavior;
  assert.equal((await api.validatePortableSubmission({ ...deployment, definition }, { ...valid, name: '' })).status, 'rejected');
}
let getterCalled = false;
const accessor = { ...valid }; Object.defineProperty(accessor, 'name', { enumerable: true, get() { getterCalled = true; return 'Ada'; } });
assert.equal((await submit(accessor)).status, 'rejected');
assert.equal(getterCalled, false);
const cyclic = { ...valid }; cyclic.cycle = cyclic;
for (const value of [cyclic, { ...valid, name: NaN }, { ...valid, name: undefined }, { ...valid, name: new Date() }, JSON.parse('{"__proto__":{}}'), { ...valid, name: 'x'.repeat(200_000) }]) assert.equal((await submit(value)).status, 'rejected');

const bindings = customBindings(api, custom.fieldDescriptors);
const customDeployment = { definition: custom, revision: 'custom-1', ...bindings };
const customValue = { money: { currency: 'CHF', minorUnits: 100 }, person: { given: 'Ada', family: 'Lovelace' }, optional: null };
assert.equal((await api.validatePortableSubmission(customDeployment, customValue)).status, 'accepted');
for (const patch of [{ optional: '' }, { money: { currency: 'USD', minorUnits: 100 } }, { money: { currency: 'CHF', minorUnits: 1.5 } }, { money: { currency: 'CHF', minorUnits: 999999 } }, { person: { given: 'Ada' } }, { person: { ...customValue.person, admin: true } }]) assert.equal((await api.validatePortableSubmission(customDeployment, { ...customValue, ...patch })).status, 'rejected');
assert.equal((await api.validatePortableSubmission({ definition: custom, revision: 'missing' }, customValue)).status, 'unavailable');

const serviced = structuredClone(contact);
serviced.form.nodes.name.validators.push({ kind: 'service', service: { key: 'app/check', version: 1 } });
serviced.requirements.services = [{ key: 'app/check', version: 1 }];
const withService = invoke => ({ definition: serviced, revision: 'service-1', serviceBindings: api.definePortableServiceBindings([{ key: 'app/check', version: 1, invoke }]) });
assert.equal((await api.validatePortableSubmission(withService(async () => ({ status: 'success' })), valid)).status, 'accepted');
assert.equal((await api.validatePortableSubmission(withService(async () => ({ status: 'failure', severity: 'warning' })), valid)).status, 'rejected');
for (const invoke of [async () => { throw Error('offline'); }, async () => ({ status: 'pending' }), async () => undefined]) {
  const result = await api.validatePortableSubmission(withService(invoke), valid);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reason, 'execution');
}
let cancelled = 0;
const pending = withService(async ({ validation }) => {
  validation.signal.onCancel(() => { cancelled++; });
  return new Promise(() => {});
});
assert.equal((await api.validatePortableSubmission(pending, valid, { timeoutMs: 20 })).reason, 'timeout');
assert.equal(cancelled, 1);
const abort = new AbortController();
const request = api.validatePortableSubmission(pending, valid, { signal: abort.signal });
abort.abort();
assert.equal((await request).reason, 'cancelled');
assert.equal(cancelled, 2);
assert.equal((await api.validatePortableSubmission(pending, valid, { signal: abort.signal })).reason, 'cancelled');
const concurrent = withService(async ({ validation }) => {
  await new Promise(resolve => setTimeout(resolve, validation.context.delay));
  return { status: validation.context.allowed ? 'success' : 'failure' };
});
assert.deepEqual((await Promise.all([
  api.validatePortableSubmission(concurrent, valid, { context: { allowed: false, delay: 5 } }),
  api.validatePortableSubmission(concurrent, valid, { context: { allowed: true, delay: 1 } }),
])).map(result => result.status), ['rejected', 'accepted']);

// Nested discriminated rows retain occurrence-specific decode paths.
const nested = structuredClone(contact);
nested.form.nodes = {
  rows: { uid: 'rows', kind: 'collection', runtimeId: 'rows', min: 1, max: 2, discriminator: 'kind', variantUids: ['person'] },
  person: { uid: 'person', kind: 'variant', runtimeId: 'person', childUids: ['name', 'choice'] },
  name: contact.form.nodes.name,
  choice: { uid: 'choice', kind: 'field', runtimeId: 'choice', definition: { key: 'choice', version: 1 }, props: { label: 'Choice', options: 'One\nTwo' } },
};
nested.form.rootNodeUids = ['rows'];
nested.initialValue = { rows: [] };
const nestedSubmit = value => api.validatePortableSubmission({ definition: nested, revision: 'rows-1' }, value);
assert.equal((await nestedSubmit({ rows: [{ kind: 'person', name: 'Ada', choice: 'One' }] })).status, 'accepted');
for (const rows of [[], [{ kind: 'wrong' }], [{ kind: 'person', name: 'Ada', choice: 'forged' }], [{ kind: 'person', name: '' }], Array(3).fill({ kind: 'person', name: 'Ada', choice: 'One' }), [{ kind: 'person', name: 'Ada', choice: 'One', forged: true }]]) assert.equal((await nestedSubmit({ rows })).status, 'rejected');
assert.deepEqual((await nestedSubmit({ rows: [{ kind: 'wrong' }] })).issues[0].path, ['rows', 0, 'kind']);

const conditional = structuredClone(contact);
conditional.form.nodes.company.validators[0].when = conditional.form.nodes.company.behavior.when;
assert.equal((await api.validatePortableSubmission({ ...deployment, definition: conditional }, { ...valid, company: '' })).status, 'accepted');
assert.equal((await api.validatePortableSubmission({ ...deployment, definition: conditional }, { ...valid, subscribe: true, company: '' })).status, 'rejected');
let invoked = 0;
const neverForMalformed = withService(async () => { invoked++; return { status: 'success' }; });
assert.equal((await api.validatePortableSubmission(neverForMalformed, {})).phase, 'decode');
assert.equal(invoked, 0);
assert.equal((await api.validatePortableSubmission({ definition: serviced, revision: 'missing-service' }, valid)).reason, 'configuration');
const unavailableCondition = structuredClone(contact);
unavailableCondition.form.nodes.name.validators[0].when = { kind: 'reference', scope: 'context', path: ['missing'] };
assert.equal((await api.validatePortableSubmission({ ...deployment, definition: unavailableCondition }, valid)).reason, 'execution');
const computed = structuredClone(contact);
computed.form.nodes.name.computed = { kind: 'literal', value: 'derived' };
assert.equal((await api.validatePortableSubmission({ ...deployment, definition: computed }, valid)).reason, 'configuration');

const grouped = structuredClone(contact);
grouped.form.nodes = {
  group: { uid: 'group', kind: 'group', runtimeId: 'group', childUids: ['wizard'] },
  wizard: { uid: 'wizard', kind: 'wizard', runtimeId: 'wizard', stageUids: ['stage'] },
  stage: { uid: 'stage', kind: 'stage', runtimeId: 'stage', childUids: ['rows'], behavior: { when: { kind: 'literal', value: false } } },
  rows: { uid: 'rows', kind: 'collection', runtimeId: 'rows', childUids: ['name'] },
  name: contact.form.nodes.name,
};
grouped.form.rootNodeUids = ['group'];
grouped.initialValue = {};
const groupSubmit = rows => api.validatePortableSubmission({ ...deployment, definition: grouped }, { group: { wizard: { stage: { rows } } } });
assert.equal((await groupSubmit([{ name: 'Ada' }])).status, 'accepted');
assert.equal((await groupSubmit([{ name: '' }])).status, 'rejected');
assert.equal((await groupSubmit([{ name: 'Ada' }, {}])).status, 'rejected');
assert.equal((await groupSubmit(Array(2))).status, 'rejected');
assert.equal((await groupSubmit(Array.from({ length: 1001 }, () => ({ name: 'Ada' })))).status, 'rejected');
assert.equal((await groupSubmit('rows')).status, 'rejected');

let finishLate;
let lateCancelled = false;
const late = withService(({ validation }) => {
  validation.signal.onCancel(() => { lateCancelled = true; });
  return new Promise(resolve => { finishLate = resolve; });
});
const lateResult = await api.validatePortableSubmission(late, valid, { timeoutMs: 20 });
assert.equal(lateResult.reason, 'timeout');
assert.equal(lateCancelled, true);
finishLate({ status: 'success' });
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(lateResult.status, 'unavailable');

const warning = structuredClone(contact);
warning.form.nodes.name.validators[0].severity = 'warning';
assert.equal((await api.validatePortableSubmission({ ...deployment, definition: warning }, { ...valid, name: '' })).status, 'accepted');
assert.equal((await api.validatePortableSubmission(customDeployment, { ...customValue, optional: 0 })).status, 'accepted');
assert.equal((await submit(valid, { timeoutMs: 0 })).reason, 'configuration');
const mutable = { ...valid };
const isolatedValue = api.validatePortableSubmission(withService(async () => {
  await new Promise(resolve => setTimeout(resolve, 1));
  return { status: 'success' };
}), mutable);
mutable.name = 'changed after request';
assert.equal((await isolatedValue).value.name, 'Ada');
