import type {
  ContainerSnapshot,
  DataPath,
  FieldDefinition,
  FieldSnapshot,
  RenderNodeSnapshot,
  StagesController,
  StagesSnapshot,
} from "@stages/core";

export interface DomFieldBinding {
  readonly document: Document;
  readonly id: string;
  readonly field: FieldSnapshot;
  readonly emit: (name: string, payload?: unknown) => void;
}

export interface DomFieldView {
  readonly render: (binding: DomFieldBinding) => HTMLElement;
}

export interface DomFieldProps {
  readonly label?: string;
  readonly inputType?: string;
  readonly placeholder?: string;
}

export interface MountStagesOptions<TValue> {
  readonly renderInactiveStages?: boolean;
  readonly onRender?: (snapshot: StagesSnapshot<TValue>) => void;
}

export interface MountedStages {
  render(): void;
  focus(path: DataPath, options?: FocusOptions): boolean;
  focusFirstIssue(options?: FocusOptions): boolean;
  destroy(): void;
}

function elementId(field: FieldSnapshot): string {
  const identity = field.address.map((segment) => {
    const encoded = [...segment.id].map((character) => character.codePointAt(0)?.toString(16) ?? "0").join("_");
    return `${segment.kind}-${segment.id.length}-${encoded}`;
  }).join("-");
  return `stages-${identity}`;
}

function nativeInputView(kind: "text" | "number" | "checkbox"): DomFieldView {
  return {
    render({ document, id, field, emit }) {
      const props = field.props as DomFieldProps;
      const wrapper = document.createElement("div");
      wrapper.dataset["stagesField"] = field.type;
      const input = document.createElement("input");
      input.id = id;
      input.type = kind === "text" ? props.inputType ?? "text" : kind;
      input.disabled = field.state.disabled;
      if (props.placeholder !== undefined) input.placeholder = props.placeholder;
      if (kind === "checkbox") input.checked = field.value === true;
      else input.value = field.value === undefined || field.value === null ? "" : String(field.value);

      if (props.label !== undefined) {
        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = props.label;
        wrapper.append(label);
      }
      input.addEventListener("input", () => {
        const payload = kind === "checkbox"
          ? input.checked
          : kind === "number"
            ? input.value === "" || !Number.isFinite(input.valueAsNumber) ? undefined : input.valueAsNumber
            : input.value;
        emit("input", payload);
      });
      input.addEventListener("focus", () => {
        if (!field.state.focused) emit("focus");
      });
      input.addEventListener("blur", () => emit("blur"));
      wrapper.append(input);

      if (field.state.visibleIssues.length > 0) {
        const list = document.createElement("ul");
        list.id = `${id}-issues`;
        list.setAttribute("role", "alert");
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", list.id);
        for (const issue of field.state.visibleIssues) {
          const item = document.createElement("li");
          item.textContent = issue.message ?? issue.code;
          list.append(item);
        }
        wrapper.append(list);
      }
      return wrapper;
    },
  };
}

export function createDomFields() {
  const text: FieldDefinition<string, DomFieldProps, DomFieldView> = {
    view: nativeInputView("text"),
    initialValue: "",
    reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
      ? { value: event.payload }
      : undefined,
  };
  const number: FieldDefinition<number | undefined, DomFieldProps, DomFieldView> = {
    view: nativeInputView("number"),
    reduce: ({ event }) => event.name === "input" && (typeof event.payload === "number" || event.payload === undefined)
      ? { value: event.payload }
      : undefined,
  };
  const checkbox: FieldDefinition<boolean, DomFieldProps, DomFieldView> = {
    view: nativeInputView("checkbox"),
    initialValue: false,
    reduce: ({ event }) => event.name === "input" && typeof event.payload === "boolean"
      ? { value: event.payload }
      : undefined,
  };
  return { text, number, checkbox } as const;
}

function renderNode<TValue>(
  document: Document,
  controller: StagesController<TValue, unknown, unknown>,
  node: RenderNodeSnapshot,
  options: MountStagesOptions<TValue>,
): HTMLElement | undefined {
  if (node.kind === "field") {
    const view = node.view as Partial<DomFieldView> | undefined;
    if (typeof view?.render !== "function") return undefined;
    return view.render({
      document,
      id: elementId(node),
      field: node,
      emit(name, payload) {
        controller.dispatch({
          name,
          target: { kind: "field", path: node.path },
          ...(payload === undefined ? {} : { payload }),
          source: "adapter",
        });
      },
    });
  }

  if (node.kind === "stage" && node.active === false && options.renderInactiveStages !== true) return undefined;
  const container = document.createElement("div");
  container.dataset["stagesKind"] = node.kind;
  container.dataset["stagesId"] = node.id;
  if (node.kind === "stage") container.hidden = node.active === false;
  for (const child of node.nodes) {
    const rendered = renderNode(document, controller, child, options);
    if (rendered !== undefined) container.append(rendered);
  }
  return container;
}

export function mountStages<TValue, TFields, TContext>(
  root: Element,
  controller: StagesController<TValue, TFields, TContext>,
  options: MountStagesOptions<TValue> = {},
): MountedStages {
  const document = root.ownerDocument;
  let destroyed = false;
  const compatibleController = controller as StagesController<TValue, unknown, unknown>;
  const findField = (nodes: readonly RenderNodeSnapshot[], predicate: (field: FieldSnapshot) => boolean): FieldSnapshot | undefined => {
    for (const node of nodes) {
      if (node.kind === "field") {
        if (predicate(node)) return node;
      } else {
        const nested = findField(node.nodes, predicate);
        if (nested !== undefined) return nested;
      }
    }
    return undefined;
  };
  const findMountedElement = (id: string): HTMLElement | undefined =>
    Array.from(root.querySelectorAll<HTMLElement>("[id]")).find((candidate) => candidate.id === id);
  const focusField = (field: FieldSnapshot | undefined, options?: FocusOptions): boolean => {
    if (field === undefined || destroyed) return false;
    const element = findMountedElement(elementId(field));
    if (element === undefined) return false;
    element.focus(options);
    return document.activeElement === element;
  };
  const render = (): void => {
    if (destroyed) return;
    const activeElement = document.activeElement;
    const activeId = activeElement !== null && root.contains(activeElement)
      ? activeElement.getAttribute("id") ?? undefined
      : undefined;
    const snapshot = controller.getSnapshot();
    const fragment = document.createDocumentFragment();
    for (const node of snapshot.nodes) {
      const rendered = renderNode(document, compatibleController, node, options);
      if (rendered !== undefined) fragment.append(rendered);
    }
    root.replaceChildren(fragment);
    if (activeId !== undefined && activeId.length > 0) {
      findMountedElement(activeId)?.focus({ preventScroll: true });
    }
    options.onRender?.(snapshot);
  };
  const unsubscribe = controller.subscribe(render);
  render();
  return {
    render,
    focus(path, focusOptions) {
      const field = findField(controller.getSnapshot().nodes, (candidate) =>
        candidate.path.length === path.length && candidate.path.every((segment, index) => segment === path[index]));
      return focusField(field, focusOptions);
    },
    focusFirstIssue(focusOptions) {
      const field = findField(controller.getSnapshot().nodes, (candidate) =>
        !candidate.state.disabled && candidate.state.visibleIssues.some((issue) => issue.severity === "error"));
      return focusField(field, focusOptions);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
    },
  };
}

export type { ContainerSnapshot };
