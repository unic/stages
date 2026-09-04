import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  ViewContainerRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  type OnChanges,
  type OnDestroy,
  type ComponentRef,
  type Signal,
  type SimpleChanges,
  type Type,
} from "@angular/core";
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

export interface AngularFieldBinding<TValue = unknown, TProps = Readonly<Record<string, unknown>>> {
  readonly id: string;
  readonly field: FieldSnapshot<TValue, unknown>;
  readonly props: TProps;
  readonly emit: (name: string, payload?: unknown) => void;
}

export type AngularFieldView<TValue = unknown, TProps = Readonly<Record<string, unknown>>> =
  AngularFieldBinding<TValue, TProps>;

export type AngularFieldComponent<TValue = unknown, TProps = Readonly<Record<string, unknown>>> =
  Type<AngularFieldView<TValue, TProps>>;

export interface InjectStagesResult<TValue, TFields, TContext> {
  readonly controller: StagesController<TValue, TFields, TContext>;
  readonly snapshot: Signal<StagesSnapshot<TValue>>;
}

type ValueAtPath<TValue, TPath extends DataPath> = TPath extends readonly []
  ? TValue
  : TPath extends readonly [infer THead, ...infer TTail]
    ? THead extends keyof TValue
      ? TTail extends DataPath ? ValueAtPath<TValue[THead], TTail> : unknown
      : unknown
    : unknown;

type CollectionItemAtPath<TValue, TPath extends DataPath> =
  ValueAtPath<TValue, TPath> extends readonly (infer TItem)[] ? TItem : unknown;

