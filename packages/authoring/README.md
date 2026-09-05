# @stages/authoring

Optional framework-neutral portable-form loader for Stages v1. Depends on the
exact matching `@stages/core`; code-authored core schemas do not need this package.

```ts
import { loadPortableForm } from '@stages/authoring';
import { stages } from '@stages/core';

const result = loadPortableForm(jsonText);
if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
const loaded = result.value;
const controller = stages({
  schema: loaded.schemaInput,
  fields: loaded.fields,
  value: loaded.initialValue as unknown,
  onChange: change => controller.update({ value: change.value }),
});
// Always destroy the controller when its owner is done.
```

The loader validates the versioned envelope and references, resolves exact trusted
service bindings, and compiles built-in fields, validation, conditions,
transforms, and localization with Studio's shared compiler. It never executes
source text, imports modules named by JSON, or invokes services while loading.
Use `schemaInput` to retain structural conditions. Render plans and source maps
are optional outputs; choose your own adapter and components.

`projectPortableForm(project, formUid, initialValue?)` resolves fragment graphs
and localization resources into a production definition. It excludes scenarios
and legacy node metadata. An omitted default is built from empty field values,
never scenario ordering. `serializePortableForm` produces deterministic JSON.
`validatePortableForm` checks data/graph shape and declared requirements without
resolving host bindings; `loadPortableForm` additionally checks execution support.
`definePortableServiceBindings` builds an exact-version registry and rejects
duplicates. Missing bindings fail explicitly; nothing is silently dropped.

`@stages/authoring/portable.schema.json` is the generated structural JSON Schema.
Semantic checks are also required. `@stages/authoring/studio` exposes the shared
project-v1 authoring API, retaining Studio-prefixed names for compatibility.
The compiler, validators, expressions, catalogs, document migration, and
localization implementation live here; preview service mocks remain in Studio.

This is UI/runtime validation, not authoritative submission decoding. Computed
values, row-dependent presence, parameterized fragments and portable extension
codecs remain unsupported. Custom field registries and hybrid composition are
subsequent work. Direct core callbacks, fields, codecs and adapters remain usable.

See the [loader guide](https://github.com/unic/stages/blob/master/docs/content/start/portable-forms.mdx)
and [reference](https://github.com/unic/stages/blob/master/docs/content/reference/authoring.mdx).

Repository setup: after root `npm ci`, run `npm --prefix packages/authoring ci`
to link the local core development dependency, then `npm run build:v1`.
The runtime dependency remains exact-versioned; the development-only file
reference is not used by installed package consumers. The Knip exception for
that duplicate dependency declaration preserves this local workspace setup.

For existing 0.x applications, see the [v1 migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md).
