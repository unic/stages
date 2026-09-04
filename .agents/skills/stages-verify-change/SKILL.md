---
name: stages-verify-change
description: Plan or run dependency-aware verification for Stages changes without testing stale generated output. Use after edits, before handoff, or when asked for focused, change-level, or release verification.
---

# Verify a Stages change

Run `npm run verify:changed -- <mode>` from the repository root.

- `plan`: print selected commands without executing them.
- `focused`: rebuild affected dependency closures, then run focused tests.
- `change`: run the complete impact-matrix selection.
- `release`: run `npm run release:check:v1`.

Use `focused` during implementation and `change` before handoff. Use `release` for public API, serialization, manifests, package metadata, framework contracts, or release work.

Review the changed-path list before execution. Unknown paths must retain the safe `check:v1` plus `test:v1` fallback. On failure, report the retained log path and the relevant tail. Warn if verification changes tracked working-tree state.
