import { STUDIO_SUPPORTED_DEFINITIONS } from "./StudioLegacyImport";
import { describe, expect, it } from "vitest";
import { validateStudioProject } from "../../src/document/validation";
import { compileStudioForm } from "../../src/compiler";
import { STUDIO_DEMO_PROJECTS } from "./studioDemoProjects";

describe("Studio demo projects", () => {
  for (const demo of STUDIO_DEMO_PROJECTS) {
    it(`${demo.label} validates and compiles`, () => {
      const validated = validateStudioProject(demo.project, { supportedDefinitions: STUDIO_SUPPORTED_DEFINITIONS });
      expect(validated.ok, JSON.stringify(validated)).toBe(true);
      for (const form of Object.values(demo.project.forms)) {
        const compiled = compileStudioForm(form, demo.project.fragments);
        expect(compiled.diagnostics.filter(({ severity }) => severity === "error")).toEqual([]);
      }
    });
  }
});
