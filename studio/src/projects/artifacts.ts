import { loadPortableForm, projectPortableForm, serializePortableForm } from "@stages/authoring";
import { openStudioProject, serializeStudioProject, type StudioDocumentDiagnostic, type StudioDocumentValidationOptions, type StudioFormDocument, type StudioProjectDocument } from "../document";
import { STUDIO_FIELD_DEFINITIONS, STUDIO_RUNTIME_FIELDS, type StudioFieldKey } from "../registry";

export interface StudioGeneratedArtifact {
  readonly path: string;
  readonly mediaType: "application/json" | "text/markdown" | "text/typescript" | "text/tsx";
  readonly source: string;
}

export interface StudioExportBundle {
  readonly artifacts: readonly StudioGeneratedArtifact[];
}

export type StudioExportResult =
  | Readonly<{ ok: true; value: StudioExportBundle }>
  | Readonly<{ ok: false; diagnostics: readonly StudioDocumentDiagnostic[]; artifacts: readonly StudioGeneratedArtifact[] }>;

export function importStudioProject(
  source: string,
  options: StudioDocumentValidationOptions = {},
) {
  return openStudioProject(source, options);
}

function safeFileName(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "form";
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

function executablePath(value: unknown, path: readonly (number | string)[] = []): readonly (number | string)[] | undefined {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return path;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = executablePath(value[index], [...path, index]);
      if (nested !== undefined) return nested;
    }
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const nested = executablePath(child, [...path, key]);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function typescriptValue(value: unknown): string {
  return JSON.stringify(canonicalize(value), null, 2);
}

function usedFieldKeys(form: StudioFormDocument): readonly StudioFieldKey[] {
  return [...new Set(Object.values(form.nodes).flatMap((node) => node.kind === "field" ? [node.definition.key as StudioFieldKey] : []))].sort();
}

function fieldsSource(form: StudioFormDocument): string {
  const entries = usedFieldKeys(form).flatMap((key) => {
    const definition = STUDIO_FIELD_DEFINITIONS[key];
    return definition === undefined ? [] : [`  ${JSON.stringify(key)}: { view: ${JSON.stringify(key)}, initialValue: ${typescriptValue(definition.value.emptyValue)}, reduce: inputReducer(${JSON.stringify(definition.value.kind)}) },`];
  });
  return `import type { FieldDefinition } from "@stages/core";\n\nfunction inputReducer(kind: "boolean" | "number" | "string"): NonNullable<FieldDefinition<unknown>["reduce"]> {\n  return ({ event }) => {\n    if (event.name !== "input" || typeof event.payload !== kind) return undefined;\n    if (kind === "number" && !Number.isFinite(event.payload)) return undefined;\n    return { value: event.payload };\n  };\n}\n\nexport const fields = {\n${entries.join("\n")}\n} as const;\n`;
}

function schemaSource(schema: unknown): string {
  return `import type { StagesSchema } from "@stages/core";\nimport { fields } from "./fields.js";\n\nexport const schema = ${typescriptValue(schema)} satisfies StagesSchema<unknown, typeof fields, unknown>;\n`;
}

function valueSource(name: string, value: unknown): string {
  return `export const ${name} = ${typescriptValue(value)} as const;\n`;
}

function migrationsSource(form: StudioFormDocument): string {
  return `import type { StagesStateMigration } from "@stages/core";\n\n// Add one explicit, tested step whenever schema ${JSON.stringify(form.runtime.schemaId)} advances its value shape.\nexport const migrations: readonly StagesStateMigration[] = [];\n`;
}

function reactSource(): string {
  return `"use client";\n\nimport { stages } from "@stages/core";\nimport { useStages } from "@stages/react";\nimport { useMemo, useState } from "react";\nimport { fields } from "./fields.js";\nimport { initialValue } from "./initial-value.js";\nimport { schema } from "./schema.js";\n\nexport function GeneratedStagesForm() {\n  const [value, setValue] = useState<unknown>(initialValue);\n  const input = useMemo(() => ({ schema, value }), [value]);\n  const { controller, snapshot } = useStages(\n    () => stages({ schema, fields, value, onChange: (change) => setValue(change.value) }),\n    input,\n  );\n\n  return <form onSubmit={(event) => {\n    event.preventDefault();\n    void controller.validate({ scope: "form", event: "submit", reveal: true });\n  }}>\n    <pre>{JSON.stringify(snapshot.value, null, 2)}</pre>\n    <button type="submit">Validate</button>\n  </form>;\n}\n`;
}

function readmeSource(form: StudioFormDocument): string {
  return `# ${form.title}\n\nGenerated from a Stages Studio project. The generated files use public package entry points only.\n\n- \`form.stages.json\`: versioned portable definition (load with @stages/authoring)\n- \`schema.ts\`: v1 schema\n- \`fields.ts\`: field registry bindings\n- \`initial-value.ts\`: initial controlled value\n- \`scenarios.ts\`: named test fixtures\n- \`migrations.ts\`: schema-state migration skeleton\n- \`App.tsx\`: minimal controlled React integration\n`;
}

export function generateStudioExportBundle(project: StudioProjectDocument): StudioExportResult {
  const artifacts: StudioGeneratedArtifact[] = [{ path: "project.stages.json", mediaType: "application/json", source: serializeStudioProject(project) }];
  const diagnostics: StudioDocumentDiagnostic[] = [];
  for (const form of Object.values(project.forms).sort((left, right) => left.uid.localeCompare(right.uid))) {
    const portable = projectPortableForm(project, form.uid);
    if (!portable.ok) {
      for (const failure of portable.diagnostics) diagnostics.push({ code: failure.code, severity: "error", source: "document", message: failure.message, propertyPath: failure.propertyPath ?? [], formUid: form.uid, ...(failure.entityUid === undefined ? {} : { entityUid: failure.entityUid }) });
      continue;
    }
    const directory = safeFileName(form.uid);
    artifacts.push({ path: `${directory}/form.stages.json`, mediaType: "application/json", source: serializePortableForm(portable.value) });
    const loaded = loadPortableForm(portable.value);
    if (!loaded.ok) {
      for (const failure of loaded.diagnostics) diagnostics.push({ code: failure.code, severity: "error", source: "document", message: failure.message, propertyPath: failure.propertyPath ?? [], formUid: form.uid });
      continue;
    }
    const compiled = loaded.value;
    // Factories carry structural conditions that are absent from the static schema.
    const unsupportedField = Object.entries(compiled.fields).find(([key, definition]) =>
      !Object.hasOwn(STUDIO_RUNTIME_FIELDS, key) || definition !== STUDIO_RUNTIME_FIELDS[key]);
    const path = typeof compiled.schemaInput === "function"
      ? ["schemaInput"]
      : unsupportedField !== undefined
        ? ["fields", unsupportedField[0]]
        : executablePath(compiled.schema);
    const initialValue = portable.value.initialValue;
    if (path !== undefined) {
      artifacts.push({ path: `${directory}/portable.ts`, mediaType: "text/typescript", source: `import { loadPortableForm } from "@stages/authoring";\n\nconst result = loadPortableForm(${typescriptValue(portable.value)});\nif (!result.ok) throw new Error(JSON.stringify(result.diagnostics));\nexport const loaded = result.value;\n` });
    }
    artifacts.push(
      { path: `${directory}/schema.ts`, mediaType: "text/typescript", source: path === undefined ? schemaSource(compiled.schema) : `import { loaded } from "./portable.js";\nexport const schema = loaded.schemaInput;\n` },
      { path: `${directory}/fields.ts`, mediaType: "text/typescript", source: path === undefined ? fieldsSource(compiled.expandedForm) : `import { loaded } from "./portable.js";\nexport const fields = loaded.fields;\n` },
      { path: `${directory}/initial-value.ts`, mediaType: "text/typescript", source: valueSource("initialValue", initialValue) },
      { path: `${directory}/scenarios.ts`, mediaType: "text/typescript", source: valueSource("scenarios", form.scenarios) },
      { path: `${directory}/migrations.ts`, mediaType: "text/typescript", source: migrationsSource(form) },
      { path: `${directory}/App.tsx`, mediaType: "text/tsx", source: reactSource() },
      { path: `${directory}/README.md`, mediaType: "text/markdown", source: readmeSource(form) },
    );
  }
  if (diagnostics.length > 0) {
    artifacts.push({ path: "export-report.json", mediaType: "application/json", source: `${JSON.stringify({
      message: "The complete project is preserved in project.stages.json. Runtime code was not generated for the forms listed below. Resolve these issues before exporting their runtime code.",
      diagnostics,
    }, null, 2)}\n` });
    return { ok: false, diagnostics, artifacts };
  }
  return { ok: true, value: { artifacts } };
}
