# Problems, inspection, and observability

Studio combines compiler and live runtime diagnostics in one Problems surface.
Authors can filter by source, severity, form, or entity and group by any of the
same dimensions. Each problem retains its document property path and runtime
path/address. Activating it reveals the owning outline node, highlights the
same canvas entity, opens its inspector, and identifies the relevant property.

Test mode exposes the live snapshot revision and accepted revision. A pending
controlled-value proposal makes the preview explicitly stale until its owner
accepts or rejects it. The runtime panel also shows the validation aggregate,
active wizard stages, collection row keys, and the last transaction's events
and ordered patches. Rejected navigation and other runtime diagnostics appear
in Problems without requiring developer tools.

The support-report action emits deterministic JSON containing project/form
identity, the runtime inspection, problems, and the latest transaction. Keys
commonly used for passwords, secrets, credentials, cookies, authorization,
sessions, tokens, and API keys are replaced with `[REDACTED]`. Reports are
still user-reviewed artifacts; integrations must not upload them implicitly.

Hosts may pass an optional `StudioTelemetryPort` to the preview host. The port
receives proposal/decision counts and diagnostic codes only. Studio never
passes domain values, event payloads, patches, context, extensions, or
credentials to telemetry, and no transport is built into the runtime.

## Evidence

- `studio/src/runtime/observability.ts` and `observability.test.ts`
- `studio/src/runtime/preview-host.ts` and `preview-host.test.tsx`
- `studio/components/v1/StudioV1Editor.tsx` and `StudioV1Editor.test.tsx`
