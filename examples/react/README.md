# Event Launch — React

The React implementation of the canonical Event Launch workflow. The product
behavior is shared with the DOM, Vue, and Angular examples; this application
owns only React composition, field components, focus, and lifecycle policy.

- `src/EventLaunchApp.tsx` — controlled `useStages()`, selector-backed
  collection/wizard hooks, navigation, save/resume, and inspector chrome
- `src/fields.tsx` — the six typed, application-owned React field views
- `../shared/event-launch` — framework-neutral model, schema, validators,
  fixtures, persistence helpers, and visual language
- `test/strict-mode.test.mjs` — Strict Mode replay and teardown coverage

From the repository root:

```sh
npm run build:v1
npm --prefix examples/react run dev
npm --prefix examples/react test
```

Browser storage, publishing, and routing are application policies composed
around Stages; the core controller does not claim ownership of them.
