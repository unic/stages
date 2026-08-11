# React Stages 0.8.24 — Current Implementation API Specification

Status: implementation baseline for the v1.0 rewrite

Source revision: `ec057a4` (`0.8.24`, 2026-06-11)

Scope: the public package entry point in `src/lib/index.js`, the behavior reachable through it, and configuration shapes demonstrated by `docs` and `demo`

## 1. Purpose and interpretation

This document records the API that the current JavaScript implementation actually exposes. It is intended to be the compatibility baseline and decision inventory for a framework-agnostic TypeScript rewrite. It is not a proposal for the v1 API.

The implementation is authoritative. Existing documentation and demos are used to recover intent and examples, but where they disagree with the source this document describes the source and labels the disagreement as a compatibility issue.

Terms used below:

- **Public API** means an export from `src/lib/index.js` or a callback/configuration contract reachable from one of those exports.
- **Observed behavior** means behavior encoded by the current implementation, including accidental behavior on which an application could depend.
- **Compatibility issue** means behavior that is internally inconsistent, contradicts the existing docs, is React/browser-specific, or appears defective. It should not automatically be preserved in v1.
- **Path** means a Lodash-compatible property path such as `profile.name` or `guests[2].email`.
- **External data** means the object passed through the `Form.data` prop.
- **All data** means the shallow copy of external data into which interface state is merged for internal processing.

## 2. Package and export surface

The package is named `react-stages`, version `0.8.24`. Its declared source entry is `src/lib/index.js`; built entry points are `dist/lib.umd.js` and `dist/lib.module.js`. React `>=16.8.0` is a peer dependency.

The root module has these named exports and no default export:

| Export | Kind | Contract |
| --- | --- | --- |
| `Stages` | React component | Multi-step data and validation coordinator. |
| `HashRouter` | React component | Optional hash-based router for `Stages`. Renders `null`. |
| `Navigation` | React component | Minimal sample step navigation. |
| `Progression` | React component | Minimal sample progress display. |
| `Debugger` | React component | Browser-only floating inspector using a global logging hook. |
| `Form` | React component | Headless configurable form engine and renderer adapter. |
| `Actions` | React component | Minimal sample action-button renderer. |
| `plainFields` | field registry object | Built-in unstyled HTML field components and validators. |
| `get` | function | Lodash `get`, re-exported unchanged. |

`src/lib/fieldsets/bootstrap` exists in the repository but is not exported from the package root. It also imports `react-bootstrap`, which the root package does not declare. It is therefore not part of the supported package API described here.

## 3. Shared data model and conventions

### 3.1 Paths and data shape

A field's `id` contributes one segment to the data path. Containers produce nested data:

```text
group id           -> object property
collection id      -> array property
collection index   -> [n]
wizard/stage ids   -> nested object properties
regular field id   -> value property
```

For example, this path:

```text
profile.guests[1].email
```

corresponds to:

```js
{
  profile: {
    guests: [
      {},
      { email: "person@example.com" }
    ]
  }
}
```

The implementation uses Lodash `get`, `set`, `unset`, `merge`, `find`, `findIndex`, and `sortBy`. Any path accepted by those helpers can affect behavior, even if the docs only show dot segments and numeric bracket indexes.

### 3.2 Core structural types

These TypeScript-like declarations describe the runtime shapes. They are descriptive, not generated or enforced by the current package.

```ts
type Path = string;
type Data = Record<string, any>;

interface Option {
  value: any;
  text: React.ReactNode;
  disabled?: boolean;
  [extra: string]: any;
}

interface DirtyField {
  oldData: any;
  newData: any;
}

type DirtyFields = Record<Path, DirtyField>;

interface FieldError {
  value?: any;
  field: FieldConfig;
  subField?: FieldConfig;
  errorCode?: any;
}

type FormErrors = Record<Path, FieldError | FormErrors>;

type RenderedFields = Record<
  string,
  React.ReactElement | RenderedFields | RenderedFields[]
>;
```

Error values are metadata objects, not message strings or React elements. Rendering an error is the responsibility of the field component or the form renderer.

### 3.3 Controlled-state convention

`Form` does not own the external form data. A consumer normally stores data in React state and replaces it from `onChange`:

```jsx
const [data, setData] = useState({});

<Form
  data={data}
  onChange={(nextData) => setData(nextData)}
  {...otherProps}
/>
```

The implementation nevertheless shallow-copies and sometimes mutates nested references from the supplied object. Default initialization directly calls Lodash `set` on the `data` prop. Consumers must therefore not assume strict immutability.

## 4. `Form`

### 4.1 Role

`Form` is the main form engine. It expands configuration, derives field paths, creates field elements from a registry, manages validation and auxiliary state, and exposes renderer callbacks. It renders no wrapper markup of its own.

### 4.2 Props

```ts
interface FormProps {
  config: FormConfigObject | FieldConfig[] | FormConfigFunction;
  fields: FieldRegistry;
  data?: Data;                         // default {}
  render?: (props: FormRenderProps) => React.ReactNode;
  renderFields?: (fields: RenderedFields) => React.ReactNode;
  onChange?: FormChangeHandler;        // default no-op
  isVisible?: boolean;                 // default true
  isDisabled?: boolean;                // default false
  id?: string | number;
  onValidation?: (errors: FormErrors) => void;
  parentRunValidation?: boolean;
  validateOn?: ValidationEvent[] | DynamicValidateOn; // runtime accepts function too; default ["action"]
  throttleWait?: number;               // effective default 400 ms
  customEvents?: Record<string, CustomEventPredicate>;
  enableUndo?: boolean;
  undoMaxDepth?: number;               // default 10
  customRuleHandlers?: Record<string, CollectionRuleHandler>; // default {}
  autoSave?: false | "local" | "session" | AutoSaveConfig;   // default false
  typeValidations?: Record<string, TypeValidation>;           // default {}
  fieldsets?: Record<string, FieldsetDefinition>;              // default {}
  initialInterfaceState?: Data;                                // default {}
  hashSeparator?: string;                                     // embedded wizards; effective default ":"
}
```

`config` and `fields` are required by `propTypes`. At least one of `render` and `renderFields` is needed to produce output, though neither is marked required. `throttleWait`, `customEvents`, `enableUndo`, `autoSave`, and `hashSeparator` are accepted by the function but absent from `propTypes`.

If `isVisible === false`, `Form` returns `null`. Its visibility effect still initializes collections, computed values, validation, and change propagation as visibility changes. Async form data and initial dynamic options are loaded only while visible.

### 4.3 Configuration input

The accepted top-level forms are:

```ts
type FormConfigFunction = (
  data: Data,
  asyncData: any,
  interfaceState: Data
) => FieldConfig[];

type FieldConfigTemplate = (
  data: Data,
  asyncData: any,
  interfaceState: Data
) => FieldConfig;

interface FormConfigObject {
  fields: (
    data: Data,
    asyncData: any,
    interfaceState: Data
  ) => FieldConfig[];
  fieldConfigs?: Record<string, FieldConfigTemplate>;
  asyncDataLoader?: () => Promise<any> | any;
}
```

The runtime selection order is:

