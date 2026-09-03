# Migrating from react-stages 0.x to Stages v1

Status: v1 alpha migration contract

This guide maps the public concepts documented for `react-stages` 0.8.24 to
the implemented v1 packages. It is a replacement guide, not a compatibility
guide: v1 uses new package names, immutable schemas, a framework-neutral
controller, structured validation, and explicit adapters. The complete legacy
behavior inventory is in
[`CURRENT_IMPLEMENTATION_API.md`](./CURRENT_IMPLEMENTATION_API.md); the new API
is described in [`V1_API.md`](./V1_API.md).

The dispositions used below are:

- **Replace**: v1 has a direct, intentionally different API.
- **Move**: the responsibility remains supported outside the core runtime.
- **Remove**: the behavior is not a v1 contract; compose it explicitly if an
  application still needs it.

No 0.x module-global state, input mutation, undocumented callback behavior, or
known correctness bug is preserved.

## Package and root-export map

| 0.x export | Disposition | v1 replacement |
| --- | --- | --- |
| `Stages` | Replace | One `stages()` controller with a recursive `wizard` node. |
| `Form` | Replace | The same `stages()` controller with field, group, collection, and wizard nodes. |
| `HashRouter` | Move | An application/router subscriber that dispatches `wizard:go` and observes wizard snapshots. |
| `Navigation` | Move | Application-owned UI using wizard snapshot capabilities and `useStagesWizard` in React. |
| `Progression` | Move | Derive progress from visible stages and per-stage validation in the wizard snapshot. |
| `Actions` | Move | Application-owned buttons that call `validate()`, `dispatch()`, or `reset()`. |
| `Debugger` | Move | A per-controller `subscribe()` devtools adapter; no `window.stagesLogging` hook. |
| `plainFields` | Replace | `createDomFields()` from `@stages/dom`, or an application field registry. |
| `get` | Remove | Use `getAtPath(value, ['segment', 0])`; v1 never accepts dotted Lodash paths. |

Install only the packages an integration needs:

```sh
npm install @stages/core @stages/react
```

The v1 alpha packages are ESM-only. `@stages/core` has no runtime dependencies;
React is a peer of `@stages/react`.

## Minimal controlled migration

In 0.x, `Form` received controlled data but also held derived copies and could
mutate nested input while initializing or extracting interface state:

```jsx
<Form
  config={[{ id: "name", type: "text", label: "Name" }]}
  fields={plainFields}
  data={value}
  onChange={(nextValue) => setValue(nextValue)}
  renderFields={(fields) => fields.name}
/>
```

In v1, the owner explicitly accepts each immutable proposal. The controller
does not make a proposal canonical until `update({ value })` is called:

```ts
import { stages, type StagesSchema } from "@stages/core";

const fields = {
  text: {
    view: "text",
    initialValue: "",
    reduce: ({ event }) => event.name === "input"
      && typeof event.payload === "string"
      ? { value: event.payload }
      : undefined,
  },
} as const;

const schema = {
  id: "profile",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
} as const satisfies StagesSchema<{ name: string }, typeof fields>;

let controller;
controller = stages({
  schema,
  fields,
  value: { name: "" },
  onChange: ({ value }) => controller.update({ value }),
});
```

An owner may reject a proposal by not calling `update`, replace it with a
different accepted value, or accept it later. `onChange` receives one object
containing `value`, `patches`, source `events`, and a transaction ID instead of
the positional 0.x `Form.onChange` arguments. General subscribers then run
before changed selector subscribers. See `V1_API.md` for the executable callback
order contract.

## Paths, identity, and data shape

| 0.x concept | Disposition | v1 decision |
| --- | --- | --- |
| String, dotted, or array `Path` values | Replace | `DataPath` is always a readonly segment array such as `['people', 0, 'email']`. |
| Array indexes as runtime identity | Replace | `NodeAddress` uses stable row keys for identity-bound metadata; data paths still use current indexes. |
| Mutating Lodash `set`/`unset` updates | Remove | `setAtPath`, `removeAtPath`, and `applyPatches` return structurally shared immutable values. |
| Unsafe object-key traversal | Remove | `__proto__`, `prototype`, `constructor`, and invalid numeric indexes are rejected. |
| Containers shaping nested data | Replace | `group`, `collection`, wizard, and stage IDs contribute explicit path segments. |

Use a data path for field events and value scopes. Use a node address for a
collection row, container, wizard, or durable metadata. Do not persist array
indexes as row identity.

## Configuration and fields

