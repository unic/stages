import {
  decodeJson,
  encodeJson,
  migrateSerializedState,
  SerializationError,
  stages,
  validateSerializedState,
  type FieldDefinition,
  type JsonValue,
  type SerializedStagesState,
  type StagesController,
  type StagesExtensionCodec,
  type StagesSchema,
  type StagesStateMigration,
  type StagesValueCodec,
} from "@stages/core";

interface TextProps {
  readonly label: string;
}

const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const fields = { text } as const;

interface ProjectValue {
  title: string;
  createdAt: Date;
  schedule: {
    startsAt: Date;
    milestones: Array<{ name: string; dueAt: Date }>;
  };
}

const projectSchema = {
  id: "project",
  version: 1,
  nodes: [{
    kind: "field",
    id: "title",
    type: "text",
    props: { label: "Title" },
  }],
} as const satisfies StagesSchema<ProjectValue, typeof fields>;

function jsonObject(value: JsonValue, label: string): Readonly<Record<string, JsonValue>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Readonly<Record<string, JsonValue>>;
}

function jsonString(
  value: Readonly<Record<string, JsonValue>>,
  key: string,
): string {
  const item = value[key];
  if (typeof item !== "string") throw new TypeError(`${key} must be a string`);
  return item;
}

function isoDate(value: string, label: string): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) throw new TypeError(`${label} must be an ISO date`);
  return date;
}

// source:start value-codec
export const projectCodec = {
  encode(value) {
    return {
      title: value.title,
      createdAt: value.createdAt.toISOString(),
      schedule: {
        startsAt: value.schedule.startsAt.toISOString(),
        milestones: value.schedule.milestones.map(item => ({
          name: item.name,
          dueAt: item.dueAt.toISOString(),
        })),
      },
    };
  },
  decode(value) {
    const project = jsonObject(value, "project");
    const schedule = jsonObject(project["schedule"]!, "schedule");
    const milestones = schedule["milestones"];
    if (!Array.isArray(milestones)) throw new TypeError("milestones must be an array");
    return {
      title: jsonString(project, "title"),
      createdAt: isoDate(jsonString(project, "createdAt"), "createdAt"),
      schedule: {
        startsAt: isoDate(jsonString(schedule, "startsAt"), "startsAt"),
        milestones: milestones.map((item, index) => {
          const milestone = jsonObject(item, `milestones[${index}]`);
          return {
            name: jsonString(milestone, "name"),
            dueAt: isoDate(jsonString(milestone, "dueAt"), `milestones[${index}].dueAt`),
          };
        }),
      },
    };
  },
} satisfies StagesValueCodec<ProjectValue>;
// source:end value-codec

interface DraftExtension {
  readonly panel: "details" | "review";
  readonly updatedAt: Date;
}

// source:start extension-state
export const draftExtensionCodec = {
  encode(value) {
    const draft = value as DraftExtension;
    return { panel: draft.panel, updatedAt: draft.updatedAt.toISOString() };
  },
  decode(value) {
    const draft = jsonObject(value, "draft extension");
    const panel = draft["panel"];
    if (panel !== "details" && panel !== "review") {
      throw new TypeError("draft panel is invalid");
    }
    return {
      panel,
      updatedAt: isoDate(jsonString(draft, "updatedAt"), "draft.updatedAt"),
    } satisfies DraftExtension;
  },
} satisfies StagesExtensionCodec;

export const extensionCodecs = { draft: draftExtensionCodec } as const;

export function showReviewPanel(
  controller: StagesController<ProjectValue, typeof fields>,
) {
  // Extension updates replace the current namespace map and do not call onChange.
  controller.update({
    extensions: {
      draft: { panel: "review", updatedAt: new Date() } satisfies DraftExtension,
    },
  });
}
// source:end extension-state

