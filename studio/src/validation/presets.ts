import type { StudioValidatorSpec } from "../document/types";
import { defaultStudioValidator, STUDIO_VALIDATOR_CATALOG } from "./catalog";

interface ValidationPreset {
  readonly key: string;
  readonly displayName: string;
  readonly description: string;
  readonly create: (id: string) => StudioValidatorSpec;
}

const textFields = new Set(["text", "textarea", "email", "tel", "url", "password"]);
const formats = [
  { key: "email", displayName: "Email address", description: "An email address, such as ada@example.com.", pattern: String.raw`^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$`, message: "Enter a valid email address." },
  { key: "url", displayName: "Web address", description: "A web address starting with http:// or https://.", pattern: String.raw`^https?://[^\s/?#]+(?:[/?#][^\s]*)?$`, message: "Enter a web address starting with http:// or https://." },
  { key: "phone", displayName: "Phone number", description: "7–15 digits, with optional +, spaces, brackets, or dashes.", pattern: String.raw`^\+?(?=(?:\D*\d){7,15}\D*$)[\d ()-]+$`, message: "Enter a phone number with 7–15 digits." },
  { key: "letters", displayName: "Letters only", description: "Unicode letters and spaces, for names or words.", pattern: String.raw`^[\p{L}\p{M} ]+$`, flags: "u", message: "Use letters and spaces only." },
  { key: "digits", displayName: "Digits only", description: "Digits 0–9, preserving leading zeros.", pattern: "^[0-9]+$", message: "Use digits only." },
] as const;

// Presets expand into existing validator specs; no additional persisted format.
export function studioValidationPresets(target: string): readonly ValidationPreset[] {
  const kinds: StudioValidatorSpec["kind"][] = ["required"];
  if (textFields.has(target)) kinds.push("length", "pattern");
  if (target === "number" || target === "range") kinds.push("range");
  if (target === "collection") kinds.push("collection");
  kinds.push("comparison", "service");
  const basics = kinds.map((kind) => ({ key: kind, ...STUDIO_VALIDATOR_CATALOG[kind], create: (id: string) => defaultStudioValidator(kind, id) }));
  if (!textFields.has(target)) return basics;
  return [basics[0]!, ...formats.map((format) => ({
    key: format.key, displayName: format.displayName, description: format.description,
    create: (id: string): StudioValidatorSpec => ({ ...defaultStudioValidator("pattern", id), kind: "pattern", code: format.key, pattern: format.pattern, ...("flags" in format ? { flags: format.flags } : {}), message: format.message }),
  })), ...basics.slice(1)];
}

export function studioValidatorTitle(validator: StudioValidatorSpec): string {
  const format = formats.find((entry) => validator.kind === "pattern" && validator.code === entry.key && validator.pattern === entry.pattern && (validator.flags ?? "") === ("flags" in entry ? entry.flags : ""));
  return format?.displayName ?? STUDIO_VALIDATOR_CATALOG[validator.kind].displayName;
}
