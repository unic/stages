# Async validation service bindings

Status: implemented for Session 19

Date: 2026-09-04

Async Studio validators contain only an ID, ordinary validation policies, a
versioned service reference, and an optional bounded expression that produces
the request value. They contain no executable code or transport configuration.

The compiler resolves `{ key, version }` against a trusted environment registry.
An unresolved or mismatched version produces
`compiler.unresolved-service-binding` and no malformed core validator. Real
applications define bindings with `defineStudioAsyncServiceBindings()`. The
binding closure owns its endpoint, credentials, authorization, timeout, retry,
cache, and telemetry policy; none of those values enter resolver execution or
the Studio project document.

Bindings receive the evaluated request value and core's validation context.
They bridge `validation.signal.onCancel()` to their transport and return either
`{ status: "success" }` or a safe failure presentation. Core remains responsible
for pending state, dependency invalidation, cancellation, and stale-result
suppression.

## Local preview scenarios

A named scenario may store deterministic mock responses under `services`, keyed
by service name. Supported outcomes are:

- `success`: resolves without issues on the next microtask;
- `failure`: resolves a configured issue on the next microtask;
- `pending`: remains pending until core cancels the run;
- `stale`: deliberately ignores cancellation and resolves late, proving that
  core suppresses the obsolete result; and
- `cancelled`: remains pending and cooperatively settles when core cancels it.

The preview binding performs no network work. Switching scenarios, changing a
declared dependency, replacing schema/context/extensions, resetting, or tearing
down the controller exercises the same public core cancellation contract used
by a production binding.

Document validation rejects endpoint, credential, retry, and cache properties
on validators and preview service fixtures. Arbitrary project resources are
still inert JSON; the compiler never treats them as integration configuration.

## Evidence

- `studio/src/registry/services.ts`
- `studio/src/validation/catalog.ts`
- `studio/src/validation/validation.test.ts`
- `studio/src/document/document.test.ts`
- ADR 0003 (safe expressions and trusted bindings)