| 0.x concept/name | Disposition | v1 replacement |
| --- | --- | --- |
| `config` array | Replace | A versioned immutable `StagesSchema` object. |
| `config` function | Replace | A pure schema factory receiving readonly `value`, external `context`, and controller `meta`. |
| `config.fields` function | Replace | The schema factory itself; object wrappers with a `fields` callback are gone. |
| `fieldConfigs`, string templates | Remove | Typed TypeScript composition functions that return schema nodes before runtime. |
| `fieldsets` and fieldset `params`/`render` | Remove | Typed node factories plus adapter/application components. Core does not render layout. |
| `modifyConfig(path, key, action)` | Remove | Change controlled value/context so a schema factory returns the desired stable subtree. |
| Function entries inside config arrays | Replace | Compose nodes before returning the schema; normalization is fully recursive and non-mutating. |
| `{ id, type }` field config | Replace | `{ kind: 'field', id, type }`; `type` must exist in the typed registry. |
| Arbitrary presentation properties | Replace | Static `props` or typed `deriveProps(resolverContext)`. |
| Magic `labelFn` and other `*Fn` props | Remove | Explicit `deriveProps`, `when`, `disabled`, or validator `when`. |
| Config `value` overriding engine value | Remove | A snapshot's field value always comes from controlled domain value. |
| `defaultValue` | Replace | `FieldDefinition.initialValue`; owner-supplied value is never mutated during initialization. |
| `isVisible` / field `isRendered` | Replace | Node `when`; the adapter decides whether an entire mounted UI is visible. |
| `isDisabled` | Replace | Node `disabled`; validators opt into disabled nodes explicitly. |
| `id` form identity | Replace | Stable schema `id` and `version`; node IDs are local structural identity. |
| Random placeholder arrays | Remove | Derive or choose a deterministic placeholder outside core. |
| Unknown field types being omitted and valid | Remove | Schema diagnostics reject an invalid revision and retain the last valid tree. |

Dynamic schemas may add or remove fields, groups, collections, stages, and
wizards. Keep IDs stable for the same logical structure. Compatible nodes keep
their metadata; removed or incompatible identities cannot leak state into a
later revision. A schema factory runs at most once per transaction and
resolvers at most once per node/address.

The 0.x registry combined a React `component` and `isValid`. In v1 a
`FieldDefinition` contains an adapter-owned opaque `view`, `initialValue`, an
optional pure `reduce`, and reusable intrinsic `validators`. Rendering belongs
to `@stages/dom`, `@stages/react`, or another adapter.

## Value processing and events

The implicit 0.x processing pipeline is replaced by named events, field
reducers, and node/root transforms. Transforms return immutable `set` or
`remove` patches and run target-to-root; later patches observe and may
overwrite earlier patches. Any reducer, transform, or patch error rejects the
whole value transaction and emits a diagnostic.

| 0.x concept/name | Disposition | v1 replacement |
| --- | --- | --- |
| `filter` | Replace | Normalize the event payload in the field reducer. |
| `cast.data` | Replace | Parse in the field reducer; define empty-value semantics explicitly. |
| `cast.field` | Move | Format in the adapter/view or expose a derived prop. |
| `transform` | Replace | Typed transforms matched by event name and returning patches. |
| `cleanUp` | Replace | A `blur` reducer/transform. |
| `precision` | Replace | A `blur` reducer/transform with an application-selected numeric representation. |
| `computedValue` | Replace | A node/ancestor/root transform returning a `set` patch. |
| `clearFields` | Replace | A transform returning explicit `remove` patches. |
| Automatic collection sorting after changes | Remove | Dispatch `collection:sort` explicitly or return a transform patch. |
| `updateData` bypass path | Replace | `update({ value })` for owner replacement, or normal events/transforms for domain actions. |
| `handleActionClick` | Replace | Call `validate({ event: 'submit' })`, then application logic; call `reset()` explicitly. |
| `customEvents` predicates | Replace | Open event names dispatched explicitly, with validator event policies and transform matching. |
| `throttleWait` / global throttled change | Move | Debounce in the adapter/application, then dispatch a named event. |

Field reducers return a replacement field value, patches, or `undefined`.
Synchronous dispatches in one turn share a microtask transaction; `batch(fn)`
defines that boundary explicitly. A batch produces at most one proposed-value
callback and one general subscriber flush.

Use `fieldEvent`, `nodeEvent`, and `formEvent` to construct typed targets and
infer custom payloads. The executable `processing-migration` core fixture shows
filter/cast parsing, blur cleanup and precision, computed and cleared fields,
custom application events, and collection sorting together.

## Validation

0.x Boolean/error-code validation becomes structured validators and issues.
Execution policy and issue visibility are separate: a validator declares
trigger events and optional reveal events. Validation status is `unknown`,
`pending`, `invalid`, or `valid`; `isValid` is true only for a complete current
valid result.

