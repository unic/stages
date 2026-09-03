import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
} from "react";
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

export interface ReactFieldProps<TValue = unknown, TProps = Readonly<Record<string, unknown>>> {
  readonly id: string;
  readonly field: FieldSnapshot<TValue, unknown>;
  readonly props: TProps;
  readonly emit: (name: string, payload?: unknown) => void;
}

export type ReactFieldView<TValue = unknown, TProps = Readonly<Record<string, unknown>>> =
  ComponentType<ReactFieldProps<TValue, TProps>>;

export interface UseStagesResult<TValue, TFields, TContext> {
  readonly controller: StagesController<TValue, TFields, TContext>;
  readonly snapshot: StagesSnapshot<TValue>;
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

export interface ReactCollectionItemBinding<TItem> {
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

export interface ReactCollectionBinding<TItem> {
  readonly items: readonly ReactCollectionItemBinding<TItem>[];
  readonly canAdd: boolean;
  add(value: TItem): void;
}

export interface ReactWizardStageBinding {
  readonly id: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly validation: ValidationSnapshot | undefined;
}

export interface ReactWizardBinding {
  readonly activeStage: string | undefined;
  readonly stages: readonly ReactWizardStageBinding[];
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly canGo: boolean;
  previous(): void;
  next(): void;
  go(stage: string): void;
}

export function useStagesController<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
): StagesSnapshot<TValue> {
  const [snapshot, setSnapshot] = useState(() => controller.getSnapshot());
  useEffect(() => {
    setSnapshot(controller.getSnapshot());
    return controller.subscribe(() => setSnapshot(controller.getSnapshot()));
  }, [controller]);
  return snapshot;
}

export function useStages<TValue, TFields, TContext>(
  factory: () => StagesController<TValue, TFields, TContext>,
  input: StagesUpdate<TValue, TFields, TContext>,
): UseStagesResult<TValue, TFields, TContext> {
  const controllerRef = useRef<StagesController<TValue, TFields, TContext> | null>(null);
  if (controllerRef.current === null) controllerRef.current = factory();
  const controller = controllerRef.current;
  const snapshot = useStagesController(controller);

  useEffect(() => {
    controller.update(input);
  }, [controller, input.value, input.context, input.schema, input.extensions]);
  useEffect(() => () => controller.destroy(), [controller]);
  return { controller, snapshot };
}

export function useStagesField<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  path: DataPath,
): FieldSnapshot {
  const select = (snapshot: StagesSnapshot<TValue>): FieldSnapshot | undefined => findField(snapshot.nodes, path);
  const [field, setField] = useState(() => select(controller.getSnapshot()));
  const pathKey = JSON.stringify(path);
  useEffect(() => {
    setField(select(controller.getSnapshot()));
    return controller.subscribeSelector(select, (selection) => setField(selection));
  }, [controller, pathKey]);
  if (field === undefined) throw new Error(`Stages field does not exist at ${JSON.stringify(path)}.`);
  return field;
}

export function useStagesCollection<TValue, TFields, TContext, TPath extends DataPath>(
  controller: StagesController<TValue, TFields, TContext>,
  path: TPath,
): ReactCollectionBinding<CollectionItemAtPath<TValue, TPath>> {
  type TItem = CollectionItemAtPath<TValue, TPath>;
  const select = (snapshot: StagesSnapshot<TValue>): ContainerSnapshot | undefined =>
    findContainer(snapshot.nodes, path, "collection");
  const [collection, setCollection] = useState(() => select(controller.getSnapshot()));
  const pathKey = JSON.stringify(path);
  useEffect(() => {
    setCollection(select(controller.getSnapshot()));
    return controller.subscribeSelector(select, (selection) => setCollection(selection));
  }, [controller, pathKey]);
  if (collection === undefined) throw new Error(`Stages collection does not exist at ${JSON.stringify(path)}.`);

  const snapshot = controller.getSnapshot();
  const rows = collection.nodes.filter((node): node is ContainerSnapshot => node.kind === "row");
  return {
    canAdd: collection.canAdd === true,
    add(value) {
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
      value: valueAtPath(snapshot.value, row.path) as DeepReadonly<TItem>,
      address: row.address,
      canRemove: collection.canRemove === true,
      canMovePrevious: !collection.state.disabled && index > 0,
      canMoveNext: !collection.state.disabled && index < rows.length - 1,
      fieldPath(field) {
        return [...row.path, field];
      },
      remove() {
        controller.dispatch({ name: "collection:remove", target: { kind: "node", address: row.address }, source: "adapter" });
      },
      moveTo(nextIndex) {
        controller.dispatch({
          name: "collection:move",
          target: { kind: "node", address: row.address },
          payload: { to: nextIndex },
          source: "adapter",
        });
      },
    })),
  };
}

export function useStagesWizard<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  path: DataPath,
): ReactWizardBinding {
  const select = (snapshot: StagesSnapshot<TValue>): ContainerSnapshot | undefined =>
    findContainer(snapshot.nodes, path, "wizard");
  const [wizard, setWizard] = useState(() => select(controller.getSnapshot()));
  const pathKey = JSON.stringify(path);
  useEffect(() => {
    setWizard(select(controller.getSnapshot()));
    return controller.subscribeSelector(select, (selection) => setWizard(selection));
  }, [controller, pathKey]);
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
    previous() {
      dispatch("wizard:previous");
    },
    next() {
      dispatch("wizard:next");
    },
    go(stage) {
      dispatch("wizard:go", stage);
    },
  };
}

export interface StagesFieldProps<TValue, TFields, TContext> {
  readonly controller: StagesController<TValue, TFields, TContext>;
  readonly path: DataPath;
  readonly id?: string;
}

export function StagesField<TValue, TFields, TContext>({
  controller,
  path,
  id,
}: StagesFieldProps<TValue, TFields, TContext>): ReactElement {
  const field = useStagesField(controller, path);
  if (field.view === undefined || field.view === null) {
    throw new Error(`Stages field view is missing at ${JSON.stringify(path)}.`);
  }
  const view = field.view as ReactFieldView;
  return createElement(view, {
    id: id ?? fieldId(field),
    field,
    props: field.props,
    emit(name, payload) {
      controller.dispatch({
        name,
        target: { kind: "field", path: field.path },
        ...(payload === undefined ? {} : { payload }),
        source: "adapter",
      });
    },
  });
}
