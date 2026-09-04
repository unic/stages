# Local projects and recovery

Session 26 replaces the v1 editor's single manual draft with a local project
repository workflow. The document and compiler depend only on
`StudioProjectRepository`; IndexedDB details remain in the platform adapter and
the memory adapter supplies the same contract for tests.

## Project lifecycle

The Projects panel lists confirmed local projects and can create, open,
duplicate, rename, and delete them. Creation and duplication allocate a new
project UID. Rename is a document command, so it participates in the same
history and dirty policy as every other authoring edit. Deletion requires a
second explicit confirmation and moves the last confirmed document to recovery
instead of destroying it.

Repository saves and deletes carry the last confirmed repository revision.
The adapter rejects a stale writer with `StudioProjectConflictError`; Studio
keeps the in-memory document dirty and reports the conflict rather than
overwriting the other tab. Repository revisions remain separate from document
history revisions and controller snapshot revisions.

Accepted document edits schedule an autosave after 1.5 seconds, inside the
two-second loss budget. Repeated edits coalesce, writes execute in revision
order, and `pagehide`, `beforeunload`, and transition to a hidden document
attempt to flush pending work. The status announces pending, confirmed, failed,
quota, and conflict outcomes. It never marks a document saved before the
repository confirms the write.

## Recovery copies

Before replacing an active confirmed revision, the repository stores it as a
backup. The newest three backup revisions per project are retained; rotation
does not touch the active revision. A deleted project is retained separately
until its recovery entry is explicitly discarded.

IndexedDB records contain canonical Studio JSON rather than structured runtime
objects. `load()` passes that source through `openStudioProject()`. If it fails,
the adapter atomically moves the raw record to a non-restorable corruption
quarantine and removes it from the active project list. The recovery panel
shows the diagnostic and any valid backup or deleted copies. Restore is itself
revision-checked and creates a newly confirmed active revision.

Storage and quota errors propagate through the repository boundary. The editor
keeps its dirty in-memory history and the last confirmed active/backup records;
it does not convert a failed write into a saved state.

## Legacy local storage

The v1 page no longer rehydrates the legacy Zustand persistence record. It only
reads `stages-studio-storage-0.1` into a non-mutating preview containing the
legacy title and top-level block count. Migration runs only after the user
selects **Confirm legacy migration**. The legacy importer receives new project
and form UIDs, and the old key is removed only after the new IndexedDB project
has been confirmed. A failed import or save leaves the old record untouched.

## State ownership

The toolbar reports project dirty state from document history. Preview values,
controller touched/visited state, stage state, and accepted runtime revision
remain session-local to the preview host and do not affect project save status.

## Evidence

- `studio/src/projects/project-repository.test.ts`
- `studio/src/projects/projects.test.ts`
- `studio/src/commands/commands.test.ts`
- `studio/components/StudioEditorPage.test.jsx`
- `studio/src/platform/indexeddb-project-repository.ts`
