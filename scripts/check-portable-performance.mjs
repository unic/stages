import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { stages } from '../packages/core/dist/index.js';
import * as api from '../packages/authoring/dist/index.js';
import { eventLaunchBindings, portableValue, smokeTestValue, defaultEventLaunchContext } from '../examples/shared/event-launch/portable.mjs';
const fixture = name => JSON.parse(readFileSync(new URL(`../packages/authoring/test/fixtures/${name}`, import.meta.url)));
const project = fixture('contact-project-v1.json');
project.forms.contact.nodes = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`field${i}`, { uid: `field${i}`, kind: 'field', runtimeId: `field${i}`, definition: { key: 'text', version: 1 }, props: { label: `Field ${i}` }, validators: [{ kind: 'required' }] }]));
project.forms.contact.rootNodeUids = Object.keys(project.forms.contact.nodes);
project.forms.contact.scenarios = [];
const start = performance.now();
const projected = api.projectPortableForm(JSON.parse(JSON.stringify(project)), 'contact');
assert.equal(projected.ok, true, JSON.stringify(projected.ok ? {} : projected.diagnostics.slice(0, 3)));
const large = projected.value;
const measurements = [];
function shapeProject(nodes, rootNodeUids) {
  const source = fixture('contact-project-v1.json');
  source.forms.contact.nodes = nodes; source.forms.contact.rootNodeUids = rootNodeUids; source.forms.contact.scenarios = [];
  const projected = api.projectPortableForm(source, 'contact');
  assert.equal(projected.ok, true, JSON.stringify(projected.ok ? {} : projected.diagnostics.slice(0, 3)));
  return projected.value;
}
const leaf = { uid: 'leaf', kind: 'field', runtimeId: 'name', definition: { key: 'text', version: 1 }, props: { label: 'Name' }, validators: [{ kind: 'required' }] };
const rows = shapeProject({ rows: { uid: 'rows', kind: 'collection', runtimeId: 'rows', childUids: ['leaf'] }, leaf }, ['rows']);
const deepNodes = { leaf };
let deepValue = { name: 'Deep' };
for (let depth = 39; depth >= 0; depth--) {
  deepNodes[`g${depth}`] = { uid: `g${depth}`, kind: 'group', runtimeId: `g${depth}`, childUids: [depth === 39 ? 'leaf' : `g${depth + 1}`] };
  deepValue = { [`g${depth}`]: deepValue };
}
const deep = shapeProject(deepNodes, ['g0']);
const nestedNodes = { leaf };
let nestedValue = { name: 'Nested' };
for (let depth = 3; depth >= 0; depth--) {
  nestedNodes[`c${depth}`] = { uid: `c${depth}`, kind: 'collection', runtimeId: `c${depth}`, childUids: [depth === 3 ? 'leaf' : `c${depth + 1}`] };
  nestedValue = { [`c${depth}`]: Array.from({ length: 5 }, () => structuredClone(nestedValue)) };
}
const nested = shapeProject(nestedNodes, ['c0']);
for (const [name, definition, bindings, value, context] of [
  ['contact', fixture('contact-form-v1.json'), {}, { name: 'Ada', email: 'a@b.ch', confirm: 'a@b.ch', subscribe: false, company: 'Company' }, {}],
  ['event-launch', fixture('event-launch-form-v1.json'), eventLaunchBindings(api), portableValue(smokeTestValue), { ...defaultEventLaunchContext, validationDelayMs: 0 }],
  ['1000 rows', rows, {}, { rows: Array.from({ length: 1000 }, (_, i) => ({ name: `Row ${i}` })) }, {}],
  ['40 groups deep', deep, {}, deepValue, {}],
  ['780 nested rows', nested, {}, nestedValue, {}],
  ['1000 fields', large, {}, Object.fromEntries(Object.keys(large.form.nodes).map(key => [key, 'value'])), {}],
]) {
  const before = performance.now();
  const loaded = api.loadPortableForm(api.serializePortableForm(definition), bindings);
  assert.equal(loaded.ok, true);
  const controller = stages({ schema: loaded.value.schemaInput, fields: loaded.value.fields, value, context });
  const validation = await controller.validate({ scope: 'form', event: 'submit' });
  assert.equal(validation.isValid, true, name);
  if (name === '1000 fields') assert.equal(controller.getSnapshot().nodes.length, 1000);
  controller.destroy();
  const result = await api.validatePortableSubmission({ definition, revision: `benchmark-${name}`, ...bindings }, value, { context });
  assert.equal(result.status, 'accepted', JSON.stringify(result));
  const elapsed = performance.now() - before;
  assert(elapsed < 3000, `${name}: ${elapsed}ms exceeded 3000ms load/controller/validate/submission budget`);
  measurements.push({ name, nodes: Object.keys(definition.form.nodes).length, milliseconds: Math.round(elapsed) });
}
const oversized = await api.validatePortableSubmission({ definition: rows, revision: 'rows' }, { rows: Array.from({ length: 1001 }, () => ({ name: 'row' })) });
assert.equal(oversized.status, 'rejected');
assert(oversized.issues.some(issue => issue.code === 'submission.collection-size'));
const serviced = fixture('contact-form-v1.json');
serviced.form.nodes.name.validators.push({ kind: 'service', service: { key: 'bench/check', version: 1 } });
serviced.requirements.services = [{ key: 'bench/check', version: 1 }];
let active = 0, maximum = 0;
const services = api.definePortableServiceBindings([{ key: 'bench/check', version: 1, async invoke({ validation }) {
  maximum = Math.max(maximum, ++active);
  await new Promise(resolve => setTimeout(resolve, 5)); active--;
  return { status: validation.context.allowed ? 'success' : 'failure' };
} }]);
const parallel = await Promise.all(Array.from({ length: 8 }, (_, index) => api.validatePortableSubmission({ definition: serviced, revision: 'async-benchmark', serviceBindings: services },
  { name: 'Ada', email: 'a@b.ch', confirm: 'a@b.ch', subscribe: false, company: 'Company' }, { context: { allowed: index % 2 === 0 } })));
assert.deepEqual(parallel.map(result => result.status), Array.from({ length: 8 }, (_, index) => index % 2 === 0 ? 'accepted' : 'rejected'));
assert.equal(active, 0); assert.equal(maximum, 8);
const heapMiB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
assert(heapMiB < 256, `Portable benchmark heap exceeded 256 MiB: ${heapMiB}`);
assert(performance.now() - start < 6000, 'Portable aggregate budget exceeded 6000ms.');
console.log(JSON.stringify({ portableWorkflows: measurements, aggregateMilliseconds: Math.round(performance.now() - start), maximumAsyncRequests: maximum, heapMiB }));
