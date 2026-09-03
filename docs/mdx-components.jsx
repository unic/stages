import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { CheckedSource } from "./components/CheckedSource";
import { StagesExample } from "./components/StagesExample";

export function useMDXComponents(components) {
  return {
    ...getThemeComponents(),
    CheckedSource,
    StagesDemo: StagesExample,
    ...components,
  };
}