1. If `config.fields` is a function, call it.
2. Else if `config` is a function, call it.
3. Else if `config` is an array, use it.
4. Else use an empty array.

An object whose `fields` property is already an array is therefore not supported and silently produces no fields.

All configuration functions receive current all-data, current async data, and current interface state. They are run during render, so they must be synchronous and should be free of side effects.

### 4.4 Config item expansion

Each config array item may be:

- a field/container object;
- a string naming `config.fieldConfigs[key]`;
- an object whose `type` names `config.fieldConfigs[type]`;
- an object whose `type` names a `fieldsets` definition;
- a function returning a field/container object.

Expansion behavior:

- A string template is replaced with the template callback result.
- For `{ type: templateKey, ...overrides }`, the template result is shallow-merged with overrides. The template's own resulting `type` is restored, so the override cannot change it.
- A fieldset reference becomes an internal `{ id, type: "fieldset", fieldset, fields, params }` node.
- A function item is invoked as `(data, asyncData, interfaceState)`.
- Direct `fields` children of a top-level `group`, `collection`, or `fieldset` and direct `stages` children of a top-level `wizard` are expanded. Expansion is not a fully recursive normalization pass; templates/functions deeper than that can remain unresolved.
- Parsing mutates nested `fields`/`stages` arrays on config objects that were returned by the consumer.

#### Runtime config modification

`fieldProps.modifyConfig(path, configKey, action)` works only when the object config has a function at `fieldConfigs[configKey]`. It converts the supplied data path to a config-array path, removing collection indexes while locating matching config IDs, and targets the resolved node's `fields` array.

- `"add"` appends the template result.
- `"remove"` evaluates the template, finds the first existing child with the same `id`, and removes it.
- Unknown actions are recorded but have no effect.
- The template is evaluated as `(data, asyncData)` in this path; interface state is not passed.
- Repeated adds are not deduplicated.
- An empty/unresolvable path does nothing.

Runtime modifications live only in component state. They are replayed over every subsequently parsed config and are not written back to the original `config` object or external data.

### 4.5 Base field configuration

Every renderable field needs an `id` and a `type`. Most other properties are convention-based and are passed through to the registered field component.

```ts
interface FieldConfig {
  id: string;
  type: string;

  // Common presentation props, interpreted by field components
  label?: React.ReactNode;
  value?: any;
  options?: Option[] | OptionsFunction;
  placeholder?: any | any[];
  isRequired?: boolean;
  isDisabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  secondaryText?: React.ReactNode;
  errorRenderer?: (error: FieldError) => React.ReactNode;

  // Form-engine behavior
  defaultValue?: any | ((data: Data) => any);
  computedValue?: (data: Data, itemData: any, interfaceState: Data) => any;
  computedOptions?: ComputedOptionsConfig;
  dynamicOptions?: DynamicOptionsConfig;
  filter?: (value: any) => any;
  transform?: TransformConfig[];
  cast?: CastConfig;
  cleanUp?: (value: any) => any;
  clearFields?: Path[] | ((value: any, data: Data, errors?: FormErrors) => Path[]);
  precision?: number;
  isRendered?: (path: Path, fieldData: any, allData: Data, interfaceState: Data) => boolean;
  isInterfaceState?: boolean;
  disableAutoSave?: boolean;
  isUnique?: boolean;                 // collection-child validation/computed-option behavior
  validateOn?: ValidationEvent[] | DynamicValidateOn;
  regexValidation?: string | RegExp;
  customValidation?: CustomValidation;

  // Arbitrary field-specific props are allowed
  [prop: string]: any;
}
```

`label` is not enforced but is expected for accessible UI. The `value` config property is not a default: because config props are merged after engine-supplied props, it overrides the value derived from form data.

### 4.6 Dynamic `*Fn` props

On non-reserved field types, any config property whose name ends with `Fn` and whose value is a function is evaluated at render time:

```ts
type DynamicPropFunction = (context: {
  path: Path;
  fieldData: any;
  alldata: Data;
  interfaceState: Data;
}) => any;
```

The `Fn` suffix is removed for the prop given to the field component. For example, `labelFn` produces `label`. The original `labelFn` prop is removed. This applies broadly, including event-handler-looking or engine-looking names, provided the node type is not reserved.

### 4.7 Reserved node types

The engine treats these type strings as reserved:

```text
collection, subform, group, fieldset, config, wizard, stage
```

Their implemented meanings are:

| Type | Configuration | Data/render behavior |
| --- | --- | --- |
| `group` | `{ id, type: "group", fields: FieldConfig[] }` | Produces an object at `id`; the group itself renders nothing. Descendants appear as a nested object in `fieldProps.fields`. |
| `collection` | See section 4.16 | Produces an array; descendants are generated once per data entry. |
| `subform` | `{ id, type: "subform", config, render }` | Renders a recursive `Form` at the field path. |
| `fieldset` | Internal normalized type | Renders a reusable config/render bundle from `Form.fieldsets`. |
| `wizard` | `{ id, type: "wizard", stages: StageConfig[] }` | Produces an object containing stage objects; only the active stage's descendants are included in field paths/rendering. |
| `stage` | `{ id, type: "stage", fields: FieldConfig[] }` | Child of an embedded wizard; produces a nested object. |
| `config` | No dedicated implementation | Recognized as reserved for validation but has no traversal or render behavior. |

Container IDs participate in paths and data even though the containers do not create registered field components.

### 4.8 Field registry contract

```ts
interface FieldTypeDefinition {
  component: React.ComponentType<InjectedFieldProps & Record<string, any>>;
  isValid: (value: any, config: FieldConfig) => true | false | any;
}

type FieldRegistry = Record<string, FieldTypeDefinition>;
```

For a non-reserved node to render, `fields[node.type]` must exist. Unknown types are omitted from rendering and treated as valid.

The engine creates each field component with these props, then overlays the cleaned field config on top:

```ts
interface InjectedFieldProps {
  key: Path;
  id: Path;
  value: any;
  initialValue: any;
  error?: FieldError;
  isDirty: boolean;
  isDisabled: boolean;
  hasFocus: boolean;
  isValidating?: boolean;
  onChange: (value: any) => void;
  onFocus: () => void;
  onBlur: () => void;
}
```

The full path replaces the configured local `id`. The config overlay means config properties can override `value`, `initialValue`, `error`, dirty/disabled/focus flags, and even engine handlers.

When `placeholder` is an array with more than one entry, one entry is chosen randomly and cached by full path in module-global state. Empty and one-entry arrays are passed through unchanged. If a type-level validation supplies `renderer` and the field has no `errorRenderer`, that renderer is injected before dynamic `*Fn` properties are evaluated.

Before the overlay, these engine-only config properties are removed from the object passed to the field component:

```text
computedValue, computedOptions, filter, clearFields, dynamicOptions,
isRendered, defaultValue, cleanUp, precision
```

Other behavior properties—including `customValidation`, `regexValidation`, `cast`, `transform`, and `validateOn`—are passed through unless the field component destructures or discards them.

`isRendered(path, fieldData, allData, interfaceState)` is evaluated before creating a field. A false result omits it. A false result on a `group` also suppresses all paths whose string starts with the group path. It is not applied to collection or wizard containers by the current renderer.

### 4.9 Value processing order

