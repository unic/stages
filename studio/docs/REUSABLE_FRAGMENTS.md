# Reusable fragments

Status: implemented for Session 15

Date: 2026-09-04

Reusable fragments keep repeated authoring structure in Studio without adding
a fieldset registry to the Stages runtime. Use one when several forms or form
locations should follow the same structural definition.

## Authoring workflow

Select contiguous sibling nodes and choose **Create fragment from selection**.
Studio moves those subtrees into a versioned definition and replaces them with
a linked instance that has its own runtime ID. The fragment palette can insert
additional instances. The linked-fragment inspector supports definition
renaming, definition-node editing, per-instance field-label overrides, and
detachment.

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
document.

## Evidence

- `studio/src/document/document.test.ts`
- `studio/src/commands/commands.test.ts`
- `studio/src/compiler/compiler.test.ts`
- `studio/src/legacy/importer.test.ts`
- `studio/components/StudioEditorPage.test.jsx`
- ADR 0004 (compiler source maps)
