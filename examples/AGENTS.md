# V1 example guidance

- Event Launch is the canonical cross-framework domain.
- Shared behavior belongs in `examples/shared/event-launch`, not duplicated in framework applications.
- Keep framework examples behaviorally equivalent.
- Framework-specific UI changes require that adapter's build and matching E2E project.
- Shared contract changes require shared tests, every example build, and all-adapter E2E.
