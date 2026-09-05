# Repository guidance

Stages v1 is the default development target. Active v1 packages and applications live under `packages/`, `examples/`, `docs/`, and `studio/`.

- Root `src/` and the root package metadata describe the historical React Stages 0.x implementation. Do not edit or import them for v1 work.
- `demo/` is retired and must remain retired.
- Before editing a subtree, read its nearest nested `AGENTS.md`.
- Prefer evidence in this order: exported TypeScript declarations, executable tests, production examples, architecture documents, then prose.
- Treat `dist/`, `.next/`, `out/`, coverage, Playwright reports, and test results as generated output. Never edit them directly.
- Start verification with `npm run verify:changed -- plan`; use `$stages-verify-change` for execution. Select checks from the actual diff and affected consumers, not project size or a generic handoff checklist.
- Package tests import generated `dist/`. The verifier builds prerequisites in dependency order and reuses successful checks only while inputs and required output match. Do not manually rebuild an unchanged dependency that the verifier can reuse.
- Use `focused` while iterating and `change` once before handoff; unchanged successful checks carry forward. Do not repeat passed checks without new relevant edits, a failure, or an explicit fresh-verification request (`--force`).
- Agent instructions and tooling changes use `check:agent-setup`; they do not require application builds or the v1 suite. Unknown executable paths retain the broad fallback; inspect unexpected selections and fix missing mappings instead of silently omitting checks.
- Public behavior changes require runtime tests, compile-time contracts, documentation, coverage metadata, and packed-package consumer verification.
- Do not add dependencies or modify lockfiles incidentally.
- Preserve existing working-tree changes, including unrelated untracked files.
- Use Node 24.15.0 from `.nvmrc`.
- Use `$stages-check-quality` for dependency, dead-code, or React-quality work. Run the relevant static checks; `npm run check:quality` is the complete gate for broad quality work, not every edit.
- Run `npm run release:check:v1` for public API, serialization, manifests, package metadata, framework contracts, or release work.
- Keep context and output small: use `$stages-find-context` for unfamiliar v1 behavior, read returned evidence first, and report selected checks, reused results, and failures without dumping successful logs.

During review, flag changes that weaken controlled-value proposal/acceptance semantics, public contract changes without compatibility evidence and documentation, and core imports of framework, browser, or runtime dependencies.
