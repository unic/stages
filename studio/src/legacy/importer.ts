import { isSafeObjectKey, isUid, toUid } from "../document/uid";
import { validateStudioProject } from "../document/validation";
import type {
  JsonObject,
  JsonValue,
  StudioFragmentDefinition,
  StudioNode,
  StudioNodeBehavior,
  Uid,
} from "../document/types";
import { parseLegacyExpression } from "../expressions/legacy-parser";
import type { StudioExpression } from "../expressions/types";
import type {
  LegacyImportDiagnostic,
  LegacyImportOptions,
  LegacyImportResult,
  LegacyStudioInput,
} from "./types";

const DEFAULT_BLOCK_TYPES = Object.freeze(["divider", "heading", "message"]);
const STRUCTURAL_KEYS = new Set([
  "id", "type", "fields", "stages", "fieldset", "min", "max", "init",
  "isRendered", "isDisabled", "computedValue",
]);
const PRESENTATION_KEYS = ["blockBorder", "blockWidth", "label", "secondaryText"] as const;

interface ImportContext {
  readonly diagnostics: LegacyImportDiagnostic[];
  readonly nodes: Record<string, StudioNode>;
  readonly usedUids: Set<string>;
  readonly fieldTypes: Set<string>;
  readonly fieldDefinitionAliases: Readonly<Record<string, { readonly key: string; readonly version: number }>>;
  readonly blockTypes: Set<string>;
  readonly fieldsets: Map<string, Record<string, unknown>>;
  readonly fragmentUids: Map<string, Uid>;
  readonly fragments: Record<Uid, StudioFragmentDefinition>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototypeValue = Object.getPrototypeOf(value) as object | null;
  return prototypeValue === Object.prototype || prototypeValue === null;
}

function emit(
  context: ImportContext,
  code: string,
  severity: "error" | "warning",
  message: string,
  path: readonly (number | string)[],
  entityUid?: Uid,
): void {
  context.diagnostics.push({ code, severity, message, path, ...(entityUid ? { entityUid } : {}) });
}

function allocateUid(context: ImportContext, kind: string, path: readonly (number | string)[]): Uid {
  const stem = `${kind}_${path.join("_")}`.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 112) || kind;
  let candidate = stem;
  let suffix = 2;
  while (context.usedUids.has(candidate) || !isUid(candidate)) candidate = `${stem.slice(0, 118)}_${suffix++}`;
  context.usedUids.add(candidate);
  return toUid(candidate);
}

function runtimeId(
  value: unknown,
  fallback: string,
  context: ImportContext,
  path: readonly (number | string)[],
): string {
  if (typeof value === "string" && value.length > 0 && value.length <= 128 && isSafeObjectKey(value)) return value;
  emit(context, "legacy.runtime-id.replaced", "warning", `Replaced invalid runtime ID with ${fallback}.`, [...path, "id"]);
  return fallback;
}

function jsonValue(
  value: unknown,
  context: ImportContext,
  path: readonly (number | string)[],
): JsonValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    emit(context, "legacy.value.non-finite", "warning", "Dropped a non-finite numeric value.", path);
    return undefined;
  }
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      emit(context, "legacy.value.invalid-date", "warning", "Dropped an invalid Date.", path);
      return undefined;
    }
    emit(context, "legacy.value.date-normalized", "warning", "Converted a Date to an ISO string.", path);
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    const output: JsonValue[] = [];
    value.forEach((child, index) => {
      const converted = jsonValue(child, context, [...path, index]);
      if (converted !== undefined) output.push(converted);
      else emit(context, "legacy.value.array-entry-dropped", "warning", "Dropped an unsupported array entry.", [...path, index]);
    });
    return output;
  }
  if (isRecord(value)) {
    const output: Record<string, JsonValue> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!isSafeObjectKey(key)) {
        emit(context, "legacy.value.unsafe-key", "error", `Dropped unsafe key ${key}.`, [...path, key]);
        continue;
      }
      const converted = jsonValue(child, context, [...path, key]);
      if (converted !== undefined) output[key] = converted;
      else emit(context, "legacy.value.property-dropped", "warning", `Dropped unsupported property ${key}.`, [...path, key]);
    }
    return output;
  }
  emit(context, "legacy.value.unsupported", "warning", `Dropped unsupported ${typeof value} value.`, path);
  return undefined;
}

