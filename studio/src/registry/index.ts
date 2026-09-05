/** Shared authoring implementation; kept as a Studio import compatibility bridge. */
export { STUDIO_FIELD_DEFINITIONS, STUDIO_RUNTIME_FIELDS, STUDIO_SUPPORTED_DEFINITIONS, studioFieldDefinition, migrateStudioFieldReference, validateStudioFieldProps, createStudioFieldNode } from "@stages/authoring/studio";
export type { StudioFieldKey, StudioInspectorControlKind, StudioPropControl, StudioAuthoringFieldDefinition, AnyStudioAuthoringFieldDefinition } from "@stages/authoring/studio";
export * from "./presentation";
export * from "./services";
export * from "./codecs";
