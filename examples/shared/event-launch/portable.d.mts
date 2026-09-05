import type * as Authoring from '@stages/authoring';
import type { StudioProjectDocument, JsonValue } from '@stages/authoring/studio';
export { defaultEventLaunchContext, defaultEventLaunchValue, smokeTestValue } from './dist/fixtures.js';
export function portableValue(value: unknown): JsonValue;
export function canonicalValue(value: unknown): unknown;
export const eventLaunchDescriptors: readonly Authoring.PortableFieldDescriptor[];
export function eventLaunchProject(): StudioProjectDocument;
export function eventLaunchBindings(api: typeof Authoring): { fieldBindings: Authoring.PortableFieldBindings; behaviorBindings: Authoring.PortableBehaviorBindings };
