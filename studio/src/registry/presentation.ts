import type { JsonObject, JsonValue, StudioBlockNode, StudioDefinitionRef } from "../document";

export type StudioBlockKey = "block:divider" | "block:heading" | "block:help" | "block:message";
export type StudioBreakpoint = "desktop" | "mobile" | "tablet";
export type StudioAlignment = "center" | "end" | "start" | "stretch";
export type StudioWidth = "full" | "half" | "quarter" | "third" | "two-thirds" | "three-quarters";

export interface StudioResponsiveValue<TValue extends JsonValue> extends JsonObject {
  readonly mobile: TValue;
  readonly tablet: TValue;
  readonly desktop: TValue;
}

export interface StudioLayoutSpec extends JsonObject {
  readonly width: StudioResponsiveValue<StudioWidth>;
  readonly columns: StudioResponsiveValue<number>;
  readonly align: StudioResponsiveValue<StudioAlignment>;
}

export interface StudioThemeTokens extends JsonObject {
  readonly background: string;
  readonly foreground: string;
  readonly muted: string;
  readonly border: string;
  readonly accent: string;
  readonly radius: string;
  readonly spacing: string;
}

export interface StudioBlockProp {
  readonly key: string;
  readonly label: string;
  readonly control: "select" | "text" | "textarea";
  readonly defaultValue: JsonValue;
  readonly options?: readonly { readonly label: string; readonly value: string }[];
}

export interface StudioBlockDefinition {
  readonly key: StudioBlockKey;
  readonly version: 1;
  readonly displayName: string;
  readonly category: "Content";
  readonly icon: string;
  readonly props: readonly StudioBlockProp[];
  readonly element: "aside" | "heading" | "separator" | "text";
  readonly accessibility: {
    readonly semanticRole: "heading" | "note" | "separator";
    readonly requiresTextAlternative: boolean;
  };
}

export const STUDIO_BREAKPOINTS = Object.freeze(["mobile", "tablet", "desktop"] as const);

export const DEFAULT_STUDIO_LAYOUT: StudioLayoutSpec = Object.freeze({
  width: Object.freeze({ mobile: "full", tablet: "full", desktop: "full" }),
  columns: Object.freeze({ mobile: 1, tablet: 1, desktop: 1 }),
  align: Object.freeze({ mobile: "stretch", tablet: "stretch", desktop: "stretch" }),
});

export const DEFAULT_STUDIO_THEME: StudioThemeTokens = Object.freeze({
  background: "#ffffff",
  foreground: "#172033",
  muted: "#667085",
  border: "#d0d5dd",
  accent: "#4f46e5",
  radius: "0.5rem",
  spacing: "1rem",
});

const heading = Object.freeze({
  key: "block:heading", version: 1, displayName: "Heading", category: "Content", icon: "heading",
  props: Object.freeze([
    { key: "text", label: "Heading", control: "text", defaultValue: "Heading" },
    { key: "level", label: "Level", control: "select", defaultValue: "2", options: [
      { label: "Heading 2", value: "2" }, { label: "Heading 3", value: "3" }, { label: "Heading 4", value: "4" },
    ] },
  ]),
  element: "heading", accessibility: Object.freeze({ semanticRole: "heading", requiresTextAlternative: true }),
} satisfies StudioBlockDefinition);

const message = Object.freeze({
  key: "block:message", version: 1, displayName: "Message", category: "Content", icon: "message-square",
  props: Object.freeze([
    { key: "text", label: "Message", control: "textarea", defaultValue: "Helpful message" },
    { key: "tone", label: "Tone", control: "select", defaultValue: "info", options: [
      { label: "Information", value: "info" }, { label: "Success", value: "success" },
      { label: "Warning", value: "warning" }, { label: "Error", value: "error" },
    ] },
  ]),
  element: "aside", accessibility: Object.freeze({ semanticRole: "note", requiresTextAlternative: true }),
} satisfies StudioBlockDefinition);

const divider = Object.freeze({
  key: "block:divider", version: 1, displayName: "Divider", category: "Content", icon: "minus",
  props: Object.freeze([{ key: "label", label: "Label", control: "text", defaultValue: "" }]),
  element: "separator", accessibility: Object.freeze({ semanticRole: "separator", requiresTextAlternative: false }),
} satisfies StudioBlockDefinition);

