<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Stages documentation guidance

- Start with [the documentation contribution guide](content/project/contributing-to-docs.mdx).
- Implement documentation as a vertical slice: task guide, normative reference, checked example, evidence links, and synchronized coverage manifest.
- Displayed code must come from checked source markers; do not maintain a second inline copy.
- Prose cannot promise behavior that exported declarations and executable tests do not establish.
- Run `npm run check:docs:v1` for every documentation change.
- Also run `npm --prefix docs run build` for MDX, components, navigation, or configuration changes.
- Preserve `CLAUDE.md` as the existing compatibility shim.
