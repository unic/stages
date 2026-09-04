import type { Uid } from "../../src/document";
import { importLegacyStudioProject } from "../../src/legacy/importer";
import type { LegacyStudioInput } from "../../src/legacy/types";
import { STUDIO_BLOCK_DEFINITIONS, STUDIO_FIELD_DEFINITIONS, STUDIO_SUPPORTED_DEFINITIONS as SUPPORTED_FIELDS } from "../../src/registry";
import shadcnFields from "../shadcnFields";

export const STUDIO_SUPPORTED_DEFINITIONS: Readonly<Record<string, readonly number[]>> = Object.freeze(Object.fromEntries([
  ...Object.keys(shadcnFields).map((key) => [key, Object.freeze([1])]),
  ...Object.entries(SUPPORTED_FIELDS),
  ...Object.values(STUDIO_BLOCK_DEFINITIONS).map(({ key, version }) => [key, Object.freeze([version])]),
].map((entry) => Array.isArray(entry) ? entry : [entry, Object.freeze([1])])));

const STUDIO_LEGACY_FIELD_TYPES = Object.freeze([
  ...new Set([
    ...Object.keys(shadcnFields),
    ...Object.values(STUDIO_FIELD_DEFINITIONS).flatMap(({ legacyTypes }) => legacyTypes),
  ]),
]);
const STUDIO_LEGACY_FIELD_ALIASES = Object.freeze(Object.fromEntries(
  Object.values(STUDIO_FIELD_DEFINITIONS).flatMap((definition) => definition.legacyTypes.map((legacyType) => [
    legacyType,
    Object.freeze({ key: definition.key, version: definition.version }),
  ])),
));

export function importStudioLegacyInput(input: LegacyStudioInput, identities: { readonly projectUid: Uid; readonly formUid: Uid }) {
  return importLegacyStudioProject(input, {
    fieldTypes: STUDIO_LEGACY_FIELD_TYPES,
    fieldDefinitionAliases: STUDIO_LEGACY_FIELD_ALIASES,
    ...identities,
  });
}
