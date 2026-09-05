import { stages, type StagesExtensionCodec } from '@stages/core';
import {
  createPortableRelease, loadPortableRelease, migratePortableState, projectPortableForm,
  type LoadedPortableRelease, type PortableCompatibilityDecision, type PortableLoadOptions,
  type PortableProjectOptions, type PortableRelease, type PortableSavedState, type PortableStateMigration,
} from '@stages/authoring';
import type { StudioProjectDocument, Uid } from '../document';

export interface StudioPortableFormDeployment extends PortableLoadOptions, PortableProjectOptions {
  readonly bindingId: string;
  readonly policyId: string;
  readonly compatibility?: PortableCompatibilityDecision;
  readonly states?: readonly PortableSavedState[];
  readonly migrations?: readonly PortableStateMigration[];
  readonly extensionCodecs?: Readonly<Record<string, StagesExtensionCodec>>;
}
export interface StudioPortableEvidence {
  readonly releaseId: string;
  readonly report: string;
  readonly packed: boolean;
  readonly server: boolean;
  readonly adapters: readonly ('dom' | 'react' | 'vue' | 'angular')[];
}
export interface StudioPortablePublicationOptions {
  readonly forms: Readonly<Record<Uid, StudioPortableFormDeployment>>;
  /** Host runner executes the installed-artifact matrix. No default successful report. */
  readonly verify: (releases: Readonly<Record<Uid, PortableRelease>>) => Promise<readonly StudioPortableEvidence[]>;
}
export interface StudioPortablePublication {
  readonly releases: Readonly<Record<Uid, PortableRelease>>;
  readonly evidence: readonly StudioPortableEvidence[];
}

export async function preparePortablePublication(
  project: StudioProjectDocument,
  options: StudioPortablePublicationOptions,
  previous?: StudioPortablePublication,
): Promise<Readonly<{ publication: StudioPortablePublication; loaded: ReadonlyMap<Uid, LoadedPortableRelease> }>> {
  const releases: Record<Uid, PortableRelease> = {};
  const loaded = new Map<Uid, LoadedPortableRelease>();
  for (const form of Object.values(project.forms)) {
    const deployment = options.forms[form.uid];
    if (!deployment) throw new TypeError(`Supply immutable deployment identities and bindings for form ${form.uid}.`);
    const projected = projectPortableForm(project, form.uid, undefined, deployment);
    if (!projected.ok) throw new TypeError(`${form.uid}: ${projected.diagnostics.map(item => item.message).join(' ')}`);
    const prior = previous?.releases[form.uid];
    const release = await createPortableRelease(projected.value, {
      bindingId: deployment.bindingId, policyId: deployment.policyId,
      ...(prior ? { previous: prior } : {}),
      ...(deployment.compatibility ? { compatibility: deployment.compatibility } : {}),
    });
    const target = await loadPortableRelease(release, deployment);
    if (prior && release.compatibility?.state !== 'reset') {
      if (!deployment.states?.length || deployment.states.some(state => state.releaseId !== prior.id)) throw new TypeError(`${form.uid}: Supply full saved-state fixtures from the previous portable release.`);
      for (const state of deployment.states) {
        const migrated = await migratePortableState(state, target, deployment.migrations);
        const controller = stages({ schema: target.schemaInput, fields: target.fields, state: migrated.state,
          ...(deployment.extensionCodecs ? { extensionCodecs: deployment.extensionCodecs } : {}) });
        controller.destroy();
      }
    }
    releases[form.uid] = release;
    loaded.set(form.uid, target);
  }
  // Freeze the collection too: a verifier cannot replace the contract being certified.
  Object.freeze(releases);
  const evidence = await options.verify(releases);
  for (const release of Object.values(releases)) {
    const matches = evidence.filter(item => item.releaseId === release.id);
    const result = matches[0];
    if (matches.length !== 1 || !result || !result.report.trim() || !result.packed || !result.server
      || !['dom', 'react', 'vue', 'angular'].every(adapter => result.adapters.some(item => item === adapter))) {
      throw new TypeError(`Release ${release.id} needs a named passing packed/server/four-adapter report.`);
    }
  }
  if (evidence.length !== Object.keys(releases).length) throw new TypeError('Portable evidence includes an unrelated release.');
  return { publication: { releases, evidence }, loaded };
}