For a normal `onChange`, the engine processes a value in this order:

1. Resolve current field config from its full path.
2. Apply `filter(value)` if present.
3. Apply `cast.data`.
4. Apply matching `transform` entries in array order, but only when the current value is truthy.
5. Store `undefined` for empty/falsy values other than `0` and `false`, and for empty arrays; otherwise store the value.
6. Recompute every active `computedValue` field.
7. Perform configured validation for this event.
8. Recalculate dirty state for the changed path.
9. Apply `clearFields` and discard loaded options for those exact paths.
10. Trigger watched dynamic-option loaders.
11. Auto-sort a containing collection if configured.
12. Call the form-level change pipeline.

```ts
interface CastConfig {
  data?: "number" | "string" | "boolean" | "date" |
         ["number" | "string" | "boolean" | "date"] |
         ((value: any) => any);
  field?: "number" | "string" | "boolean" | "date" |
          ["number" | "string" | "boolean" | "date"] |
          ((value: any) => any);
}

interface TransformConfig {
  event: string | string[];
  fn: (value: any, oldValue: any) => any;
}
```

String casts use JavaScript constructors (`Number`, `String`, `Boolean`, `new Date`). An array cast applies the first declared type to each array element. Unknown cast strings leave the value unchanged.

`cast.field` is applied when producing the field's `value` prop. `cleanUp` runs on blur and may also run after a throttled synthetic change when the field is no longer focused. `precision` runs on blur as `Number(value).toFixed(precision)`, producing a string.

`computedValue` receives `(newData, itemData, interfaceState)`. `itemData` is the parent object's value from the render's pre-change all-data snapshot, so it may be stale relative to `newData`. Computed fields run in field-path order and their returned values are stored regardless of whether the field is disabled.

### 4.10 Defaults and initial snapshot

On first processing of a truthy `data` object:

- Every active field with `defaultValue` and an `undefined` current value is initialized.
- A function default receives external `data` only.
- Defaults are written directly into both `data` and internal all-data.
- Configured `init` validations are run.
- The resulting data is stable-JSON-stringified and parsed to create the initial snapshot.

The JSON snapshot removes unsupported JSON values and converts `Date` objects to strings. It is subsequently used for dirty comparisons, reset, and the first undo entry.

The init-validation merge assigns the entire `{ errors, firstErrorField }` return object into visible errors rather than assigning only its `errors` member. Forms using `validateOn: ["init"]` can therefore expose unexpected top-level `errors` and `firstErrorField` keys.

### 4.11 Render contracts

With `render`, the callback receives:

```ts
interface FormRenderProps {
  actionProps: FormActionProps;
  fieldProps: FormFieldProps;
  loading: boolean;
}

interface FormFieldProps {
  fields: RenderedFields;
  onCollectionAction: CollectionActionHandler;
  onWizardNav: EmbeddedWizardNavHandler;
  getWizardNavHash: EmbeddedWizardHashGetter;
  isWizardStepActive: (path: Path, stage: string) => boolean;
  isWizardStepDisabled: (path: Path, hash: string, disableIfActive?: boolean) => boolean;
  modifyConfig: (path: Path, configKey: string, action: "add" | "remove" | string) => void;
  data: Data;
  interfaceState: Data;
  errors: FormErrors;
  asyncData: any;
  isDirty: boolean;
  focusedField: Path | "";
  lastFocusedField: Path | "";
  dirtyFields: DirtyFields;
  get: typeof import("lodash/get");
  getConfig: (path: Path) => FieldConfig | undefined;
}

interface FormActionProps {
  handleActionClick: (callback: () => void, validate?: boolean, reset?: boolean) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  isDisabled: boolean;
  isDirty: boolean;
  focusedField: Path | "";
  lastFocusedField: Path | "";
  dirtyFields: DirtyFields;
  silentlyGetValidationErrors: () => FormErrors;
  updateData: (data: Data, pathsToValidate?: Path[]) => void;
}
```

`RenderedFields` mirrors the data path hierarchy: regular leaves are React elements, groups/stages/wizards are nested objects, and collections are arrays of nested objects. Missing, unknown, inactive, or `isRendered === false` fields are absent.

`fieldProps.data` is the external `data` prop and excludes interface state; configuration, validation, and most value processing use all-data instead. `getConfig(path)` searches the current active field-path list and returns `undefined` for unknown paths and descendants of inactive embedded-wizard stages.

With `renderFields`, the callback receives only `createRenderedFields()`.

The main `actionProps.isDisabled` is true when the whole form is disabled or when any async custom validation is pending. Fieldset action props omit `updateData` and use only the direct `isDisabled` prop, so they do not reflect pending async validations.

### 4.12 `onChange` contract

```ts
type FormChangeHandler = (
  data: Data,
  errors: FormErrors,
  id: string | number | undefined,
  fieldKey: Path | undefined,
  interfaceState: Data,
  allValidationErrors: FormErrors,
  isDirty: boolean,
  dirtyFields: DirtyFields
) => void;
```

The first argument has interface-state paths removed. `errors` is the error object selected by the triggering path; `allValidationErrors` is a silent full-form validation performed at callback time. `fieldKey` is present for field/collection changes and omitted for broader updates.

For a normal field change, the caller already supplies `validationErrors(false, newData)` as `errors`, and the change pipeline computes `allValidationErrors` again. Validators can therefore run twice per emitted change even when the configured visible validation event is only `"action"`. Focus, blur, collection, undo, saved-data restore, and direct-update paths can supply different error snapshots as the second argument.

Change calls are deduplicated by a stable serialization of data, the list of error keys, ID, field key, and interface state. `forceChange` is used internally when restoring saved form data. The deduplication snapshot is module-global, not per `Form` instance.

The callback's `interfaceState` argument comes from the render closure, while extraction schedules a state update immediately before the call. It can therefore lag behind the data being emitted.

### 4.13 Actions and direct updates

`handleActionClick(callback, validate, reset)` behaves as follows:

- If `reset` is truthy, remove autosaved data, emit the initial snapshot, and clear dirty state.
- Evaluate active custom events for the `action` trigger.
- Validation is considered only when the form-level `validateOn` array contains `action` or an active custom event.
- If `validate` is truthy, validate all fields and briefly toggle subform validation.
- If `validate` is falsy while action validation is active, replace visible errors with `{}`.
- Suppress `callback` when synchronous errors exist.
- Otherwise invoke `callback()` with **no arguments**.

Existing docs and demos describe or imply a data payload for the action callback, but the implementation never passes one. Applications must close over their controlled data if they need it.

`updateData(data, pathsToValidate = [])` recalculates dirty fields with strict reference/value inequality, optionally validates exact paths, updates error/dirty state, and emits the supplied data. It does not run filters, casts, transforms, computed values, dynamic options, or collection sorting.

### 4.14 Interface state

Fields with `isInterfaceState: true` participate in config functions, rendering, validation, and computed values, but are removed from the first `onChange` argument. Their values are stored in internal `interfaceState` and exposed through `fieldProps.interfaceState` and the fifth `onChange` argument.

`initialInterfaceState` is read only by the initial React state initializer; subsequent prop updates are ignored. Before processing, it is deep-merged into a shallow copy of external data, with interface-state values taking precedence.

