The best setup here is a three-layer system:

1. Small, durable `AGENTS.md` files for invariants.
2. Focused repo skills under `.agents/skills/` for repeatable workflows.
3. Deterministic scripts and CI for rules that must never depend on an agent remembering them.

`AGENTS.md` is the supported filename—the singular `AGENT.md` is not discovered by default. Codex loads root-to-current-directory guidance once per session, so essential rules must remain in the root file; nested files should only add specialized detail. [Official AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

## Repository findings

The current baseline is healthy:

- The working tree is clean.
- Only [docs/AGENTS.md](/Users/fredibach/Projects/stages/docs/AGENTS.md) exists, containing an auto-generated Next.js rule.
- There are no repository skills or GitHub workflows.
- Root `src/` is the historical React 0.x implementation; active v1 development is under `packages/`.
- Package tests import generated `dist/`, so running a test without rebuilding can produce false confidence.
- Documentation is unusually comprehensive: 131 checked pages and a machine-readable public API coverage manifest.
- Existing gates pass:
  - `npm run check:v1`: about 11 seconds
  - `npm run test:v1`: about 3 seconds, 88 tests
  - Studio tests: about 2.4 seconds
  - `npm run release:check:v1`: about 28 seconds, including builds and E2E

Because the complete gate is already inexpensive, local agents should use targeted tests for feedback, while CI should always run the complete release gate.

## Proposed file structure

```text
AGENTS.md
src/AGENTS.md
packages/AGENTS.md
packages/core/AGENTS.md
examples/AGENTS.md
examples/shared/event-launch/AGENTS.md
studio/AGENTS.md
docs/AGENTS.md

.agents/skills/
  stages-find-context/
    SKILL.md
    agents/openai.yaml
    scripts/locate.mjs
    references/topic-map.md

  stages-verify-change/
    SKILL.md
    agents/openai.yaml

  stages-change-api/
    SKILL.md
    agents/openai.yaml
    references/compatibility-checklist.md

  stages-update-docs/
    SKILL.md
    agents/openai.yaml

  stages-prepare-release/
    SKILL.md
    agents/openai.yaml

scripts/agent/
  impact-map.mjs
  verify-changed.mjs
  validate-setup.mjs
  public-api-report.mjs
  impact-map.test.mjs
  validate-setup.test.mjs

contracts/public-api/
  core.api.json
  dom.api.json
  react.api.json
  vue.api.json
  angular.api.json
  test-kit.api.json

.github/workflows/
  ci.yml
```

Codex discovers checked-in skills from `.agents/skills`. Only skill names and descriptions occupy initial context; the full instructions load when invoked, making this appropriate for token-efficient workflows. [Official skill guidance](https://learn.chatgpt.com/docs/build-skills)

## What each `AGENTS.md` should contain

### Root `AGENTS.md`

Keep it below roughly 3 KB. It should contain only rules that matter across the repository:

- v1 is the default development target.
- Root `src/` and the root package manifest still represent 0.x; do not edit them for v1 tasks.
- `demo/` is retired and must remain retired.
- Before editing a subtree, read its nearest nested `AGENTS.md`.
- Use evidence in this order:
  1. exported TypeScript declarations;
  2. executable tests;
  3. production examples;
  4. architecture documents;
  5. existing prose.
- Do not edit generated `dist/`, `.next/`, `out/`, coverage, or Playwright output.
- Do not run package tests against stale `dist/`; use `$stages-verify-change`.
- Public behavior changes require runtime tests, compile-time contracts, docs, coverage metadata, and package-consumer verification.
- Never add dependencies or change lockfiles incidentally.
- Preserve the user’s existing working-tree changes.
- Use Node `24.15.0` from `.nvmrc`.
- Run the full release gate for public API, serialization, manifests, package metadata, framework contracts, or release work.

Add three semantic code-review rules:

- Flag changes that weaken controlled-value proposal/acceptance semantics.
- Flag public contract changes without compatibility evidence and documentation.
- Flag core imports of framework, browser, or runtime dependencies.

### `src/AGENTS.md`

A very short legacy boundary:

- This subtree is React Stages 0.x.
- Modify it only when the task explicitly concerns 0.x.
- Do not copy v1 APIs into it or make v1 applications import it.
- Use the root legacy build as the current minimum check.

### `packages/AGENTS.md`

Shared package rules:

- `src/` is authoritative; `dist/` is generated.
- Strict TypeScript remains enabled; no `any`, `@ts-ignore`, or `@ts-nocheck`.
- All packages remain ESM-only, side-effect-free, and version-aligned.
- Non-core packages depend on the exact matching `@stages/core` version.
- Test dependency closures: build core before an adapter; build before executing `.mjs` tests.
- Package export changes are public API changes.
- Adapter behavior must remain expressible through the shared controller contract.

Include a compact adapter-specific matrix:

| Package | Preserve |
|---|---|
| DOM | Accessible relationships, focus behavior, no framework dependency |
| React | Strict Mode lifecycle and deferred destruction |
| Vue | Scope destruction, reactive selector behavior |
| Angular | Signals, strict templates, partial compilation |
| test-kit | Framework-neutral adapter contract |

### `packages/core/AGENTS.md`

Encode the architectural invariants most likely to be broken:

- Zero runtime dependencies and no DOM/framework globals.
- Controlled values remain proposals until owner acceptance.
- No mutation of values or schema; unchanged branches retain identity.
- No module-global controller state.
- One evaluation per transaction where currently guaranteed.
- Async validation must support cancellation and stale-result suppression.
- Invalid dynamic schema revisions retain the previous valid tree.
- Row identity, wizard location, and durable interaction state survive serialization.
- Persisted format changes require old-state fixtures or an explicit migration.
- Performance and selector fan-out budgets cannot regress silently.

### `examples/AGENTS.md`

- The Event Launch example is the canonical cross-framework domain.
- Shared behavior belongs in `examples/shared/event-launch`, not duplicated in framework apps.
- Framework examples should stay behaviorally equivalent.
- Framework-specific UI changes require that adapter’s build and E2E project.
- Changes to shared contracts require all example builds and all-adapter E2E.

### `examples/shared/event-launch/AGENTS.md`

- Treat schemas, fixtures, validators, persistence, and field contracts as shared public examples.
- Avoid framework imports.
- Update behavior-contract tests before propagating changes to adapters.
- Preserve fixture determinism and serialization compatibility.

### `docs/AGENTS.md`

Extend the existing file without removing the Next.js-generated block:

- Point agents to `project/contributing-to-docs.mdx`.
- Require a vertical slice: guide, normative reference, checked example, evidence links, and coverage manifest.
- Displayed code must come from checked source markers.
- Prose cannot promise behavior that declarations and tests do not establish.
- Run docs checking for every docs change; run the production docs build for MDX, components, navigation, or configuration.

Keep [docs/CLAUDE.md](/Users/fredibach/Projects/stages/docs/CLAUDE.md) as the existing compatibility shim.

### `studio/AGENTS.md`

- Studio is a v1 consumer with a deliberate 0.x configuration converter.
- Do not bypass the converter by importing root 0.x runtime code.
- Preserve converter immutability, diagnostics, and presentation-key behavior.
- Run Studio tests for component/store/converter work and the production build for routing or Next.js work.

## Dedicated skills

### `$stages-find-context`

Purpose: retrieve the smallest authoritative context for a topic or symbol.

Examples:

```text
$stages-find-context StagesController.update
$stages-find-context async validation cancellation
$stages-find-context packages/react/src/index.tsx
```

`locate.mjs` should derive results from `docs/content/coverage-manifest.json`. For a public symbol it should return:

- defining entry point;
- focused runtime and type tests;
- task-oriented guide;
- normative reference and anchor;
- checked example.

It should return paths and headings only—never dump entire documents. Limit normal output to approximately six files. `topic-map.md` should cover only information absent from the manifest: architecture, legacy migration, Studio, examples, and releases.

### `$stages-verify-change`

Purpose: plan and run the minimum safe verification for changed files.

Modes:

```text
$stages-verify-change plan
$stages-verify-change focused
$stages-verify-change change
$stages-verify-change release
```

Behavior:

- `plan` prints commands without executing.
- `focused` rebuilds the affected dependency closure, then runs focused tests.
- `change` runs the complete impact-matrix selection.
- `release` delegates to `npm run release:check:v1`.
- Capture successful command output and show only concise summaries.
- On failure, show the relevant tail and retain the full log in a temporary file.
- Compare tracked working-tree status before and after verification and warn about unexpected mutations.
- Unknown paths must fall back to `check:v1` plus `test:v1`, never to no tests.

### `$stages-change-api`

Purpose: handle additions, removals, or behavioral changes to public contracts.

Workflow:

1. Classify the change as internal, additive, or breaking.
2. Locate the current declaration, tests, docs, and examples.
3. Change implementation and compile-time contract together.
4. Add observable runtime tests.
5. Update package README, guide/reference pages, and coverage manifest where applicable.
6. Regenerate and review the public API report.
7. For breaking behavior, update migration guidance and serialization fixtures.
8. Run the packed-consumer verifier and full release gate.

This skill should treat event names, diagnostic codes, serialized envelopes, callback ordering, and identity semantics as public contracts even when they are not obvious exported functions.

### `$stages-update-docs`

Purpose: implement one documentation vertical slice without reading the entire docs tree.

It should point to the existing contributing guide, use `$stages-find-context`, and enforce:

- checked source regions;
- navigation metadata;
- coverage-manifest synchronization;
- evidence links;
- `npm run check:docs:v1`;
- production docs build when needed.

It should not duplicate the 131-page documentation corpus into skill references.

### `$stages-prepare-release`

Purpose: validate release-candidate preparation.

Set `allow_implicit_invocation: false` in `agents/openai.yaml` so expensive or publication-adjacent behavior requires explicit invocation.

It should:

- read `V1_RELEASE_CHECKLIST.md`;
- verify six-package version alignment;
- inspect public API report changes;
- run the full release gate;
- perform dry-run packaging when requested;
- never publish, tag, or push without explicit authorization.

## Deterministic verification matrix

The impact mapper should encode and test this policy:

| Changed area | Local change-level verification |
|---|---|
| `packages/core/src/**` | Core build/typecheck/tests; escalate to all packages, docs, examples for public or structural files |
| Adapter `src/**` | Core + adapter build, adapter typecheck/test, matching example build and E2E |
| `packages/test-kit/**` | Core/test-kit build and all adapter contract tests |
| `examples/shared/**` | Shared contract tests, all example builds, all-adapter E2E |
| One framework example | That example’s build/typecheck and matching E2E project |
| `docs/content/**`, `docs/examples/**` | Docs checker; production docs build for MDX/navigation/components |
| `studio/components/**` | Studio tests; production build for integration/routing changes |
| Package manifests, lockfiles, TS configs, root scripts | `check:v1`, `test:v1`, and package verification |
| Package versions or exports | Public API check and full release gate |
| `src/**` | Legacy root build; do not infer v1 work |
| Unknown/new source directory | Safe fallback: `check:v1` and `test:v1` |

The mapper needs tests proving that representative paths produce the expected commands. It should also fail when a new package or example directory appears without a mapping rule.

## Compatibility protection

Add two protections beyond instructions.

First, generate canonical API reports from emitted declarations using the installed TypeScript compiler API. `public-api-report.mjs` should have:

```text
--check    Fail when emitted public API differs from checked-in reports
--update   Deliberately regenerate reports
```

This turns accidental signature changes into visible diffs. An intentional update must travel with relevant tests and docs.

Second, add serialized-state fixtures under `packages/core/test/fixtures/serialized/`. Every previously accepted format should either:

- continue to load; or
- have a tested, ordered migration.

This is especially important because serialization format, row identity, validation reveal state, and wizard location can break consumers without producing TypeScript errors.

## Mechanical validation and CI

`validate-setup.mjs` should check:

- expected `AGENTS.md` files exist;
- no accidental `AGENT.md` files exist;
- skill folder names match frontmatter names;
- descriptions are concise and unique;
- every referenced file and package script exists;
- skill bodies remain below an agreed size;
- impact-map tests cover every active package and application;
- generated directories are never referenced as editable source.

Add two root scripts:

```json
{
  "check:agent-setup": "node --test scripts/agent/*.test.mjs && node scripts/agent/validate-setup.mjs",
  "verify:changed": "node scripts/agent/verify-changed.mjs"
}
```

CI should always run:

1. locked installations for root, Studio, docs, shared example, framework examples, and E2E;
2. `npm run check:agent-setup`;
3. `npm run release:check:v1`.

The local impact mapper optimizes feedback; the full CI gate ensures an incorrect future mapping cannot allow an incompatible change through.

## Implementation order

1. Add and test the impact mapper and setup validator.
2. Add the public API report and serialization compatibility fixtures.
3. Add root and nested `AGENTS.md` files.
4. Scaffold the five skills with the standard skill initializer.
5. Validate each skill and its referenced commands.
6. Add package scripts and CI.
7. Test instruction discovery from the repository root, `packages/core`, `docs`, and `studio`.
8. Exercise every skill with positive, indirect, negative, and incomplete prompts.
9. Introduce controlled test failures to confirm each impact path catches the expected regression.
10. Run `npm run release:check:v1` and confirm the tracked working tree remains clean.

## Definition of done

The setup is complete when:

- Agents can find relevant source, test, and documentation context without reading large umbrella documents.
- Focused tests can never execute against stale builds.
- Every active subtree maps to a verification policy.
- Public API or serialization drift fails mechanically.
- Root-v1 versus legacy-0.x confusion is explicitly prevented.
- Skills and instructions validate in CI.
- The complete existing release gate still passes.
- Successful verification produces concise output, while failures retain actionable diagnostics.
- No instruction or skill duplicates facts already maintained in source, tests, or documentation.

No repository files were changed during this planning pass.