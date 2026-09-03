import type {
  StagesController,
  StagesEvent,
  StagesSnapshot,
} from "@stages/core";

export interface AdapterHarness<TValue> {
  readonly getSnapshot: () => StagesSnapshot<TValue>;
  readonly emit: (event: StagesEvent) => void;
  readonly destroy: () => void;
}

export function bindAdapter<TValue, TFields, TContext>(
  controller: StagesController<TValue, TFields, TContext>,
  render: (snapshot: StagesSnapshot<TValue>) => void,
): AdapterHarness<TValue> {
  let destroyed = false;
  const publish = (): void => {
    if (!destroyed) render(controller.getSnapshot());
  };
  const unsubscribe = controller.subscribe(publish);
  publish();
  return {
    getSnapshot: () => controller.getSnapshot(),
    emit(event) {
      if (!destroyed) controller.dispatch(event);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
    },
  };
}
