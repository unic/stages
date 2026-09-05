import type { ValidationCancellationSignal } from "@stages/core";
import type { JsonObject, StudioDefinitionRef, StudioServiceScenario } from "../document";
import type { StudioAsyncServiceRequest, StudioAsyncServiceResult, StudioAsyncServiceBindings, StudioAsyncServiceBinding } from "@stages/authoring/studio";
/** Shared authoring implementation; kept as a Studio import compatibility bridge. */
export { defineStudioAsyncServiceBindings } from "@stages/authoring/studio";
export type { StudioAsyncServiceResult, StudioAsyncServiceBindings } from "@stages/authoring/studio";

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
