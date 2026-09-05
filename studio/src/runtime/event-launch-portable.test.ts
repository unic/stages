import { expect, it } from 'vitest';
import * as authoring from '@stages/authoring';
import * as core from '@stages/core';
import { resolvePortableFields } from '@stages/authoring/studio';
import { eventLaunchBindings, eventLaunchProject, eventLaunchDescriptors } from '../../../examples/shared/event-launch/portable.mjs';
import { eventLaunchJourneys } from '../../../examples/shared/event-launch/portable-journeys.mjs';
import { compileStudioForm } from '../compiler/compiler';
import { createStudioPreviewHost } from './preview-host';
import type { JsonObject } from '../document';
import { generateStudioExportBundle } from '../projects/artifacts';
import fixture from '../document/fixtures/event-launch.json';
import portable from '../../../packages/authoring/test/fixtures/event-launch-form-v1.json';

it('Studio project exports the complete portable artifact and runs the canonical journeys', async () => {
  const project = eventLaunchProject();
  expect(project).toEqual(fixture);
  const definition = authoring.projectPortableForm(project, project.forms['event_launch']!.uid, undefined, { fieldDescriptors: eventLaunchDescriptors });
  expect(definition.ok).toBe(true);
  if (!definition.ok) throw new Error(JSON.stringify(definition.diagnostics));
  expect(definition.value).toEqual(portable);
  const bundle = generateStudioExportBundle(project, eventLaunchDescriptors);
  expect(JSON.parse((bundle.ok ? bundle.value.artifacts : bundle.artifacts).find(item => item.path.endsWith('/form.stages.json'))!.source)).toEqual(portable);
  const bindings = eventLaunchBindings(authoring);
  const compiled = compileStudioForm(project.forms['event_launch']!, {}, { customFields: resolvePortableFields(eventLaunchDescriptors, bindings.fieldBindings), behaviorBindings: bindings.behaviorBindings });
  expect(compiled.diagnostics).toEqual([]);
  await eventLaunchJourneys(authoring, core, definition.value, (_loaded, value, context) => createStudioPreviewHost({ compiled, value, context: context as JsonObject }));
});
