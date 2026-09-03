import { useMDXComponents as getNextraComponents } from "nextra/mdx-components";

function Wrapper({ children }) {
  return children;
}

export function useMDXComponents(components) {
  return {
    ...getNextraComponents(),
    wrapper: Wrapper,
    ...components,
  };
}