function selectedObject(
  item: Record<string, unknown>,
  keys: readonly string[],
  context: ImportContext,
  path: readonly (number | string)[],
): JsonObject {
  const output: Record<string, JsonValue> = {};
  for (const key of keys) {
    if (item[key] === undefined) continue;
    const converted = jsonValue(item[key], context, [...path, key]);
    if (converted !== undefined) output[key] = converted;
  }
  return output;
}

function props(item: Record<string, unknown>, context: ImportContext, path: readonly (number | string)[]): JsonObject {
  return selectedObject(item, Object.keys(item).filter((key) => !STRUCTURAL_KEYS.has(key)), context, path);
}

function presentation(item: Record<string, unknown>, context: ImportContext, path: readonly (number | string)[]): JsonObject {
  return selectedObject(item, PRESENTATION_KEYS, context, path);
}

function legacyExpression(
  source: unknown,
  property: "computedValue" | "isRendered",
  context: ImportContext,
  path: readonly (number | string)[],
  entityUid: Uid,
): { readonly expression?: StudioExpression; readonly metadata?: JsonObject } {
  if (typeof source === "boolean") return { expression: { kind: "literal", value: source } };
  if (typeof source === "string") {
    const parsed = parseLegacyExpression(source);
    if (parsed.ok) return { expression: parsed.value };
  }
  const retainedSource = typeof source === "function" ? String(source) : String(source ?? "");
  emit(
    context,
    "legacy.expression.unsupported",
    "error",
    `Retained unsupported ${property} source as inert migration metadata.`,
    [...path, property],
    entityUid,
  );
  return { metadata: { unsupportedExpressions: [{ property, source: retainedSource }] } };
}

function behaviorAndLegacy(
  item: Record<string, unknown>,
  context: ImportContext,
  path: readonly (number | string)[],
  entityUid: Uid,
): { readonly behavior?: StudioNodeBehavior; readonly computed?: StudioExpression; readonly legacy?: JsonObject } {
  const behavior: { when?: StudioExpression; disabled?: boolean | StudioExpression } = {};
  const metadata: Record<string, JsonValue> = {};
  let computed: StudioExpression | undefined;
  if (item["isDisabled"] !== undefined) behavior.disabled = Boolean(item["isDisabled"]);
  if (item["isRendered"] !== undefined) {
    const parsed = legacyExpression(item["isRendered"], "isRendered", context, path, entityUid);
    if (parsed.expression) behavior.when = parsed.expression;
    if (parsed.metadata) Object.assign(metadata, parsed.metadata);
  }
  if (item["computedValue"] !== undefined) {
    const parsed = legacyExpression(item["computedValue"], "computedValue", context, path, entityUid);
    computed = parsed.expression;
    if (parsed.metadata) {
      const existing = metadata["unsupportedExpressions"];
      const incoming = parsed.metadata["unsupportedExpressions"];
      metadata["unsupportedExpressions"] = [
        ...(Array.isArray(existing) ? existing : []),
        ...(Array.isArray(incoming) ? incoming : []),
      ];
    }
  }
  return {
    ...(Object.keys(behavior).length > 0 ? { behavior } : {}),
    ...(computed ? { computed } : {}),
    ...(Object.keys(metadata).length > 0 ? { legacy: metadata } : {}),
  };
}

function normalizedFieldsetNodes(item: Record<string, unknown>, fieldset: Record<string, unknown>): unknown[] {
  const config = Array.isArray(fieldset["config"]) ? fieldset["config"] : [];
  const first = config[0];
  if (config.length === 1 && isRecord(first) && first["type"] === "group"
    && (first["id"] === item["id"] || first["id"] === item["fieldset"] || first["id"] === fieldset["id"])) {
    return Array.isArray(first["fields"]) ? first["fields"] : [];
  }
  return config;
}

