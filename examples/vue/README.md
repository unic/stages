# Event Launch — Vue

The Vue 3 Composition API implementation of the canonical Event Launch
workflow shared with the other public adapters.

- `src/EventLaunchApp.ts` — controlled `useStages()` with a computed update
  source, wizard/collection composables, save/resume, and scope disposal
- `src/fields.ts` — six typed Vue functional field views
- `../shared/event-launch` — framework-neutral domain behavior and shared CSS

From the repository root:

```sh
npm run build:v1
npm --prefix examples/vue run dev
```

Local storage and the displayed publish payload deliberately remain
application-owned policies.
