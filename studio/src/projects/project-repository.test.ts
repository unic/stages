import { describe, expect, it } from "vitest";
import projectV1 from "../document/fixtures/project-v1.json";
import { toUid, validateStudioProject } from "../document";
import { createMemoryProjectRepository, StudioProjectConflictError } from "./index";

function project() {
  const result = validateStudioProject(structuredClone(projectV1), { supportedDefinitions: { text: [1] } });
  if (!result.ok) throw new Error("Fixture must be valid.");
  return result.value;
}

describe("Studio project repository contract", () => {
  it("loads isolated snapshots and enforces revision-safe draft saves", async () => {
    const repository = createMemoryProjectRepository([], () => new Date("2026-09-04T12:00:00.000Z"));
    const input = project();
    const created = await repository.save(input, null);
    expect(created).toMatchObject({ uid: "project_event_launch", revision: 1, updatedAt: "2026-09-04T12:00:00.000Z" });

    const loaded = await repository.load(toUid("project_event_launch"));
    expect(loaded?.project).toEqual(input);
    expect(loaded?.project).not.toBe(input);
    await expect(repository.save(input, null)).rejects.toEqual(
      expect.objectContaining<Partial<StudioProjectConflictError>>({ actualRevision: 1, expectedRevision: null }),
    );

    const updated = await repository.save(input, 1);
    expect(updated.revision).toBe(2);
    expect(await repository.list()).toEqual([expect.objectContaining({ revision: 2 })]);
  });

  it("rotates three confirmed backups and makes deletion recoverable", async () => {
    const repository = createMemoryProjectRepository();
    const input = project();
    let saved = await repository.save(input, null);
    for (let revision = 2; revision <= 5; revision += 1) saved = await repository.save(input, saved.revision);

    expect(await repository.listRecovery(input.project.uid)).toEqual([
      expect.objectContaining({ kind: "backup", revision: 4, recoverable: true }),
      expect.objectContaining({ kind: "backup", revision: 3, recoverable: true }),
      expect.objectContaining({ kind: "backup", revision: 2, recoverable: true }),
    ]);

    await repository.delete(input.project.uid, saved.revision);
    expect(await repository.load(input.project.uid)).toBeUndefined();
    const deleted = (await repository.listRecovery(input.project.uid)).find(({ kind }) => kind === "deleted");
    expect(deleted).toMatchObject({ revision: 5, recoverable: true });
    const restored = await repository.restore(deleted!.id, null);
    expect(restored.project).toEqual(input);
    expect(restored.revision).toBe(6);
    await expect(repository.save(input, 1)).rejects.toMatchObject({ expectedRevision: 1, actualRevision: 6 });
  });
});
