import type { StudioProjectDocument, Uid } from "../document/types";
import { StudioProjectConflictError } from "./types";
import type {
  StudioProjectRepository,
  StudioProjectSnapshot,
  StudioProjectSummary,
} from "./types";

function cloneProject(project: StudioProjectDocument): StudioProjectDocument {
  return structuredClone(project);
}

function cloneSnapshot(snapshot: StudioProjectSnapshot): StudioProjectSnapshot {
  return { ...snapshot, project: cloneProject(snapshot.project) };
}

export function createMemoryProjectRepository(
  initial: readonly StudioProjectSnapshot[] = [],
  now: () => Date = () => new Date(),
): StudioProjectRepository {
  const records = new Map<Uid, StudioProjectSnapshot>(initial.map((snapshot) => [
    snapshot.uid,
    cloneSnapshot(snapshot),
  ]));

  return {
    async list(): Promise<readonly StudioProjectSummary[]> {
      return [...records.values()]
        .map(({ project: _project, ...summary }) => ({ ...summary }))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    async load(uid): Promise<StudioProjectSnapshot | undefined> {
      const record = records.get(uid);
      return record === undefined ? undefined : cloneSnapshot(record);
    },
    async save(project, expectedRevision): Promise<StudioProjectSnapshot> {
      const current = records.get(project.project.uid);
      const actualRevision = current?.revision ?? null;
      if (actualRevision !== expectedRevision) {
        throw new StudioProjectConflictError(expectedRevision, actualRevision);
      }
      const snapshot: StudioProjectSnapshot = {
        uid: project.project.uid,
        title: project.project.title,
        revision: (actualRevision ?? 0) + 1,
        updatedAt: now().toISOString(),
        project: cloneProject(project),
      };
      records.set(snapshot.uid, snapshot);
      return cloneSnapshot(snapshot);
    },
    async delete(uid, expectedRevision): Promise<void> {
      const current = records.get(uid);
      const actualRevision = current?.revision ?? null;
      if (actualRevision !== expectedRevision) {
        throw new StudioProjectConflictError(expectedRevision, actualRevision);
      }
      records.delete(uid);
    },
  };
}