On every emitted change, the engine rebuilds interface state only from currently active field paths and uses shallow copies plus Lodash `unset`; nested input references may be mutated.

### 4.15 Async form data and options

If an object config supplies `asyncDataLoader`, it is called without arguments the first time the form is visible. `loading` is true while the returned value is awaited, then the result is stored as `asyncData`. There is no error handler. The loader is invoked even if it returns a non-Promise value because it is awaited. The public `loading` flag covers only this loader, not dynamic-option loading or async validation.

Configuration functions and render props receive `asyncData`. It is cached in component state and is not reloaded when `config` changes.

Three option mechanisms exist, in precedence order:

1. Options loaded for the exact path by `dynamicOptions`.
2. An `options(path, fieldData, allData)` function.
3. `computedOptions` built from a source collection.

```ts
interface DynamicOptionsConfig {
  watchFields: Path[];
  events: Array<"init" | "change" | "blur" | string>;
  loader: (data: Data, handleChange: Function) => Promise<Option[]> | Option[];
  enableCaching?: boolean;
  onOptionsChange?: (
    options: Option[],
    updatedData: Data,
    handleChange: Function
  ) => void;
}

type OptionsFunction = (path: Path, fieldData: any, allData: Data) => Option[];

interface ComputedOptionsConfig {
  source: Path;
  filter?: (item: any, index: number, array: any[]) => boolean;
  sort?: (a: any, b: any) => number;
  map?: (item: any, index: number, array: any[]) => Option;
  initWith?: Option[];
}
```

Dynamic option requests use a module-global per-path sequence number so only the most recently started request updates a path. Caching keys include the target path plus stable-serialized truthy values of `watchFields`; falsy watched values are omitted. Loader failures are not caught.

`init` loaders run in the visibility effect. `change` loaders normally run when a watched full path changes. When the triggering field itself has `dynamicOptions`, propagation to another loader is additionally allowed only if that target has not loaded yet or its loaded options array directly contains the changed value. Because options are normally objects, the direct `indexOf(value)` check usually prevents later chained propagation. The blur implementation compares watched fields to the triggering field's local ID and updates by the target's local ID, so nested blur-driven options can be stored under the wrong path.

Computed options start from `get(externalData, source, [])`, then apply `filter`, `sort`, `map`, and `initWith` in that order. When the configured field is `isUnique` inside a collection, an option already selected in another row is copied with `disabled: true`. If the current value is absent from computed options, render-time code writes an empty string into internal all-data without calling `onChange`.

### 4.16 Collections

```ts
interface CollectionConfig extends FieldConfig {
  type: "collection";
  fields: FieldConfig[] | Record<string, FieldConfig[]>;
  init?: boolean | string;
  min?: number | string;
  max?: number | string;
  isRequired?: boolean;
  uniqEntries?: boolean;
  setInitialData?: (collectionData: any[], allData: Data, unionType?: string) => any;
  sort?: {
    by: any;       // Lodash sortBy iteratee or iteratee array
    dir?: "asc" | "desc" | string;
  };
  rules?: CollectionRules;
}

type CollectionAction = "add" | "remove" | "move" | "sort" | "duplicate" | "update";
type CollectionActionHandler = (
  fieldKey: Path,
  action: CollectionAction | string,
  index?: number | string | any[],
  toIndex?: number | "last"
) => void;
```

Initialization occurs when visibility changes. If `init` is truthy, entries are appended until `min` is reached; absent/falsy `min` means one. A string `init` selects a union member and produces `{ __typename: init }` unless `setInitialData` is provided. A normal collection produces `{}` by default.

For union collections, `fields` is an object keyed by union type. Each data entry must contain `__typename`; only that member's fields are traversed and rendered.

Actions:

| Action | Behavior |
| --- | --- |
| `add` | Append `{}`, custom initial data, or a selected union entry. Honors `max`. A string `index` selects the union type. |
| `remove` | Splice one entry if current length is greater than `min`. `index: "last"` is supported. |
| `move` | Splice from numeric `index` and insert at numeric `toIndex`; both may use `"last"` before numeric checks. |
| `sort` | Replace with `sortBy(collection, index)` when `index` is truthy. |
| `duplicate` | Shallow-copy the entry and insert it immediately after. Does not enforce `max`. |
| `update` | Treat an array supplied as `index` as the complete replacement collection. |

After any action, declarative `collection.sort.by` is also applied; `dir === "desc"` reverses it. A nested field change also triggers this sort when the changed field's local ID occurs in `sort.by`.

Add/remove mark the collection as updated even when max/min prevents a structural change. Dirty collection comparison uses `JSON.stringify`; normal field comparison uses Lodash deep equality.

Collection validation includes:

- required collection emptiness;
- full-entry deep uniqueness with `uniqEntries`;
- per-subfield uniqueness when a child has `isUnique`;
- ordinary validation of each generated descendant path;
- collection rules.

A required collection is empty when missing, `[]`, or `[{}]`. The special in-collection subfield validation call has reversed arguments and effectively returns valid, but generated child paths are also validated independently. This distinction affects optional initialized rows and the shape/location of errors.

In particular, an optional collection containing an empty object can still receive full-path errors for required descendants during the normal all-field validation pass, even though the collection-specific branch attempts to skip empty optional entries.

#### Collection rules

Rules have this shape:

```ts
type CollectionRules = Record<
  string,                         // one or comma-separated field paths
  Record<
    string,                       // one or comma-separated target values
    CollectionValueRules
  >
>;

interface CollectionValueRules {
  maxCount?: number;
  minCount?: number;
  exactCount?: number;
  sameCountAs?: string;
  differentCountAs?: string;
  sameSumAs?: Path;
  differentSumAs?: Path;
  biggerSumAs?: Path;
  smallerSumAs?: Path;
  isUnique?: boolean;
  disallow?: any | any[];
  require?: any | any[];
  errorCode?: any;
  [customRule: string]: any;
}
```

Comma-separated field and value strings are converted to the Cartesian product. Nested field paths are read with Lodash `get`.

- Count rules compare strict equality against target strings.
- `sameCountAs`/`differentCountAs` compare counts of two values in the same target field.
- Sum rules convert values with `Number` and ignore `NaN`.
- `isUnique` compares arrays of selected field values with Lodash deep equality.
- Custom rule handlers are invoked only while built-in rules still conform:

```ts
type CollectionRuleHandler = (args: {
  fieldValueCombos: Array<[Path, string]>;
  fieldValidationData: any[];
  valueRules: CollectionValueRules;
  get: typeof import("lodash/get");
}) => any;
```

Only truthy count values activate the count checks, so a configured count of `0` is ignored. `require` is never read by the implementation. The second conditional intended for `require` repeats `disallow` and its values; as a result, once the trigger value exists, a `disallow` rule becomes invalid whether or not the banned value exists. These are compatibility issues, not reliable rule semantics for v1.

On a failure, the collection error is `{ value, field, errorCode }`, where `errorCode` defaults to `"invalidRule"`. Later failing rules overwrite earlier errors for the same collection.

### 4.17 Validation

