import type { JsonObject, StudioResourceCatalog } from "../document/types.js";

export interface StudioLocalizationOptions {
  readonly defaultLocale: string;
  readonly resources: StudioResourceCatalog;
}

export interface StudioLocalizedValue {
  readonly value?: string;
  readonly requestedLocale: string;
  readonly resolvedLocale?: string;
  readonly fallback: boolean;
  readonly code?: "localization.fallback" | "localization.missing-message";
  readonly message?: string;
}

function baseLocale(locale: string): string | undefined {
  const separator = locale.indexOf("-");
  return separator < 0 ? undefined : locale.slice(0, separator);
}

function localeCandidates(requestedLocale: string, defaultLocale: string): readonly string[] {
  return [...new Set([
    requestedLocale,
    baseLocale(requestedLocale),
    defaultLocale,
    baseLocale(defaultLocale),
  ].filter((value): value is string => value !== undefined && value.length > 0))];
}

export function studioScenarioLocale(context: JsonObject | undefined, defaultLocale: string): string {
  const locale = context?.["locale"];
  return typeof locale === "string" && locale.length > 0 ? locale : defaultLocale;
}

export function resolveStudioMessage(
  key: string,
  requestedLocale: string,
  options: StudioLocalizationOptions,
): StudioLocalizedValue {
  for (const locale of localeCandidates(requestedLocale, options.defaultLocale)) {
    const value = options.resources.locales?.[locale]?.messages[key];
    if (typeof value !== "string") continue;
    const fallback = locale !== requestedLocale;
    return {
      value,
      requestedLocale,
      resolvedLocale: locale,
      fallback,
      ...(fallback ? {
        code: "localization.fallback" as const,
        message: `Message ${key} is unavailable in ${requestedLocale}; Studio used ${locale}.`,
      } : {}),
    };
  }
  return {
    requestedLocale,
    fallback: true,
    code: "localization.missing-message",
    message: `Message ${key} is unavailable in ${requestedLocale} and default locale ${options.defaultLocale}.`,
  };
}

export function formatStudioFieldValue(
  value: unknown,
  format: { readonly kind: "date" | "number"; readonly options?: JsonObject },
  locale: string,
): string | undefined {
  try {
    if (format.kind === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
      return new Intl.NumberFormat(locale, format.options as Intl.NumberFormatOptions | undefined).format(value);
    }
    if (typeof value !== "string" || value.length === 0) return undefined;
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return undefined;
    return new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      ...(format.options as Intl.DateTimeFormatOptions | undefined),
    }).format(date);
  } catch {
    return undefined;
  }
}
