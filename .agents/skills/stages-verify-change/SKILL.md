---
name: stages-verify-change
description: Select checks from the Stages diff and reuse verified unchanged work. Use after edits, before handoff, or for focused, change-level, or release verification.
---

# Verify a Stages change

Start with `npm run verify:changed -- plan` from the repository root. Inspect the changed paths and selected commands before execution; a clean tree needs no verification unless requested.

- `plan`: show the change-level selection and whether each command can reuse successful evidence. This is read-only; downstream reuse is checked again after prerequisites run.
- `focused`: ensure current package output and run focused checks while iterating.
- `change`: run the full selection for the diff before handoff, reusing unchanged successes from focused runs.
- `release`: always run `npm run release:check:v1` fresh.

By default the diff includes staged, unstaged, and untracked files. Add `--base <ref>` to include committed branch changes since the merge base as well. Preserve unrelated working-tree changes and identify them in the plan; do not assume every dirty file belongs to the current task.

Successful package builds, package runtime/type checks, shared-example checks, and agent-setup checks can be reused across invocations. Evidence is local to this checkout in the OS temporary directory; it checks file contents, dependency output, Node/environment, manifests, and install stamps. Missing or modified output invalidates reuse. Failed checks are never recorded. Release, unknown-path fallback, browser, application, and global quality gates always execute when selected. Use `--force` for explicitly requested fresh verification or after manual dependency/environment changes the cache cannot observe.

Do not run the selected commands manually first, append the complete v1 suite to a narrow change, or repeat successful checks merely because the task reached handoff. Agent guidance/tooling changes select setup validation; package test edits select that package's checks. Fix an incomplete mapping in `scripts/agent/impact-map.mjs` with regression coverage when evidence supports a narrower selection. Unknown paths retain the safe `check:v1` plus `test:v1` fallback until mapped.

Use `release` for public API, serialization, manifests, package metadata, framework contracts, or release work even if a path-based plan is narrower. Path matching cannot infer semantic contract changes.

On failure, inspect the retained log and report its path and relevant tail. Report reused successes separately from checks executed now, and warn if verification changes tracked working-tree state. Stop after the required checks pass unless new edits or findings justify more verification.