```ts
type BuiltInValidationEvent =
  | "action"
  | "init"
  | "focus"
  | "blur"
  | "change"
  | "throttledChange"
  | "collectionAction";

type ValidationEvent = BuiltInValidationEvent | string;

type DynamicValidateOn = (args: {
  data: any;
  fieldIsDirty: boolean;
  fieldConfig: FieldConfig;
  fieldHasFocus: boolean;
}) => ValidationEvent[];
```

The form default is `["action"]`. A field-level `validateOn` takes precedence over form-level settings for focus, blur, change, throttled change, and active custom events. Dependency tokens of the form `${otherFullPath}:change` and `${otherFullPath}:blur` are supported only in field-level arrays.

Function-valued `validateOn` is implemented for change/focus/blur decisions and is expected to return an array. Collection actions directly call `.indexOf` on both form and field settings, so a function-valued setting can throw when collection actions occur.

Action triggering is controlled only by the form-level array. Once full validation runs, every known field path is validated regardless of each field's `validateOn` list.

Independently of visible validation scheduling, every emitted change performs silent full validation inside the `onChange` pipeline. Normal field changes do so twice as described in section 4.12. Consequently `validateOn` primarily controls visible synchronous error-state updates and action gating; it does not guarantee that validation callbacks are called only on those events. Async custom validators started by a “silent” pass can later update visible errors.

Throttled change uses a module-global timestamp and timeout shared across all `Form` instances. The effective wait is `throttleWait || 400`, so `0` cannot disable the wait. A synthetic call repeats the change pipeline and may run cleanup after focus is lost.

Custom event predicates are evaluated on change, focus, blur, and action:

```ts
type CustomEventPredicate = (args: {
  fieldValue: any;
  data: Data;
  dirtyFields: DirtyFields;
  optionsLoaded: Record<Path, Option[]>;
  asyncData: any;
  errors: FormErrors;
  focusedField: Path | "";
  triggeringEvent: "change" | "focus" | "blur" | "action";
}) => boolean;
```

All predicates returning truthy contribute their key as an active validation event. If exactly one custom event is active, `triggeringEvent` passed to validation is that string; otherwise it is an array.

#### Validation precedence

For a registered non-reserved field, validation follows this order:

1. Call registry `isValid(value, fieldConfig)`.
2. If a global type validation exists and the field has no `customValidation`, return the global validation result immediately.
3. Else if `regexValidation` exists and there is no `customValidation`, require both base validity and regex match (empty/falsy values bypass regex).
4. Else if `customValidation` exists, call it.
5. Else return base validity.

```ts
interface TypeValidation {
  validation?: CustomValidation;
  renderer?: (error: FieldError) => React.ReactNode;
}

type CustomValidation = (args: {
  data: any;
  allData: Data;
  interfaceState: Data;
  fieldConfig: FieldConfig;
  isValid: any;
  fieldHasFocus: boolean;
  fieldIsDirty: boolean;
  triggeringEvent: string | string[];
}) => true | false | any | Promise<true | false | any>;
```

The docs sometimes call `fieldIsDirty` `isDirty`; the runtime name is `fieldIsDirty`.

Any synchronous result other than literal `true` is invalid. A non-`false` invalid result is copied to `errorCode`. A regular error is:

```js
{
  value: currentValue,
  field: fieldConfig,
  errorCode: result !== false ? result : undefined
}
```

Invalid regex strings leave the compiled regex undefined and subsequently cause a runtime exception when tested. A global type validation short-circuits regex validation.

Async validation is recognized only for a per-field `customValidation` result where `Object.prototype.toString.call(result) === "[object Promise]"`. Async results from registry or global type validation are not scheduled and are treated as non-`true` synchronous results. Requests use a module-global per-field timestamp map. While pending, the rendered field gets `isValidating: true` and main actions are disabled. Only the newest result for a path is applied. Rejections are not caught. An async invalid result creates `{ field }` and discards any error code/value. A successful result republishes the error-object closure captured when that validation began; clearing therefore depends on the in-place error deletion performed at validation start.

`silentlyGetValidationErrors()` returns synchronous errors without assigning them to the visible error state. It can still launch async validators whose resolution later changes visible errors.

On user-action full validation, the first regular or required-collection error is looked up with `document.getElementById(path)` and scrolled into view if it is outside the viewport. Field components must put the full path on a DOM `id` to support this.

### 4.18 Dirty state and undo/redo

Normal changes compare the changed value with the initial snapshot using Lodash `isEqual`. `dirtyFields[path]` is `{ oldData, newData }`. `isDirty` is true when at least one dirty key exists.

Collection actions compare serialized collection values. `updateData` instead uses strict inequality at every active non-interface path, so object/array values may be marked dirty solely because their references differ.

Undo is enabled by `enableUndo`. The initial entry is captured the first time the form is visible. Subsequent entries are added on field blur, not on every change; collection actions do not explicitly add entries. Each entry is a stable JSON string containing all-data, dirty state, dirty fields, and errors. New edits truncate redo history. When history exceeds `undoMaxDepth`, the oldest entry is shifted.

`handleUndo` and `handleRedo` restore error/dirty state and emit the selected data through `onChange`. There are no public `canUndo`/`canRedo` flags. Serialization has the same JSON limitations as the initial snapshot.

### 4.19 Form autosave

```ts
interface AutoSaveConfig {
  type: "local" | "session" | "custom" | string;
  validDataOnly?: boolean;
  get?: (id: string | number | undefined) => any;
  save?: (id: string | number | undefined, saved: SavedFormEnvelope) => void;
  remove?: (id: string | number | undefined) => void;
}

interface SavedFormEnvelope {
  data: Data;
  isDirty: boolean;
  dirtyFields: DirtyFields;
}
```

Form autosave occurs on blur. String modes save only when a full validation has no errors. Object/custom modes save all data unless `validDataOnly` is truthy. Fields with `disableAutoSave` are removed from the saved copy. Reset actions remove saved data.

At initial-data setup, saved data is loaded and expected to have the envelope shape above. If non-empty, it restores dirty metadata and force-emits `savedData.data` on a zero-delay timer. Custom storage is synchronous; returned Promises are not awaited.

Browser storage keys are `stages-form-${id}`. The storage utility checks for `sessionStorage` in session mode but always reads, writes, and removes from `localStorage`; current `"session"` mode therefore uses local storage. JSON errors are swallowed and fall back to `{}`/`"{}"`.

Local/session Form autosave does not consistently require an ID at runtime; without one it can read or write `stages-form-undefined`. Existing docs require an ID, but the component does not enforce it.

### 4.20 Fieldsets

```ts
interface FieldsetParamDefinition {
  type: string;       // compared with typeof
  required?: boolean;
  default?: any;
}

interface FieldsetDefinition {
  params: Record<string, FieldsetParamDefinition>;
  config: (args: {
    data: Data;
    asyncData: any;
    interfaceState: Data;
    params: Record<string, any>;
  }) => FieldConfig[];
  render: (args: {
    params: Record<string, any>;
    fieldProps: FormFieldProps;
    actionProps: Omit<FormActionProps, "updateData">;
  }) => React.ReactNode;
}
```

