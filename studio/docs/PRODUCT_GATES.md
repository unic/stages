# Stages Studio product gates

Status: Accepted initial targets for the local-first beta

Date: 2026-09-04

These gates make Session 02 decisions explicit. They may be tightened with
measured evidence, but relaxing one requires a recorded decision and migration
or compatibility analysis where user data is affected.

## Product boundary

The current milestone is a local-first editor. It includes project authoring,
accurate v1 preview, diagnostics, local recovery, named scenarios, legacy
import, portable project export, and readable v1 TypeScript/React exports.

Accounts, organizations, permissions, remote repositories, hosted form URLs,
submission storage, review workflows, deployment, audit, marketplace loading,
and real-time collaboration are the named hosted-product backlog. They must not
enter the document, compiler, or core runtime during the local beta.

## Supported browsers

The beta supports the latest two stable major versions of Chrome, Edge, and
Firefox, plus Safari 17 and newer on supported Apple platforms. Mobile browsers
may run form preview, but the authoring workbench is a desktop/tablet-landscape
product for the beta. Browser support is verified at release time; an old
browser must receive an explicit unsupported message rather than silent data
loss.

IndexedDB, structured cloning, `crypto.randomUUID`, ES modules, and modern CSS
are baseline capabilities. Required fallbacks belong in platform adapters, not
the document or compiler.

## Accessibility target

The initial target is WCAG 2.2 Level AA for the authoring workbench and the
default preview components. Every essential action must have a keyboard path;
focus order, focus restoration, accessible names, status announcements,
reduced motion, 200% zoom, and reflow are release criteria.

Automated checks are necessary but insufficient. Gate D requires documented
manual keyboard and screen-reader passes on at least one macOS/Safari/VoiceOver
combination and one Windows/Edge/NVDA combination.

## Data-loss and recovery policy

- A command is accepted into in-memory history synchronously or rejected with
  a visible error.
- Autosave targets no more than two seconds of accepted document edits at risk
  after an abrupt browser/process loss.
- Lifecycle flushes attempt to persist pending edits, but the UI never claims a
  save until the repository confirms it.
- Save failure, quota exhaustion, corruption, and revision conflict are visible
  and keep the last confirmed revision recoverable.
- Migration, import replacement, destructive refactors, and deletion create or
  preserve a recoverable copy before the sole current copy can be overwritten.
- At least three confirmed local backup revisions are retained per project;
  backup rotation never deletes the active confirmed revision.
- Project deletion requires confirmation and remains recoverable until the user
  explicitly empties Studio recovery data.

## Initial project-size target

The supported beta target is:

- 1,000 editable nodes in an active form;
- 10,000 editable nodes across a project;
- 50 forms, 100 fragments, and 50 named scenarios per form;
- maximum normalized graph depth of 50; and
- 5 MiB for decoded portable project JSON, excluding separately managed binary
  assets.

Session 04 must enforce defensive parser limits at or above these supported
targets. Session 30 will replace hardware-sensitive timings with measured
budgets while retaining deterministic work-count and render-count assertions.

## Local publication semantics

Before a backend exists, **Publish** means creating an immutable local release
snapshot and exportable artifact manifest. It does not upload data, create a
hosted URL, collect responses, or imply third-party availability.

Publication is blocked by document/compiler errors, unresolved trusted
bindings, incompatible schema migrations, or failing required contract
scenarios. A release snapshot records the project revision, form schema IDs and
versions, compiler/exporter versions, artifact hashes, and diagnostic summary.
Publishing never overwrites an earlier release snapshot.

The POC draft/published/archived controls remain importer-only presentation and
do not define this workflow.

## Routing gate

The existing Pages Router remains through the Sessions 03–09 vertical slice.
No routing migration, URL redesign, or application-shell rewrite is required
for Gate A. Domain modules cannot depend on either Next.js router.

## Gate A exit checklist

- [x] Legacy behavior inventory and frozen migration fixtures exist.
- [x] Foundational architecture decisions are accepted.
- [x] Local-beta and hosted-product boundaries are named.
- [x] Browser, accessibility, data-loss, project-size, publication, and routing
  decisions are explicit.
- [x] Strict TypeScript module boundaries run in CI.
- [ ] Document v1 and its migration policy are reviewed.

The remaining Gate A work belongs to Sessions 03 and 04.
