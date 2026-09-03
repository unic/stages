import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { StagesDemo } from "./components/StagesDemo";

export function useMDXComponents(components) {
  return {
    ...getThemeComponents(),
    StagesDemo,
    ...components,
  };
}
