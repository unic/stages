import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as authoring from '../dist/index.js';
import * as core from '../../core/dist/index.js';
import { eventLaunchJourneys } from '../../../examples/shared/event-launch/portable-journeys.mjs';
test('full portable Event Launch matches canonical domain and authoritative submissions', async () => {
  await eventLaunchJourneys(authoring, core, JSON.parse(readFileSync(new URL('./fixtures/event-launch-form-v1.json', import.meta.url))));
});
