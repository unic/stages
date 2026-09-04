# Event Launch — Angular

The standalone Angular v22 signals implementation of the canonical Event
Launch workflow.

- `src/event-launch-app.ts` — `injectStages()`, collection/wizard signals,
  strict control-flow templates, persistence controls, and teardown
- `src/fields.ts` — typed dynamic field components used by
  `StagesFieldComponent`
- `../shared/event-launch` — framework-neutral domain behavior and shared CSS

From the repository root:

```sh
npm run build:v1
npm --prefix examples/angular run dev
```

`npm run build:examples:v1` runs Angular's strict template compiler as part of
the four-adapter build.
