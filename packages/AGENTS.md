# V1 package guidance

- `src/` is authoritative; `dist/` is generated.
- Preserve strict TypeScript. Do not introduce `any`, `@ts-ignore`, or `@ts-nocheck`.
- Packages remain ESM-only, side-effect-free, and version-aligned.
- Non-core packages depend on the exact matching `@stages/core` version.
- Build core before an adapter, and build every affected package before running its `.mjs` tests.
- Package export changes are public API changes.
- Adapter behavior must remain expressible through the shared controller contract.

| Package | Preserve |
| --- | --- |
| DOM | Accessible relationships, focus behavior, and no framework dependency |
| React | Strict Mode lifecycle and deferred destruction |
| Vue | Scope destruction and reactive selector behavior |
| Angular | Signals, strict templates, and partial compilation |
| test-kit | A framework-neutral adapter contract |
