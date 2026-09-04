# Studio guidance

Studio is a v1 consumer with a deliberate 0.x configuration converter.

- Do not bypass the converter by importing root 0.x runtime code.
- Preserve converter immutability, diagnostics, and presentation-key behavior.
- Run `npm run doctor` for React component changes and resolve new errors before handoff.
- Run `npm --prefix studio run test:v1` for component, store, or converter changes.
- Also run `npm --prefix studio run build` for routing, Next.js integration, or configuration changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
