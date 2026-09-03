# Stages v1 API guide

Status: implemented alpha API

This guide describes the API currently implemented in the v1 packages. For
design rationale and delivery status, see
[`V1_ARCHITECTURE_PLAN.md`](./V1_ARCHITECTURE_PLAN.md). The v1 API is not
compatible with `react-stages` 0.x. Existing users should follow
[`MIGRATING_TO_V1.md`](./MIGRATING_TO_V1.md), which maps every legacy root
export and major runtime concept to its v1 disposition.

## Packages

| Package | Purpose | Runtime dependencies |
| --- | --- | --- |
| `@stages/core` | Schema, controller, events, validation, collections, and serialization | None |
| `@stages/dom` | Dependency-free renderer and native field definitions | `@stages/core` |
| `@stages/react` | React lifecycle and selector bindings | `@stages/core`; React is a peer |
| `@stages/test-kit` | Framework adapter contract harness | `@stages/core` |

All packages are ESM-only during the alpha and expose declarations through
their package export maps.

## Minimal controlled controller

```ts
import {
  stages,
  type FieldDefinition,
  type StagesController,
  type StagesSchema,
} from "@stages/core";

interface Value {
  name: string;
}

const text: FieldDefinition<string, { readonly label: string }, "text"> = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
};
const fields = { text } as const;
const schema = {
  id: "profile",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
} as const satisfies StagesSchema<Value, typeof fields>;

let controller: StagesController<Value, typeof fields>;
controller = stages({
  schema,
  fields,
  value: { name: "" },
  onChange({ value }) {
    // The owner accepts the proposal. It may instead reject or replace it.
    controller.update({ value });
  },
});

controller.dispatch({
  name: "input",
  target: { kind: "field", path: ["name"] },
  payload: "Ada",
});
```

`stages()` accepts either `value` for a new controller or `state` for recreation,
never both. Optional inputs include `context`, `onDiagnostic`, a value `codec`,
ordered `migrations`, and registered extension codecs/state.

## Controlled value and callback order

The controller never silently adopts a proposed value. Field reducers,
transforms, and collection commands build a proposal and call `onChange` once
per transaction. The owner accepts or replaces it with `update({ value })`.

Synchronous dispatches in the same JavaScript turn share one microtask
transaction. `batch(fn)` creates the same boundary explicitly.

Observable order is:

1. `dispatch()` resolves the target and accumulates immutable patches.
2. At flush, `onChange(change)` receives the proposed value, patches, source
   events, and transaction ID.
3. If `onChange` calls `update({ value })` synchronously, the general
   subscribers receive the accepted snapshot in the same publish.
4. General subscribers run before selector subscribers. A selector callback
   runs only when its selected value changes according to its equality function.

If acceptance is delayed, the proposal flush still produces one general
notification with the unchanged canonical value. A later `update({ value })`
produces another general notification and the affected selector callbacks.
Rejected proposals never become canonical.

`update()` can also replace `context`, `schema`, or registered extension state.
`destroy()` cancels pending validation, clears listeners, and makes later work
inert.

## Paths and addresses

```ts
type DataPath = readonly (string | number)[];
type NodeAddress = readonly (
  | { readonly kind: "node"; readonly id: string }
  | { readonly kind: "row"; readonly id: string }
)[];
```

A data path locates domain data, for example `['people', 1, 'email']`. A node
address locates durable engine identity, using stable row keys instead of array
indexes. Use paths for field events and value scopes; use addresses for
collection rows, containers, wizard navigation, and identity-bound metadata.

The core exports safe immutable helpers: `getAtPath`, `setAtPath`,
`removeAtPath`, `applyPatches`, `pathsEqual`, `isSafePathSegment`, and
`assertSafePath`. The segments `__proto__`, `prototype`, and `constructor` and
invalid numeric indexes are rejected.

## Schemas

A schema has a stable `id`, a positive integer `version`, and recursive `nodes`:

