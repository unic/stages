# Extensions, transient state, and localization

Status: implemented for Session 22

Date: 2026-09-04

## Ownership

Studio exposes four author-facing inputs without collapsing their lifecycles:

| Input | Examples | Owner and lifetime |
| --- | --- | --- |
| Domain value | answers, collection rows, submitted choices | controlled preview/application owner; persisted as business data |
| Context | locale, permissions, settled environment data | scenario/application owner; replaced as one input and not merged by core |
| Registered extension | durable draft preferences or engine-adjacent feature state | named namespace with trusted codec metadata; may survive controller recreation |
| Workbench | selection, expanded panels, invalid JSON drafts, drag state, route simulation | adapter/editor session only; never form data or controller extension state |

Touched/visited fields, wizard position, row keys, validation, and accepted
revision are controller runtime state. The controller serialization envelope can
recreate that runtime for Test mode, but it is not the Studio project format.

## Extension resources and scenarios

`resources.extensions` is keyed by a safe namespace. Each entry declares a
title, positive definition version, and codec reference. The local trusted
preview supports `json@1`; executable encode/decode functions remain outside
project JSON. Named scenarios provide values only for registered namespaces.
Document validation rejects unsafe definitions, unsupported codec metadata, and
unregistered scenario namespaces. The preview registers codecs from the catalog
and recreation tests prove durable extension values round-trip through the
public controller envelope.

The legacy importer maps POC `interfaceState` references used by schema behavior
to `extensions.legacyInterfaceState` and adds matching codec metadata. It does
not move editor-only UI concerns into that namespace.

## Locale resources

`resources.locales` maps locale identifiers to display labels and message maps.
The project `defaultLocale` must resolve when a locale catalog is declared. A
scenario selects its locale through `context.locale`, because locale is an
environment input rather than submitted data.

Fields bind `localizedProps` such as `label` and `helpText` to message keys.
Validator localized-message objects may use the same catalog key before their
inline translation/default fallback. Resolution tries the requested locale,
its base language, the project default, and the default base language. Test
mode exposes `localization.fallback` or `localization.missing-message` rather
than silently hiding incomplete catalogs; missing default messages also produce
compiler diagnostics.

Number and ISO-date `format` metadata uses `Intl` for a locale-sensitive,
read-only display. The field control and controlled value remain canonical, so
changing locale cannot create a data proposal.

## Evidence

- `studio/src/document/document.test.ts`
- `studio/src/localization/localization.test.ts`
- `studio/src/compiler/compiler.test.ts`
- `studio/src/runtime/preview-host.test.tsx`
- `studio/components/v1/StudioV1Editor.test.tsx`
- `studio/src/legacy/importer.test.ts`
