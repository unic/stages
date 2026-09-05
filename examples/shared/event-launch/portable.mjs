// Trusted host bindings shared by Studio, installed adapters, and Node submission tests.
// The canonical code-authored schema remains independent of the optional authoring package.
import { createEventLaunchSchema } from './dist/schema.js';
import { createEventLaunchFields } from './dist/field-contract.js';
import { defaultEventLaunchContext, defaultEventLaunchValue, smokeTestValue } from './dist/fixtures.js';
export { defaultEventLaunchContext, defaultEventLaunchValue, smokeTestValue };

export const portableValue = value => value === undefined ? null : Array.isArray(value) ? value.map(portableValue)
  : value !== null && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, portableValue(child)])) : value;
export const canonicalValue = value => value === null ? undefined : Array.isArray(value) ? value.map(canonicalValue)
  : value !== null && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, canonicalValue(child)])) : value;
const full = createEventLaunchSchema()({ context: { ...defaultEventLaunchContext, requiresDataProcessingAgreement: true } });
const fields = createEventLaunchFields(Object.fromEntries(['text', 'textarea', 'choice', 'number', 'money', 'checkbox'].map(key => [key, key])));
const uidFor = path => path.join('_');
const reference = (scope, path) => ({ kind: 'reference', scope, path });
const compare = (path, value, operator = '!==') => ({ kind: 'binary', operator, left: reference('value', path), right: { kind: 'literal', value } });
const delivery = mode => compare(['launch', 'basics', 'deliveryMode'], mode);
const conditionFor = {
  launch_venue: { when: delivery('virtual') },
  launch_streaming: { when: delivery('in-person') },
  launch_tickets: { when: compare(['launch', 'basics', 'accessModel'], 'paid', '===') },
  launch_compliance: { presentWhen: reference('context', ['requiresDataProcessingAgreement']) },
  launch_streaming_recordingConsent: { when: reference('value', ['launch', 'streaming', 'recordEvent']) },
};
const baseProps = { label: '', description: '', placeholder: '', required: false };
const props = {
  text: { ...baseProps, inputType: 'text', autocomplete: '' }, textarea: baseProps,
  choice: { ...baseProps, options: [] }, checkbox: baseProps,
  number: { ...baseProps, min: null, max: null, step: null, suffix: '' },
  money: { ...baseProps, min: null, max: null, step: null, suffix: '', currency: 'CHF', locale: 'en-CH' },
};
export const eventLaunchDescriptors = Object.entries(props).map(([key, defaults]) => ({
  key: `event-launch/${key}`, version: 1, displayName: `Event Launch ${key}`,
  value: ['number', 'money'].includes(key) ? { kind: 'nullable', value: { kind: 'number' } } : { kind: key === 'checkbox' ? 'boolean' : 'string' },
  emptyValue: ['number', 'money'].includes(key) ? null : key === 'checkbox' ? false : '',
  props: Object.fromEntries(Object.entries(defaults).map(([name, value]) => [name, name === 'options'
    ? { kind: 'array', items: { kind: 'object', properties: { label: { kind: 'string' }, value: { kind: 'string' } } } }
    : value === null ? { kind: 'nullable', value: { kind: 'number' } } : { kind: typeof value }])),
  defaultProps: defaults,
  input: { draft: 'string', parsing: 'Blank numbers use null in JSON and undefined in canonical code. Money retains decimal major units.', formatting: 'Use the canonical Event Launch view formatter.' },
  accessibility: { role: key === 'checkbox' ? 'checkbox' : 'textbox', label: 'label', description: 'description', keyboard: ['Tab', 'Native control interaction'] },
}));

function walk(nodes, parent, visit, conditions = []) {
  for (const node of nodes) {
    const path = [...parent, node.id];
    const active = [...conditions, ...(typeof node.when === 'function' ? [node.when] : []), ...(typeof node.disabled === 'function' ? [context => !node.disabled(context)] : [])];
    visit(node, path, active);
    if (node.kind === 'group' || (node.kind === 'collection' && node.nodes)) walk(node.nodes, path, visit, active);
    if (node.kind === 'collection' && node.variants) for (const [id, variant] of Object.entries(node.variants)) walk(variant.nodes, [...path, id], visit, active);
    if (node.kind === 'wizard') for (const stage of node.stages) {
      const stageConditions = [...active, ...(stage.when ? [stage.when] : []), ...(stage.id === 'compliance' ? [context => context.context.requiresDataProcessingAgreement] : [])];
      visit({ ...stage, kind: 'stage' }, [...path, stage.id], stageConditions);
      walk(stage.nodes, [...path, stage.id], visit, stageConditions);
    }
  }
}