A fieldset is referenced with `{ id, type: fieldsetName, params? }`. It is normalized to a reserved `fieldset` node whose child fields come from the definition's `config` callback. Parameter values are selected only from keys declared in the definition. Missing required values and `typeof` mismatches produce `console.warn`; they do not prevent rendering. Extra supplied params are discarded.

Template expansion has precedence over fieldset expansion. Fieldset expansion has precedence over a same-named registered field type.

The fieldset renderer receives fields rooted beneath the fieldset path plus the main field/action helper families. Its `fieldProps.data` is external data, not all-data. Its action props omit `updateData`, and its disabled flag does not include pending async validation state.

### 4.21 Subforms

```ts
interface SubformConfig extends FieldConfig {
  type: "subform";
  config: FormProps["config"];
  render: React.ComponentType<FormFieldProps>;
}
```

A subform renders another `Form` with:

- the parent's field registry;
- data at the subform path;
- the parent's visibility, disabled flag, and `validateOn`;
- an ID equal to the full subform path;
- a renderer that creates `fieldConfig.render` with only nested `fieldProps`;
- change propagation through the parent's normal `handleChange`;
- a parent/child validation bridge.

Other parent features are not forwarded: fieldsets, type validations, custom events/rules, autosave, undo, interface-state initialization, throttle wait, and embedded-wizard hash settings use nested defaults unless encoded inside the nested config itself.

The parent toggles `parentRunValidation` during validated actions. The nested validation effect depends on `onValidation` rather than `parentRunValidation`; because the parent supplies a new inline callback on render, this often works indirectly but is not a stable standalone contract.

### 4.22 Embedded wizards inside `Form`

```ts
interface WizardConfig extends FieldConfig {
  type: "wizard";
  stages: StageConfig[];
}

interface StageConfig extends FieldConfig {
  type: "stage";
  fields: FieldConfig[];
}

type EmbeddedWizardNavHandler = (
  navType: "step" | "next" | "prev" | "first" | "last" | string,
  path: Path,
  stage?: string
) => void;

type EmbeddedWizardHashGetter = (
  path: Path,
  stage?: string,
  action?: "step" | "next" | "prev" | "first" | "last" | string
) => string | false;
```

The first stage becomes active unless the URL hash selects a valid stage. Hash parsing assumes a `#!` prefix by blindly removing the first two characters, then splits entries with `hashSeparator || ":"`. An entry is `${wizardPath}.${stageId}`.

Only descendants of the active stage are included in active field paths; wizard and stage container objects still shape `fieldProps.fields`. `onWizardNav` changes active state and performs no validation itself.

`getWizardNavHash(path, stage, action = "step")` returns a `#!` hash containing all active embedded wizards. `prev`/`next` return `false` when unavailable. `isWizardStepDisabled` enforces at most one forward step, optionally disables the active step, and silently validates all prior stages before allowing navigation.

The hash/navigation implementation is browser- and React-specific and has edge cases with nested wizard paths: keys beginning with the selected path are updated together using the selected wizard's stage configuration.

## 5. `Stages`

### 5.1 Role and props

`Stages` coordinates an ordered set of child render functions. Each child normally hosts a `Form`, but may render arbitrary content.

```ts
interface StagesProps {
  children: StageChild[];
  initialData?: Data;                 // default {}
  initialStep?: number;               // effective default 0
  render: (props: StagesRenderProps) => React.ReactNode;
  validateOnStepChange?: boolean;     // default true
  onChange?: (result: { data: Data; errors: Record<string, FormErrors> }) => void;
  autoSave?: boolean | "local" | "session" | StagesAutoSaveConfig; // default true; booleans have no effect
  id?: string | number;
}

interface StagesAutoSaveConfig {
  type: "local" | "session" | "custom" | string;
  validDataOnly?: boolean;
  get?: (id: string | number) => Data;
  save?: (id: string | number, data: Data) => void;
  remove?: (id: string | number) => void;
}
```

The runtime requires `children` to be an array with `.map`, and every entry is called as a function. Although `propTypes` also allows React nodes, nodes are not usable. A single non-array child also fails unless React tooling has already supplied an array.

### 5.2 Child lifecycle and contract

On mount, each child is called once in initialization mode:

```ts
interface StageChildInitProps {
  index: number;
  setStepKey: (key: any, index: number) => any;
  initializing: true;
}

type StageChild = (
  props: StageChildInitProps | StageChildProps
) => React.ReactNode;
```

Children are expected to call `setStepKey(key, index)` and return `null` while initializing. A key is stored only if that index has no entry; later attempts to rename it are ignored, although the function still returns the newly supplied key rather than the stored key.

During normal rendering, each child is called with:

```ts
interface StageChildProps {
  data: Data;                         // data for this key/index
  allData: Data;
  onChange: (changedData: Data, stepErrors: FormErrors, formId: string | number) => void;
  reset: () => void;
  onNav: (navType: StageNavType, nr?: number | string) => void;
  isActive: boolean;
  index: number;
  errors: FormErrors;                 // looked up by numeric index
  setStepKey: (key: any, index: number) => any;
}

type StageNavType = "next" | "prev" | "first" | "last" | "lastValid" | "step";
```

Normal child props do not include `initializing`; it is `undefined` after initialization.

The child is called once to update internal `activeChildren` whenever current step or data changes, and called again to build `render(...).steps`. Child render functions can therefore run more than once per logical update and should be free of side effects other than the expected callbacks.

The `activeChildren` effect depends only on current step and data, not on `children`, errors, keys, or other props. If child visibility changes for some other reason, rendered `steps` can update while the internal null guard and `stepCount` remain stale.

A child returning `null` is considered invisible and its `keys[index].visible` flag is mutated to false. Non-null children are all included in `steps`; `Stages` does not itself keep only the active child. Consumers typically pass `isActive` to a child `Form` as `isVisible` or condition their markup.

### 5.3 Step data and change propagation

Wizard data is grouped by step key when one exists, otherwise by numeric index. `getStepData(index)` returns `{}` when no data exists.

The child `onChange` is designed to receive the first three arguments of `Form.onChange`. It:

- chooses `keys[formId].key` only when `formId` can index the key array; otherwise uses `formId` directly;
- stores `stepErrors` at `errors[formId]`;
- stores `changedData` at `data[resolvedKey]`;
- emits `{ data: newData, errors }` through `Stages.onChange`;
- runs Stages-level autosave.

This mutates both existing data and errors objects before shallow-copying them into state.

### 5.4 Navigation and validity

`onNav` supports:

- `next`/`prev`: nearest visible step in that direction;
- `first`/`last`: first/last visible step;
- `lastValid`: result of the internal validity calculation;
- `step, number`: that visible numeric index;
- `step, string`: the index whose stored key equals the string.

It sets the step directly. When `validateOnStepChange` is true, an effect after a step/data change may clamp it back to the first step after the last valid one. `onChangeStep`, exposed to navigation renderers, performs its own validity gate for numeric targets. `routerProps.onChange` is raw `setCurrentStep` and bypasses `onChangeStep`.

The current validity algorithm is tied to error object insertion order and numeric IDs:

- It iterates `Object.keys(errors)`.
- An empty error object is valid; an invisible keyed step can also be considered valid.
- It assigns `lastValidStep = Number(errorKey)`, not the matching key-array index.
- Named form IDs therefore produce `NaN` for valid steps.
- Progression loops error keys but then reads `errors[index]` by iteration ordinal.

