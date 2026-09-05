import { describe, expect, it, vi } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import { executeStudioCommand } from "../commands";
import { toUid, type StudioFieldNode, type StudioGroupNode, type StudioNode, type StudioProjectDocument } from "../document";
import { STUDIO_PREVIEW_CODEC_BINDINGS } from "../registry";
import {
  createMemoryVersionRepository,
  createStudioSchemaVersionBump,
  prepareStudioRelease,
  publishStudioRelease,
  requestStudioReleaseReview,
  type StudioContractScenarioRunner,
  type StudioPublicationService,
  type StudioSchemaMigrationBinding,
} from "./versioning";

const supportedDefinitions = { text: [1] } as const;
const now = () => new Date("2026-09-04T15:00:00.000Z");
const formUid = toUid("form_event");

function fixture(): StudioProjectDocument {
  return structuredClone(projectV1) as unknown as StudioProjectDocument;
}

function withScenario(): StudioProjectDocument {
  const project = fixture();
  const form = project.forms[formUid]!;
  return {
    ...project,
    forms: { ...project.forms, [form.uid]: {
      ...form,
      scenarios: [{ uid: "scenario_contract", title: "Contract", value: { event: { title: "Launch" } } }],
    } },
  } as StudioProjectDocument;
}

const passingRunner: StudioContractScenarioRunner = {
  async run({ project }) {
    return Object.values(project.forms).flatMap((form) => form.scenarios.map((scenario) => ({
      formUid: form.uid,
      scenarioUid: scenario.uid,
      ok: true,
    })));
  },
};

