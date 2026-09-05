# Studio import and export

Studio uses one canonical JSON boundary for editable projects. The Import &
export panel accepts text only through `importStudioProject()`, which delegates
to `openStudioProject()`: it applies the ordered project-format migrations,
validates the migrated document against trusted definition versions, and
returns either a detached frozen project plus migration IDs or path-addressed
diagnostics. Imported data replaces document history only after the complete
pipeline succeeds.

`generateStudioExportBundle()` always includes the complete `project.stages.json`
through the canonical serializer. When runtime generation fails, the result has
`ok: false`, diagnostics, and the available `artifacts`, including an
`export-report.json`. Supported forms still receive their code artifacts; blocked
forms never receive incomplete runtime code. The panel lists the affected forms
and nodes and offers a Download artifact link for the selected file.

For each supported form, the exporter emits `form.stages.json`: a versioned
production projection loaded through `@stages/authoring`. It resolves fragments,
keeps referenced localization messages, and excludes scenario answers, legacy
metadata and non-theme authoring settings. Initial values come from empty field
defaults, never from the first scenario. Application tooling can supply explicit
production defaults to `projectPortableForm`.

The existing static schema and field emitter remains available for closure-free
forms. Supported rules, conditions, reducers and transforms produce a
`portable.ts` module that calls the public loader; `schema.ts` uses its
`schemaInput` and `fields.ts` uses its semantic field bindings. Both paths include
initial values, separate scenario fixtures, a state-migration skeleton, a minimal
controlled React integration, and a README. No generated application imports
Studio or repository source. The React integration remains a scaffold; rendering
the authored controls and custom field registries is S2 work.

Unknown definitions, unsupported computed values, row-dependent presence and
parameterized fragments still fail explicitly. Service rules export JSON with
exact binding requirements, but cannot emit runnable integration code until the
host supplies those bindings. The failure report and canonical project remain
available; no closure is stringified or rule silently omitted. Plain Node hosts
can register trusted service implementations and load the JSON without React.

Artifact order, object-key order, indentation, filenames, and trailing newlines
are stable. The golden fixture guards exact schema output, while the isolated
consumer test writes a bundle to a temporary package, compiles every generated
TypeScript/TSX file, and dispatches events through the generated schema for all
built-in definitions. It checks invalid payloads, ignored events, and the
controlled proposal/acceptance boundary. That generated-code test links Studio's installed dependencies. Separately, the
contact-form JSON is checked against the actual Studio export and loaded in an
isolated core-plus-authoring tarball consumer by `scripts/verify-v1-packages.mjs`.
It proves required/comparison/conditional/localized behavior and controlled
ownership without browser or framework dependencies.

## Evidence

- `studio/src/projects/artifacts.ts` and `artifacts.test.ts`
- `studio/src/projects/fixtures/event-launch-schema.ts.txt`
- `studio/src/document/migrations.ts` and `serialization.ts`
- `studio/components/v1/StudioV1Editor.tsx`
- `studio/components/StudioEditorPage.test.jsx`
