import type {
  StudioDocumentDiagnostic,
  StudioDocumentResult,
  StudioDocumentValidationOptions,
} from "./types";
import {
  DEFAULT_STUDIO_DOCUMENT_LIMITS,
  inspectJsonSafety,
  isPlainRecord,
  utf8ByteLength,
  validateStudioProject,
} from "./validation";

interface MigrationSuccess {
  readonly ok: true;
  readonly value: unknown;
  readonly migrations: readonly string[];
}
interface MigrationFailure {
  readonly ok: false;
  readonly diagnostics: readonly StudioDocumentDiagnostic[];
}
type MigrationResult = MigrationSuccess | MigrationFailure;
type MutableRecord = Record<string, unknown>;

function failure(code: string, message: string, propertyPath: readonly (number | string)[]): MigrationFailure {
  return { ok: false, diagnostics: [{ code, severity: "error", source: "document", message, propertyPath }] };
}

function migrateV0ToV1(input: MutableRecord): MutableRecord {
  const projectValue = isPlainRecord(input["project"]) ? input["project"] : {};
  const { locale, ...projectRest } = projectValue;
  const oldForms = isPlainRecord(input["forms"]) ? input["forms"] : {};
  const forms = Object.fromEntries(Object.entries(oldForms).map(([uid, formUnknown]) => {
    if (!isPlainRecord(formUnknown)) return [uid, formUnknown];
    return [uid, {
      ...formUnknown,
      scenarios: Array.isArray(formUnknown["scenarios"]) ? formUnknown["scenarios"] : [],
      settings: isPlainRecord(formUnknown["settings"]) ? formUnknown["settings"] : {},
    }];
  }));
  return {
    ...input,
    formatVersion: 1,
    project: { ...projectRest, defaultLocale: typeof locale === "string" ? locale : "en" },
    forms,
    fragments: isPlainRecord(input["fragments"]) ? input["fragments"] : {},
    resources: isPlainRecord(input["resources"]) ? input["resources"] : {},
  };
}

const MIGRATIONS: Readonly<Record<number, {
  readonly id: string;
  readonly migrate: (input: MutableRecord) => MutableRecord;
}>> = Object.freeze({
  0: { id: "studio-project-0-to-1", migrate: migrateV0ToV1 },
});

function migrateStudioProject(input: unknown): MigrationResult {
  if (!isPlainRecord(input) || input["format"] !== "stages-studio") {
    return failure("document.invalid-format", "format must be stages-studio.", ["format"]);
  }
  let current: unknown = input;
  const applied: string[] = [];
  const seen = new Set<number>();
  while (isPlainRecord(current) && current["formatVersion"] !== 1) {
    const version = current["formatVersion"];
    if (!Number.isSafeInteger(version) || (version as number) < 0) {
      return failure("document.invalid-format-version", "formatVersion must be a non-negative integer.", ["formatVersion"]);
    }
    if (seen.has(version as number)) {
      return failure("document.migration-cycle", "Project-format migration did not advance the version.", ["formatVersion"]);
    }
    seen.add(version as number);
    const step = MIGRATIONS[version as number];
    if (!step) return failure("document.unsupported-format-version", `No migration is available from formatVersion ${version}.`, ["formatVersion"]);
    current = step.migrate(current);
    applied.push(step.id);
  }
  return { ok: true, value: current, migrations: applied };
}

export function openStudioProject(
  source: string | unknown,
  options: StudioDocumentValidationOptions = {},
): StudioDocumentResult {
  const maxBytes = options.limits?.maxBytes ?? DEFAULT_STUDIO_DOCUMENT_LIMITS.maxBytes;
  if (typeof source === "string" && utf8ByteLength(source) > maxBytes) {
    return failure("document.size-limit", `Encoded project exceeds the ${maxBytes}-byte defensive limit.`, []);
  }
  let parsed: unknown = source;
  if (typeof source === "string") {
    try { parsed = JSON.parse(source) as unknown; }
    catch { return failure("document.invalid-json", "Project source is not valid JSON.", []); }
  }
  const safetyFailures = inspectJsonSafety(
    parsed,
    maxBytes,
    options.limits?.maxJsonDepth ?? DEFAULT_STUDIO_DOCUMENT_LIMITS.maxJsonDepth,
  );
  if (safetyFailures.length > 0) return { ok: false, diagnostics: safetyFailures };
  const migrated = migrateStudioProject(parsed);
  if (!migrated.ok) return migrated;
  const validated = validateStudioProject(migrated.value, options);
  return validated.ok ? { ...validated, migrations: migrated.migrations } : validated;
}
