# Legacy demo retirement

The `react-stages` 0.x Next.js demo application was retired during the v1
migration. It depended on the incompatible 0.x render-prop API and duplicated
coverage that is now maintained as release-gated v1 examples and tests.

Use these active resources instead:

- [`examples/vanilla`](../examples/vanilla/README.md) for the native DOM adapter;
- [`examples/react`](../examples/react/README.md) for the React adapter;
- [`studio`](../studio) for the v1-backed visual editor;
- [`docs`](../docs) for the v1 documentation application;
- [`docs/LEGACY_DEMO_COVERAGE.md`](../docs/LEGACY_DEMO_COVERAGE.md) for the
  feature-by-feature replacement map.

The complete retired application remains available in Git history through the
commit preceding its removal. It is not installed, built, deployed, or treated
as a v1 compatibility surface.