| 0.x concept/name | Disposition | v1 replacement |
| --- | --- | --- |
| Registry `isValid` | Replace | Intrinsic validators on the registered `FieldDefinition`. |
| `typeValidations` | Replace | Reusable registry validators or ordinary field/node validators. |
| `regexValidation` | Replace | A validator returning a structured issue; invalid configuration is diagnosed, never thrown during input. |
| `customValidation` | Replace | Sync or async validator with stable ID and cancellation signal. |
| `isRequired` | Replace | An explicit required validator with application-defined empty semantics. |
| `isUnique` / `uniqEntries` | Replace | Field or collection validators with explicit dependencies. |
| `validateOn` / dynamic `validateOn` | Replace | Validator `on`, `revealOn`, and optional `when`. |
| Dependency strings such as `field:change` | Replace | Typed validator `dependencies` using data paths. |
| `onValidation` | Replace | `await controller.validate(...)` and/or subscribe to validation snapshots. |
| `parentRunValidation` | Remove | Validate a recursive path/address scope; subform bridging no longer exists. |
| `silentlyGetValidationErrors` | Replace | Validate without reveal, or inspect all issues separately from visible issues. |
| `errorRenderer` and type renderer | Move | Render structured visible issues in the adapter/application. |
| DOM error scrolling | Move | `focusFirstIssue()` in `@stages/dom`, or an adapter focus implementation. |
| Form `customRuleHandlers` and collection `rules` language | Remove | Ordinary collection/root validators; express count, sum, uniqueness, allow/disallow, and cross-field rules directly. |

Async validators are supported uniformly. Dependency changes cancel and
invalidate affected work, superseded results cannot publish, and rejected or
malformed results become deterministic system issues. The 0.x global request
timestamps and unhandled rejections are not preserved.

For action validation:

```ts
const result = await controller.validate({
  scope: "form", // or { path } / { address }
  event: "submit",
  reveal: true,
});

if (result.isValid) submit(controller.getSnapshot().value);
```

## Groups, collections, subforms, and wizards

| 0.x structural concept | Disposition | v1 replacement |
| --- | --- | --- |
| Reserved `group` | Replace | Recursive `{ kind: 'group', id, nodes }`. |
| Reserved `collection` | Replace | Recursive homogeneous nodes or explicit discriminated `variants`, with stable row identity. |
| Union `fields` plus `__typename` | Replace | Collection `variants` with an explicit discriminator and variant initial values. |
| Reserved `subform` | Remove | Recursive nodes already provide nested ownership and scoped validation. |
| Reserved `fieldset` | Remove | Schema composition and application layout. |
| Reserved no-op `config` node | Remove | No equivalent. |
| Reserved `wizard` and `stage` | Replace | The same nestable wizard/stage schema nodes used at any depth. |
| Outer `Stages` children and embedded Form wizards | Replace | One structural and runtime wizard model. |

Collection operations are explicit immutable events:

| 0.x action | v1 event |
| --- | --- |
| `add` | `collection:add` with `{ value?, index? }` or `{ variant, index? }` |
| `remove` | `collection:remove` with `{ index }`, or target a stable row address |
| `move` | `collection:move` with `{ from, to }`, or `{ to }` at a row |
| `sort` | `collection:sort` with a complete index `order` permutation |
| `duplicate` | `collection:duplicate` with `{ index, toIndex? }`, or target a row |
| `update` | `collection:replace` for one row; owner `update()` for whole-array replacement |

`min` and `max` reject invalid commands without proposing a change. Replace
0.x `init` and `setInitialData` with controlled initial value, a field initial
value, or a variant's explicit initial value. Replace declarative `sort.by` and
`sort.dir` with an application-created order or transform. Collection
snapshots expose `size`, `canAdd`, `canRemove`, and stable row branches.

Wizard navigation uses `wizard:next`, `wizard:previous`, and `wizard:go` events
targeted at a node address. The old outer-wizard `initialData` becomes the
controller's controlled `value`; `initialStep` becomes initial/recreated
controller metadata. `validateOnStepChange` becomes
`navigation.validateCurrent`.
Application policy belongs in a pure `guard`; non-linear navigation must be
enabled explicitly. Replace `onNav`, `onChangeStep`, `getWizardNavHash`,
`isWizardStepActive`, and `isWizardStepDisabled` with dispatch plus wizard
snapshot state (`activeStage`, visible stages, validation, `canPrevious`,
`canNext`, and `canGo`).

## Async data and options

