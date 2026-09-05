import type { ValidationContext } from "@stages/core";
import type {
  StudioDefinitionRef,
} from "../document/index.js";

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

