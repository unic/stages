import {
  computed,
  defineComponent,
  getCurrentScope,
  h,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type Component,
  type ComputedRef,
  type MaybeRefOrGetter,
  type PropType,
  type ShallowRef,
} from "vue";
import type {
  ContainerSnapshot,
  DataPath,
  DeepReadonly,
  FieldSnapshot,
  NodeAddress,
  RenderNodeSnapshot,
  StagesController,
  StagesSnapshot,
  StagesUpdate,
  ValidationSnapshot,
} from "@stages/core";

export interface VueFieldProps<TValue = unknown, TProps = Readonly<Record<string, unknown>>> {
  readonly id: string;
  readonly field: FieldSnapshot<TValue, unknown>;
  readonly props: TProps;
  readonly emit: (name: string, payload?: unknown) => void;
}

export type VueFieldView<TValue = unknown, TProps = Readonly<Record<string, unknown>>> =
  Component<VueFieldProps<TValue, TProps>>;

export interface UseStagesResult<TValue, TFields, TContext> {
  readonly controller: StagesController<TValue, TFields, TContext>;
  readonly snapshot: ShallowRef<StagesSnapshot<TValue>>;
}

function fieldId(field: FieldSnapshot): string {
  return `stages-${field.address.map((segment) => {
    const encoded = [...segment.id].map((character) => character.codePointAt(0)?.toString(16) ?? "0").join("_");
    return `${segment.kind}-${segment.id.length}-${encoded}`;
  }).join("-")}`;
}

