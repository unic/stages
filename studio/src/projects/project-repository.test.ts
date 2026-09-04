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
});
