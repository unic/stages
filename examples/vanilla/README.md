# Vanilla DOM wizard

A production-style Stages v1 example using only `@stages/core` and
`@stages/dom`. It demonstrates the controlled-value handshake, wizard stages,
scoped validation, accessible issue output, first-error focus, and serialized
durable state.

Build the v1 packages from the repository root, then install and run the example:

```sh
npm run build:v1
cd examples/vanilla
npm install
npm run dev
```

The repository-level `npm run check:v1` command type-checks this example against
the built public declarations.