function findField(nodes: readonly RenderNodeSnapshot[], path: DataPath): FieldSnapshot | undefined {
  for (const node of nodes) {
    if (node.kind === "field") {
      if (node.path.length === path.length && node.path.every((segment, index) => segment === path[index])) return node;
    } else {
      const nested = findField(node.nodes, path);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function findContainer(
  nodes: readonly RenderNodeSnapshot[],
  path: DataPath,
  kind: ContainerSnapshot["kind"],
): ContainerSnapshot | undefined {
  for (const node of nodes) {
    if (node.kind !== "field") {
      if (node.kind === kind && node.path.length === path.length
        && node.path.every((segment, index) => segment === path[index])) return node;
      const nested = findContainer(node.nodes, path, kind);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function valueAtPath(value: unknown, path: DataPath): unknown {
  let current = value;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Readonly<Record<string | number, unknown>>)[segment];
  }
  return current;
}

type ValueAtPath<TValue, TPath extends DataPath> = TPath extends readonly []
  ? TValue
  : TPath extends readonly [infer THead, ...infer TTail]
    ? THead extends keyof TValue
      ? TTail extends DataPath
        ? ValueAtPath<TValue[THead], TTail>
        : unknown
      : unknown
    : unknown;

type CollectionItemAtPath<TValue, TPath extends DataPath> =
  ValueAtPath<TValue, TPath> extends readonly (infer TItem)[] ? TItem : unknown;

export interface VueCollectionItemBinding<TItem> {
  readonly key: string;
  readonly index: number;
  readonly value: DeepReadonly<TItem>;
  readonly address: NodeAddress;
  readonly canRemove: boolean;
  readonly canMovePrevious: boolean;
  readonly canMoveNext: boolean;
  fieldPath(field: Extract<keyof TItem, string | number>): DataPath;
  remove(): void;
  moveTo(index: number): void;
}

export interface VueCollectionBinding<TItem> {
  readonly items: readonly VueCollectionItemBinding<TItem>[];
  readonly canAdd: boolean;
  add(value: TItem): void;
}

export interface VueWizardStageBinding {
  readonly id: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly validation: ValidationSnapshot | undefined;
}

export interface VueWizardBinding {
  readonly activeStage: string | undefined;
  readonly stages: readonly VueWizardStageBinding[];
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly canGo: boolean;
  previous(): void;
  next(): void;
  go(stage: string): void;
}

function disposeWithScope(dispose: () => void): void {
  if (getCurrentScope() !== undefined) onScopeDispose(dispose);
}

export function useStagesController<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
): ShallowRef<StagesSnapshot<TValue>> {
  const snapshot = shallowRef(controller.getSnapshot()) as ShallowRef<StagesSnapshot<TValue>>;
  const unsubscribe = controller.subscribe(() => { snapshot.value = controller.getSnapshot(); });
  disposeWithScope(unsubscribe);
  return snapshot;
}

export function useStages<TValue, TFields, TContext>(
  factory: () => StagesController<TValue, TFields, TContext>,
  input: MaybeRefOrGetter<StagesUpdate<TValue, TFields, TContext>>,
): UseStagesResult<TValue, TFields, TContext> {
  const controller = factory();
  const snapshot = useStagesController(controller);
  const stop = watch(() => toValue(input), (next) => controller.update(next), { deep: true });
  disposeWithScope(() => {
    stop();
    controller.destroy();
  });
  return { controller, snapshot };
}

export function useStagesField<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  path: DataPath,
): ComputedRef<FieldSnapshot> {
  const snapshot = useStagesController(controller);
  return computed(() => {
    const field = findField(snapshot.value.nodes, path);
    if (field === undefined) throw new Error(`Stages field does not exist at ${JSON.stringify(path)}.`);
    return field;
  });
}

export function useStagesCollection<TValue, TFields, TContext, TPath extends DataPath>(
  controller: StagesController<TValue, TFields, TContext>,
  path: TPath,
): ComputedRef<VueCollectionBinding<CollectionItemAtPath<TValue, TPath>>> {
  type TItem = CollectionItemAtPath<TValue, TPath>;
  const snapshot = useStagesController(controller);
  return computed(() => {
    const collection = findContainer(snapshot.value.nodes, path, "collection");
    if (collection === undefined) throw new Error(`Stages collection does not exist at ${JSON.stringify(path)}.`);
    const rows = collection.nodes.filter((node): node is ContainerSnapshot => node.kind === "row");
    return {
      canAdd: collection.canAdd === true,
      add(value: TItem) {
        controller.dispatch({
          name: "collection:add",
          target: { kind: "node", address: collection.address },
          payload: { value },
          source: "adapter",
        });
      },
      items: rows.map((row, index) => ({
        key: row.id,
        index,
        value: valueAtPath(snapshot.value.value, row.path) as DeepReadonly<TItem>,
        address: row.address,
        canRemove: collection.canRemove === true,
        canMovePrevious: !collection.state.disabled && index > 0,
        canMoveNext: !collection.state.disabled && index < rows.length - 1,
        fieldPath(field: Extract<keyof TItem, string | number>) { return [...row.path, field]; },
        remove() {
          controller.dispatch({ name: "collection:remove", target: { kind: "node", address: row.address }, source: "adapter" });
        },
        moveTo(nextIndex: number) {
          controller.dispatch({
            name: "collection:move",
            target: { kind: "node", address: row.address },
            payload: { to: nextIndex },
            source: "adapter",
          });
        },
      })),
    };
  });
}

export function useStagesWizard<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  path: DataPath,
): ComputedRef<VueWizardBinding> {
  const snapshot = useStagesController(controller);
  return computed(() => {
    const wizard = findContainer(snapshot.value.nodes, path, "wizard");
    if (wizard === undefined) throw new Error(`Stages wizard does not exist at ${JSON.stringify(path)}.`);
    const dispatch = (name: "wizard:previous" | "wizard:next" | "wizard:go", payload?: unknown): void => {
      controller.dispatch({
        name,
        target: { kind: "node", address: wizard.address },
        ...(payload === undefined ? {} : { payload }),
        source: "adapter",
      });
    };
    return {
      activeStage: wizard.activeStage,
      stages: wizard.nodes
        .filter((stage): stage is ContainerSnapshot => stage.kind === "stage")
        .map((stage) => ({
          id: stage.id,
          path: stage.path,
          address: stage.address,
          active: stage.active === true,
          disabled: stage.state.disabled,
          validation: stage.validation,
        })),
      canPrevious: wizard.canPrevious === true,
      canNext: wizard.canNext === true,
      canGo: wizard.canGo === true,
      previous() { dispatch("wizard:previous"); },
      next() { dispatch("wizard:next"); },
      go(stage: string) { dispatch("wizard:go", stage); },
    };
  });
}

export interface StagesFieldProps<TValue, TFields, TContext> {
  readonly controller: StagesController<TValue, TFields, TContext>;
  readonly path: DataPath;
  readonly id?: string;
}

type VueStagesFieldController = Pick<
  StagesController<unknown, Readonly<Record<string, unknown>>, unknown>,
  "getSnapshot" | "subscribe" | "dispatch"
>;

export const StagesField = defineComponent({
  name: "StagesField",
  props: {
    controller: { type: Object as PropType<VueStagesFieldController>, required: true },
    path: { type: Array as unknown as PropType<DataPath>, required: true },
    id: { type: String, required: false },
  },
  setup(props) {
    const controller = props.controller;
    const snapshot = shallowRef(controller.getSnapshot());
    disposeWithScope(controller.subscribe(() => { snapshot.value = controller.getSnapshot(); }));
    const field = computed(() => {
      const current = findField(snapshot.value.nodes, props.path);
      if (current === undefined) throw new Error(`Stages field does not exist at ${JSON.stringify(props.path)}.`);
      return current;
    });
    return () => {
      const current = field.value;
      if (current.view === undefined || current.view === null) {
        throw new Error(`Stages field view is missing at ${JSON.stringify(props.path)}.`);
      }
      return h(current.view as Component, {
        id: props.id ?? fieldId(current),
        field: current,
        props: current.props,
        emit(name: string, payload?: unknown) {
          controller.dispatch({
            name,
            target: { kind: "field", path: current.path },
            ...(payload === undefined ? {} : { payload }),
            source: "adapter",
          });
        },
      });
    };
  },
});
