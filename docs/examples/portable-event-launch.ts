// source:start portable-event-launch
import * as authoring from '@stages/authoring';
import { stages } from '@stages/core';
import { eventLaunchBindings } from '../../examples/shared/event-launch/portable.mjs';

export function openEventLaunch(artifact: unknown, context: unknown) {
  const bindings = eventLaunchBindings(authoring);
  const result = authoring.loadPortableForm(artifact, bindings);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  const loaded = result.value;
  const controller = stages({
    schema: loaded.schemaInput, fields: loaded.fields,
    value: loaded.initialValue as unknown, context,
    onChange: proposal => controller.update({ value: proposal.value }),
  });
  return { controller, deployment: { definition: loaded.definition, revision: 'event-launch-domain-1', ...bindings } };
}
// source:end portable-event-launch