The documented pattern uses named step keys as `Form.id`, so named steps and this numeric algorithm conflict. This is a major v1 compatibility decision.

Step indices are clamped below zero to zero and above `keys.length` to `keys.length`; the latter is one past the final valid index.

### 5.5 Render contract

```ts
interface StagesRenderProps {
  navigationProps: {
    currentStep: number;
    data: Data;
    onChangeStep: (step: number | string) => void;
    errors: Record<string, FormErrors>;
    keys: Array<{ key: any; visible: boolean }>;
    stepCount: number;
    lastValidStep: number;
    reset: () => void;
  };
  progressionProps: {
    currentStep: number;
    stepCount: number;
    validSteps: number;
    percentage: number;
    data: Data;
    errors: Record<string, FormErrors>;
  };
  routerProps: {
    step: number;
    onChange: React.Dispatch<React.SetStateAction<number>>;
    keys: Array<{ key: any; visible: boolean }>;
  };
  steps: React.ReactNode[];
}
```

Before at least one active child exists, `Stages` returns `null` and does not invoke `render`.

`stepCount` is the count of non-null children, while indexes and the keys array retain original child positions. `validSteps` counts steps at/before `lastValidStep` that have an empty error object and non-empty step data. `percentage` is `100 / stepCount * validSteps`.

### 5.6 Reset and autosave

`reset()` removes saved data, restores the original `initialData` reference, sets step `0`, and emits `{ data: initialData, errors }`. It does not clear the current errors object.

On initialization, Stages autosave loads a raw wizard data object. Unlike Form autosave, there is no envelope. Custom `get` must return a non-null object synchronously because `Object.keys(savedData)` is called immediately.

On each step change callback:

- String `"local"`/`"session"` modes save only when `Object.keys(errors).length === 0`.
- Object/custom modes save when `!validDataOnly` or that same top-level condition holds.
- Because each visited form leaves an error entry even when its value is `{}`, “valid data only” usually stops saving after any step reports.

Stages and Form use the same `stages-form-${id}` storage key scheme and the same session/local implementation, so using autosave at both levels with the same ID creates collisions.

## 6. `HashRouter`

```ts
interface HashRouterProps {
  step: number;
  onChange: (step: number) => void;
  keys?: Array<{ key: any }>;
  prefix?: string;
  hashFormat?: string; // default "#!"
}
```

`HashRouter` renders `null` and synchronizes `window.location.hash` with a step.

- If `keys[step]` exists, its `key` is used.
- Otherwise the hash value is `${prefix}-${step}` when `prefix` is truthy, or the numeric index.
- On mount, a hash containing `hashFormat` is parsed. Exact non-negative integer strings become indexes; other strings are looked up by key.
- A recognized hash is canonicalized and sent to `onChange`.
- With no recognized hash, the current step is written.
- Later hash changes call `onChange`; later step changes update the hash.

`prefix` is only used when a key entry is absent; it is not prepended to an existing key. Prefix-generated values such as `step-1` cannot be parsed back unless they also appear in `keys`, because the parser has no prefix-removal logic.

The underlying `useHash` reads `window.location.hash` during state initialization, so the component is not server-render safe. Existing demos guard it with `typeof window !== "undefined"`.

## 7. Sample UI components

### 7.1 `Navigation`

`Navigation` accepts the `navigationProps` shape from `Stages`:

```ts
interface NavigationProps {
  currentStep: number;
  data: Data;
  onChangeStep: (step: number) => void;
  errors: Record<string, FormErrors>;
  lastValidStep: number;
  keys: Array<{ key: any; visible: boolean }>;
  stepCount: number;
  reset: () => void;
}
```

Only `currentStep`, `onChangeStep`, `lastValidStep`, and `keys` affect output. It renders a `<ul>` with one `<li>` per visible key. The active key is bold; locked future steps are gray; allowed inactive steps have an `onClick`. It provides no buttons, ARIA state, keyboard handling, or default step labels for missing key entries because it loops only `keys.length`.

### 7.2 `Progression`

```ts
interface ProgressionProps {
  stepCount: number;
  validSteps: number;
  percentage: number;
}
```

It renders:

```text
{validSteps} / {stepCount} ({Math.round(percentage)}%)
```

inside a `<div>`.

### 7.3 `Actions`

```ts
interface ActionConfig {
  title: React.ReactNode;
  type?: "primary" | string;
  onClick: () => void;
  validate?: boolean;
}

interface ActionsProps {
  config: ActionConfig[];
  handleActionClick: FormActionProps["handleActionClick"];
  isDisabled?: boolean;
}
```

It renders one `type="button"` button per config entry. Primary titles are wrapped in `<strong>`. Clicking calls `handleActionClick(action.onClick, action.validate)`. The helper does not expose the third reset argument through action config and does not forward other config properties to the button.

### 7.4 `Debugger`

`Debugger` accepts no props. On mount it assigns `window.stagesLogging` and never restores or removes it. `Form` and `Stages` detect that function and send state snapshots and log strings keyed by generated IDs.

It renders nothing until it receives a data snapshot, then shows a fixed-size floating inspector with selectable internal datasets and an optional Lodash path filter. Multiple debugger instances overwrite the same global function. The logger and several tracked structures mutate existing state objects, so updates are best-effort development tooling rather than a stable telemetry API.

## 8. `plainFields`

`plainFields` is this registry:

| Type key | Component | Native control/value behavior |
| --- | --- | --- |
| `text` | Input | `<input type="text">`; string changes. |
| `number` | Input | `<input type="number">`; still emits strings; displays `0` when value is undefined. |
| `email` | Input | `<input type="email">`; only requiredness is validated. |
| `password` | Input | `<input type="password">`; uses `autocomplete="current-password"`. |
| `tel` | Input | `<input type="tel">`. |
| `time` | Input | `<input type="time">`. |
| `date` | Input | `<input type="date">`. |
| `checkbox` | CheckBox | Checked from Boolean coercion; click emits literal Boolean. |
| `select` | Select | Single `<select>`; emits option value strings. |
| `radio` | RadioGroup | Radio list; click emits configured `option.value`. |
| `checkboxGroup` | CheckBoxGroup | Checkbox list; emits an array of configured values. |
| `dummy` | Dummy | No input; optionally renders label/help/error; always valid. |

All non-dummy validators share this implementation:

```js
if (config.isRequired && (value === "" || typeof value === "undefined")) {
  return false;
}
return true;
```

Consequences:

- `null`, `false`, and `[]` satisfy required validation.
- Required checkboxes do not require `true`.
- Required checkbox groups do not require a selection when their value is `[]`.
- Email, number, date, and other native types receive no semantic validation beyond requiredness.

Common presentation props are `id`, `label`, `value`, `onChange`, `onBlur`, `onFocus`, `error`, `isRequired`, `isDisabled`, `isValidating`, `prefix`, `suffix`, `secondaryText`, and `errorRenderer`. Input/select additionally use `placeholder`; option fields expect `options` with `value` and `text`.

