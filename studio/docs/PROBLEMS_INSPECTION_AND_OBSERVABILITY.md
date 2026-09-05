# Problems, inspection, and observability

Studio combines compiler and live runtime diagnostics in one Problems surface.
Authors can filter by source, severity, form, or entity and group by any of the
same dimensions. Each problem retains its document property path and runtime
path/address. Activating it reveals the owning outline node, highlights the
same canvas entity, opens its inspector, and identifies the relevant property.

Collection variants may share a runtime path without sharing a Studio UID.
Compilation retains all candidate entries with their enclosing collection
paths, discriminator properties, and variant IDs. Runtime diagnostic translation
and validation inspection resolve the candidate from the row's accepted value,
including nested collections. They retain fragment definition and instance
provenance and do not evaluate expressions or accept pending proposals.

Static UID lookups contain only unqualified, unambiguous entries. If an occurrence
cannot be identified uniquely, its diagnostic keeps the runtime path/address
but has no entity navigation target. This also applies to synchronous callbacks
during envelope restoration, before decoded values are available; diagnostics
read from the resulting snapshot resolve against the restored values.
Submitted data paths, row addresses, and serialized envelopes are unchanged.

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

- `studio/src/compiler/source-map.ts` and `types.ts`
- `studio/src/runtime/diagnostics.test.ts`
- `studio/src/validation/inspection.ts`

- `studio/src/runtime/observability.ts` and `observability.test.ts`
- `studio/src/runtime/preview-host.ts` and `preview-host.test.tsx`
- `studio/components/v1/StudioV1Editor.tsx` and `StudioV1Editor.test.tsx`
