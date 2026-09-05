import { readFileSync, writeFileSync } from 'node:fs';
import { projectPortableForm, serializePortableForm } from '../packages/authoring/dist/index.js';
import { eventLaunchProject, eventLaunchDescriptors } from '../examples/shared/event-launch/portable.mjs';
const project = eventLaunchProject();
const result = projectPortableForm(project, 'event_launch', undefined, { fieldDescriptors: eventLaunchDescriptors });
if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
const files = new Map([
  ['studio/src/document/fixtures/event-launch.json', `${JSON.stringify(project, null, 2)}\n`],
  ['packages/authoring/test/fixtures/event-launch-form-v1.json', serializePortableForm(result.value)],
]);
for (const [path, source] of files) {
  if (process.argv.includes('--update')) writeFileSync(path, source);
  else if (readFileSync(path, 'utf8') !== source) throw new Error(`Stale Event Launch fixture: ${path}`);
}