function importNodes(
  input: unknown,
  context: ImportContext,
  path: readonly (number | string)[],
): Uid[] {
  if (!Array.isArray(input)) {
    emit(context, "legacy.nodes.invalid", "error", "Expected an array of legacy nodes.", path);
    return [];
  }
  const output: Uid[] = [];
  input.forEach((itemUnknown, index) => {
    const itemPath = [...path, index];
    if (!isRecord(itemUnknown)) {
      emit(context, "legacy.node.invalid", "error", "Ignored a non-object legacy node.", itemPath);
      return;
    }
    const item = itemUnknown;
    const type = typeof item["type"] === "string" ? item["type"] : "unknown";
    const fallbackId = `node${index + 1}`;
    const id = runtimeId(item["id"], fallbackId, context, itemPath);
    const uid = allocateUid(context, type, [...path, id, index]);
    const common = {
      uid,
      presentation: presentation(item, context, itemPath),
      ...behaviorAndLegacy(item, context, itemPath, uid),
    };
    const explicitFieldset = type === "fieldset" && typeof item["fieldset"] === "string" ? item["fieldset"] : undefined;
    const implicitFieldset = context.fieldsets.has(type) ? type : undefined;
    const fieldsetId = explicitFieldset ?? implicitFieldset;
    if (fieldsetId) {
      const fragmentUid = context.fragmentUids.get(fieldsetId);
      if (!fragmentUid) {
        emit(context, "legacy.fieldset.missing", "error", `Could not resolve fieldset ${fieldsetId}.`, itemPath, uid);
      }
      context.nodes[uid] = {
        ...common,
        kind: "fragment",
        runtimeId: id,
        fragmentUid: fragmentUid ?? toUid("missing_fragment"),
        legacy: { ...(common.legacy ?? {}), fieldsetId, fieldsetEncoding: explicitFieldset ? "explicit" : "poc-type" },
      };
      output.push(uid);
      return;
    }
    if (type === "group") {
      context.nodes[uid] = { ...common, kind: "group", runtimeId: id, childUids: importNodes(item["fields"], context, [...itemPath, "fields"]) };
    } else if (type === "collection") {
      context.nodes[uid] = {
        ...common,
        kind: "collection",
        runtimeId: id,
        childUids: importNodes(item["fields"], context, [...itemPath, "fields"]),
        ...(Number.isInteger(item["min"]) && (item["min"] as number) >= 0 ? { min: item["min"] as number } : {}),
        ...(Number.isInteger(item["max"]) && (item["max"] as number) >= 0 ? { max: item["max"] as number } : {}),
        initialRows: item["init"] === true ? Math.max(1, typeof item["min"] === "number" ? item["min"] : 0) : 0,
      };
    } else if (type === "wizard") {
      const stages = Array.isArray(item["stages"]) ? item["stages"] : [];
      const stageUids = stages.flatMap((stageUnknown, stageIndex) => {
        const stagePath = [...itemPath, "stages", stageIndex];
        if (!isRecord(stageUnknown)) {
          emit(context, "legacy.stage.invalid", "error", "Ignored a non-object wizard stage.", stagePath, uid);
          return [];
        }
        const stageId = runtimeId(stageUnknown["id"], `stage${stageIndex + 1}`, context, stagePath);
        const stageUid = allocateUid(context, "stage", [...path, id, stageId, stageIndex]);
        context.nodes[stageUid] = {
          uid: stageUid,
          kind: "stage",
          runtimeId: stageId,
          presentation: presentation(stageUnknown, context, stagePath),
          childUids: importNodes(stageUnknown["fields"], context, [...stagePath, "fields"]),
        };
        return [stageUid];
      });
      context.nodes[uid] = { ...common, kind: "wizard", runtimeId: id, stageUids };
    } else if (context.blockTypes.has(type)) {
      context.nodes[uid] = { ...common, kind: "block", definition: { key: `block:${type}`, version: 1 }, props: props(item, context, itemPath) };
    } else if (context.fieldTypes.has(type)) {
      const definition = context.fieldDefinitionAliases[type] ?? { key: type, version: 1 };
      context.nodes[uid] = {
        ...common,
        kind: "field",
        runtimeId: id,
        definition,
        props: props(item, context, itemPath),
        ...(item["isRequired"] === true ? { validators: [{ kind: "required", message: `${String(item["label"] ?? id)} is required.` }] } : {}),
      };
    } else {
      emit(context, "legacy.definition.unknown", "error", `Ignored unknown legacy type ${type}.`, [...itemPath, "type"], uid);
      return;
    }
    output.push(uid);
  });
  return output;
}

function localeFrom(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value["locales"]) || typeof value["locales"][0] !== "string") return "en";
  return value["locales"][0].toLowerCase();
}

