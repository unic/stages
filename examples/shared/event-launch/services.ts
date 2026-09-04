import type { EventLaunchContext } from "./model.js";
import type { ValidationCancellationSignal } from "@stages/core";

export type SlugAvailability = "available" | "reserved";

export function checkSlugAvailability(
  slug: string,
  context: EventLaunchContext,
  signal: ValidationCancellationSignal,
): Promise<SlugAvailability> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      if (slug === "service-failure") {
        reject(new Error("Deterministic example service failure"));
        return;
      }
      resolve(context.reservedSlugs.has(slug) ? "reserved" : "available");
    }, context.validationDelayMs);
    const unsubscribe = signal.onCancel(() => {
      clearTimeout(timer);
      resolve("available");
    });
  });
}
