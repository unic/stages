# Reusable fragments

Status: implemented

Date: 2026-09-05

Reusable fragments keep repeated authoring structure in Studio without adding
a fieldset registry to the Stages runtime. Use one when several forms or form
locations should follow the same structural definition.

## Authoring workflow

Select contiguous sibling nodes and choose **Create fragment from selection**
in Layers, Insert, or the selection’s context menu.
Studio moves those subtrees into a versioned definition and replaces them with
a linked instance that has its own runtime ID. The fragment list in Layers and the Insert palette can insert additional
instances inside a selected group, collection, stage, or variant, or after a
selected item. With no suitable selection, insertion uses the form root.
Canvas insertion menus also offer saved fragments at the chosen location.

Choose **Edit** beside a fragment in Layers or **Edit shared contents** on a
linked instance to open its shared definition. Choose a **Shared item** to edit
its field or content properties, presentation, validation, logic, and supported
container settings using the ordinary inspector controls. Changes affect every
linked instance immediately. **Back to form** returns to the selected instance;
selecting a form item also leaves shared editing.

The linked-fragment inspector supports definition title renaming, per-instance
field-label overrides, and detachment. Clear an override to inherit the shared
label again. Existing
instance and definition-node runtime IDs are read-only until the reference and
value-migration workflow is implemented. Ordinary node updates reject runtime-ID
changes, including changes to the effective ID through instance overrides, with
`command.runtime-id-refactor-required`. Label overrides remain supported.

Editing a definition is one immutable history command and affects all linked
instances. An override belongs only to its instance. Detach allocates new UIDs,
replaces the link with a local group and node copies, applies its overrides,
and leaves the shared definition and other instances unchanged. All workflows
participate in undo and redo.

## Compilation and failures

The compiler expands an instance below its local runtime ID, then emits only
ordinary Stages groups, fields, collections, wizards, stages, and variants.
Repeated uses consequently have independent runtime paths. Expansion is pure:
neither the form nor definition is modified.

Unresolved definitions and direct or indirect dependency cycles produce stable
diagnostics with definition/instance provenance. Document opening rejects the
same invalid resource graph. Clipboard payloads declare fragment dependencies;
a paste without the required resources is rejected before it changes the
document. Definitions remain separate JSON resources, so linked copies within
a project share their definition. Self-contained clipboard transfer between
separate projects is a later workflow: the current clipboard declares resource
UIDs and does not carry those definitions to a new project.

## Evidence

- `studio/src/document/document.test.ts`
- `studio/src/commands/commands.test.ts`
- `studio/src/compiler/compiler.test.ts`
- `studio/src/legacy/importer.test.ts`
- `studio/components/StudioEditorPage.test.jsx`
- ADR 0004 (compiler source maps)
