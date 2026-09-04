# Stages v1 release-candidate checklist

Status: executable alpha/RC process

This checklist produces and validates the six independently publishable v1
packages. It does not publish them. Package naming, ESM-only output, and the
`@stages/*` scope are the currently ratified alpha decisions.

## Release unit

The release contains:

- `@stages/core`
- `@stages/dom`
- `@stages/react`
- `@stages/vue`
- `@stages/angular`
- `@stages/test-kit`

All six packages use the same prerelease version. Adapter and test-kit
manifests depend on that exact `@stages/core` version. Packages are public,
ESM-only, side-effect-free, and licensed under MIT. Each tarball contains its
manifest, README, license, ESM/declaration output, source maps, and the small
TypeScript source tree required by declaration maps.

## Local preflight

Use the repository's Node version, install the locked dependencies, and run:

```sh
nvm use
npm ci
npm --prefix studio ci
npm --prefix docs ci
npm --prefix examples/vanilla ci
npm --prefix examples/react ci
npm --prefix examples/vue ci
npm --prefix examples/angular ci
npm run release:check:v1
```

The release gate performs:

1. migration/API documentation inventory checks;
2. active-application boundary and legacy-retirement checks;
3. architecture acceptance-criterion evidence checks;
4. strict package and example type checks;
5. ESM and declaration builds;
6. six real `npm pack` operations using an isolated cache;
7. manifest, license, export-map, source-map, and tarball allowlist checks;
8. offline installation into an isolated consumer;
9. packed runtime/type checks, including controlled changes, adapters,
   serialization, a custom value codec, migration, and recreation;
10. structural and elapsed-time performance budgets;
11. the complete core/DOM/React/Vue/Angular/test-kit test suite;
12. Studio compatibility-converter tests and a production Studio build;
13. a production build of the v1 documentation application;
14. production builds of the vanilla, React, Vue, and Angular examples; and
15. the React 19 Strict Mode lifecycle test.

Any failure blocks the candidate.

## Version preparation

Before a candidate, update all six package versions together. Update the exact
`@stages/core` dependency in `dom`, `react`, `vue`, `angular`, and `test-kit` in the same commit.
Prereleases use SemVer identifiers such as `1.0.0-alpha.1` or `1.0.0-rc.1`.

Run `npm run release:check:v1` after the version change. The packed verifier
rejects version skew and non-exact internal dependencies.

## Registry dry run and publication

After the local/CI gate passes, inspect registry-facing output without
publishing:

```sh
npm publish --dry-run ./packages/core
npm publish --dry-run ./packages/dom
npm publish --dry-run ./packages/react
npm publish --dry-run ./packages/vue
npm publish --dry-run ./packages/angular
npm publish --dry-run ./packages/test-kit
```

Publishing is an explicit maintainer operation. Publish core first, then DOM,
React, Vue, Angular, and test-kit. Use the `next` dist-tag for alpha/RC versions; reserve
`latest` for the accepted stable release. Confirm package pages, provenance,
README links, and installation from a clean external project before creating
the matching Git tag and release notes.

Never overwrite a published version. If a candidate is faulty, deprecate it
with a useful message, fix forward under a new prerelease version, and rerun
the entire gate.

## Stable v1 promotion

Promote `1.0.0` only when the architecture acceptance criteria are satisfied,
the active applications remain on the v1 boundary, accessibility coverage is
accepted, and at least one release candidate has been exercised by real
consumers. Update the API and migration documents whenever a public contract
changes during prerelease feedback.

Use `V1_ACCEPTANCE_REVIEW.md` as the criterion ledger. The automated state in
that document does not replace the external-consumer exercise or maintainer
approval.
