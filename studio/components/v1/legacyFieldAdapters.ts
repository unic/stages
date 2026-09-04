import {
  STUDIO_FIELD_DEFINITIONS,
  type StudioFieldKey,
  type StudioInspectorControlKind,
} from "../../src/registry";

const legacyControlType: Readonly<Record<StudioInspectorControlKind, string>> = Object.freeze({
  checkbox: "checkbox",
  number: "number",
  select: "select",
  text: "text",
  textarea: "textarea",
});

export const migratedLegacyFieldProps = Object.freeze(Object.fromEntries(
  Object.values(STUDIO_FIELD_DEFINITIONS).flatMap((definition) => definition.legacyTypes.map((legacyType) => [
    legacyType,
    definition.props.map((control) => ({
      id: control.key,
      type: legacyControlType[control.control],
      label: control.label,
      ...(control.defaultValue === undefined ? {} : { defaultValue: control.defaultValue }),
      ...(control.required === undefined ? {} : { isRequired: control.required }),
      ...(control.options === undefined ? {} : {
        options: control.options.map(({ label, value }) => ({ text: label, value })),
      }),
    })),
  ])),
));

type LegacyView = Readonly<{ component: unknown; isValid: unknown }>;

export function createMigratedLegacyViews(
  views: Readonly<Record<StudioFieldKey, LegacyView>>,
): Readonly<Record<string, LegacyView>> {
  return Object.freeze(Object.fromEntries(
    Object.values(STUDIO_FIELD_DEFINITIONS).flatMap((definition) => definition.legacyTypes.map((legacyType) => [
      legacyType,
      views[definition.key],
    ])),
  ));
}
