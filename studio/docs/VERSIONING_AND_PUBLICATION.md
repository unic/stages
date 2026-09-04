# Studio versioning and publication

Studio uses four separate lifecycle concepts:

| Concept | Meaning |
| --- | --- |
| Draft | The mutable project document saved through `StudioProjectRepository` with optimistic project revisions. |
| Release version | An immutable snapshot of one confirmed project revision after all publication gates pass. |
| Schema migration | A named, deterministic value transformation for one form schema from version `n` to `n + 1`. |
| Publication | A channel record created by a host service that points at one immutable release ID. |

Neither releases, reviews, nor publication records are stored in
`StudioProjectDocument`. Accounts, permissions, channels, reviewer identity,
remote revisions, credentials, and deployment state remain platform concerns.

## Immutable local releases

`prepareStudioRelease()` validates and compiles a detached project snapshot. A
successful `StudioReleaseSnapshot` records the confirmed project revision, a
SHA-256 digest of canonical project JSON, per-form compiled artifact manifests,
schema IDs and versions, scenario counts, migration manifests, and the time at
which its gate passed. The captured project graph and all release metadata are
deeply frozen.

`StudioVersionRepository` is append-only. Its local in-memory contract rejects
replacement of an existing release ID and returns isolated frozen copies. A
future remote implementation may add storage and conflict mechanics without
changing document or compiler modules.

## Publication gate

A release is not created when any of these checks fails:

- project validation or compiler diagnostics contain an error;
- prior-release evidence belongs to another project or the draft revision is
  not newer;
- a trusted async-service, value-codec, or extension-codec binding is missing;
- a named contract scenario is not reported by the configured runner or reports
  failure; or
- schema lineage regresses, skips a version, lacks exactly one required
  migration or prior-version scenario, or its migration throws, emits unsafe
  JSON, or is nondeterministic for a prior release scenario.

Named scenarios require an explicit `StudioContractScenarioRunner`. The runner
receives the validated project and its compiled forms, and must report every
scenario by form UID and scenario UID. This keeps the gate independent of a
specific test framework or backend.

## Schema-version bump workflow

Value-shape changes use `createStudioSchemaVersionBump()`. The workflow accepts
a trusted migration binding whose schema identity matches the current form and
whose target is exactly the next version. It runs the migration twice against
every named scenario, checks deterministic JSON-safe output, and returns one
`form.schema-version.bump` command. The command rechecks the expected schema
identity and version, then updates the version and all scenario values as one
immutable document transaction. A stale or partial migration is rejected.

When preparing the next release against a prior one, the same migration binding
must be supplied as compatibility evidence. Only inert metadata—ID,
description, schema identity, and version edge—is retained in the release.
Executable migration code never enters project JSON or the snapshot manifest.

## Review and publication ports

`StudioReviewService` creates and resolves review records for a release.
`StudioPublicationService` creates a channel publication record. The
`publishStudioRelease()` workflow accepts only a gate-passed release, rejects a
review for another release, and can require an approved review per channel.
These are service interfaces only; Studio does not implement a production
backend, authentication, approval policy, or deployment transport in this
session.

## Evidence

- `studio/src/projects/versioning.ts`
- `studio/src/projects/versioning.test.ts`
- `studio/src/commands/engine.ts`
