import {
  fieldEvent,
  stages,
  type DataPath,
  type FieldDefinition,
  type NodeAddress,
  type RenderNodeSnapshot,
  type StagesController,
  type StagesEvent,
  type StagesSchema,
  type StagesSnapshot,
  type ValidationIssue,
} from "@stages/core";
import { bindAdapter, type AdapterHarness } from "@stages/test-kit";

interface Profile {
  name: string;
}

interface TextViewToken {
  readonly kind: "text-input";
}

const profileFields = {
  text: {
    view: { kind: "text-input" },
    initialValue: "",
    reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
      ? { value: event.payload }
      : undefined,
  } satisfies FieldDefinition<string, Readonly<Record<string, unknown>>, TextViewToken>,
} as const;

const profileSchema = {
  id: "custom-adapter-profile",
  version: 1,
  nodes: [{ kind: "field", id: "name", type: "text" }],
} as const satisfies StagesSchema<Profile, typeof profileFields>;

function createProfileController() {
  let value: Profile = { name: "Ada" };
  let controller!: StagesController<Profile, typeof profileFields>;
  controller = stages({
    schema: profileSchema,
    fields: profileFields,
    value,
    onChange(change) {
      value = change.value;
      controller.update({ value });
    },
  });
  return controller;
}

interface ConnectedAdapter<TValue> {
  readonly getSnapshot: () => StagesSnapshot<TValue>;
  readonly emit: (event: StagesEvent) => void;
  readonly destroy: () => void;
}

// source:start custom-adapter-loop
export function connectFramework<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  render: (snapshot: StagesSnapshot<TValue>) => void,
): ConnectedAdapter<TValue> {
  let active = true;
  const publish = () => {
    if (active) render(controller.getSnapshot());
  };
  const unsubscribe = controller.subscribe(publish);
  publish();

  return {
    getSnapshot: () => controller.getSnapshot(),
    emit(event) {
      if (active) controller.dispatch(event);
    },
    destroy() {
      if (!active) return;
      active = false;
      unsubscribe();
    },
  };
}
// source:end custom-adapter-loop

interface AdapterRenderNode {
  readonly key: string;
  readonly id: string;
  readonly kind: RenderNodeSnapshot["kind"];
  readonly path: DataPath;
  readonly address: NodeAddress;
  readonly visible: boolean;
  readonly disabled: boolean;
  readonly view?: unknown;
  readonly value?: unknown;
  readonly issues: readonly ValidationIssue[];
  readonly children?: readonly AdapterRenderNode[];
  readonly capabilities?: Readonly<Record<string, boolean>>;
  readonly active?: boolean;
  readonly activeStage?: string;
  readonly size?: number;
}

function addressKey(address: NodeAddress): string {
  return address.map(segment => `${segment.kind}:${segment.id.length}:${segment.id}`).join("/");
}

// source:start custom-adapter-tree
export function mapRenderTree(nodes: readonly RenderNodeSnapshot[]): readonly AdapterRenderNode[] {
  return nodes.flatMap(node => {
    if (!node.state.visible) return [];
    const common = {
      key: addressKey(node.address),
      id: node.id,
      kind: node.kind,
      path: node.path,
      address: node.address,
      visible: node.state.visible,
      disabled: node.state.disabled,
    };
    if (node.kind === "field") {
      return {
        ...common,
        view: node.view,
        value: node.value,
        issues: node.state.visibleIssues,
      };
    }
    return {
      ...common,
      issues: node.validation?.visibleIssues ?? [],
      children: mapRenderTree(node.nodes),
      ...(node.kind === "stage" ? { active: node.active === true } : {}),
      ...(node.kind === "wizard" && node.activeStage !== undefined
        ? { activeStage: node.activeStage }
        : {}),
      ...(node.kind === "collection" ? { size: node.size ?? 0 } : {}),
      capabilities: node.kind === "collection"
        ? { add: node.canAdd === true, remove: node.canRemove === true }
        : node.kind === "wizard"
          ? {
              previous: node.canPrevious === true,
              next: node.canNext === true,
              go: node.canGo === true,
            }
          : {},
    };
  });
}
// source:end custom-adapter-tree

// source:start framework-mappings
interface WritableRef<T> {
  value: T;
}

export function bindVueStyle<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  snapshot: WritableRef<StagesSnapshot<TValue>>,
): AdapterHarness<TValue> {
  return bindAdapter(controller, nextSnapshot => {
    snapshot.value = nextSnapshot;
  });
}

interface ChangeDetector {
  markForCheck(): void;
}

export class AngularStyleBinding<TValue, TFields, TContext> {
  snapshot!: StagesSnapshot<TValue>;
  readonly harness: AdapterHarness<TValue>;

  constructor(
    controller: StagesController<TValue, TFields, TContext>,
    changeDetector: ChangeDetector,
  ) {
    this.harness = bindAdapter(controller, snapshot => {
      this.snapshot = snapshot;
      changeDetector.markForCheck();
    });
  }

  emit(event: StagesEvent) {
    this.harness.emit(event);
  }

  destroy() {
    this.harness.destroy();
  }
}
// source:end framework-mappings

// source:start test-kit-harness
export function exerciseAdapterHarness() {
  const controller = createProfileController();
  const rendered: StagesSnapshot<Profile>[] = [];
  const harness: AdapterHarness<Profile> = bindAdapter(
    controller,
    snapshot => rendered.push(snapshot),
  );

  // bindAdapter has already rendered once here.
  const initial = harness.getSnapshot();
  harness.emit(fieldEvent("input", ["name"], {
    payload: "Grace",
    source: "adapter",
  }));

  return {
    controller,
    harness,
    initial,
    rendered,
    destroy() {
      // The harness borrows the controller; its owner destroys both.
      harness.destroy();
      controller.destroy();
    },
  };
}
// source:end test-kit-harness
