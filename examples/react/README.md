# React workspace wizard

A production-style Stages v1 example composed with React. It demonstrates:

- the controlled `useStages()` lifecycle;
- typed custom field views and `StagesField`;
- stable collection rows through `useStagesCollection()`;
- staged validation and `useStagesWizard()` navigation;
- accessible issue markup and application-owned error focus.

Build the v1 packages from the repository root, then install and run the example:

```sh
npm run build:v1
cd examples/react
npm install
npm run dev
```

The repository-level `npm run check:v1` command type-checks this example against
the built public declarations. Within this directory, `npm run build` verifies a
React 19 production consumer and `npm test` covers Strict Mode lifecycle replay.
