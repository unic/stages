---
name: stages-change-api
description: Change public Stages contracts with compatibility evidence. Use for exports, events, diagnostics, serialization, callback order, identity semantics, or adapter contracts.
---

# Change a Stages API

1. Classify the change as internal, additive, or breaking.
2. Use `$stages-find-context` for the declaration, runtime and type tests, guide, reference, and checked example.
3. Change implementation and compile-time contract together.
4. Add observable runtime tests.
5. Update the package README, guide/reference pages, checked examples, and coverage manifest when applicable.
6. Run `node scripts/agent/public-api-report.mjs --update` and review every report diff.
7. For breaking behavior, update migration guidance and add an old-state serialization fixture or explicit migration.
8. Run `npm run verify:packages:v1` and `$stages-verify-change release`.

Treat event names, diagnostic codes, serialized envelopes, callback ordering, and identity semantics as public contracts. Use [the compatibility checklist](references/compatibility-checklist.md) during review.
