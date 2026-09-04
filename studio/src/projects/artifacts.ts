import { compileStudioForm, createEmptyStudioScenarioValue } from "../compiler";
import { openStudioProject, serializeStudioProject, type StudioDocumentDiagnostic, type StudioDocumentValidationOptions, type StudioFormDocument, type StudioProjectDocument } from "../document";
import { STUDIO_FIELD_DEFINITIONS, type StudioFieldKey } from "../registry";

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
  | Readonly<{ ok: false; diagnostics: readonly StudioDocumentDiagnostic[] }>;

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
    return definition === undefined ? [] : [`  ${JSON.stringify(key)}: { view: ${JSON.stringify(key)}, initialValue: ${typescriptValue(definition.value.emptyValue)}, reduce: reduceInput },`];
  });
  return `import type { FieldDefinition } from "@stages/core";\n\nconst reduceInput: NonNullable<FieldDefinition<unknown>["reduce"]> = ({ event }) =>\n  event.name === "input" ? { value: event.payload } : undefined;\n\nexport const fields = {\n${entries.join("\n")}\n} as const;\n`;
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
  return `# ${form.title}\n\nGenerated from a Stages Studio project. The generated files use public package entry points only.\n\n- \`schema.ts\`: v1 schema\n- \`fields.ts\`: field registry bindings\n- \`initial-value.ts\`: initial controlled value\n- \`scenarios.ts\`: named test fixtures\n- \`migrations.ts\`: schema-state migration skeleton\n- \`App.tsx\`: minimal controlled React integration\n`;
}

function exportFailure(form: StudioFormDocument, path: readonly (number | string)[]): StudioDocumentDiagnostic {
  return {
    code: "export.executable-binding-required",
    severity: "error",
    source: "document",
    message: "The compiled schema contains executable behavior that needs a named export binding before portable code can be generated.",
    propertyPath: path,
    formUid: form.uid,
  };
}

export function generateStudioExportBundle(project: StudioProjectDocument): StudioExportResult {
  const artifacts: StudioGeneratedArtifact[] = [{ path: "project.stages.json", mediaType: "application/json", source: serializeStudioProject(project) }];
  const diagnostics: StudioDocumentDiagnostic[] = [];
  for (const form of Object.values(project.forms).sort((left, right) => left.uid.localeCompare(right.uid))) {
    const compiled = compileStudioForm(form, project.fragments, { localization: { defaultLocale: project.project.defaultLocale, resources: project.resources } });
    const compileFailure = compiled.diagnostics.find(({ severity }) => severity === "error");
    if (compileFailure !== undefined) {
      diagnostics.push({ code: compileFailure.code, severity: "error", source: "document", message: compileFailure.message, propertyPath: compileFailure.propertyPath ?? [], formUid: form.uid, ...(compileFailure.entityUid === undefined ? {} : { entityUid: compileFailure.entityUid }) });
      continue;
    }
    const path = executablePath(compiled.schema);
    if (path !== undefined) {
      diagnostics.push(exportFailure(form, path));
      continue;
    }
    const directory = safeFileName(form.uid);
    const initialValue = form.scenarios[0]?.value ?? createEmptyStudioScenarioValue(form, project.fragments);
    artifacts.push(
      { path: `${directory}/schema.ts`, mediaType: "text/typescript", source: schemaSource(compiled.schema) },
      { path: `${directory}/fields.ts`, mediaType: "text/typescript", source: fieldsSource(compiled.expandedForm) },
      { path: `${directory}/initial-value.ts`, mediaType: "text/typescript", source: valueSource("initialValue", initialValue) },
      { path: `${directory}/scenarios.ts`, mediaType: "text/typescript", source: valueSource("scenarios", form.scenarios) },
      { path: `${directory}/migrations.ts`, mediaType: "text/typescript", source: migrationsSource(form) },
      { path: `${directory}/App.tsx`, mediaType: "text/tsx", source: reactSource() },
      { path: `${directory}/README.md`, mediaType: "text/markdown", source: readmeSource(form) },
    );
  }
  return diagnostics.length > 0 ? { ok: false, diagnostics } : { ok: true, value: { artifacts } };
}
