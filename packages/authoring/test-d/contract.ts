import { stages, type StagesController } from '@stages/core';
import { loadPortableForm, definePortableServiceBindings, type PortableFormDefinition, type PortableResult } from '../src/index.js';
const checked: PortableResult<PortableFormDefinition> = { ok: false, diagnostics: [] };
void checked;
const result = loadPortableForm('{}', { serviceBindings: definePortableServiceBindings([{ key: 'app/check', version: 1, async invoke(request) { void request.validation.signal; return { status: 'success' }; } }]) });
if (result.ok) {
  const controller: StagesController<unknown, unknown> = stages({ schema: result.value.schemaInput, fields: result.value.fields, value: result.value.initialValue as unknown, onChange() {} });
  controller.destroy();
  // @ts-expect-error portable definitions are immutable
  result.value.definition.formatVersion = 2;
}
// @ts-expect-error missing exact version
const invalid = definePortableServiceBindings([{ key: 'app/check', async invoke() { return { status: 'success' }; } }]);
void invalid;
