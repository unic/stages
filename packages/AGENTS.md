# V1 package guidance

- `src/` is authoritative; `dist/` is generated.
- Preserve strict TypeScript. Do not introduce `any`, `@ts-ignore`, or `@ts-nocheck`.
- Packages remain ESM-only, side-effect-free, and version-aligned.
- Non-core packages depend on the exact matching `@stages/core` version.
- Use the root change verifier to ensure current core and package output before `.mjs` tests. It orders prerequisites and reuses verified unchanged builds; test-only edits do not by themselves require recompilation.
- Package export changes are public API changes.
- Adapter behavior must remain expressible through the shared controller contract.

| Package | Preserve |
| --- | --- |
| DOM | Accessible relationships, focus behavior, and no framework dependency |
| React | Strict Mode lifecycle and deferred destruction |
| Vue | Scope destruction and reactive selector behavior |
| Angular | Signals, strict templates, and partial compilation |
| test-kit | A framework-neutral adapter contract |