export function importLegacyStudioProject(
  input: LegacyStudioInput,
  options: LegacyImportOptions,
): LegacyImportResult {
  const diagnostics: LegacyImportDiagnostic[] = [];
  const fieldsets = new Map<string, Record<string, unknown>>();
  if (Array.isArray(input.fieldsets)) input.fieldsets.forEach((fieldset) => {
    if (isRecord(fieldset) && typeof fieldset["id"] === "string") fieldsets.set(fieldset["id"], fieldset);
  });
  const context: ImportContext = {
    diagnostics,
    nodes: {},
    usedUids: new Set<string>(),
    fieldTypes: new Set(options.fieldTypes),
    fieldDefinitionAliases: options.fieldDefinitionAliases ?? {},
    blockTypes: new Set(options.blockTypes ?? DEFAULT_BLOCK_TYPES),
    fieldsets,
    fragmentUids: new Map(),
    fragments: {},
  };
  const projectUid = options.projectUid ?? toUid("legacy_project");
  const formUid = options.formUid ?? toUid("legacy_form");
  context.usedUids.add(projectUid);
  context.usedUids.add(formUid);
  for (const [fieldsetId] of fieldsets) {
    const fragmentUid = allocateUid(context, "fragment", [fieldsetId]);
    context.fragmentUids.set(fieldsetId, fragmentUid);
  }
  for (const [fieldsetId, fieldset] of fieldsets) {
    const fragmentUid = context.fragmentUids.get(fieldsetId)!;
    const definitionNodes: Record<string, StudioNode> = {};
    const definitionContext: ImportContext = { ...context, nodes: definitionNodes };
    const rootNodeUids = importNodes(
      normalizedFieldsetNodes({ id: fieldsetId, fieldset: fieldsetId }, fieldset),
      definitionContext,
      ["fieldsets", fieldsetId, "config"],
    );
    context.fragments[fragmentUid] = {
      uid: fragmentUid,
      title: typeof fieldset["label"] === "string" ? fieldset["label"] : fieldsetId,
      version: 1,
      parameters: [],
      rootNodeUids,
      nodes: definitionNodes,
    };
  }
  const rootNodeUids = importNodes(input.config, context, ["config"]);
  const general = isRecord(input.generalConfig) ? input.generalConfig : {};
  const generalJson = jsonValue(general, context, ["generalConfig"]);
  const scenarioValue = input.value === undefined ? undefined : jsonValue(input.value, context, ["value"]);
  const scenarioUid = scenarioValue === undefined ? undefined : allocateUid(context, "scenario", ["imported"]);
  const candidate = {
    format: "stages-studio",
    formatVersion: 1,
    project: {
      uid: projectUid,
      title: typeof general["title"] === "string" ? general["title"] : "Imported Studio project",
      defaultLocale: localeFrom(general),
    },
    forms: {
      [formUid]: {
        uid: formUid,
        title: typeof general["title"] === "string" ? general["title"] : "Imported form",
        runtime: {
          schemaId: typeof general["slug"] === "string" ? general["slug"] : "imported-form",
          schemaVersion: 1,
        },
        rootNodeUids,
        nodes: context.nodes,
        scenarios: scenarioUid && scenarioValue !== undefined
          ? [{ uid: scenarioUid, title: "Imported data", value: scenarioValue }]
          : [],
        settings: { legacyFormMetadata: generalJson ?? {} },
      },
    },
    fragments: context.fragments,
    resources: {
      migration: { source: "studio-poc" },
      extensions: {
        legacyInterfaceState: {
          title: "Migrated interface state",
          description: "Legacy interfaceState used by core dynamics. Move adapter-only controls such as open panels out of this namespace.",
          version: 1,
          codec: { key: "json", version: 1 },
        },
      },
    },
  };
  const supportedDefinitions = Object.fromEntries([
    ...options.fieldTypes.map((key) => {
      const reference = options.fieldDefinitionAliases?.[key] ?? { key, version: 1 };
      return [reference.key, [reference.version] as const];
    }),
    ...(options.blockTypes ?? DEFAULT_BLOCK_TYPES).map((key) => [`block:${key}`, [1] as const]),
  ]);
  const validated = validateStudioProject(candidate, { supportedDefinitions });
  if (!validated.ok) {
    return {
      ok: false,
      diagnostics: [
        ...diagnostics,
        ...validated.diagnostics.map((entry) => ({
          code: entry.code,
          severity: "error" as const,
          message: entry.message,
          path: entry.propertyPath,
          ...(entry.entityUid ? { entityUid: entry.entityUid } : {}),
        })),
      ],
    };
  }
  return { ok: true, value: validated.value, diagnostics: Object.freeze(diagnostics.slice()) };
}
