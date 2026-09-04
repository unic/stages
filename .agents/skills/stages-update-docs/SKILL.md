---
name: stages-update-docs
description: Implement and verify a focused Stages documentation vertical slice. Use for guides, references, checked examples, navigation, coverage metadata, or documentation of a public behavior change.
---

# Update Stages documentation

1. Read [the contribution guide](../../../docs/content/project/contributing-to-docs.mdx).
2. Use `$stages-find-context` to locate existing evidence.
3. Update the task guide, normative reference, checked source region, evidence links, navigation metadata, and `docs/content/coverage-manifest.json` as one vertical slice where applicable.
4. Keep displayed code sourced from markers in `docs/examples/`; do not duplicate snippets inline.
5. Confirm prose against declarations and executable tests.
6. Run `npm run check:docs:v1`.
7. Also run `npm --prefix docs run build` for MDX, components, navigation, or configuration changes.

Do not read or reproduce the complete documentation corpus when a focused slice is sufficient.
