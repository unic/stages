# Legacy Studio POC baseline

This inventory freezes the migration input for Session 01 of the Studio v1
roadmap. It describes the editor in `components/` as observed on 2026-09-04;
it is not a design contract for the v1-native replacement.

## Visible behavior inventory

| Surface | Current behavior | Disposition |
| --- | --- | --- |
| Form setup | Clear the form or load Demo, Templating, Layout, Interface State, and Kitchensink templates | Importer-only for legacy templates; retain create/reset as project commands |
| Field insertion | Insert text, textarea, select, multiselect, calendar, checkbox, switch, number, rating, buttons, slider, toggle, editor, chips, color, mask, and password fields | Retain through the typed authoring registry |
| Structure insertion | Insert groups, collections, wizards, stages, dividers, headings, messages, and saved fieldsets | Retain; redesign as UID-based commands and separate presentation blocks |
| Structure editing | Cut, copy, paste, group, ungroup, create collection, convert among group/collection/wizard, move up/down/top/bottom, and pointer drag | Retain through one command engine; redesign invalid-placement handling and keyboard parity |
| Reuse | Create a fieldset, insert local/global fieldsets, edit linked fieldsets, and disconnect an instance | Redesign as explicit fragments; both observed encodings remain importer fixtures |
| Selection | Select by dotted path, shift-toggle multiple paths, search by path, and clear selection after destructive edits | Retain interaction intent; redesign identity around immutable UIDs |
| Inspector | Edit form metadata, field/container IDs and props, bulk common props, width per preview size, labels, headings, and messages | Retain; redesign from registry metadata with command-backed commits |
| Preview | Toggle design/preview, switch desktop/tablet/mobile width, edit controlled values, navigate wizards, and manipulate collection rows | Retain; redesign around a long-lived explicitly controlled v1 preview host |
| Data | Inspect current data, take anonymous snapshots, restore/remove snapshots, and show form data in editor controls | Redesign as named scenarios with a separate history |
| History | Undo/redo `currentConfig` snapshots, branch after undo, deduplicate equal snapshots, cap at 25 | Redesign as labeled transactional history; current fieldset and inline property edits are not consistently included |
| Clipboard/path | Copy a dotted data path and keep copied config in the persisted store | Retain copy/paste intent; redesign clipboard dependency handling and make clipboard session-local |
| Export | Download only `currentConfig` as `stages-config.json` with MIME type `text/json` | Importer-only format; replace with Studio project and v1 artifact exports |
| Persistence | Manually rehydrate one unversioned `stages-studio-storage-0.1` local-storage record | Importer-only; replace with a versioned repository and recovery flow |
| Publishing shell | Display draft/published/archived controls and URL-like owner/slug text | Retire until the hosted-product milestone defines real services |

## Persisted state inventory

Zustand currently serializes all non-function store properties into the single
local-storage record. The persisted keys are:

`data`, `snapshots`, `isEditMode`, `editorTabIndex`, `selectedElement`,
`activeContextMenuInput`, `clipboard`, `currentConfig`, `generalConfig`,
`activeStep`, `undoData`, `activeUndoIndex`, `previewSize`, and `fieldsets`.

This mixes durable document input, preview data, history, clipboard contents,
selection, panel state, and display size. Hydration and persistence
characterization tests intentionally preserve that fact for the later importer.

## Known compatibility facts

- The five shipped templates are fingerprinted in
  `components/configTemplates/legacyFixtures.test.js`.
- The converter-style fieldset encoding is `{ type: "fieldset", fieldset:
  "address" }`.
- The live POC insertion path instead emits `{ type: "address" }`, where the
  type is the fieldset ID. Both are frozen fixtures.
- Some inspector and width edits update `currentConfig` directly and therefore
  bypass `updateCurrentConfig` history.
- Fieldset definition edits do not participate in `currentConfig` history.
- Legacy visibility and computed-value strings are executable JavaScript in the
  converter. The importer converts the supported subset to a safe AST and keeps
  unsupported source only as inert, error-producing migration metadata; no
  imported source enters executable document behavior.

## Reference baseline

Reference machine: local developer machine, Node 24.15.0, macOS, warm
dependency cache, 2026-09-04.

| Check | Observed result |
| --- | --- |
| `npm --prefix studio run test:v1` before Session 01 additions | 26 tests (7 Node + 19 Vitest), 2.31 s wall time on Node 24.13.0 |
| `npm --prefix studio run test:v1` after Session 01 additions | 39 tests (7 Node + 32 Vitest), 1.59 s Vitest-reported duration |
| 1,000-field legacy conversion | 2.67 ms |
| 1,000-field editor canvas React render | 793.97 ms |

Run `npm --prefix studio run bench:legacy -- --reporter=verbose` to refresh the
machine-dependent benchmark observations; the command deliberately enforces no
CI threshold yet.

Session 02 should ratify supported hardware/browsers and turn suitable work
counts or timing ranges into explicit budgets.
