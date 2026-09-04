# Event Launch — DOM / vanilla

The framework-free implementation of the canonical Event Launch workflow.

- `src/main.ts` — controlled controller ownership, `mountStages()`, snapshot-
  driven collection/wizard chrome, focus, persistence, and page-hide cleanup
- `src/fields.ts` — native DOM fields merged with custom textarea, choice, and
  money views
- `../shared/event-launch` — framework-neutral domain behavior and shared CSS

From the repository root:

```sh
npm run build:v1
npm --prefix examples/vanilla run dev
```

The DOM renderer uses stable row snapshots and addresses rather than deriving
identity from labels or array values.
