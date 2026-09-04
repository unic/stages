# Test data and runtime persistence

Studio Test mode uses named scenarios instead of anonymous snapshots. A
scenario owns its editable name, domain value, context, registered extension
values, and deterministic async-service fixtures. Selecting or resetting a
scenario creates a fresh controller session, so touched/visited state, revealed
issues, active wizard stages, and generated collection row keys return to that
scenario's starting point.

Form, stage, and data-path actions call the public `validate()` contract. They
use the same event and reveal behavior, while differing only in scope: the whole
form, a compiled stage address, or a canonical value path.

“Save runtime envelope” calls the controller serializer. The saved envelope is
not a Studio project document. It contains the accepted domain value and
baseline plus durable controller metadata: touched and visited addresses,
revealed validation addresses, active wizard stages, collection row keys, and
registered extension values. A pending controlled proposal is deliberately not
captured. Context, scenario service fixtures, editor selection, open panels,
browser state, credentials, and application state remain outside the envelope.

“Recreate preview” destroys the current controller and creates another from the
saved envelope. This demonstrates that accepted value, wizard position,
collection identity, interaction metadata, and codec-backed extensions survive
a real controller boundary rather than merely remaining in React state.

Executable codecs are trusted host code. `defineStudioCodecBindings()` resolves
value codecs by exact schema ID/version and extension codecs by exact
definition key/version. Documents contain only JSON-safe extension codec
references. The built-in preview binding supports JSON-safe values and the
declarative `json@1` extension codec; an application can inject different
bindings without placing functions, endpoints, or credentials in a project.

## Evidence

- `studio/src/registry/codecs.ts` and `codecs.test.ts`
- `studio/src/runtime/preview-host.ts` and `preview-host.test.tsx`
- `studio/components/v1/StudioV1Editor.tsx` and `StudioV1Editor.test.tsx`
