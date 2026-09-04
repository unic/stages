---
name: stages-check-quality
description: Run and interpret Stages static quality checks. Use for dependencies, dead code, package efficiency, React diagnostics, or after changing JavaScript or TypeScript.
---

# Check Stages quality

Choose the narrowest relevant check while iterating:

- Run `npm run check:knip` after changing imports, exports, entry points, dependencies, or JavaScript/TypeScript file topology.
- Run `npm run doctor` after React work in `packages/react`, `examples/react`, `studio`, or `docs`.
- Run `npm run check:e18e` after dependency, lockfile, package, or runtime-efficiency changes.
- Run `npm run check:quality` before handoff for broad changes.

Treat Knip findings as evidence to verify against package exports, runtime loading, framework conventions, and tests before deleting code. Public package entry exports are intentional consumer surfaces.

React Doctor contains narrow suppressions for established behavior. Do not add or broaden a suppression merely to make the gate pass; explain why the rule does not apply and keep any exception scoped to the exact rule and file.

e18e analyzes the root locked dependency graph and active v1 source patterns. Warnings remain advisory; errors fail. Run `npm run e18e` when investigating its full optimization backlog. Never run `e18e-cli migrate` without explicit authorization because it changes dependencies and source.

After fixes, use `$stages-verify-change` for dependency-aware build and test verification.
