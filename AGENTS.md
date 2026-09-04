# Repository guidance

Stages v1 is the default development target. Active v1 packages and applications live under `packages/`, `examples/`, `docs/`, and `studio/`.

- Root `src/` and the root package metadata describe the historical React Stages 0.x implementation. Do not edit or import them for v1 work.
- `demo/` is retired and must remain retired.
- Before editing a subtree, read its nearest nested `AGENTS.md`.
- Prefer evidence in this order: exported TypeScript declarations, executable tests, production examples, architecture documents, then prose.
- Treat `dist/`, `.next/`, `out/`, coverage, Playwright reports, and test results as generated output. Never edit them directly.
- Package tests import generated `dist/`. Rebuild the affected dependency closure before executing `.mjs` tests; use `$stages-verify-change` when available.
- Public behavior changes require runtime tests, compile-time contracts, documentation, coverage metadata, and packed-package consumer verification.
- Do not add dependencies or modify lockfiles incidentally.
- Preserve existing working-tree changes, including unrelated untracked files.
- Use Node 24.15.0 from `.nvmrc`.
- Run `npm run release:check:v1` for public API, serialization, manifests, package metadata, framework contracts, or release work.

During review, flag changes that weaken controlled-value proposal/acceptance semantics, public contract changes without compatibility evidence and documentation, and core imports of framework, browser, or runtime dependencies.
