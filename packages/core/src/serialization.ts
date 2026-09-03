import type {
  DataPath,
  JsonValue,
  SerializedStagesState,
  StagesStateMigration,
} from "./types.js";

export class SerializationError extends TypeError {
  readonly code: string;
  readonly path: DataPath;

  constructor(code: string, message: string, path: DataPath = []) {
    super(`${message} at ${JSON.stringify(path)}.`);
    this.name = "SerializationError";
    this.code = code;
    this.path = path;
  }
}

function isPlainObject(value: unknown): value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

export function encodeJson(value: unknown, path: DataPath = [], seen = new Set<object>()): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    throw new SerializationError("json.non-finite", "Non-finite number", path);
  }
  if (typeof value !== "object") {
    throw new SerializationError("json.unsupported", `Unsupported ${typeof value}`, path);
  }
  if (seen.has(value)) throw new SerializationError("json.cycle", "Cyclic value", path);
  if (!Array.isArray(value) && !isPlainObject(value)) {
    throw new SerializationError("json.object", "Unsupported object", path);
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item, index) => encodeJson(item, [...path, index], seen));
    const output: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      if (unsafeKeys.has(key)) throw new SerializationError("json.unsafe-key", `Unsafe object key \"${key}\"`, [...path, key]);
      output[key] = encodeJson(item, [...path, key], seen);
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

export function decodeJson(value: JsonValue, path: DataPath = []): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item, index) => decodeJson(item, [...path, index]));
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (unsafeKeys.has(key)) throw new SerializationError("json.unsafe-key", `Unsafe object key \"${key}\"`, [...path, key]);
    output[key] = decodeJson(item, [...path, key]);
  }
  return output;
}

function requireJson(value: unknown, path: DataPath): JsonValue {
  return encodeJson(value, path);
}

export function validateSerializedState(value: unknown): SerializedStagesState {
  if (!isPlainObject(value)) throw new SerializationError("state.envelope", "Serialized state must be an object");
  if (value["format"] !== "stages") throw new SerializationError("state.format", "Unsupported serialized format", ["format"]);
  if (value["formatVersion"] !== 1) throw new SerializationError("state.format-version", "Unsupported serialized format version", ["formatVersion"]);
  const schema = value["schema"];
  if (!isPlainObject(schema) || typeof schema["id"] !== "string") {
    throw new SerializationError("state.schema", "Serialized schema id must be a string", ["schema", "id"]);
  }
  if (!Number.isSafeInteger(schema["version"]) || (schema["version"] as number) < 1) {
    throw new SerializationError("state.schema", "Serialized schema version must be a positive safe integer", ["schema", "version"]);
  }
  const meta = value["meta"];
  if (!isPlainObject(meta)) throw new SerializationError("state.meta", "Serialized metadata must be an object", ["meta"]);

  return {
    format: "stages",
    formatVersion: 1,
    schema: { id: schema["id"], version: schema["version"] as number },
    value: requireJson(value["value"], ["value"]),
    baseline: requireJson(value["baseline"], ["baseline"]),
    meta: requireJson(meta, ["meta"]) as Readonly<Record<string, JsonValue>>,
  };
}

export function migrateSerializedState(
  input: SerializedStagesState,
  migrations: readonly StagesStateMigration[],
): SerializedStagesState {
  let state = validateSerializedState(input);
  const visited = new Set<number>();

  while (true) {
    if (visited.has(state.schema.version)) {
      throw new SerializationError("migration.cycle", "Schema migration cycle detected", ["schema", "version"]);
    }
    visited.add(state.schema.version);
    const matches = migrations.filter((migration) =>
      migration.schemaId === state.schema.id && migration.fromVersion === state.schema.version);
    if (matches.length === 0) return state;
    if (matches.length > 1) {
      throw new SerializationError("migration.ambiguous", `Multiple migrations start at schema version ${state.schema.version}`, ["schema", "version"]);
    }
    const migration = matches[0];
    if (migration === undefined || migration.toVersion <= migration.fromVersion) {
      throw new SerializationError("migration.version", "Migration versions must increase", ["schema", "version"]);
    }
    let migratedOutput: SerializedStagesState;
    try {
      migratedOutput = migration.migrate(state);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new SerializationError(
        "migration.failed",
        `Migration ${migration.schemaId}@${migration.fromVersion} failed: ${detail}`,
        ["schema", "version"],
      );
    }
    const migrated = validateSerializedState(migratedOutput);
    if (migrated.schema.id !== migration.schemaId || migrated.schema.version !== migration.toVersion) {
      throw new SerializationError(
        "migration.output",
        `Migration must produce ${migration.schemaId}@${migration.toVersion}`,
        ["schema"],
      );
    }
    state = migrated;
  }
}
