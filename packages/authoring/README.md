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

The loader creates UI/runtime behavior; use the separate submission entry point
for authoritative acceptance. Row-dependent structural presence, parameterized
fragments and portable extension codecs remain unsupported. Custom JSON field descriptors, exact semantic bindings and view replacement are
supported through `definePortableFieldBindings` and `bindPortableViews`.
`definePortableBehaviorBindings` resolves portable JS rule references and config;
`composePortableForm` appends host rules under a distinct deployment schema identity. Direct core callbacks, fields, codecs and adapters remain usable.

See the [loader guide](https://github.com/unic/stages/blob/master/docs/content/start/portable-forms.mdx)
and [reference](https://github.com/unic/stages/blob/master/docs/content/reference/authoring.mdx).

Repository setup: after root `npm ci`, run `npm --prefix packages/authoring ci`
to link the local core development dependency, then `npm run build:v1`.
The runtime dependency remains exact-versioned; the development-only file
reference is not used by installed package consumers. The Knip exception for
that duplicate dependency declaration preserves this local workspace setup.

For existing 0.x applications, see the [v1 migration guide](https://github.com/unic/stages/blob/master/docs/MIGRATING_TO_V1.md).

## Authoritative submissions

`validatePortableSubmission` accepts a server-owned deployment (`definition`,
immutable `revision`, exact bindings), an unknown parsed request value and trusted
context/cancellation options. It strictly decodes all declared values, validates
through fresh core state, and returns accepted canonical values, rejected input
or unavailable execution. UI visibility and disabled state do not exempt values;
conditional business applicability belongs on validators. No coercion, default
filling or UI transform replay occurs. Service failures never accept.

See the [server guide](../../docs/content/start/portable-forms.mdx),
[normative contract](../../docs/content/reference/authoring.mdx) and
[packed submission matrix](test/fixtures/packed-submissions.mjs).

## Complex portable forms

Studio forms can retain exact behavior references. Behavior factories may attach
scoped rules by node UID, including aggregate validators with multiple row issues,
field presentation, transforms and wizard guards. Computed expressions use ordered
dependencies and controlled proposals; validation rejects inconsistent values.
The full [Event Launch artifact](test/fixtures/event-launch-form-v1.json) is checked
against canonical callbacks, Studio preview, installed adapters and Node submissions.
See the [guide](../../docs/content/start/portable-forms.mdx) for bindings and policies.


Durable deployment wrappers use `createPortableRelease`, `comparePortableReleases`,
`loadPortableRelease` and `serializePortableRelease`. SHA-256 identities cover the
artifact, compiler contract and immutable host binding/policy IDs. Subsequent
releases require an explicit compatibility decision. `savePortableState` and
`migratePortableState` pin full core envelopes to exact releases, including baseline,
row/wizard state, interaction metadata and extensions with declared preserve/reset
policies. Existing portable-v1 artifact bytes and direct core workflows are unchanged.
See the [release guide](../../docs/content/start/portable-forms.mdx) and
[normative contract](../../docs/content/reference/authoring.mdx). The optional
[Node worker recipe](../../scripts/portable/isolated-submission.mjs) demonstrates
hard synchronous deadlines; manual portable beta gates remain explicitly open.

`createPortableReleaseCache` supplies bounded LRU reuse for standard compilation.
Each caller receives detached compiled output; controller/request state is never
cached. Definitions with trusted executable bindings compile afresh per load.
