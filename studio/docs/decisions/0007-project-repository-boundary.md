# ADR 0007: Persistence is behind a project repository

- Status: Accepted
- Date: 2026-09-04

## Context

One unversioned local-storage key cannot safely support project lists,
migrations, backups, corruption recovery, or concurrent writers.

## Decision

Application services access projects through an asynchronous repository port
with list, load, save, and delete operations. Save and delete accept an expected
revision. The beta adapter uses IndexedDB; remote storage can implement the same
port later.

## Consequences

Browser APIs, retries, conflicts, authentication, and storage failures remain
outside the document and compiler. The legacy local-storage record is migration
input and is never overwritten before a recoverable backup exists.
