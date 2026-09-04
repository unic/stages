# Legacy demo replacement map

The 0.x Next.js demo application was retired after its behavioral coverage was
captured by v1 examples, focused engine/adapter tests, Studio, and migration
documentation. This table records where each former route is represented.

| Retired route(s) | v1 replacement |
| --- | --- |
| `index`, `simple`, `plain`, `disabled`, `groups` | Vanilla and React examples; core schema and DOM adapter tests |
| `asyncdata` | Controlled owner updates and external `controller.update()` tests |
| `asyncvalidation`, `validateon`, `customerrors` | Validation cancellation, event/reveal policy, dependency, and failure-presentation tests |
| `autosave`, `undo`, `isdirty` | Controlled change metadata, reset, baseline, dirty-state, and serialization tests |
| `interfacestate` | Namespaced extension state and extension-codec tests |
| `subform`, `configtemplates`, `fieldsets` | Recursive schema composition, Studio fieldset conversion, and the exhaustive nesting matrix |
| `dynamicfields`, `functionprops`, `dynamicoptions`, `computedoptions` | Dynamic schema/resolver tests and the migration guide |
| `dynamicvalues`, `transforms`, `typecasting` | Reducer/transform migration fixtures, ordered patch tests, and custom value codecs |
| `collections`, `collectionrules`, `collectionsort` | Canonical Event Launch agenda/tickets, its cross-adapter suite, and collection command/property tests |
| `wizard`, `dynamicsteps`, `stepsummaries`, `wizardnavigation` | Canonical Event Launch dynamic flow and the wizard validation/navigation matrix |
| `i18n` | v1 documentation application internationalization guide |
| `wysiwyg` | Opaque custom field-view contracts in DOM/React adapter tests |
| `quiz`, `slideshow`, `sparouter` | Event Launch application-owned composition over wizard bindings and named navigation events |

The historical source is still available in Git. This map is a coverage record,
not a claim that v1 preserves the old component or render-prop API.