export interface AngularCollectionItemBinding<TItem> {
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

export interface AngularCollectionBinding<TItem> {
  readonly items: readonly AngularCollectionItemBinding<TItem>[];
  readonly canAdd: boolean;
  add(value: TItem): void;
}

export interface AngularWizardStageBinding {
  readonly id: string;
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly validation: ValidationSnapshot | undefined;
}

export interface AngularWizardBinding {
  readonly activeStage: string | undefined;
  readonly stages: readonly AngularWizardStageBinding[];
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly canGo: boolean;
  previous(): void;
  next(): void;
  go(stage: string): void;
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

function findContainer(nodes: readonly RenderNodeSnapshot[], path: DataPath, kind: ContainerSnapshot["kind"]): ContainerSnapshot | undefined {
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

export function stagesSignal<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  destroyRef: DestroyRef = inject(DestroyRef),
): Signal<StagesSnapshot<TValue>> {
  const snapshot = signal(controller.getSnapshot(), { equal: Object.is });
  const unsubscribe = controller.subscribe(() => snapshot.set(controller.getSnapshot()));
  destroyRef.onDestroy(unsubscribe);
  return snapshot.asReadonly();
}

export function injectStages<TValue, TFields, TContext>(
  factory: () => StagesController<TValue, TFields, TContext>,
  input: Signal<StagesUpdate<TValue, TFields, TContext>>,
): InjectStagesResult<TValue, TFields, TContext> {
  const destroyRef = inject(DestroyRef);
  const controller = factory();
  const snapshot = stagesSignal(controller, destroyRef);
  effect(() => {
    const next = input();
    untracked(() => controller.update(next));
  });
  destroyRef.onDestroy(() => controller.destroy());
  return { controller, snapshot };
}

export function fieldSignal<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  path: DataPath,
  destroyRef: DestroyRef = inject(DestroyRef),
): Signal<FieldSnapshot> {
  const snapshot = stagesSignal(controller, destroyRef);
  return computed(() => {
    const field = findField(snapshot().nodes, path);
    if (field === undefined) throw new Error(`Stages field does not exist at ${JSON.stringify(path)}.`);
    return field;
  });
}

export function collectionSignal<TValue, TFields, TContext, TPath extends DataPath>(
  controller: StagesController<TValue, TFields, TContext>,
  path: TPath,
  destroyRef: DestroyRef = inject(DestroyRef),
): Signal<AngularCollectionBinding<CollectionItemAtPath<TValue, TPath>>> {
  type TItem = CollectionItemAtPath<TValue, TPath>;
  const snapshot = stagesSignal(controller, destroyRef);
  return computed(() => {
    const collection = findContainer(snapshot().nodes, path, "collection");
    if (collection === undefined) throw new Error(`Stages collection does not exist at ${JSON.stringify(path)}.`);
    const rows = collection.nodes.filter((node): node is ContainerSnapshot => node.kind === "row");
    return {
      canAdd: collection.canAdd === true,
      add(value: TItem) {
        controller.dispatch({ name: "collection:add", target: { kind: "node", address: collection.address }, payload: { value }, source: "adapter" });
      },
      items: rows.map((row, index) => ({
        key: row.id,
        index,
        value: valueAtPath(snapshot().value, row.path) as DeepReadonly<TItem>,
        address: row.address,
        canRemove: collection.canRemove === true,
        canMovePrevious: !collection.state.disabled && index > 0,
        canMoveNext: !collection.state.disabled && index < rows.length - 1,
        fieldPath(field: Extract<keyof TItem, string | number>) { return [...row.path, field]; },
        remove() { controller.dispatch({ name: "collection:remove", target: { kind: "node", address: row.address }, source: "adapter" }); },
        moveTo(nextIndex: number) { controller.dispatch({ name: "collection:move", target: { kind: "node", address: row.address }, payload: { to: nextIndex }, source: "adapter" }); },
      })),
    };
  });
}

export function wizardSignal<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  path: DataPath,
  destroyRef: DestroyRef = inject(DestroyRef),
): Signal<AngularWizardBinding> {
  const snapshot = stagesSignal(controller, destroyRef);
  return computed(() => {
    const wizard = findContainer(snapshot().nodes, path, "wizard");
    if (wizard === undefined) throw new Error(`Stages wizard does not exist at ${JSON.stringify(path)}.`);
    const dispatch = (name: "wizard:previous" | "wizard:next" | "wizard:go", payload?: unknown): void => controller.dispatch({
      name,
      target: { kind: "node", address: wizard.address },
      ...(payload === undefined ? {} : { payload }),
      source: "adapter",
    });
    return {
      activeStage: wizard.activeStage,
      stages: wizard.nodes.filter((stage): stage is ContainerSnapshot => stage.kind === "stage").map((stage) => ({
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

type FieldController = Pick<StagesController<unknown>, "getSnapshot" | "subscribe" | "dispatch">;

@Component({
  selector: "stages-field",
  standalone: true,
  template: "",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagesFieldComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) controller!: FieldController;
  @Input({ required: true }) path!: DataPath;
  @Input() id?: string;

  private readonly container = inject(ViewContainerRef);
  private unsubscribe?: () => void;
  private component?: ComponentRef<AngularFieldView>;
  private view?: AngularFieldComponent;

  ngOnChanges(_changes: SimpleChanges): void {
    this.bind();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  private bind(): void {
    this.unsubscribe?.();
    this.unsubscribe = this.controller.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    const field = findField(this.controller.getSnapshot().nodes, this.path);
    if (field === undefined) throw new Error(`Stages field does not exist at ${JSON.stringify(this.path)}.`);
    if (field.view === undefined || field.view === null) throw new Error(`Stages field view is missing at ${JSON.stringify(this.path)}.`);
    const view = field.view as AngularFieldComponent;
    if (this.component === undefined || this.view !== view) {
      this.container.clear();
      this.component = this.container.createComponent(view);
      this.view = view;
    }
    this.component.setInput("id", this.id ?? fieldId(field));
    this.component.setInput("field", field);
    this.component.setInput("props", field.props);
    this.component.setInput("emit", (name: string, payload?: unknown) => this.controller.dispatch({
      name,
      target: { kind: "field", path: field.path },
      ...(payload === undefined ? {} : { payload }),
      source: "adapter",
    }));
    this.component.changeDetectorRef.detectChanges();
  }
}