describe("Studio versioning and publication", () => {
  it("creates an immutable release with project revision, artifact identity, schema identity, and a passed gate", async () => {
    const result = await prepareStudioRelease({
      project: withScenario(), projectRevision: 7, supportedDefinitions,
      codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, contractRunner: passingRunner, now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      id: expect.stringMatching(/^project_event_launch:r7:[a-f0-9]{12}$/),
      projectRevision: 7,
      createdAt: "2026-09-04T15:00:00.000Z",
      gate: { status: "passed", scenarioCount: 1 },
      artifacts: [{ formUid: "form_event", schemaId: "event-launch", schemaVersion: 1, digest: expect.stringMatching(/^[a-f0-9]{64}$/) }],
    });
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.project.forms[formUid])).toBe(true);

    const repository = createMemoryVersionRepository();
    await repository.create(result.value);
    await expect(repository.create(result.value)).rejects.toThrow(/cannot be replaced/);
    const loaded = await repository.load(result.value.id);
    expect(loaded).toEqual(result.value);
    expect(loaded).not.toBe(result.value);
  });

  it("blocks compiler errors, unresolved codecs, and missing or failing contract scenarios", async () => {
    const project = withScenario();
    const form = project.forms[formUid]!;
    const invalid = { ...project, forms: { ...project.forms, [form.uid]: { ...form, rootNodeUids: [toUid("missing")] } } } as StudioProjectDocument;
    const compileFailure = await prepareStudioRelease({ project: invalid, projectRevision: 1, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS });
    expect(compileFailure.ok).toBe(false);
    if (!compileFailure.ok) expect(compileFailure.diagnostics.map(({ code }) => code)).toContain("document.missing-node-reference");

    const withService = { ...project, forms: { ...project.forms, [form.uid]: { ...form, validators: [{ kind: "service", service: { key: "availability", version: 1 } }] } } } as StudioProjectDocument;
    const gated = await prepareStudioRelease({ project: withService, projectRevision: 1, supportedDefinitions });
    expect(gated.ok).toBe(false);
    if (!gated.ok) expect(gated.diagnostics.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "compiler.unresolved-service-binding",
      "publication.unresolved-value-codec",
      "publication.contract-runner-required",
    ]));

    const failed = await prepareStudioRelease({
      project, projectRevision: 1, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS,
      contractRunner: { async run() { return [{ formUid: form.uid, scenarioUid: form.scenarios[0]!.uid, ok: false, message: "Expected submit success." }]; } },
    });
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.diagnostics).toContainEqual(expect.objectContaining({ code: "publication.contract-scenario-failed", message: "Expected submit success." }));
  });

  it("bumps a schema only through a contiguous deterministic migration and migrates every scenario atomically", () => {
    const project = withScenario();
    const migration: StudioSchemaMigrationBinding = {
      id: "event-launch-1-to-2", formUid, schemaId: "event-launch",
      fromVersion: 1, toVersion: 2, description: "Nest the event title under details.",
      migrate: (value) => ({ details: value }),
    };
    const planned = createStudioSchemaVersionBump(project, migration);
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    const result = executeStudioCommand(project, planned.command);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.forms[formUid]?.runtime.schemaVersion).toBe(2);
      expect(result.document.forms[formUid]?.scenarios[0]?.value).toEqual({ details: { event: { title: "Launch" } } });
    }

    const nondeterministic = createStudioSchemaVersionBump(project, { ...migration, migrate: () => ({ value: Math.random() }) });
    expect(nondeterministic).toMatchObject({ ok: false, diagnostic: { code: "publication.incompatible-migration" } });
  });

  it("requires compatible migration evidence against the prior release", async () => {
    const previous = await prepareStudioRelease({ project: withScenario(), projectRevision: 1, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, contractRunner: passingRunner, now });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const project = withScenario();
    const form = project.forms[formUid]!;
    const bumped = { ...project, forms: { ...project.forms, [form.uid]: { ...form, runtime: { ...form.runtime, schemaVersion: 2 } } } } as StudioProjectDocument;
    const missing = await prepareStudioRelease({ project: bumped, projectRevision: 2, previousRelease: previous.value, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, contractRunner: passingRunner, now });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.diagnostics).toContainEqual(expect.objectContaining({ code: "publication.migration-required" }));

    const migration: StudioSchemaMigrationBinding = { id: "event-launch-1-to-2", formUid: form.uid, schemaId: "event-launch", fromVersion: 1, toVersion: 2, description: "Compatible identity migration.", migrate: (value) => value };
    const released = await prepareStudioRelease({ project: bumped, projectRevision: 2, previousRelease: previous.value, migrations: [migration], supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, contractRunner: passingRunner, now });
    expect(released.ok).toBe(true);
    if (released.ok) expect(released.value.migrations).toEqual([expect.objectContaining({ id: "event-launch-1-to-2", fromVersion: 1, toVersion: 2 })]);

    const staleRevision = await prepareStudioRelease({ project: bumped, projectRevision: 1, previousRelease: previous.value, migrations: [migration], supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, contractRunner: passingRunner, now });
    expect(staleRevision).toMatchObject({ ok: false, diagnostics: expect.arrayContaining([expect.objectContaining({ code: "publication.project-revision-not-newer" })]) });
  });

  it("rejects an omitted schema-version bump even without named scenarios", async () => {
    const project = fixture();
    const previous = await prepareStudioRelease({ project, projectRevision: 1, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const form = project.forms[formUid]!;
    const fieldUid = toUid("field_title");
    const field = form.nodes[fieldUid] as StudioFieldNode;
    const renamed = { ...project, forms: { [formUid]: { ...form, nodes: { ...form.nodes, [fieldUid]: { ...field, runtimeId: "headline" } } } } };
    const result = await prepareStudioRelease({ project: renamed, projectRevision: 2, previousRelease: previous.value, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now });
    expect(result).toMatchObject({ ok: false, diagnostics: expect.arrayContaining([expect.objectContaining({
      code: "publication.schema-version-bump-required", formUid,
      message: expect.stringContaining("headline"),
    })]) });
    expect(previous.value.project.forms[formUid]?.nodes[fieldUid]).toMatchObject({ runtimeId: "title" });
  });

  it.each([
    ["field value contract", { uid: toUid("field_title"), kind: "field", runtimeId: "title", definition: { key: "number", version: 1 }, props: { label: "Amount" } }],
    ["field/container conversion", { uid: toUid("field_title"), kind: "group", runtimeId: "title", childUids: [] }],
    ["structural presence", { uid: toUid("field_title"), kind: "field", runtimeId: "title", definition: { key: "text", version: 1 }, props: { label: "Title" }, behavior: { presentWhen: { kind: "reference", scope: "context", path: ["enabled"] } } }],
  ] satisfies readonly (readonly [string, StudioNode])[])("requires a bump for a changed %s", async (_label, node) => {
    const project = fixture();
    const definitions = { text: [1], number: [1] };
    const options = { supportedDefinitions: definitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now };
    const previous = await prepareStudioRelease({ ...options, project, projectRevision: 1 });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const form = project.forms[formUid]!;
    const result = await prepareStudioRelease({ ...options, project: { ...project, forms: { [formUid]: { ...form, nodes: { ...form.nodes, [node.uid]: node } } } }, projectRevision: 2, previousRelease: previous.value });
    expect(result).toMatchObject({ ok: false, diagnostics: expect.arrayContaining([expect.objectContaining({ code: "publication.schema-version-bump-required" })]) });
  });

  it.each(["addition", "removal", "move"] as const)("requires a bump for a field %s", async (change) => {
    const project = fixture();
    const options = { supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now };
    const previous = await prepareStudioRelease({ ...options, project, projectRevision: 1 });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const form = project.forms[formUid]!;
    const groupUid = toUid("group_event");
    const fieldUid = toUid("field_title");
    const group = form.nodes[groupUid] as StudioGroupNode;
    const field = form.nodes[fieldUid] as StudioFieldNode;
    const extraUid = toUid("field_extra");
    const nodes = change === "addition" ? {
      ...form.nodes, [groupUid]: { ...group, childUids: [...group.childUids, extraUid] },
      [extraUid]: { ...field, uid: extraUid, runtimeId: "extra" },
    } : change === "removal" ? { [groupUid]: { ...group, childUids: [] } }
      : { ...form.nodes, [groupUid]: { ...group, childUids: [] } };
    const changed = { ...project, forms: { [formUid]: { ...form, nodes, rootNodeUids: change === "move" ? [groupUid, fieldUid] : form.rootNodeUids } } };
    expect(await prepareStudioRelease({ ...options, project: changed, projectRevision: 2, previousRelease: previous.value }))
      .toMatchObject({ ok: false, diagnostics: expect.arrayContaining([expect.objectContaining({ code: "publication.schema-version-bump-required" })]) });
  });

  it("compares collection shape, discriminator values, and row-key policies", async () => {
    const project = fixture();
    const form = project.forms[formUid]!;
    const collectionUid = toUid("contacts");
    const variantUid = toUid("person");
    const collection = { uid: collectionUid, kind: "collection" as const, runtimeId: "contacts", discriminator: "kind", variantUids: [variantUid] };
    const variant = { uid: variantUid, kind: "variant" as const, runtimeId: "person", childUids: [] };
    const baseline = { ...project, forms: { [formUid]: { ...form, rootNodeUids: [collectionUid], nodes: { [collectionUid]: collection, [variantUid]: variant } } } };
    const options = { supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now };
    const previous = await prepareStudioRelease({ ...options, project: baseline, projectRevision: 1 });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    for (const node of [
      { ...collection, discriminator: "category" },
      { ...collection, itemKey: { kind: "property" as const, property: "id" } },
      { ...variant, runtimeId: "company" },
    ]) {
      const changed = { ...baseline, forms: { [formUid]: { ...baseline.forms[formUid]!, nodes: { ...baseline.forms[formUid]!.nodes, [node.uid]: node } } } };
      expect(await prepareStudioRelease({ ...options, project: changed, projectRevision: 2, previousRelease: previous.value }))
        .toMatchObject({ ok: false, diagnostics: expect.arrayContaining([expect.objectContaining({ code: "publication.schema-version-bump-required" })]) });
    }
  });

  it("compares expanded fragment definitions and follows schema lineage across form UID changes", async () => {
    const project = fixture();
    const fragmentUid = toUid("fragment_details");
    const fieldUid = toUid("field_title");
    const created = executeStudioCommand(project, {
      type: "fragment.create", formUid, uids: [fieldUid],
      fragment: { uid: fragmentUid, title: "Details", version: 1, parameters: [] },
      instance: { uid: toUid("instance_details"), kind: "fragment", runtimeId: "details", fragmentUid },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const baseline = created.document;
    const options = { supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now };
    const previous = await prepareStudioRelease({ ...options, project: baseline, projectRevision: 1 });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const replacementUid = toUid("replacement_form");
    const changedUid = { ...baseline, forms: { [replacementUid]: { ...baseline.forms[formUid]!, uid: replacementUid } } };
    expect((await prepareStudioRelease({ ...options, project: changedUid, projectRevision: 2, previousRelease: previous.value })).ok).toBe(true);
    const fragment = baseline.fragments[fragmentUid]!;
    const changed = { ...changedUid, fragments: { [fragmentUid]: { ...fragment, nodes: { ...fragment.nodes, [fieldUid]: { ...fragment.nodes[fieldUid] as StudioFieldNode, runtimeId: "headline" } } } } };
    expect(await prepareStudioRelease({ ...options, project: changed, projectRevision: 2, previousRelease: previous.value }))
      .toMatchObject({ ok: false, diagnostics: expect.arrayContaining([expect.objectContaining({ code: "publication.schema-version-bump-required", formUid: replacementUid })]) });
  });

  it("accepts a structural rename after an explicit bump and migration evidence", async () => {
    const project = withScenario();
    const options = { supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, contractRunner: passingRunner, now };
    const previous = await prepareStudioRelease({ ...options, project, projectRevision: 1 });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const migration: StudioSchemaMigrationBinding = {
      id: "rename-title", formUid, schemaId: "event-launch", fromVersion: 1, toVersion: 2,
      description: "Rename title to headline.",
      migrate: (value) => ({ event: { headline: (value as { event: { title: string } }).event.title } }),
    };
    const bump = createStudioSchemaVersionBump(project, migration);
    expect(bump.ok).toBe(true);
    if (!bump.ok) return;
    const bumped = executeStudioCommand(project, bump.command);
    expect(bumped.ok).toBe(true);
    if (!bumped.ok) return;
    const form = bumped.document.forms[formUid]!;
    const uid = toUid("field_title");
    const renamed = { ...bumped.document, forms: { [formUid]: { ...form, nodes: { ...form.nodes, [uid]: { ...form.nodes[uid] as StudioFieldNode, runtimeId: "headline" } } } } };
    const result = await prepareStudioRelease({ ...options, project: renamed, projectRevision: 2, previousRelease: previous.value, migrations: [migration] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.project.forms[formUid]?.scenarios[0]?.value).toEqual({ event: { headline: "Launch" } });
  });

  it("allows presentation edits and editor UID changes under the same schema identity", async () => {
    const project = fixture();
    const previous = await prepareStudioRelease({ project, projectRevision: 1, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now });
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const form = project.forms[formUid]!;
    const field = form.nodes[toUid("field_title")] as StudioFieldNode;
    const renamedUid = toUid("new_editor_uid");
    const changed = { ...project, forms: { [formUid]: { ...form, title: "New title", settings: { theme: { accent: "#123456" } }, nodes: {
      [toUid("group_event")]: { ...form.nodes[toUid("group_event")] as StudioGroupNode, kind: "group" as const, childUids: [renamedUid] },
      [renamedUid]: { ...field, uid: renamedUid, props: { label: "Headline" }, presentation: { width: "half" } },
    } } } };
    const result = await prepareStudioRelease({ project: changed, projectRevision: 2, previousRelease: previous.value, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now });
    expect(result.ok).toBe(true);
  });

  it("keeps review and publication as ports and enforces channel approval policy", async () => {
    const prepared = await prepareStudioRelease({ project: fixture(), projectRevision: 3, supportedDefinitions, codecBindings: STUDIO_PREVIEW_CODEC_BINDINGS, now });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    const review = await requestStudioReleaseReview(prepared.value, {
      request: vi.fn(async (release) => ({ id: "review_1", releaseId: release.id, status: "approved" as const })),
      load: vi.fn(),
    });
    const publicationService: StudioPublicationService = { publish: vi.fn(async ({ release, channel }) => ({ id: "publication_1", releaseId: release.id, channel, publishedAt: now().toISOString() })) };
    await expect(publishStudioRelease({ release: prepared.value, channel: "production", service: publicationService, requireApproval: true })).rejects.toThrow(/approved review/);
    await expect(publishStudioRelease({ release: prepared.value, channel: "production", service: publicationService, requireApproval: true, review })).resolves.toMatchObject({ releaseId: prepared.value.id, channel: "production" });
    expect(publicationService.publish).toHaveBeenCalledOnce();
  });
});
