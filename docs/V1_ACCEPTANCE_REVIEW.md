# Stages v1 acceptance review

Status: all architecture criteria automated; external RC exercise pending

This ledger turns the eighteen acceptance criteria in the architecture plan
into a stable review surface. `npm run check:acceptance:v1` verifies that every
row still matches its architecture criterion, that its cited evidence exists,
that package sources contain no explicit `any` or TypeScript-checking bypass,
and that core remains dependency-, framework-, and browser-global-free.

| ID | State | Primary executable evidence |
| --- | --- | --- |
| AC-01 | Automated | Core manifest and packed-package verification |
| AC-02 | Automated | Packed Node consumer imports all five packages without browser globals |
| AC-03 | Automated | Strict package builds and source escape-hatch audit |
| AC-04 | Automated | Exhaustive structural permutation and deep-tree test |
| AC-05 | Automated | Frozen-schema and seeded immutable-operation tests |
| AC-06 | Automated | Dynamic resolver test and legacy demo replacement map |
| AC-07 | Automated | Dynamic factory reconciliation and identity tests |
| AC-08 | Automated | Transaction property tests and evaluation budgets |
| AC-09 | Automated | One-hundred-event batch regression test |
| AC-10 | Automated | Selector structural-sharing and fan-out budget tests |
| AC-11 | Automated | Controller isolation regression test |
| AC-12 | Automated | Async cancellation, rejection, and stale-result tests |
| AC-13 | Automated | Full-form and wizard validation state matrix |
| AC-14 | Automated | Strict JSON failure and custom-codec round-trip tests |
| AC-15 | Automated | Durable recreation, wizard location, and row identity tests |
| AC-16 | Automated | DOM, React, and Vue opaque custom-view tests |
| AC-17 | Automated | DOM, React, Vue, and Angular-style adapter proofs |
| AC-18 | Automated | Executable 0.x API and migration inventory |

## Promotion evidence still requiring maintainers

The architecture criteria above are necessary but do not by themselves
authorize publication. Stable promotion still requires a selected, immutable
RC version to be installed by at least one real external consumer and reviewed
by maintainers. Record that exercise in the release checklist before promoting
the same artifacts to `1.0.0`; a repository-local fixture must not be presented
as external adoption.
