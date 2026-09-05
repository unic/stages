import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as authoring from '@stages/authoring';
import { stages, fieldEvent, formEvent } from '@stages/core';
import { customBindings } from './custom-bindings.mjs';
const definition = JSON.parse(readFileSync(new URL('./custom-form-v1.json', import.meta.url)));
const result = authoring.loadPortableForm(definition, customBindings(authoring, definition.fieldDescriptors));
assert.equal(result.ok, true, JSON.stringify(result));
assert.equal(typeof document, 'undefined');
const loaded = result.value;
const hybrid = authoring.composePortableForm(loaded, { schemaId: 'installed/hybrid', schemaVersion: 1, validators: [{ id: 'host', on: 'submit', validate: () => [] }] });
const controller = stages({ schema: hybrid.schemaInput, fields: hybrid.fields, value: hybrid.initialValue, onChange: change => controller.update({ value: change.value }) });
try {
  controller.dispatch(fieldEvent('input', ['optional'], { payload: '0' }));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(controller.getSnapshot().value.optional, 0);
  controller.dispatch(fieldEvent('input', ['optional'], { payload: '' }));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(controller.getSnapshot().value.optional, null);
  controller.update({ value: { money: { minorUnits: 20000, currency: 'CHF' }, person: { given: ' Ada ', family: ' Lovelace ' }, optional: null } });
  await controller.validate({ scope: 'form' });
  assert.equal(controller.getSnapshot().validation.status, 'invalid');
  controller.dispatch(formEvent('normalize'));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(controller.getSnapshot().value.person, { given: 'Ada', family: 'Lovelace' });
  const views = Object.fromEntries(Object.values(loaded.fields).map(field => [field.view, Symbol(field.view)]));
  const bound = authoring.bindPortableViews(loaded, views);
  assert.equal(bound.fields['example/money@1'].reduce, loaded.fields['example/money@1'].reduce);
} finally { controller.destroy(); }
