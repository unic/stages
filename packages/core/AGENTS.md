# Core engine invariants

- Keep zero runtime dependencies and avoid DOM or framework globals.
- Controlled values remain proposals until the owner accepts them.
- Never mutate values or schemas; unchanged branches retain identity.
- Do not introduce module-global controller state.
- Preserve one evaluation per transaction where currently guaranteed.
- Async validation supports cooperative cancellation and suppresses stale results.
- Invalid dynamic schema revisions retain the previous valid tree.
- Row identity, wizard location, and durable interaction state survive serialization.
- Persisted format changes require fixtures for every old accepted state or an explicit ordered migration.
- Performance and selector fan-out budgets must not regress silently.
