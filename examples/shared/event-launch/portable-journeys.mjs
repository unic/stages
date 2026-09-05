import assert from 'node:assert/strict';
import { createEventLaunchSchema } from './dist/schema.js';
import { createEventLaunchFields } from './dist/field-contract.js';
import { eventLaunchBindings, portableValue, defaultEventLaunchContext, defaultEventLaunchValue, smokeTestValue } from './portable.mjs';
const issueSummary = issues => issues.map(({ code, path, severity, message }) => ({ code, path, severity, message })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
export async function eventLaunchJourneys(api, core, definition, openPreview) {
  const bindings = eventLaunchBindings(api);
  const result = api.loadPortableForm(definition, bindings);
  assert.equal(result.ok, true, JSON.stringify(result));
  const loaded = result.value;
  const context = { ...defaultEventLaunchContext, validationDelayMs: 0 };
  const identities = { bindingId: 'event-launch-bindings-v1', policyId: 'all-values-v1' };
  const release = await api.createPortableRelease(definition, identities);
  const deployed = await api.loadPortableRelease(release, { ...identities, ...bindings });
  const deployment = { definition: deployed.definition, revision: release.id, ...bindings };
  const cases = [
    ['default', defaultEventLaunchValue, context],
    ['ready', smokeTestValue, context],
    ['compliance', smokeTestValue, { ...context, requiresDataProcessingAgreement: true }],
    ['german', smokeTestValue, { ...context, locale: 'de-CH', messages: { slugHelp: 'Adresse', streamHelp: 'Stream', confirmationPrefix: 'Titel:' } }],
  ];
  const change = (label, mutate) => { const value = structuredClone(smokeTestValue); mutate(value.launch); cases.push([label, value, context]); };
  change('required', value => { value.basics.identity.title = ''; value.basics.identity.description = ''; });
  change('schedule', value => { value.basics.schedule.endsAt = value.basics.schedule.startsAt; });
  change('stream', value => { value.streaming.url = 'http://example.com'; value.streaming.recordingConsent = false; });
  change('inactive stream', value => { value.basics.deliveryMode = 'in-person'; value.streaming.url = ''; value.streaming.recordingConsent = false; });
  change('inactive venue', value => { value.basics.deliveryMode = 'virtual'; value.venue.name = ''; value.venue.capacity = undefined; value.venue.address.city = ''; });
  change('address disabled', value => { value.venue.name = ''; value.venue.address.city = ''; });
  change('paid', value => { value.basics.accessModel = 'paid'; value.tickets.tiers = [
    { id: 'one', name: 'Same', price: undefined, quantity: 0 }, { id: 'two', name: ' same ', price: 1.5, quantity: 10 },
  ]; });
  change('agenda aggregates', value => { value.agenda.items = [
    { id: 'one', kind: 'session', title: 'Same', speaker: '', durationMinutes: 120 },
    { id: 'two', kind: 'break', label: ' SAME ', durationMinutes: 15 },
    { id: 'three', kind: 'workshop', title: 'same', facilitator: 'Ada', durationMinutes: undefined, capacity: 300 },
  ]; });
  change('service failure', value => { value.basics.identity.slug = 'service-failure'; });
  for (const [label, value, trustedContext] of cases) {
    const canonical = core.stages({ schema: createEventLaunchSchema(), fields: createEventLaunchFields({ text: 'text', textarea: 'textarea', choice: 'choice', number: 'number', money: 'money', checkbox: 'checkbox' }), value, context: trustedContext });
    const portable = core.stages({ schema: loaded.schemaInput, fields: loaded.fields, value: portableValue(value), context: trustedContext });
    const preview = openPreview?.(loaded, portableValue(value), trustedContext);
    try {
      const expected = await canonical.validate({ scope: 'form', event: 'submit' });
      const actual = await portable.validate({ scope: 'form', event: 'submit' });
      assert.deepEqual(issueSummary(actual.issues), issueSummary(expected.issues), label);
      if (preview) assert.deepEqual(issueSummary((await preview.controller.validate({ scope: 'form', event: 'submit' })).issues), issueSummary(expected.issues), `Studio ${label}`);
      const submission = await api.validatePortableSubmission(deployment, portableValue(value), { context: trustedContext });
      if (label === 'service failure') assert.equal(submission.status, 'unavailable');
      else {
        assert.equal(submission.status, expected.isValid ? 'accepted' : 'rejected', `server ${label}: ${JSON.stringify(submission)}`);
        assert.deepEqual(issueSummary(submission.issues), issueSummary(expected.issues), `server ${label}`);
      }
      assert.deepEqual(portable.getSnapshot().nodes[0].visibleStageIds, canonical.getSnapshot().nodes[0].visibleStageIds, `stages ${label}`);
    } finally { canonical.destroy(); portable.destroy(); preview?.destroy(); }
  }
  let proposed;
  const controller = core.stages({ schema: loaded.schemaInput, fields: loaded.fields, value: portableValue(smokeTestValue), context, onChange: change => { proposed = change.value; } });
  try {
    const title = ['launch', 'basics', 'identity', 'title'];
    controller.dispatch(core.fieldEvent('input', title, { payload: '  New title  ' }));
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(controller.getSnapshot().value.launch.basics.identity.title, smokeTestValue.launch.basics.identity.title);
    controller.update({ value: proposed });
    controller.dispatch(core.fieldEvent('blur', title));
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(proposed.launch.basics.identity.title, 'New title');
    assert.equal(controller.getSnapshot().value.launch.basics.identity.title, '  New title  ');
    controller.update({ value: proposed });
    controller.dispatch(core.formEvent('apply-template'));
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(proposed.launch.basics.identity.title, 'Product Systems Conference');
    controller.update({ value: proposed });
    const wizardAddress = [{ kind: 'node', id: 'launch' }];
    await controller.validate({ scope: { path: ['launch', 'basics'] }, event: 'submit' });
    controller.dispatch(core.nodeEvent('wizard:next', wizardAddress));
    await new Promise(resolve => setTimeout(resolve, 5));
    controller.update({ value: proposed });
    assert.equal(controller.getSnapshot().nodes[0].activeStage, 'venue', JSON.stringify(controller.getSnapshot().validation));
    const agendaAddress = [...wizardAddress, { kind: 'node', id: 'agenda' }, { kind: 'node', id: 'items' }];
    controller.dispatch(core.nodeEvent('collection:add', agendaAddress, { payload: { value: { id: 'added-workshop', kind: 'workshop', title: 'Workshop', facilitator: 'Ada', durationMinutes: 30, capacity: 20 } } }));
    await new Promise(resolve => setTimeout(resolve, 5));
    controller.update({ value: proposed });
    const rows = () => controller.getSnapshot().nodes[0].nodes.find(stage => stage.id === 'agenda').nodes[0].nodes;
    const added = rows().at(-1);
    controller.dispatch(core.nodeEvent('collection:move', added.address, { payload: { to: 0 } }));
    await new Promise(resolve => setTimeout(resolve, 5));
    controller.update({ value: proposed });
    assert.equal(rows()[0].id, added.id);
    controller.dispatch(core.nodeEvent('collection:replace', rows()[0].address, { payload: { value: { id: 'added-workshop', kind: 'session', title: 'Converted', speaker: 'Ada', durationMinutes: 30 } } }));
    await new Promise(resolve => setTimeout(resolve, 5));
    controller.update({ value: proposed });
    assert.equal(rows()[0].id, added.id);
    const state = controller.serialize();
    const saved = api.savePortableState(deployed, state);
    const updated = structuredClone(definition); updated.form.title += ' release 2';
    const next = await api.createPortableRelease(updated, { ...identities, previous: release,
      compatibility: { changes: ['presentation'], state: 'compatible', rationale: 'Title-only update; preserve full envelope.' } });
    const target = await api.loadPortableRelease(next, { ...identities, ...bindings });
    const migrated = await api.migratePortableState(saved, target, [{ from: release, to: next, baseline: 'preserve',
      metadata: Object.fromEntries(Object.keys(state.meta).map(key => [key, 'preserve'])), migrate: state => state }]);
    assert.deepEqual(migrated.state, state);
    const restored = core.stages({ schema: loaded.schemaInput, fields: target.fields, state: migrated.state, context });
    assert.deepEqual(restored.getSnapshot().value, controller.getSnapshot().value);
    assert.deepEqual(restored.serialize().baseline, state.baseline);
    assert.deepEqual(restored.serialize().meta.collectionKeys, state.meta.collectionKeys);
    assert.deepEqual(restored.serialize().meta.activeWizards, state.meta.activeWizards);
    assert.deepEqual(restored.serialize().meta.touched, state.meta.touched);
    restored.destroy();
    controller.update({ context: { ...context, requiresDataProcessingAgreement: true } });
    assert(controller.getSnapshot().nodes[0].visibleStageIds.includes('compliance'));
  } finally { controller.destroy(); }
  const malformed = portableValue(smokeTestValue);
  malformed.launch.agenda.items[0].forged = true;
  assert.equal((await api.validatePortableSubmission(deployment, malformed, { context })).status, 'rejected');
  delete malformed.launch.agenda.items[0].forged;
  malformed.launch.agenda.items.push({ ...malformed.launch.agenda.items[0] });
  assert((await api.validatePortableSubmission(deployment, malformed, { context })).issues.some(issue => issue.code === 'submission.row-key'));
  const abort = new AbortController();
  const pending = api.validatePortableSubmission(deployment, portableValue(smokeTestValue), { context: { ...context, validationDelayMs: 100 }, signal: abort.signal });
  abort.abort();
  assert.equal((await pending).reason, 'cancelled');
}