// source:start serialized-envelope
export const serializedEnvelope = {
  format: "stages",
  formatVersion: 1,
  schema: { id: "project", version: 1 },
  value: {
    title: "Documentation",
    createdAt: "2026-09-03T08:00:00.000Z",
    schedule: { startsAt: "2026-09-04T08:00:00.000Z", milestones: [] },
  },
  baseline: {
    title: "",
    createdAt: "2026-09-03T08:00:00.000Z",
    schedule: { startsAt: "2026-09-04T08:00:00.000Z", milestones: [] },
  },
  meta: {
    touched: [[{ kind: "node", id: "title" }]],
    visited: [[{ kind: "node", id: "title" }]],
    revealedValidation: [[{ kind: "node", id: "title" }]],
    activeWizards: [],
    collectionKeys: [],
    extensions: {
      draft: { panel: "review", updatedAt: "2026-09-03T09:00:00.000Z" },
    },
  },
} as const satisfies SerializedStagesState;
// source:end serialized-envelope

// source:start recreate-controller
export function recreateProject(
  controller: StagesController<ProjectValue, typeof fields>,
) {
  const state = controller.serialize();
  controller.destroy();

  return stages({
    schema: projectSchema,
    fields,
    state,
    codec: projectCodec,
    extensionCodecs,
  });
}
// source:end recreate-controller

function splitFullName(value: JsonValue): JsonValue {
  const profile = jsonObject(value, "profile");
  const fullName = jsonString(profile, "fullName").trim();
  const [firstName = "", ...rest] = fullName.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

function nestProfile(value: JsonValue): JsonValue {
  const profile = jsonObject(value, "profile");
  const firstName = jsonString(profile, "firstName");
  const lastName = jsonString(profile, "lastName");
  return {
    profile: {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
    },
  };
}

// source:start state-migrations
export const profileMigrations = [
  {
    schemaId: "profile",
    fromVersion: 1,
    toVersion: 2,
    migrate: state => ({
      ...state,
      schema: { id: "profile", version: 2 },
      value: splitFullName(state.value),
      baseline: splitFullName(state.baseline),
    }),
  },
  {
    schemaId: "profile",
    fromVersion: 2,
    toVersion: 3,
    migrate: state => ({
      ...state,
      schema: { id: "profile", version: 3 },
      value: nestProfile(state.value),
      baseline: nestProfile(state.baseline),
    }),
  },
] as const satisfies readonly StagesStateMigration[];

export function upgradeProfile(input: unknown): SerializedStagesState {
  return migrateSerializedState(validateSerializedState(input), profileMigrations);
}
// source:end state-migrations

// source:start serialization-utilities
export function parseStoredState(
  source: string,
  migrations: readonly StagesStateMigration[],
): SerializedStagesState {
  const parsed: unknown = JSON.parse(source);
  const validated = validateSerializedState(parsed);
  return migrateSerializedState(validated, migrations);
}

const encoded: JsonValue = encodeJson({ title: "Safe", rows: [1, 2] });
const decoded: unknown = decodeJson(encoded);

export function serializationFailure(error: unknown) {
  return error instanceof SerializationError
    ? { code: error.code, path: error.path, message: error.message }
    : undefined;
}

void decoded;
// source:end serialization-utilities

// source:start storage-and-autosave
export function writeLocalDraft(
  storage: Pick<Storage, "setItem">,
  key: string,
  controller: StagesController<ProjectValue, typeof fields>,
): { readonly ok: true } | { readonly ok: false; readonly error: unknown } {
  try {
    storage.setItem(key, JSON.stringify(controller.serialize()));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function putRemoteDraft(
  endpoint: string,
  state: SerializedStagesState,
  etag?: string,
): Promise<string | undefined> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (etag !== undefined) headers["if-match"] = etag;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify(state),
  });
  if (response.status === 412) throw new Error("Draft changed on another client");
  if (!response.ok) throw new Error(`Draft save failed (${response.status})`);
  return response.headers.get("etag") ?? undefined;
}

export function subscribeAutosave(
  controller: StagesController<ProjectValue, typeof fields>,
  save: (state: SerializedStagesState) => Promise<void>,
  onError: (error: unknown) => void,
  delayMs = 500,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = controller.subscribeSelector(
    snapshot => snapshot.value,
    () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        void save(controller.serialize()).catch(onError);
      }, delayMs);
    },
  );
  return () => {
    unsubscribe();
    if (timer !== undefined) clearTimeout(timer);
  };
}
// source:end storage-and-autosave
