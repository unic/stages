import type { ValidationCancellationSignal, ValidationContext } from "@stages/core";
import type {
  JsonObject,
  StudioDefinitionRef,
  StudioServiceScenario,
} from "../document";

export interface StudioAsyncServiceRequest {
  readonly input: unknown;
  readonly validation: ValidationContext<unknown, unknown>;
}

export type StudioAsyncServiceResult =
  | { readonly status: "success" }
  | {
      readonly status: "failure";
      readonly code?: string;
      readonly message?: string;
      readonly severity?: "error" | "warning";
      readonly meta?: Readonly<Record<string, unknown>>;
    };

/** Trusted executable adapter. Endpoint, credentials, retry, and cache policy stay in this closure. */
export interface StudioAsyncServiceBinding extends StudioDefinitionRef {
  invoke(request: StudioAsyncServiceRequest): Promise<StudioAsyncServiceResult>;
}

export interface StudioAsyncServiceBindings {
  resolve(reference: StudioDefinitionRef): StudioAsyncServiceBinding | undefined;
}

function bindingKey(reference: StudioDefinitionRef): string {
  return `${reference.key}@${reference.version}`;
}

/** Creates an exact-version environment registry from trusted host bindings. */
export function defineStudioAsyncServiceBindings(
  bindings: readonly StudioAsyncServiceBinding[],
): StudioAsyncServiceBindings {
  const byKey = new Map<string, StudioAsyncServiceBinding>();
  for (const binding of bindings) {
    const key = bindingKey(binding);
    if (byKey.has(key)) throw new TypeError(`Duplicate async-service binding ${key}.`);
    byKey.set(key, Object.freeze(binding));
  }
  return Object.freeze({ resolve: (reference: StudioDefinitionRef) => byKey.get(bindingKey(reference)) });
}

export const STUDIO_PREVIEW_SERVICE_EXTENSION = "__studioServiceMocks";

export function studioPreviewServiceExtensions(
  extensions: JsonObject | undefined,
  services: Readonly<Record<string, StudioServiceScenario>> | undefined,
): JsonObject {
  return { ...extensions, [STUDIO_PREVIEW_SERVICE_EXTENSION]: services ?? {} } as unknown as JsonObject;
}

function scenarioFrom(request: StudioAsyncServiceRequest, service: string): StudioServiceScenario {
  const scenarios = request.validation.meta.extensions[STUDIO_PREVIEW_SERVICE_EXTENSION];
  if (scenarios === null || typeof scenarios !== "object" || Array.isArray(scenarios)) throw new Error(`No preview response is configured for async service ${service}.`);
  const scenario = (scenarios as Readonly<Record<string, StudioServiceScenario>>)[service];
  if (scenario === undefined) throw new Error(`No preview response is configured for async service ${service}.`);
  return scenario;
}

function waitForCancellation(signal: ValidationCancellationSignal): Promise<StudioAsyncServiceResult> {
  return new Promise((resolve) => {
    let unsubscribe = () => {};
    unsubscribe = signal.onCancel(() => {
      unsubscribe();
      resolve({ status: "success" });
    });
  });
}

function response(scenario: StudioServiceScenario): StudioAsyncServiceResult {
  if (scenario.outcome === "success") return { status: "success" };
  return {
    status: "failure",
    ...(scenario.code === undefined ? {} : { code: scenario.code }),
    ...(scenario.message === undefined ? {} : { message: scenario.message }),
    ...(scenario.severity === undefined ? {} : { severity: scenario.severity }),
  };
}

/**
 * Local-only wildcard registry. It reads deterministic scenario fixtures from
 * a reserved trusted preview extension and performs no I/O. Production
 * exporters inject an exact-version registry created with
 * defineStudioAsyncServiceBindings().
 */
export const STUDIO_PREVIEW_ASYNC_SERVICE_BINDINGS: StudioAsyncServiceBindings = Object.freeze({
  resolve(reference: StudioDefinitionRef): StudioAsyncServiceBinding {
    return Object.freeze({
      ...reference,
      async invoke(request: StudioAsyncServiceRequest): Promise<StudioAsyncServiceResult> {
        const scenario = scenarioFrom(request, reference.key);
        if (scenario.outcome === "pending" || scenario.outcome === "cancelled") return waitForCancellation(request.validation.signal);
        if (scenario.outcome === "stale") {
          // Deliberately ignore cancellation to prove that core suppresses late results.
          await new Promise((resolve) => setTimeout(resolve, 20));
        } else await Promise.resolve();
        return response(scenario);
      },
    });
  },
});