- `field`: a registered field type and optional static/derived props;
- `group`: nested `nodes` under an object path;
- `collection`: repeated homogeneous `nodes` or discriminated `variants`;
- `wizard`: nested `stages`, each containing recursive `nodes`.

Every structural ID contributes a data-path segment except a collection row,
which contributes its current numeric index. A wizard stage also contributes a
segment.

Schemas may be pure factories receiving the controlled `value`, external
`context`, and readonly controller `meta`. Nodes support `when`, `disabled`,
`deriveProps`, `transforms`, and `validators`. Invalid dynamic revisions publish
diagnostics and retain the previous valid normalized tree.

## Field registry and events

A field definition provides an adapter-owned opaque `view`, an optional initial
value, an optional event reducer, and optional reusable intrinsic validators.
Registry keys are the complete field-type vocabulary inferred by TypeScript.

```ts
interface StagesEvent<TPayload = unknown> {
  readonly name: string;
  readonly target:
    | { readonly kind: "field"; readonly path: DataPath }
    | { readonly kind: "node"; readonly address: NodeAddress }
    | { readonly kind: "form" };
  readonly payload?: TPayload;
  readonly source?: "user" | "adapter" | "system";
}
```

Names are open-ended. Implemented conventions include `input`, `focus`, `blur`,
`reset`, collection commands, and wizard navigation. Field reducers return a
new field value, patches, or `undefined`.

`fieldEvent`, `nodeEvent`, and `formEvent` construct correctly targeted events
while preserving inferred payload types:

```ts
controller.dispatch(fieldEvent("input", ["name"], {
  payload: "Ada",
  source: "adapter",
}));
controller.dispatch(nodeEvent("wizard:next", wizardAddress));
controller.dispatch(formEvent("submit", { source: "user" }));
```

The helpers do not close the event-name vocabulary or interpret custom
payloads. Standard collection and wizard payloads are still checked at the
controller boundary.

Transforms match event names and return immutable `set` or `remove` patches.
They run in deterministic target-to-root order: target, nearest ancestor through
farthest ancestor, then schema root. Later patches observe and can overwrite
earlier patches. Any reducer, transform, or patch failure rejects the event's
entire value transaction and emits a diagnostic.

## Collections

Target collection commands at the collection address, or target supported row
commands at a stable row address.

| Event | Payload |
| --- | --- |
| `collection:add` | `{ value?, index? }`; union collections use `{ variant, index? }` when no value is supplied |
| `collection:remove` | `{ index }`, or omit the index when targeting a row |
| `collection:replace` | `{ index, value }`, or `{ value }` when targeting a row |
| `collection:duplicate` | `{ index, toIndex? }`, or `{ toIndex? }` when targeting a row |
| `collection:move` | `{ from, to }`, or `{ to }` when targeting a row |
| `collection:sort` | `{ order: number[] }` containing every index exactly once |

`min` and `max` constraints reject commands without proposing a value. An
`itemKey(item, index)` function should be supplied when external owners reorder
or replace rows. Otherwise engine-owned keys follow accepted commands and are
serialized as metadata.

Collection snapshots expose `size`, `canAdd`, `canRemove`, and `row` branches.

## Wizards

Wizard state lives in controller metadata. Dispatch navigation to the wizard's
node address:

```ts
controller.dispatch({ name: "wizard:next", target: { kind: "node", address } });
controller.dispatch({ name: "wizard:previous", target: { kind: "node", address } });
controller.dispatch({ name: "wizard:go", target: { kind: "node", address }, payload: "review" });
```

`wizard:go` requires `navigation.nonLinear`. `navigation.validateCurrent` blocks
movement while the current stage is not valid. A pure `guard(value, from, to)`
can apply additional policy. Snapshots expose the active and visible stages,
per-stage validation, and `canPrevious`, `canNext`, and `canGo` capabilities.

## Validation

Validators have stable IDs, one or more triggering events, optional reveal
events, dependencies, applicability, and disabled-node policy. They return
structured issues synchronously or asynchronously.

