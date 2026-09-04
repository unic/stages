# Studio import and export

Studio uses one canonical JSON boundary for editable projects. The Import &
export panel accepts text only through `importStudioProject()`, which delegates
to `openStudioProject()`: it applies the ordered project-format migrations,
validates the migrated document against trusted definition versions, and
returns either a detached frozen project plus migration IDs or path-addressed
diagnostics. Imported data replaces document history only after the complete
pipeline succeeds.

`generateStudioExportBundle()` always emits `project.stages.json` through the
canonical serializer. For every form it emits deterministic files for the v1
schema, field-registry bindings, initial controlled value, named scenarios,
state-migration skeleton, a minimal controlled React integration, and a short
README. Generated TypeScript imports only public `@stages/core` and
`@stages/react` entry points; the Studio document and compiler are not runtime
dependencies of the generated application.

The code emitter serializes closure-free compiled schemas. If dynamic
expressions, reducers, validators, transforms, item-key callbacks, or other
executable behavior remains in the compiled artifact, export stops with
`export.executable-binding-required` instead of stringifying a closure or
silently weakening behavior. The canonical project JSON is still independently
available for round trips. A future named-binding exporter can resolve those
diagnostics without changing the project format.

Artifact order, object-key order, indentation, filenames, and trailing newlines
are stable. The golden fixture guards exact schema output, while the isolated
consumer test writes a bundle to a temporary package, compiles every generated
TypeScript/TSX file, and executes the generated schema with the packed-style
public package boundary.

## Evidence

- `studio/src/projects/artifacts.ts` and `artifacts.test.ts`
- `studio/src/projects/fixtures/event-launch-schema.ts.txt`
- `studio/src/document/migrations.ts` and `serialization.ts`
- `studio/components/v1/StudioV1Editor.tsx`
- `studio/components/StudioEditorPage.test.jsx`
