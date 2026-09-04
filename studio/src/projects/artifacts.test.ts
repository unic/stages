import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import projectV0 from "../document/fixtures/project-v0.json";
import projectV1 from "../document/fixtures/project-v1.json";
import type { StudioProjectDocument } from "../document";
import { generateStudioExportBundle, importStudioProject } from "./artifacts";

const definitions = { text: [1] } as const;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("Studio project artifacts", () => {
  it("imports canonical JSON with migration and validation reports", () => {
    const migrated = importStudioProject(JSON.stringify(projectV0), { supportedDefinitions: definitions });
    expect(migrated.ok).toBe(true);
    if (migrated.ok) expect(migrated.migrations).toEqual(["studio-project-0-to-1"]);

    const invalid = importStudioProject("{");
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.diagnostics).toContainEqual(expect.objectContaining({ code: "document.invalid-json" }));
  });

  it("generates deterministic public-entry-point artifacts matching the golden schema", async () => {
    const first = generateStudioExportBundle(projectV1 as unknown as StudioProjectDocument);
    const second = generateStudioExportBundle(structuredClone(projectV1) as unknown as StudioProjectDocument);
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const schema = first.value.artifacts.find(({ path }) => path === "form_event/schema.ts");
    const golden = await readFile(join(process.cwd(), "src/projects/fixtures/event-launch-schema.ts.txt"), "utf8");
    expect(schema?.source).toBe(golden);
    expect(first.value.artifacts.map(({ path }) => path)).toEqual([
      "project.stages.json",
      "form_event/schema.ts",
      "form_event/fields.ts",
      "form_event/initial-value.ts",
      "form_event/scenarios.ts",
      "form_event/migrations.ts",
      "form_event/App.tsx",
      "form_event/README.md",
    ]);
    for (const artifact of first.value.artifacts.filter(({ path }) => /\.(?:ts|tsx)$/.test(path))) {
      expect(artifact.source).not.toContain("stages-studio");
    }
  });

  it("compiles and runs an isolated generated consumer", async () => {
    const generated = generateStudioExportBundle(projectV1 as unknown as StudioProjectDocument);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const root = await mkdtemp(join(tmpdir(), "stages-studio-export-"));
    temporaryDirectories.push(root);
    for (const artifact of generated.value.artifacts) {
      if (!/\.(?:ts|tsx)$/.test(artifact.path)) continue;
      const target = join(root, artifact.path);
      await mkdir(join(target, ".."), { recursive: true });
      await writeFile(target, artifact.source);
    }
    await symlink(join(process.cwd(), "node_modules"), join(root, "node_modules"), "dir");
    await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
    await writeFile(join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: {
      target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true,
      jsx: "react-jsx", esModuleInterop: true, skipLibCheck: true, outDir: "dist",
    }, include: ["form_event", "run.ts"] }));
    await writeFile(join(root, "run.ts"), `import { stages } from "@stages/core";\nimport { fields } from "./form_event/fields.js";\nimport { initialValue } from "./form_event/initial-value.js";\nimport { schema } from "./form_event/schema.js";\nconst controller = stages({ schema, fields, value: initialValue });\nif (controller.getSnapshot().nodes[0]?.id !== "event") throw new Error("generated schema did not run");\ncontroller.destroy();\n`);

    execFileSync(join(root, "node_modules/typescript/bin/tsc"), ["-p", join(root, "tsconfig.json")], { cwd: root, stdio: "pipe" });
    execFileSync(process.execPath, [join(root, "dist/run.js")], { cwd: root, stdio: "pipe" });
  });

  it("reports executable behavior instead of emitting closure-dependent source", () => {
    const project = structuredClone(projectV1) as unknown as StudioProjectDocument;
    const form = project.forms["form_event" as keyof typeof project.forms]!;
    const field = form.nodes["field_title" as keyof typeof form.nodes]!;
    const dynamic = { ...project, forms: { ...project.forms, [form.uid]: { ...form, nodes: { ...form.nodes, [field.uid]: { ...field, behavior: { disabled: { kind: "reference", scope: "context", path: ["locked"] } } } } } } } as StudioProjectDocument;
    const result = generateStudioExportBundle(dynamic);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "export.executable-binding-required" }));
  });
});
