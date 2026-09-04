import type { JsonValue, StudioFormDocument, StudioProjectDocument, StudioScenario, Uid } from "../document";
import { inspectJsonSafety, serializeStudioProject, validateStudioProject } from "../document";
import type { StudioCommand } from "../commands";
import { compileStudioForm, type CompiledStudioForm, type StudioDiagnostic } from "../compiler";
import type { StudioAsyncServiceBindings, StudioCodecBindings } from "../registry";

export interface StudioSchemaMigrationBinding {
  readonly id: string;
  readonly formUid: Uid;
  readonly schemaId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
  migrate(value: JsonValue): JsonValue;
}

export interface StudioSchemaMigrationManifest {
  readonly id: string;
  readonly formUid: Uid;
  readonly schemaId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
}

export interface StudioArtifactManifestEntry {
  readonly formUid: Uid;
  readonly schemaId: string;
  readonly schemaVersion: number;
  readonly digest: string;
  readonly nodeCount: number;
  readonly scenarioCount: number;
}

export interface StudioPublicationDiagnostic {
  readonly code: string;
  readonly severity: "error";
  readonly source: "publication";
  readonly message: string;
  readonly formUid?: Uid;
  readonly scenarioUid?: Uid;
}

export interface StudioContractScenarioResult {
  readonly formUid: Uid;
  readonly scenarioUid: Uid;
  readonly ok: boolean;
  readonly message?: string;
}

export interface StudioContractScenarioRunner {
  run(input: Readonly<{
    project: StudioProjectDocument;
    compiledForms: ReadonlyMap<Uid, CompiledStudioForm>;
  }>): Promise<readonly StudioContractScenarioResult[]>;
}

export interface StudioReleaseSnapshot {
  readonly id: string;
  readonly projectUid: Uid;
  readonly projectRevision: number;
  readonly createdAt: string;
  readonly project: StudioProjectDocument;
  readonly documentDigest: string;
  readonly artifacts: readonly StudioArtifactManifestEntry[];
  readonly migrations: readonly StudioSchemaMigrationManifest[];
  readonly gate: Readonly<{ status: "passed"; checkedAt: string; scenarioCount: number }>;
}

export interface StudioVersionRepository {
  list(projectUid: Uid): Promise<readonly StudioReleaseSnapshot[]>;
  load(id: string): Promise<StudioReleaseSnapshot | undefined>;
  /** Creation is append-only. Existing releases can never be replaced. */
  create(snapshot: StudioReleaseSnapshot): Promise<void>;
}

export type StudioReviewStatus = "pending" | "approved" | "changes-requested";

export interface StudioReviewRecord {
  readonly id: string;
  readonly releaseId: string;
  readonly status: StudioReviewStatus;
}

export interface StudioReviewService {
  request(release: StudioReleaseSnapshot): Promise<StudioReviewRecord>;
  load(id: string): Promise<StudioReviewRecord | undefined>;
}

export interface StudioPublicationRecord {
  readonly id: string;
  readonly releaseId: string;
  readonly channel: string;
  readonly publishedAt: string;
}

export interface StudioPublicationService {
  publish(input: Readonly<{
    release: StudioReleaseSnapshot;
    channel: string;
    review?: StudioReviewRecord;
  }>): Promise<StudioPublicationRecord>;
}

export interface PrepareStudioReleaseOptions {
  readonly project: StudioProjectDocument;
  readonly projectRevision: number;
  readonly supportedDefinitions: Readonly<Record<string, readonly number[]>>;
  readonly serviceBindings?: StudioAsyncServiceBindings;
  readonly codecBindings?: StudioCodecBindings;
  readonly contractRunner?: StudioContractScenarioRunner;
  readonly previousRelease?: StudioReleaseSnapshot;
  readonly migrations?: readonly StudioSchemaMigrationBinding[];
  readonly now?: () => Date;
}

export type PrepareStudioReleaseResult =
  | Readonly<{ ok: true; value: StudioReleaseSnapshot }>
  | Readonly<{ ok: false; diagnostics: readonly StudioPublicationDiagnostic[] }>;

function publicationDiagnostic(code: string, message: string, details: Pick<StudioPublicationDiagnostic, "formUid" | "scenarioUid"> = {}): StudioPublicationDiagnostic {
  return { code, severity: "error", source: "publication", message, ...details };
}