```ts
const result = await controller.validate({
  scope: "form", // or { path } / { address }
  event: "submit",
  reveal: true,
});
```

Validation status is `unknown`, `pending`, `invalid`, or `valid`; `isValid` is
true only for `valid`. Execution and issue visibility are separate. Dependency
changes cancel and invalidate affected work. Superseded async results cannot
publish, and thrown or malformed results become deterministic rejection issues.
Disabled nodes participate only when the validator explicitly sets
`includeDisabled: true`.

Validator exceptions, rejected promises, and malformed results remain errors
with engine-owned IDs and paths. Applications may localize their presentation
without weakening that invariant:

```ts
const controller = stages({
  schema,
  fields,
  value,
  validationFailureIssue({ kind, validatorId, event, error }) {
    return {
      code: `validation.${kind}`,
      message: translate("validation.failed", { validatorId, event, error }),
      meta: { reportable: true },
    };
  },
});
```

The hook may customize `code`, `message`, and `meta`. Core always supplies the
failure `id`, exact node `path`, and `severity: "error"`. A hook that throws or
returns malformed presentation data produces the deterministic default issue
and a `validation.failure-issue-failed` diagnostic.

The validation cancellation signal exposes `aborted` and `onCancel(listener)`.
Use it to stop framework-neutral asynchronous work cooperatively.

## Snapshots and subscriptions

`getSnapshot()` returns canonical readonly value, revision, render nodes,
aggregate validation, and diagnostics. Field snapshots contain resolved value,
initial value, props, opaque view, data path, node address, interaction state,
and visible/all issues. Container snapshots contain recursive render nodes and
kind-specific collection, stage, or wizard metadata.

Use `subscribe(listener)` for whole-controller effects. Use
`subscribeSelector(selector, listener, isEqual?)` for narrow adapters and UI;
snapshots structurally share unchanged branches.

## Serialization and recreation

`serialize()` returns a validated JSON-safe envelope containing schema identity,
canonical value, baseline, and durable metadata. It includes touched/visited
addresses, revealed validation addresses, active wizard stages, collection row
keys, and registered extension namespaces. It excludes validation results,
pending work, listeners, and focus.

Unsupported objects, non-finite numbers, cycles, unsafe keys, and unregistered
extension data throw `SerializationError` with a stable `code` and `path`.
Provide a `StagesValueCodec` for richer domain values. Schema migrations are
ordered, explicit version increases and apply to both value and baseline within
the serialized envelope.

Recreate with:

```ts
const state = controller.serialize();
controller.destroy();
const recreated = stages({ schema, fields, state, migrations, codec });
```

## DOM adapter

`createDomFields()` returns native text, number, and checkbox definitions.
`mountStages(root, controller, options?)` renders visible nodes and returns:

- `render()`;
- `focus(path, options?)`;
- `focusFirstIssue(options?)`;
- `destroy()`.

Native views connect labels, `aria-invalid`, issue descriptions, and alert
output. Focus is preserved across controller-driven rerenders. Custom controls
implement a `DomFieldView` and receive document, ID, snapshot, and emitter.

## React adapter

- `useStages(factory, input)` owns controller lifecycle and controlled updates;
- `useStagesController(controller)` subscribes to the whole snapshot;
- `useStagesField(controller, path)` selects one field;
- `StagesField` renders its registered React view;
- `useStagesCollection(controller, path)` returns stable row commands;
- `useStagesWizard(controller, path)` returns stage metadata and navigation.

`useStages()` defers destruction across React Strict Mode effect replay and
destroys after a real unmount. React views receive an ID, field snapshot,
resolved props, and `emit(name, payload?)`. Markup, layouts, error focus, and
accessibility policy remain application-owned.

## Test-kit adapter harness

`bindAdapter(controller, render)` immediately renders the current snapshot,
rerenders on general notifications, and returns `getSnapshot`, `emit`, and
`destroy`. The Vue-style and Angular-style integration proofs use this same
framework-neutral contract.
