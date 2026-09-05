# Test data and runtime persistence

Studio Test mode uses named scenarios instead of anonymous snapshots. A
scenario owns its editable name, domain value, context, registered extension
values, and deterministic async-service fixtures. Selecting or resetting a
scenario creates a fresh controller session, so touched/visited state, revealed
issues, active wizard stages, and generated collection row keys return to that
scenario's starting point.

The editor owns one `createStudioCompilerSession()` instance. It retains only
the most recent compilation and reuses that result for equivalent immutable
form, fragment, and localization inputs in the same trusted service-binding
environment. Selection and panel changes reuse the result without compiling.
Equivalent recompilation therefore retains controller identity, touched/visited
state, wizard position, row keys, outstanding owner proposals, and in-flight
validation. It does not accept a pending proposal.

Replace the trusted binding registry when its implementations change. Compiler
sessions must not be shared between independent owners, and inputs must not be
mutated in place. Changed document content, localization, or binding identity
invalidates the cached compilation. This initial cache does not yet reuse
individual behavior definitions across real edits: those edits retain the
existing preview update/recreation policy. Calling `compileStudioForm()` directly
still performs a fresh compilation. Scenario selection and explicit reset
continue to create intentionally fresh controller sessions.

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

- `studio/src/compiler/session.ts` and `session.test.ts`
- `studio/components/StudioEditorPage.test.jsx`

- `studio/src/registry/codecs.ts` and `codecs.test.ts`
- `studio/src/runtime/preview-host.ts` and `preview-host.test.tsx`
- `studio/components/v1/StudioV1Editor.tsx` and `StudioV1Editor.test.tsx`
