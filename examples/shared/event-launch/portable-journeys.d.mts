import type * as Authoring from '@stages/authoring';
import type * as Core from '@stages/core';
export function eventLaunchJourneys(api: typeof Authoring, core: typeof Core, definition: Authoring.PortableFormDefinition, openPreview?: (loaded: Authoring.LoadedPortableForm, value: unknown, context: unknown) => { controller: Core.StagesController<unknown, unknown>; destroy(): void }): Promise<void>;