Plain input, select, radio, and group controls put the full path on a DOM ID suitable for error scrolling. The checkbox input uses the full path. Option controls derive IDs as `${path}-${option.value}` while putting the base path on a wrapper.

The select respects `option.disabled`. Radio and checkbox-group components ignore it. None of the option components guard a missing/non-array `options` prop.

## 9. Browser, state-isolation, and lifecycle dependencies

The current engine is not just a pure React adapter. These observable dependencies must be separated or explicitly modeled in a framework-agnostic rewrite:

- DOM access for first-error scrolling.
- `window.location.hash` and hash-change listeners.
- `localStorage`/`sessionStorage` globals.
- `window.stagesLogging` debugger integration.
- React hook timing for initialization, visibility, async results, and parent/subform validation.
- React elements stored directly in the `RenderedFields` tree.
- Module-global mutable state for throttled validation, change deduplication, async validation requests, dynamic option request IDs, and randomized placeholders.

Module-global state causes collisions when multiple forms use the same field paths:

```text
latestOptionsRequestIDsPerField
pendingAsyncValidations
lastOnChange
timeoutRef
lastOnChangeData
chosenPlaceholders
```

These variables also survive component unmounts for the lifetime of the loaded module.

## 10. Compatibility and rewrite decision inventory

The following items are part of the current observable implementation but should each receive an explicit preserve/fix/remove decision for v1.

### 10.1 Public contract mismatches

1. `handleActionClick` invokes callbacks without the form-data payload described by docs/demos.
2. `Form.onChange` has eight positional arguments, many undocumented, and the interface-state argument can lag.
3. `Stages` permits nodes in `propTypes` but runtime requires an array of functions.
4. Normal Stages child renders omit the documented `initializing: false`; the property is simply absent.
5. `dirtyFields` uses `oldData`/`newData`; some docs say `oldValue`/`newValue`.
6. `validateOn` runtime accepts a function even though `propTypes` declares an array.
7. Several accepted `Form` and `Stages` props are missing from `propTypes`.

### 10.2 Correctness and consistency issues

1. Session storage checks `sessionStorage` but operates on `localStorage`.
2. Form and Stages autosave use different saved shapes and can collide on the same key.
3. Named Stages step IDs become `NaN` in last-valid-step calculation.
4. Stages “valid data only” checks top-level error keys, not whether nested error objects are empty.
5. Stages reset retains errors and can clamp to an out-of-range `keys.length` step.
6. HashRouter prefix hashes are not round-trippable and prefix is ignored when keys exist.
7. Invalid regex strings can throw during validation.
8. Async validation relies on mutable error closures; rejections are unhandled and async error codes are discarded.
9. Collection `require` rules are unimplemented and `disallow` executes a second contradictory check.
10. Count rules configured with zero are skipped.
11. Collection subfield validation contains reversed arguments; separately generated field paths partly mask it.
12. Dynamic-option blur uses local IDs where full paths are needed.
13. Config expansion is only partially recursive and mutates consumer config objects.
14. `config` is reserved but has no implemented semantics.
15. Embedded wizard hash handling assumes `#!` even though only the separator is configurable.
16. Embedded nested wizard path-prefix updates can assign an outer stage ID to descendant wizards.
17. Init validation merges the validator's wrapper object into visible errors, creating unexpected `errors` and `firstErrorField` keys.

### 10.3 State and concurrency issues

1. Six mutable module-level structures are shared by every form instance.
2. Controlled input objects and nested values can be mutated through shallow copies and Lodash `set`/`unset`/`merge`.
3. Async loaders/validators have no cancellation on unmount and no error channel.
4. `asyncDataLoader` and initial dynamic options are coupled to visibility effects and not config dependencies.
5. Render callbacks/config functions may execute repeatedly and, in Stages, child render functions execute twice per update path.
6. Undo snapshots, initial snapshots, dirty comparisons, and collection comparisons use three different equality/serialization strategies.

### 10.4 Framework boundaries to make explicit in v1

A framework-agnostic implementation will need separately specified contracts for:

- immutable form state and path operations;
- config normalization and schema/type validation;
- synchronous and asynchronous validation scheduling;
- option-loading scheduling, caching, cancellation, and errors;
- collection and embedded-wizard reducers;
- persistence adapters and saved-data schema/versioning;
- router adapters;
- focus/scroll adapters;
- renderer/field adapters for React and other frameworks;
- subscriptions/events replacing positional callback tuples;
- per-instance debugger/devtools integration.

This separation should be treated as architectural work. It must not silently change the data shapes, callback timing, validation triggers, or path semantics catalogued above without a migration decision.

## 11. Minimal canonical usage

### 11.1 Standalone form

```jsx
import React, { useState } from "react";
import { Form, plainFields } from "react-stages";

export function Example() {
  const [data, setData] = useState({});

  return (
    <Form
      id="example"
      data={data}
      fields={plainFields}
      config={{
        fields: () => [
          { id: "email", type: "email", label: "Email", isRequired: true }
        ]
      }}
      onChange={(nextData) => setData(nextData)}
      render={({ fieldProps, actionProps }) => (
        <form>
          {fieldProps.fields.email}
          <button
            type="button"
            disabled={actionProps.isDisabled}
            onClick={() => actionProps.handleActionClick(
              () => console.log(data),
              true
            )}
          >
            Submit
          </button>
        </form>
      )}
    />
  );
}
```

### 11.2 Wizard

```jsx
<Stages
  initialData={{}}
  render={({ navigationProps, progressionProps, routerProps, steps }) => (
    <>
      <Navigation {...navigationProps} />
      <Progression {...progressionProps} />
      {steps}
      {typeof window !== "undefined" && <HashRouter {...routerProps} />}
    </>
  )}
>
  {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
    const key = setStepKey("details", index);
    if (initializing) return null;

    return (
      <Form
        id={key}
        data={data}
        fields={plainFields}
        config={detailsConfig}
        onChange={onChange}
        isVisible={isActive}
        render={({ fieldProps, actionProps }) => (
          <>
            {fieldProps.fields.name}
            <button
              type="button"
              onClick={() => actionProps.handleActionClick(
                () => onNav("next"),
                true
              )}
            >
              Next
            </button>
          </>
        )}
      />
    );
  }}
</Stages>
```

The wizard example is canonical current usage, but named keys expose the current last-valid-step defect described in section 5.4.

## 12. Source map

Primary implementation files used for this specification:

- `src/lib/index.js` — package exports
- `src/lib/form/Form.js` — form engine and all nested configuration behavior
- `src/lib/form/Actions.jsx` — sample actions
- `src/lib/stages/Stages.js` — step engine
- `src/lib/stages/HashRouter.js` — hash router
- `src/lib/stages/Navigation.jsx` — sample navigation
- `src/lib/stages/Progression.jsx` — sample progression
- `src/lib/stages/Debugger.js` — debugger integration
- `src/lib/fieldsets/plain/*` — exported plain field registry
- `src/lib/utils/storage.js` — persistence adapter
- `src/lib/utils/browser.js` and `src/lib/utils/hooks.js` — browser integration

The existing `docs/pages` and `demo/pages` examples were used to identify intended invocation patterns and features, especially config templates, dynamic fields/options, collections, fieldsets, recursion, validation events, autosave, transforms, and type casting.