function compilerDiagnostic(value: StudioDiagnostic): StudioPublicationDiagnostic {
  return publicationDiagnostic(value.code, value.message, value.formUid === undefined ? {} : { formUid: value.formUid });
}

async function sha256(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cloneAndFreeze<T>(value: T): T {
  const clone = structuredClone(value);
  const pending: object[] = clone !== null && typeof clone === "object" ? [clone as object] : [];
  for (let index = 0; index < pending.length; index += 1) {
    const item = pending[index]!;
    for (const child of Object.values(item)) if (child !== null && typeof child === "object") pending.push(child);
  }
  for (let index = pending.length - 1; index >= 0; index -= 1) Object.freeze(pending[index]);
  return clone;
}

function migrationManifest(binding: StudioSchemaMigrationBinding): StudioSchemaMigrationManifest {
  return {
    id: binding.id,
    formUid: binding.formUid,
    schemaId: binding.schemaId,
    fromVersion: binding.fromVersion,
    toVersion: binding.toVersion,
    description: binding.description,
  };
}

function migrationForForm(
  form: StudioFormDocument,
  previous: StudioFormDocument | undefined,
  migrations: readonly StudioSchemaMigrationBinding[],
  diagnostics: StudioPublicationDiagnostic[],
): StudioSchemaMigrationBinding | undefined {
  if (previous === undefined || previous.runtime.schemaId !== form.runtime.schemaId) return undefined;
  const from = previous.runtime.schemaVersion;
  const to = form.runtime.schemaVersion;
  if (to < from) diagnostics.push(publicationDiagnostic("publication.schema-version-regression", `Schema ${form.runtime.schemaId} regressed from version ${from} to ${to}.`, { formUid: form.uid }));
  if (to > from + 1) diagnostics.push(publicationDiagnostic("publication.schema-version-gap", `Schema ${form.runtime.schemaId} must advance one explicit version at a time.`, { formUid: form.uid }));
  if (to !== from + 1) return undefined;
  const matches = migrations.filter((migration) => migration.formUid === form.uid && migration.schemaId === form.runtime.schemaId && migration.fromVersion === from && migration.toVersion === to);
  if (matches.length !== 1) {
    diagnostics.push(publicationDiagnostic("publication.migration-required", `Schema ${form.runtime.schemaId}@${to} requires exactly one compatible migration from version ${from}.`, { formUid: form.uid }));
    return undefined;
  }
  const migration = matches[0]!;
  if (migration.id.trim().length === 0 || migration.description.trim().length === 0) diagnostics.push(publicationDiagnostic("publication.invalid-migration", "Migration ID and description must be non-empty.", { formUid: form.uid }));
  if (previous.scenarios.length === 0) diagnostics.push(publicationDiagnostic("publication.migration-scenario-required", `Migration ${migration.id} needs at least one prior-version contract scenario.`, { formUid: form.uid }));
  for (const scenario of previous.scenarios) {
    try {
      const migrated = migration.migrate(structuredClone(scenario.value));
      if (inspectJsonSafety(migrated, 5 * 1024 * 1024).length > 0) throw new Error("result is not JSON-safe");
      const repeated = migration.migrate(structuredClone(scenario.value));
      if (JSON.stringify(migrated) !== JSON.stringify(repeated)) throw new Error("result is not deterministic");
    } catch (error) {
      diagnostics.push(publicationDiagnostic("publication.incompatible-migration", `Migration ${migration.id} failed scenario ${scenario.title}: ${error instanceof Error ? error.message : "unknown failure"}.`, { formUid: form.uid, scenarioUid: scenario.uid }));
    }
  }
  return migration;
}

export function createStudioSchemaVersionBump(
  project: StudioProjectDocument,
  migration: StudioSchemaMigrationBinding,
): Readonly<{ ok: true; command: StudioCommand }> | Readonly<{ ok: false; diagnostic: StudioPublicationDiagnostic }> {
  const form = project.forms[migration.formUid];
  if (form === undefined) return { ok: false, diagnostic: publicationDiagnostic("publication.form-not-found", `Form ${migration.formUid} does not exist.`, { formUid: migration.formUid }) };
  if (migration.schemaId !== form.runtime.schemaId || migration.fromVersion !== form.runtime.schemaVersion || migration.toVersion !== migration.fromVersion + 1 || migration.id.trim() === "" || migration.description.trim() === "") {
    return { ok: false, diagnostic: publicationDiagnostic("publication.invalid-migration", "A schema bump requires a named, described, contiguous migration for the current schema identity.", { formUid: form.uid }) };
  }
  const scenarioValues: Array<{ uid: Uid; value: StudioScenario["value"] }> = [];
  for (const scenario of form.scenarios) {
    try {
      const value = migration.migrate(structuredClone(scenario.value));
      const repeat = migration.migrate(structuredClone(scenario.value));
      if (inspectJsonSafety(value, 5 * 1024 * 1024).length > 0) throw new Error("result is not JSON-safe");
      if (JSON.stringify(value) !== JSON.stringify(repeat)) throw new Error("result is not deterministic");
      scenarioValues.push({ uid: scenario.uid, value });
    } catch (error) {
      return { ok: false, diagnostic: publicationDiagnostic("publication.incompatible-migration", `Migration ${migration.id} failed scenario ${scenario.title}: ${error instanceof Error ? error.message : "unknown failure"}.`, { formUid: form.uid, scenarioUid: scenario.uid }) };
    }
  }
  return { ok: true, command: {
    type: "form.schema-version.bump",
    formUid: form.uid,
    expectedSchemaId: form.runtime.schemaId,
    expectedSchemaVersion: form.runtime.schemaVersion,
    nextSchemaVersion: migration.toVersion,
    migrationId: migration.id,
    scenarioValues,
  } };
}

export async function prepareStudioRelease(options: PrepareStudioReleaseOptions): Promise<PrepareStudioReleaseResult> {
  const diagnostics: StudioPublicationDiagnostic[] = [];
  if (!Number.isSafeInteger(options.projectRevision) || options.projectRevision < 1) diagnostics.push(publicationDiagnostic("publication.invalid-project-revision", "A release must reference a positive confirmed project revision."));
  if (options.previousRelease !== undefined && options.previousRelease.projectUid !== options.project.project.uid) diagnostics.push(publicationDiagnostic("publication.previous-release-project-mismatch", "Migration evidence must come from the same project."));
  if (options.previousRelease !== undefined && options.projectRevision <= options.previousRelease.projectRevision) diagnostics.push(publicationDiagnostic("publication.project-revision-not-newer", "A new release must reference a project revision newer than the prior release."));
  const validated = validateStudioProject(options.project, { supportedDefinitions: options.supportedDefinitions });
  if (!validated.ok) diagnostics.push(...validated.diagnostics.map((entry) => publicationDiagnostic(entry.code, entry.message, entry.formUid === undefined ? {} : { formUid: entry.formUid })));
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  const project = validated.ok ? validated.value : options.project;
  const compiledForms = new Map<Uid, CompiledStudioForm>();
  for (const form of Object.values(project.forms)) {
    const compiled = compileStudioForm(form, project.fragments, {
      ...(options.serviceBindings === undefined ? {} : { serviceBindings: options.serviceBindings }),
      localization: { defaultLocale: project.project.defaultLocale, resources: project.resources },
    });
    compiledForms.set(form.uid, compiled);
    diagnostics.push(...compiled.diagnostics.filter(({ severity }) => severity === "error").map(compilerDiagnostic));
    if (options.codecBindings?.resolveValue(form.runtime) === undefined) diagnostics.push(publicationDiagnostic("publication.unresolved-value-codec", `No value codec is bound for ${form.runtime.schemaId}@${form.runtime.schemaVersion}.`, { formUid: form.uid }));
  }
  for (const [key, extension] of Object.entries(project.resources.extensions ?? {})) {
    if (options.codecBindings?.resolveExtension(extension.codec) === undefined) diagnostics.push(publicationDiagnostic("publication.unresolved-extension-codec", `No extension codec is bound for ${key} (${extension.codec.key}@${extension.codec.version}).`));
  }
  const acceptedMigrations: StudioSchemaMigrationBinding[] = [];
  if (options.previousRelease !== undefined) for (const form of Object.values(project.forms)) {
    const previous = options.previousRelease.project.forms[form.uid];
    const migration = migrationForForm(form, previous, options.migrations ?? [], diagnostics);
    if (migration !== undefined) acceptedMigrations.push(migration);
  }
  const scenarios = Object.values(project.forms).flatMap((form) => form.scenarios.map((scenario) => ({ formUid: form.uid, scenario })));
  if (scenarios.length > 0 && options.contractRunner === undefined) diagnostics.push(publicationDiagnostic("publication.contract-runner-required", "Every named scenario must pass through a publication contract runner."));
  if (options.contractRunner !== undefined) {
    const results = await options.contractRunner.run({ project, compiledForms });
    const byKey = new Map(results.map((result) => [`${result.formUid}:${result.scenarioUid}`, result]));
    for (const { formUid, scenario } of scenarios) {
      const result = byKey.get(`${formUid}:${scenario.uid}`);
      if (result === undefined) diagnostics.push(publicationDiagnostic("publication.contract-scenario-missing", `Contract runner did not report scenario ${scenario.title}.`, { formUid, scenarioUid: scenario.uid }));
      else if (!result.ok) diagnostics.push(publicationDiagnostic("publication.contract-scenario-failed", result.message ?? `Scenario ${scenario.title} failed.`, { formUid, scenarioUid: scenario.uid }));
    }
  }
  if (diagnostics.length > 0) return { ok: false, diagnostics: Object.freeze(diagnostics) };

  const checkedAt = (options.now ?? (() => new Date()))().toISOString();
  const documentSource = serializeStudioProject(project);
  const documentDigest = await sha256(documentSource);
  const artifacts = await Promise.all(Object.values(project.forms).sort((left, right) => left.uid.localeCompare(right.uid)).map(async (form): Promise<StudioArtifactManifestEntry> => ({
    formUid: form.uid,
    schemaId: form.runtime.schemaId,
    schemaVersion: form.runtime.schemaVersion,
    digest: await sha256(serializeStudioProject({ ...project, forms: { [form.uid]: form } })),
    nodeCount: compiledForms.get(form.uid)!.sourceMap.byUid.size - 1,
    scenarioCount: form.scenarios.length,
  })));
  return { ok: true, value: cloneAndFreeze({
    id: `${project.project.uid}:r${options.projectRevision}:${documentDigest.slice(0, 12)}`,
    projectUid: project.project.uid,
    projectRevision: options.projectRevision,
    createdAt: checkedAt,
    project,
    documentDigest,
    artifacts,
    migrations: acceptedMigrations.map(migrationManifest),
    gate: { status: "passed", checkedAt, scenarioCount: scenarios.length },
  }) };
}

export function createMemoryVersionRepository(initial: readonly StudioReleaseSnapshot[] = []): StudioVersionRepository {
  const releases = new Map(initial.map((release) => [release.id, cloneAndFreeze(release)]));
  return {
    async list(projectUid) { return [...releases.values()].filter((release) => release.projectUid === projectUid).sort((left, right) => right.projectRevision - left.projectRevision); },
    async load(id) { const release = releases.get(id); return release === undefined ? undefined : cloneAndFreeze(release); },
    async create(snapshot) {
      if (releases.has(snapshot.id)) throw new Error(`Release ${snapshot.id} already exists and cannot be replaced.`);
      releases.set(snapshot.id, cloneAndFreeze(snapshot));
    },
  };
}

export async function requestStudioReleaseReview(
  release: StudioReleaseSnapshot,
  service: StudioReviewService,
): Promise<StudioReviewRecord> {
  if (release.gate.status !== "passed") throw new TypeError("Only a gate-passed immutable release can be reviewed.");
  const review = await service.request(release);
  if (review.releaseId !== release.id) throw new TypeError("Review service returned a record for another release.");
  return review;
}

export async function publishStudioRelease(input: Readonly<{
  release: StudioReleaseSnapshot;
  channel: string;
  service: StudioPublicationService;
  review?: StudioReviewRecord;
  requireApproval?: boolean;
}>): Promise<StudioPublicationRecord> {
  if (input.channel.trim() === "") throw new TypeError("Publication channel must be non-empty.");
  if (input.release.gate.status !== "passed") throw new TypeError("Only a gate-passed immutable release can be published.");
  if (input.review !== undefined && input.review.releaseId !== input.release.id) throw new TypeError("Review belongs to another release.");
  if (input.requireApproval && input.review?.status !== "approved") throw new TypeError("This channel requires an approved review.");
  return input.service.publish({ release: input.release, channel: input.channel, ...(input.review === undefined ? {} : { review: input.review }) });
}
