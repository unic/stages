import type { JsonValue, SerializedStagesState, StagesController, StagesValueCodec } from "@stages/core";
import { EVENT_LAUNCH_STORAGE_KEY, type EventLaunchContext, type EventLaunchValue } from "./model.js";
import type { EventLaunchFields } from "./field-contract.js";

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function encodeDraftValue(value: unknown): JsonValue {
  if (value === undefined) return null;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Event Launch drafts cannot contain non-finite numbers.");
    return value;
  }
  if (Array.isArray(value)) return value.map(encodeDraftValue);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, encodeDraftValue(entry)]));
  throw new TypeError(`Event Launch drafts cannot encode ${typeof value}.`);
}

function decodeDraftValue(value: JsonValue): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(decodeDraftValue);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, decodeDraftValue(entry)]));
  return value;
}

/** Keeps intentionally empty numeric controls durable at the JSON boundary. */
export const eventLaunchValueCodec: StagesValueCodec<EventLaunchValue> = {
  encode: encodeDraftValue,
  decode: (value) => decodeDraftValue(value) as EventLaunchValue,
};

export function saveEventLaunchDraft<TFields extends EventLaunchFields>(
  storage: DraftStorage,
  controller: StagesController<EventLaunchValue, TFields, EventLaunchContext>,
): SerializedStagesState {
  const state = controller.serialize();
  storage.setItem(EVENT_LAUNCH_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function readEventLaunchDraft(storage: DraftStorage): SerializedStagesState | undefined {
  const saved = storage.getItem(EVENT_LAUNCH_STORAGE_KEY);
  if (saved === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null || !("format" in parsed) || parsed.format !== "stages") return undefined;
    return parsed as SerializedStagesState;
  } catch {
    return undefined;
  }
}

export function clearEventLaunchDraft(storage: DraftStorage): void {
  storage.removeItem(EVENT_LAUNCH_STORAGE_KEY);
}

export function debounceDraftSave(save: () => void, delayMs = 500): { schedule(): void; destroy(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule() {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => { timer = undefined; save(); }, delayMs);
    },
    destroy() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
