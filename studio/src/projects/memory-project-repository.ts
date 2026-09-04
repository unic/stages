import type { StudioProjectDocument, Uid } from "../document/types";
import { StudioProjectConflictError } from "./types";
import type {
  StudioProjectRepository,
  StudioProjectRecoverySummary,
  StudioProjectSnapshot,
  StudioProjectSummary,
} from "./types";

const BACKUP_LIMIT = 3;

interface MemoryRecoveryRecord extends StudioProjectRecoverySummary {
  readonly project?: StudioProjectDocument;
}

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
  const recovery = new Map<string, MemoryRecoveryRecord>();
  let recoverySequence = 0;

  const addRecovery = (snapshot: StudioProjectSnapshot, kind: "backup" | "deleted") => {
    recoverySequence += 1;
    const record: MemoryRecoveryRecord = {
      id: `${snapshot.uid}:${kind}:${snapshot.revision}:${recoverySequence}`,
      projectUid: snapshot.uid,
      title: snapshot.title,
      revision: snapshot.revision,
      createdAt: now().toISOString(),
      kind,
      recoverable: true,
      project: cloneProject(snapshot.project),
    };
    recovery.set(record.id, record);
    if (kind === "backup") {
      const backups = [...recovery.values()]
        .filter((entry) => entry.projectUid === snapshot.uid && entry.kind === "backup")
        .sort((left, right) => right.revision - left.revision);
      for (const expired of backups.slice(BACKUP_LIMIT)) recovery.delete(expired.id);
    }
  };

  const store = (project: StudioProjectDocument, expectedRevision: number | null, minimumRevision = 0): StudioProjectSnapshot => {
    const current = records.get(project.project.uid);
    const actualRevision = current?.revision ?? null;
    if (actualRevision !== expectedRevision) throw new StudioProjectConflictError(expectedRevision, actualRevision);
    if (current) addRecovery(current, "backup");
    const snapshot: StudioProjectSnapshot = {
      uid: project.project.uid,
      title: project.project.title,
      revision: Math.max(actualRevision ?? 0, minimumRevision) + 1,
      updatedAt: now().toISOString(),
      project: cloneProject(project),
    };
    records.set(snapshot.uid, snapshot);
    return cloneSnapshot(snapshot);
  };

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
      return store(project, expectedRevision);
    },
    async delete(uid, expectedRevision): Promise<void> {
      const current = records.get(uid);
      const actualRevision = current?.revision ?? null;
      if (actualRevision !== expectedRevision) {
        throw new StudioProjectConflictError(expectedRevision, actualRevision);
      }
      if (current) addRecovery(current, "deleted");
      records.delete(uid);
    },
    async listRecovery(projectUid): Promise<readonly StudioProjectRecoverySummary[]> {
      return [...recovery.values()]
        .filter((entry) => projectUid === undefined || entry.projectUid === projectUid)
        .map(({ project: _project, ...summary }) => ({ ...summary }))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.revision - left.revision);
    },
    async restore(recoveryId, expectedRevision): Promise<StudioProjectSnapshot> {
      const entry = recovery.get(recoveryId);
      if (!entry?.recoverable || entry.project === undefined) throw new Error("Recovery copy is unavailable or invalid.");
      return store(entry.project, expectedRevision, entry.revision);
    },
    async discardRecovery(recoveryId): Promise<void> {
      recovery.delete(recoveryId);
    },
  };
}
