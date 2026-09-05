import { fieldEvent, stages } from "@stages/core";
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

it("Kitchensink runs transforms, reducers, visibility, and validation against its named scenarios", async () => {
  const project = STUDIO_DEMO_PROJECTS.find(({ id }) => id === "kitchensink")!.project;
  const form = Object.values(project.forms)[0]!;
  const compiled = compileStudioForm(form, project.fragments);
  const controller = stages({
    schema: compiled.schemaInput, fields: compiled.fields, value: form.scenarios[0]!.value,
    onChange: (change) => controller.update({ value: change.value }),
  });
  try {
    expect((await controller.validate({ event: "submit" })).issues).toEqual([]);
    controller.dispatch(fieldEvent("input", ["order", "quantity"], { payload: -2 }));
    await Promise.resolve();
    expect(controller.getSnapshot().value).toMatchObject({ order: { quantity: 1, total: 25 } });
    controller.dispatch(fieldEvent("demo:discount", ["order", "discount"], { payload: 10 }));
    await Promise.resolve();
    expect(controller.getSnapshot().value).toMatchObject({ order: { discount: 10, total: 22.5 } });
    controller.update({ value: form.scenarios[1]!.value });
    expect(controller.getSnapshot().nodes.find(({ id }) => id === "company")).toBeUndefined();
    const order = controller.getSnapshot().nodes.find(({ id }) => id === "order");
    expect(order?.kind === "group" && order.nodes.some(({ id }) => id === "reference")).toBe(false);
    controller.update({ value: form.scenarios[2]!.value });
    expect(controller.getSnapshot().nodes.find(({ id }) => id === "profile")).toMatchObject({ state: { disabled: true } });
    controller.update({ value: form.scenarios[3]!.value });
    const invalid = await controller.validate({ event: "submit", reveal: true });
    expect(invalid.issues.map(({ message }) => message)).toEqual(expect.arrayContaining([
      "Enter your name.", "Use an email such as ada@example.com.", "The passwords must match.", "Enter a company name.",
    ]));
  } finally { controller.destroy(); }
});
