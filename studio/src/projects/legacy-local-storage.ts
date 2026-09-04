import type { LegacyStudioInput } from "../legacy";

export const LEGACY_STUDIO_STORAGE_KEY = "stages-studio-storage-0.1";

export type LegacyStudioStoragePreview =
  | { readonly kind: "absent" }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "ready"; readonly title: string; readonly blockCount: number; readonly input: LegacyStudioInput };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function previewLegacyStudioStorage(storage: Pick<Storage, "getItem">): LegacyStudioStoragePreview {
  const source = storage.getItem(LEGACY_STUDIO_STORAGE_KEY);
  if (source === null) return { kind: "absent" };
  try {
    const parsed: unknown = JSON.parse(source);
    if (!record(parsed) || !record(parsed["state"])) return { kind: "invalid", message: "Legacy Studio storage has an unsupported shape." };
    const state = parsed["state"];
    const config = state["currentConfig"];
    if (!Array.isArray(config)) return { kind: "invalid", message: "Legacy Studio storage does not contain a project configuration." };
    const generalConfig = state["generalConfig"];
    const title = record(generalConfig) && typeof generalConfig["title"] === "string"
      ? generalConfig["title"]
      : "Imported Studio project";
    return {
      kind: "ready",
      title,
      blockCount: config.length,
      input: { config, fieldsets: state["fieldsets"], generalConfig, value: state["data"] },
    };
  } catch {
    return { kind: "invalid", message: "Legacy Studio storage is not valid JSON." };
  }
}
