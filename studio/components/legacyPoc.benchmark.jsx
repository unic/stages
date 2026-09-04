import { cleanup, render } from "@testing-library/react";
import { expect, it } from "vitest";
import { StudioV1Form } from "./v1/StudioV1Preview";
import { convertLegacyConfig } from "./v1/legacyConfig.mjs";

const largeConfig = Array.from({ length: 1_000 }, (_, index) => ({
  id: `field${index + 1}`,
  type: "text",
  label: `Field ${index + 1}`,
}));

it("records the legacy POC 1,000-field conversion and render baseline", () => {
  const conversionStart = performance.now();
  const converted = convertLegacyConfig(largeConfig, { fieldTypes: ["text"] });
  const conversionMs = performance.now() - conversionStart;

  const renderStart = performance.now();
  const result = render(
    <StudioV1Form
      config={largeConfig}
      value={{}}
      onChange={() => {}}
      previewSize="desktop"
      editor
    />,
  );
  const renderMs = performance.now() - renderStart;
  result.unmount();
  cleanup();

  console.log(
    `[legacy-poc] 1000 fields: conversion=${conversionMs.toFixed(2)}ms render=${renderMs.toFixed(2)}ms`,
  );
  expect(converted.schema.nodes).toHaveLength(1_000);
});