| 0.x concept/name | Disposition | v1 replacement |
| --- | --- | --- |
| `asyncDataLoader` and render `loading` | Move | Load with the application's resource/data layer and pass settled state through controlled `context`. |
| `dynamicOptions.loader`, `watchFields`, `events`, and cache | Move | Adapter/application resource keyed by explicit dependencies; dispatch value changes normally. |
| `dynamicOptions.onOptionsChange` | Replace | Application resource effect or an explicit domain event/transform. |
| Function-valued `options` | Replace | Typed `deriveProps` for synchronous derivation from value/context. |
| `computedOptions` (`source`, `filter`, `sort`, `map`, `initWith`) | Replace | A pure selector/`deriveProps`; never write a replacement value during render. |

Core deliberately owns no fetching, cache, timer, storage, or framework
lifecycle. This avoids the 0.x global request sequencing, hidden render-time
writes, and uncaught loader failures.

## Interface state, interaction metadata, and effects

| 0.x concept/name | Disposition | v1 replacement |
| --- | --- | --- |
| `isInterfaceState` / `initialInterfaceState` | Remove from domain processing | Put serializable controller/plugin data in a registered extension namespace; keep ephemeral UI state in the adapter. It is never merged into domain value. |
| `isDirty` / `dirtyFields` | Replace | Compare canonical value with serialized baseline or select the relevant snapshot/value; v1 preserves the baseline. |
| Focus and blur state | Replace | Dispatch `focus`/`blur`; interaction metadata is per controller/address and focus itself is ephemeral. |
| Touched/visited exposure | Replace | Durable controller metadata, included in serialization. |
| `enableUndo`, `undoMaxDepth`, `handleUndo`, `handleRedo` | Move | An optional subscriber/extension history built from accepted values; not v1 core. |
| Form/Stages `autoSave`, `disableAutoSave` | Move | Subscribe, select the persisted value, and store `serialize()` output externally. |
| Form/Stages `reset` | Replace | Dispatch the form-targeted `reset` event; it proposes the baseline and clears stale interaction/validation metadata. |
| `id`-derived browser storage keys | Remove | The persistence adapter owns namespacing, storage selection, errors, and async behavior. |
| `hashSeparator`, `prefix`, `hashFormat` | Move | Router configuration outside core, mapped to wizard IDs/stage IDs. |

Serialization is an explicit versioned envelope, not JSON cloning. It preserves
value, baseline, touched/visited exposure, wizard locations, collection row
keys, revealed issue addresses, and registered extension state. It rejects
cycles, unsafe keys, non-finite numbers, unsupported values, schema mismatches,
and missing migrations with precise diagnostics. Use a value codec for richer
domain types.

## Rendering and framework adapters

0.x `render` and `renderFields` callbacks, `FormRenderProps`,
`FormFieldProps`, `FormActionProps`, `RenderedFields`, and React elements stored
inside the field registry are removed. V1 exposes immutable snapshots and
subscriptions. Adapters own markup, layout, accessibility, focus, and resource
lifecycle.

For React, replace child render functions and renderer prop bags with
`useStages`, `useStagesController`, `useStagesField`, `StagesField`,
`useStagesCollection`, and `useStagesWizard`. Field views are still
application-owned, but core has no React import. `@stages/dom` supplies
`mountStages`, `createDomFields`, path focus, first-visible-issue focus, and
native text, number, and checkbox reference views.

The 0.x `plainFields` keys `email`, `password`, `tel`, `time`, `date`, `select`,
`radio`, `checkboxGroup`, and `dummy` are not promised built-ins in the minimal
v1 DOM adapter. Register them as typed field definitions/views in the
application. This makes their parsing, validation, option, disabled-option,
empty, and accessibility semantics explicit instead of inheriting the uneven
0.x behavior.

The old `prefix`, `suffix`, `secondaryText`, `placeholder`, `label`, `options`,
`isRequired`, and similar view properties remain possible as typed static or
derived field `props`; they are not interpreted by core.

## Suggested rollout

1. Install v1 packages beside `react-stages`; do not alias the old root import.
2. Define domain value and context types, then convert one 0.x config to a
   versioned schema and typed field registry.
3. Move casts/filters/computed changes into reducers and transforms. Move
   async resources, storage, routing, undo, and layout into application code.
4. Convert validation to stable validators and structured issues. Add explicit
   dependencies and reveal policies.
5. Bind the controller to the owner with the controlled `onChange`/`update`
   handshake, then add the chosen adapter.
6. Test rejection, delayed acceptance, batching, async cancellation, recursive
   collection/wizard identity, serialization, and recreation.
7. Migrate route-by-route. Remove `react-stages` only after no code imports its
   root exports or relies on positional render/change contracts.

Use the production-style examples in `examples/vanilla` and `examples/react`
as executable integration references. Package tarballs and an isolated offline
consumer are verified by `npm run verify:packages:v1`.
