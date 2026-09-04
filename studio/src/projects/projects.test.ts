import { describe, expect, it, vi } from "vitest";
import {
  LEGACY_STUDIO_STORAGE_KEY,
  copyStudioProject,
  createStudioAutosave,
  previewLegacyStudioStorage,
} from "./index";
import projectV1 from "../document/fixtures/project-v1.json";
import { toUid, validateStudioProject } from "../document";

describe("Studio project workflows", () => {
  it("coalesces autosaves and flushes pending work", async () => {
    vi.useFakeTimers();
    const save = vi.fn(async () => {});
    const autosave = createStudioAutosave(save);
    autosave.schedule();
    autosave.schedule();
    await vi.advanceTimersByTimeAsync(1_499);
    expect(save).not.toHaveBeenCalled();
    await autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("copies a project under an independent identity", () => {
    const validated = validateStudioProject(structuredClone(projectV1), { supportedDefinitions: { text: [1] } });
    if (!validated.ok) throw new Error("Fixture must be valid.");
    const copy = copyStudioProject(validated.value, toUid("project_copy"), "Event launch copy");
    expect(copy.project).toMatchObject({ uid: "project_copy", title: "Event launch copy" });
    expect(copy.forms).toEqual(validated.value.forms);
    expect(copy).not.toBe(validated.value);
  });

  it("previews legacy local storage without mutating it", () => {
    const source = JSON.stringify({ state: { currentConfig: [{ id: "name", type: "text" }], generalConfig: { title: "Legacy form" }, data: { name: "Ada" } } });
    const storage = { getItem: vi.fn((key: string) => key === LEGACY_STUDIO_STORAGE_KEY ? source : null) };
    expect(previewLegacyStudioStorage(storage)).toMatchObject({ kind: "ready", title: "Legacy form", blockCount: 1 });
    expect(storage.getItem).toHaveBeenCalledOnce();
  });
});