export function eventLaunchProject() {
  const nodes = {};
  walk(full.nodes, [], (node, path) => {
    const uid = uidFor(path);
    const common = { uid, runtimeId: node.id, kind: node.kind, ...(conditionFor[uid] ? { behavior: conditionFor[uid] } : {}) };
    if (node.kind === 'field') nodes[uid] = { ...common, definition: { key: `event-launch/${node.type}`, version: 1 }, props: { ...props[node.type], ...node.props } };
    else if (node.kind === 'wizard') nodes[uid] = { ...common, stageUids: node.stages.map(stage => uidFor([...path, stage.id])), initialStageUid: uidFor([...path, node.initialStage]), navigation: { validateCurrent: true, nonLinear: true } };
    else if (node.kind === 'collection') {
      nodes[uid] = { ...common, min: node.min, max: node.max, itemKey: { kind: 'property', property: 'id' }, ...(node.variants ? { discriminator: node.discriminator, variantUids: Object.keys(node.variants).map(id => uidFor([...path, id])) } : { childUids: node.nodes.map(child => uidFor([...path, child.id])) }) };
      for (const [id, variant] of Object.entries(node.variants ?? {})) {
        const variantUid = uidFor([...path, id]);
        nodes[variantUid] = { uid: variantUid, runtimeId: id, kind: 'variant', childUids: variant.nodes.map(child => uidFor([...path, id, child.id])) };
      }
    } else nodes[uid] = { ...common, childUids: node.nodes.map(child => uidFor([...path, child.id])) };
  });
  return JSON.parse(JSON.stringify({ format: 'stages-studio', formatVersion: 1,
    project: { uid: 'event_launch_project', title: 'Event Launch', defaultLocale: 'en-CH' }, fragments: {}, resources: {},
    forms: { event_launch: { uid: 'event_launch', title: 'Event Launch', runtime: { schemaId: 'portable-event-launch', schemaVersion: 1 }, rootNodeUids: ['launch'], nodes,
      behaviors: [{ key: 'event-launch/domain', version: 1, config: {} }], settings: {},
      scenarios: [{ uid: 'event_launch_default', title: 'Canonical Event Launch', context: { ...defaultEventLaunchContext, reservedSlugs: [...defaultEventLaunchContext.reservedSlugs] }, value: portableValue(defaultEventLaunchValue) }],
    } },
  }));
}

export function eventLaunchBindings(api) {
  const fieldBindings = api.definePortableFieldBindings(eventLaunchDescriptors.map(descriptor => {
    const key = descriptor.key.split('/')[1];
    const original = fields[key];
    return { ...descriptor, field: { reduce: context => {
      const event = { ...context.event, payload: context.event.payload === null ? undefined : context.event.payload };
      const result = original.reduce?.({ ...context, event });
      return result && 'value' in result ? { value: portableValue(result.value) } : result;
    } } };
  }));
  const behaviorBindings = api.definePortableBehaviorBindings([{ key: 'event-launch/domain', version: 1, configure(config, form) {
    if (Object.keys(config).length) throw new Error('Event Launch domain@1 has no configuration properties.');
    const nodes = {};
    walk(full.nodes, [], (node, path, conditions) => {
      if (node.kind === 'stage') return;
      const authoredProps = form?.nodes[uidFor(path)]?.props ?? node.props;
      const normalizeContext = context => ({ ...context, context: { ...context.context, reservedSlugs: context.context.reservedSlugs instanceof Set ? context.context.reservedSlugs : new Set(context.context.reservedSlugs ?? []) }, value: canonicalValue(context.value), fieldValue: canonicalValue(context.fieldValue), parentValue: canonicalValue(context.parentValue) });
      const validators = (node.validators ?? []).map(rule => ({ ...rule, dependencies: [['launch']],
        when: context => { const normalized = normalizeContext(context); return conditions.every(condition => condition(normalized)) && (!rule.when || rule.when(normalized)); },
        validate: context => rule.validate(normalizeContext(context)),
      }));
      if (node.kind === 'field') {
        for (const rule of fields[node.type].validators ?? []) validators.push({ id: rule.id, on: ['input', 'submit'], revealOn: ['blur', 'submit'], dependencies: [['launch']],
          when: context => conditions.every(condition => condition(normalizeContext(context))),
          validate: context => rule.validate(context.fieldValue, authoredProps).map(item => ({ ...item, path: context.path })),
        });
        if (node.type === 'choice') validators.push({ id: 'choice.option', on: ['input', 'submit'], validate: context => context.fieldValue === '' || authoredProps.options.some(option => option.value === context.fieldValue) ? [] : [{ id: 'choice.option', code: 'choice', severity: 'error', path: context.path }] });
      }
      nodes[uidFor(path)] = { validators,
        ...(node.disabled ? { disabled: node.disabled } : {}),
        ...(node.transforms ? { transforms: node.transforms } : {}),
        ...(node.deriveProps ? { deriveProps: context => node.deriveProps(normalizeContext(context)) } : {}),
        ...(node.kind === 'wizard' ? { navigation: node.navigation } : {}),
      };
    });
    return { nodes, transforms: full.transforms };
  } }]);
  return { fieldBindings, behaviorBindings };
}
