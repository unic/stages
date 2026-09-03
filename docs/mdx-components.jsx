import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { StagesExample } from "./components/StagesExample";

export function useMDXComponents(components) {
  return {
    ...getThemeComponents(),
    StagesDemo: StagesExample,
    ...components,
  };
}
