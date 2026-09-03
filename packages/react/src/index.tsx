import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
} from "react";
import type {
  DataPath,
  FieldSnapshot,
  RenderNodeSnapshot,
  StagesController,
  StagesSnapshot,
  StagesUpdate,
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
  }, [controller, input.value, input.context, input.schema]);
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
