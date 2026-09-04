---
name: stages-prepare-release
description: Validate Stages release-candidate readiness, version alignment, API reports, packaging, and complete gates. Use only when explicitly asked to prepare or assess a release.
---

# Prepare a Stages release

1. Read [the release checklist](../../../docs/V1_RELEASE_CHECKLIST.md).
2. Confirm all six package versions match and adapter dependencies pin that exact `@stages/core` version.
3. Build packages and run `npm run check:public-api:v1`; inspect report diffs before accepting an update.
4. Run `npm run release:check:v1`.
5. Run dry-run packaging only when requested, and inspect included files and packed-consumer results.
6. Confirm verification did not unexpectedly mutate tracked files.

Never publish, tag, push, or create a release without explicit authorization.
