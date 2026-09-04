---
name: stages-find-context
description: Locate authoritative Stages source, tests, guides, references, and checked examples for a symbol, topic, or path. Use before investigating or changing unfamiliar v1 behavior.
---

# Find Stages context

Run the locator from the repository root:

```sh
node .agents/skills/stages-find-context/scripts/locate.mjs "StagesController.update"
```

Read only the returned paths and headings first. Expand to adjacent material only when those results do not answer the task.

The locator derives public API results from `docs/content/coverage-manifest.json`. For architecture, legacy migration, Studio, examples, or releases, consult [the topic map](references/topic-map.md).

Prefer declarations, tests, examples, architecture documents, then prose. Never use generated `dist/` as source context.
