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

import { definePortableFieldBindings, definePortableBehaviorBindings, composePortableForm, bindPortableViews, matchesPortableValue, portableFieldToken, projectPortableForm, type PortableFieldDescriptor, type PortableValueContract, type PortableProjectOptions } from '../src/index.js';
const contract: PortableValueContract = { kind: 'nullable', value: { kind: 'number' } };
const descriptor: PortableFieldDescriptor = {
  key: 'app/optional', version: 2, displayName: 'Optional number', value: contract, emptyValue: null,
  props: { label: { kind: 'string' } }, defaultProps: { label: 'Number' },
  input: { draft: 'string', parsing: 'Empty is null; valid numeric input is a number.', formatting: 'Null displays an empty draft.' },
  accessibility: { role: 'spinbutton', label: 'label', description: 'helpText', keyboard: ['Arrow keys'] },
};
const fields = definePortableFieldBindings([{ ...descriptor, field: { reduce: ({ event }) => matchesPortableValue(contract, event.payload) ? { value: event.payload } : undefined } }]);
const behaviors = definePortableBehaviorBindings([{ key: 'app/rules', version: 1, configure: config => ({ validators: [{ id: 'host', on: 'submit', dependencies: [['count']], async validate({ signal }) { void config; void signal.aborted; return []; } }] }) }]);
const options: PortableProjectOptions = { fieldDescriptors: [descriptor], behaviors: [{ key: 'app/rules', version: 1, config: {} }] };
void options; void projectPortableForm; void portableFieldToken(descriptor);
const custom = loadPortableForm('{}', { fieldBindings: fields, behaviorBindings: behaviors });
if (custom.ok) {
  const composed = composePortableForm(custom.value, { schemaId: 'app/deployment', schemaVersion: 2, transforms: [{ on: 'normalize', apply: () => [] }] });
  const views = bindPortableViews(composed, { text: Symbol('custom view') });
  const viewController = stages({ schema: views.schemaInput, fields: views.fields, value: composed.initialValue as unknown });
  viewController.destroy();
}
// @ts-expect-error arbitrary value kinds are not portable
const badKind: PortableValueContract = { kind: 'Date' };
// @ts-expect-error accepted empty values must be JSON
const badEmpty: PortableFieldDescriptor = { ...descriptor, emptyValue: new Date() };
// @ts-expect-error semantic bindings do not own framework components
const badField = definePortableFieldBindings([{ key: 'app/field', version: 1, field: { view: () => null } }]);
void badKind; void badEmpty; void badField;

import { validatePortableSubmission, type PortableSubmissionDeployment, type PortableSubmissionOptions, type PortableSubmissionResult, type PortableSubmissionIdentity } from '../src/index.js';
export async function submissionContract(deployment: PortableSubmissionDeployment, input: unknown, options: PortableSubmissionOptions) {
  const result: PortableSubmissionResult = await validatePortableSubmission(deployment, input, options);
  const identity: PortableSubmissionIdentity = result.identity;
  void identity.revision;
  if (result.status === 'accepted') void result.value;
  else {
    // @ts-expect-error unsuccessful submission results cannot expose accepted values
    void result.value;
  }
  // @ts-expect-error the server must supply an approved deployment revision
  await validatePortableSubmission({ definition: deployment.definition }, input);
  // @ts-expect-error client context is not an accepted value transport option
  await validatePortableSubmission(deployment, input, { extensions: { admin: true } });
  return result;
}
