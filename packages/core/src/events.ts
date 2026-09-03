import type {
  DataPath,
  NodeAddress,
  StagesEvent,
  StagesEventSource,
} from "./types.js";

export interface StagesEventInit<TPayload = never> {
  readonly payload?: TPayload;
  readonly source?: StagesEventSource;
}

function eventOptions<TPayload>(
  init: StagesEventInit<TPayload>,
): Pick<StagesEvent<TPayload>, "payload" | "source"> {
  return {
    ...(Object.prototype.hasOwnProperty.call(init, "payload") ? { payload: init.payload } : {}),
    ...(init.source === undefined ? {} : { source: init.source }),
  };
}

export function fieldEvent<TPayload = never>(
  name: string,
  path: DataPath,
  init: StagesEventInit<TPayload> = {},
): StagesEvent<TPayload> {
  return { name, target: { kind: "field", path }, ...eventOptions(init) };
}

export function nodeEvent<TPayload = never>(
  name: string,
  address: NodeAddress,
  init: StagesEventInit<TPayload> = {},
): StagesEvent<TPayload> {
  return { name, target: { kind: "node", address }, ...eventOptions(init) };
}

export function formEvent<TPayload = never>(
  name: string,
  init: StagesEventInit<TPayload> = {},
): StagesEvent<TPayload> {
  return { name, target: { kind: "form" }, ...eventOptions(init) };
}
