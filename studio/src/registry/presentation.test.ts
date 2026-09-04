import { describe, expect, it } from "vitest";
import { toUid } from "../document";
import {
  DEFAULT_STUDIO_LAYOUT,
  DEFAULT_STUDIO_THEME,
  STUDIO_BLOCK_DEFINITIONS,
  createStudioBlockNode,
  studioBlockDefinition,
  studioLayout,
  studioPresentationLayout,
  studioTheme,
} from "./index";

describe("Studio presentation registry", () => {
  it.each(Object.values(STUDIO_BLOCK_DEFINITIONS).map((definition) => [definition.key, definition] as const))(
    "%s has authoring and accessibility metadata",
    (key, definition) => {
      expect(studioBlockDefinition({ key, version: 1 })).toBe(definition);
      expect(definition.props.length).toBeGreaterThan(0);
      expect(definition.accessibility.semanticRole).toMatch(/heading|note|separator/);
    },
  );

  it("creates decorative nodes with explicit breakpoint layout and no runtime ID", () => {
    const node = createStudioBlockNode(STUDIO_BLOCK_DEFINITIONS.heading, toUid("block_intro"));
    expect(node).toEqual({
      uid: "block_intro",
      kind: "block",
      definition: { key: "block:heading", version: 1 },
      props: { text: "Heading", level: "2" },
      presentation: { layout: DEFAULT_STUDIO_LAYOUT },
    });
    expect(node).not.toHaveProperty("runtimeId");
  });

  it("accepts complete responsive and theme tokens and falls back atomically", () => {
    const layout = {
      width: { mobile: "full", tablet: "half", desktop: "third" },
      columns: { mobile: 1, tablet: 2, desktop: 3 },
      align: { mobile: "stretch", tablet: "center", desktop: "end" },
    } as const;
    expect(studioLayout(layout)).toEqual(layout);
    expect(studioLayout({ width: { desktop: "half" } })).toEqual(DEFAULT_STUDIO_LAYOUT);
    expect(studioPresentationLayout({ blockWidth: { mobile: "large", tablet: "medium", desktop: "small" } }).width).toEqual({
      mobile: "full", tablet: "half", desktop: "quarter",
    });
    expect(studioTheme({ ...DEFAULT_STUDIO_THEME, accent: "#ff0000" })).toEqual({
      ...DEFAULT_STUDIO_THEME, accent: "#ff0000",
    });
    expect(studioTheme({ accent: "#ff0000" })).toBe(DEFAULT_STUDIO_THEME);
  });
});
