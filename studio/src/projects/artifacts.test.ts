import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import projectV0 from "../document/fixtures/project-v0.json";
import projectV1 from "../document/fixtures/project-v1.json";
import { serializeStudioProject, toUid, type StudioFieldNode, type StudioProjectDocument } from "../document";
import { fieldEvent, stages } from "@stages/core";
import { compileStudioForm } from "../compiler";
import { STUDIO_FIELD_DEFINITIONS } from "../registry";
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
    const project = structuredClone(projectV1) as unknown as StudioProjectDocument;
    const form = project.forms[toUid("form_event")]!;
    const nodes = Object.fromEntries(Object.values(STUDIO_FIELD_DEFINITIONS).map(({ key }) => [key, {
      uid: toUid(key), kind: "field" as const, runtimeId: key,
      definition: { key, version: 1 }, props: { label: key },
    }]));
    const generated = generateStudioExportBundle({ ...project, forms: { [form.uid]: {
      ...form, rootNodeUids: Object.keys(nodes).map(toUid), nodes,
    } } });
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
      types: ["node", "react"], target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true,
      jsx: "react-jsx", esModuleInterop: true, skipLibCheck: true, outDir: "dist",
    }, include: ["form_event", "run.ts"] }));
    await writeFile(join(root, "run.ts"), `import assert from "node:assert/strict";
import { fieldEvent, stages } from "@stages/core";
import { fields } from "./form_event/fields.js";
import { initialValue } from "./form_event/initial-value.js";
import { schema } from "./form_event/schema.js";
const proposals: unknown[] = [];
const controller = stages({ schema, fields, value: initialValue as unknown, onChange: change => proposals.push(change.value) });
try {
  for (const [key, definition] of Object.entries(fields)) {
    const valid = typeof definition.initialValue === "number" ? 42 : typeof definition.initialValue === "boolean" ? true : "Updated";
    for (const payload of [null, undefined, {}, [], NaN, Infinity, -Infinity, ...[true, 42, "Updated"].filter(value => typeof value !== typeof valid)]) {
      controller.dispatch(fieldEvent("input", [key], { payload }));
      await Promise.resolve();
      assert.equal(proposals.length, 0, key + " accepted invalid input");
    }
    controller.dispatch(fieldEvent("unhandled", [key], { payload: valid }));
    await Promise.resolve();
    assert.equal(proposals.length, 0);
    controller.dispatch(fieldEvent("input", [key], { payload: valid }));
    await Promise.resolve();
    assert.deepEqual(proposals.splice(0), [{ ...initialValue, [key]: valid }]);
    assert.deepEqual(controller.getSnapshot().value, initialValue);
    const accepted = { ...initialValue, [key]: valid };
    controller.update({ value: accepted });
    assert.deepEqual(controller.getSnapshot().value, accepted);
    controller.update({ value: initialValue });
  }
} finally {
  controller.destroy();
}
`);

    execFileSync(join(root, "node_modules/typescript/bin/tsc"), ["-p", join(root, "tsconfig.json")], { cwd: root, stdio: "inherit" });
    execFileSync(process.execPath, [join(root, "dist/run.js")], { cwd: root, stdio: "inherit" });
  });

  it.each(["presence", "reducer"] as const)("rejects unsupported %s behavior while preserving canonical JSON", async (capability) => {
    const project = structuredClone(projectV1) as unknown as StudioProjectDocument;
    const form = project.forms[toUid("form_event")]!;
    const field = form.nodes[toUid("field_title")] as StudioFieldNode;
    const changedField: StudioFieldNode = capability === "presence"
      ? { ...field, behavior: { presentWhen: { kind: "reference", scope: "context", path: ["showTitle"] } } }
      : { ...field, reducers: [{ id: "clear", on: "clear", actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "literal", value: "" } }] }] };
    const changedForm = { ...form, nodes: { ...form.nodes, [field.uid]: changedField } };
    const changed = { ...project, forms: { ...project.forms, [form.uid]: changedForm } };
    const compiled = compileStudioForm(changedForm, changed.fragments);
    expect(compiled.diagnostics).toEqual([]);
    const proposals: unknown[] = [];
    const controller = stages({
      schema: compiled.schemaInput, fields: compiled.fields,
      value: { event: { title: "Launch" } }, context: { showTitle: false },
      onChange: (change) => proposals.push(change.value),
    });
    try {
      if (capability === "presence") {
        expect(controller.getSnapshot().nodes[0]).toMatchObject({ id: "event", nodes: [] });
      } else {
        controller.dispatch(fieldEvent("clear", ["event", "title"]));
        await Promise.resolve();
        expect(proposals).toEqual([{ event: { title: "" } }]);
        expect(controller.getSnapshot().value).toEqual({ event: { title: "Launch" } });
      }
    } finally {
      controller.destroy();
    }
    const result = generateStudioExportBundle(changed);
    expect(result).toEqual({ ok: false, diagnostics: [expect.objectContaining({
      code: "export.executable-binding-required", formUid: form.uid,
      propertyPath: capability === "presence" ? ["schemaInput"] : ["fields", "text__studio__field_title"],
    })] });
    const imported = importStudioProject(serializeStudioProject(changed), { supportedDefinitions: definitions });
    expect(imported.ok).toBe(true);
    if (imported.ok) expect(imported.value).toEqual(changed);
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
