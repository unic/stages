// source:start portable-release
import {
  createPortableRelease, createPortableReleaseCache, savePortableState,
  migratePortableState, validatePortableSubmission,
  type PortableFormDefinition, type PortableLoadOptions, type PortableSavedState,
  type PortableStateMigration,
} from '@stages/authoring';
import { stages } from '@stages/core';

const releaseCache = createPortableReleaseCache(16);

export async function deployForm(definition: PortableFormDefinition, bindings: PortableLoadOptions) {
  const identities = { bindingId: 'application-build-abc123', policyId: 'all-values-policy-1' };
  const release = await createPortableRelease(definition, identities);
  const loaded = await releaseCache.load(release, { ...identities, ...bindings });
  const controller = stages({ schema: loaded.schemaInput, fields: loaded.fields, value: loaded.initialValue as unknown });
  const save = () => savePortableState(loaded, controller.serialize());
  const restore = (saved: PortableSavedState, migrations: readonly PortableStateMigration[]) =>
    migratePortableState(saved, loaded, migrations);
  const submit = (requestValue: unknown) => validatePortableSubmission({
    definition: loaded.definition, revision: release.id, ...bindings,
  }, requestValue);
  return { release, controller, save, restore, submit };
}
// source:end portable-release
