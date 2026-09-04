import { describe, expect, it } from "vitest";
import type { StudioResourceCatalog } from "../document";
import { formatStudioFieldValue, resolveStudioMessage } from "./index";

const resources: StudioResourceCatalog = {
  locales: {
    en: { label: "English", messages: { "field.amount": "Amount" } },
    de: { label: "Deutsch", messages: { "field.amount": "Betrag" } },
    "de-CH": { label: "Deutsch (Schweiz)", messages: {} },
  },
};

describe("Studio localization", () => {
  it("resolves exact locales, language fallbacks, defaults, and missing keys deterministically", () => {
    expect(resolveStudioMessage("field.amount", "de", { defaultLocale: "en", resources })).toMatchObject({ value: "Betrag", fallback: false });
    expect(resolveStudioMessage("field.amount", "de-CH", { defaultLocale: "en", resources })).toMatchObject({ value: "Betrag", resolvedLocale: "de", code: "localization.fallback" });
    const missing = resolveStudioMessage("field.missing", "fr-CH", { defaultLocale: "en", resources });
    expect(missing).toMatchObject({ code: "localization.missing-message" });
    expect(missing).not.toHaveProperty("value");
  });

  it("formats canonical number and date values without changing them", () => {
    expect(formatStudioFieldValue(1234.5, { kind: "number", options: { minimumFractionDigits: 2 } }, "de-CH")).toMatch(/^1['’]234\.50$/);
    expect(formatStudioFieldValue("2026-09-04", { kind: "date", options: { dateStyle: "long" } }, "de-CH")).toBe("4. September 2026");
  });
});