const help = Object.freeze({
  key: "block:help", version: 1, displayName: "Help text", category: "Content", icon: "circle-help",
  props: Object.freeze([{ key: "text", label: "Help text", control: "textarea", defaultValue: "Add guidance here." }]),
  element: "text", accessibility: Object.freeze({ semanticRole: "note", requiresTextAlternative: true }),
} satisfies StudioBlockDefinition);

export const STUDIO_BLOCK_DEFINITIONS = Object.freeze({ heading, message, divider, help });

export function studioBlockDefinition(reference: StudioDefinitionRef): StudioBlockDefinition | undefined {
  const definition = Object.values(STUDIO_BLOCK_DEFINITIONS).find(({ key }) => key === reference.key);
  return definition?.version === reference.version ? definition : undefined;
}

export function createStudioBlockNode(
  definition: StudioBlockDefinition,
  uid: StudioBlockNode["uid"],
): StudioBlockNode {
  return {
    uid,
    kind: "block",
    definition: { key: definition.key, version: definition.version },
    props: Object.fromEntries(definition.props.map(({ key, defaultValue }) => [key, defaultValue])) as JsonObject,
    presentation: { layout: DEFAULT_STUDIO_LAYOUT },
  };
}

const WIDTHS = new Set<StudioWidth>(["full", "half", "quarter", "third", "two-thirds", "three-quarters"]);
const ALIGNMENTS = new Set<StudioAlignment>(["center", "end", "start", "stretch"]);

export function studioLayout(value: JsonValue | undefined): StudioLayoutSpec {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return DEFAULT_STUDIO_LAYOUT;
  const record = value as JsonObject;
  const responsive = <TValue extends JsonValue>(
    candidate: JsonValue | undefined,
    fallback: StudioResponsiveValue<TValue>,
    accepts: (entry: JsonValue) => entry is TValue,
  ): StudioResponsiveValue<TValue> => {
    if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return fallback;
    const entries = candidate as JsonObject;
    if (!STUDIO_BREAKPOINTS.every((breakpoint) => accepts(entries[breakpoint] as JsonValue))) return fallback;
    return Object.freeze({
      mobile: entries["mobile"] as TValue,
      tablet: entries["tablet"] as TValue,
      desktop: entries["desktop"] as TValue,
    });
  };
  return Object.freeze({
    width: responsive(record["width"], DEFAULT_STUDIO_LAYOUT.width, (entry): entry is StudioWidth => typeof entry === "string" && WIDTHS.has(entry as StudioWidth)),
    columns: responsive(record["columns"], DEFAULT_STUDIO_LAYOUT.columns, (entry): entry is number => typeof entry === "number" && Number.isSafeInteger(entry) && entry >= 1 && entry <= 12),
    align: responsive(record["align"], DEFAULT_STUDIO_LAYOUT.align, (entry): entry is StudioAlignment => typeof entry === "string" && ALIGNMENTS.has(entry as StudioAlignment)),
  });
}

export function studioPresentationLayout(presentation: JsonObject): StudioLayoutSpec {
  if (presentation["layout"] !== undefined) return studioLayout(presentation["layout"]);
  const legacy = presentation["blockWidth"];
  if (legacy === null || typeof legacy !== "object" || Array.isArray(legacy)) return DEFAULT_STUDIO_LAYOUT;
  const widths = legacy as JsonObject;
  const width = (breakpoint: StudioBreakpoint): StudioWidth => {
    const value = widths[breakpoint];
    if (value === "small") return "quarter";
    if (value === "medium") return "half";
    return "full";
  };
  return Object.freeze({
    ...DEFAULT_STUDIO_LAYOUT,
    width: Object.freeze({ mobile: width("mobile"), tablet: width("tablet"), desktop: width("desktop") }),
  });
}

export function studioTheme(value: JsonValue | undefined): StudioThemeTokens {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return DEFAULT_STUDIO_THEME;
  const candidate = value as JsonObject;
  if (!Object.keys(DEFAULT_STUDIO_THEME).every((key) => typeof candidate[key] === "string")) return DEFAULT_STUDIO_THEME;
  return Object.freeze(Object.fromEntries(Object.keys(DEFAULT_STUDIO_THEME).map((key) => [key, candidate[key]])) as unknown as StudioThemeTokens);
}
