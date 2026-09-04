import { openStudioProject } from "../document/migrations";
import { serializeStudioProject } from "../document/serialization";
import type { StudioProjectDocument, Uid } from "../document/types";
import {
  StudioProjectConflictError,
  StudioProjectCorruptionError,
  type StudioProjectRecoveryKind,
  type StudioProjectRecoverySummary,
  type StudioProjectRepository,
  type StudioProjectSnapshot,
  type StudioProjectSummary,
} from "../projects/types";

const DATABASE_NAME = "stages-studio-v1";
const DATABASE_VERSION = 2;
const PROJECT_STORE = "projects";
const RECOVERY_STORE = "recovery";
const BACKUP_LIMIT = 3;

interface StoredProject {
  readonly uid: string;
  readonly title: string;
  readonly revision: number;
  readonly updatedAt: string;
  readonly source: string;
}

interface StoredRecovery {
  readonly id: string;
  readonly projectUid: string;
  readonly title: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly kind: StudioProjectRecoveryKind;
  readonly recoverable: boolean;
  readonly source: string;
  readonly message?: string;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error ?? new Error("IndexedDB request failed.")), { once: true });
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error ?? new Error("IndexedDB transaction aborted.")), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error ?? new Error("IndexedDB transaction failed.")), { once: true });
  });
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener("upgradeneeded", () => {
      if (!request.result.objectStoreNames.contains(PROJECT_STORE)) request.result.createObjectStore(PROJECT_STORE, { keyPath: "uid" });
      if (!request.result.objectStoreNames.contains(RECOVERY_STORE)) request.result.createObjectStore(RECOVERY_STORE, { keyPath: "id" });
    });
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error ?? new Error("Could not open the Studio draft database.")), { once: true });
  });
}

function parseStored(record: StoredProject, supportedDefinitions: Readonly<Record<string, readonly number[]>>): StudioProjectSnapshot {
  const opened = openStudioProject(record.source, { supportedDefinitions });
  if (!opened.ok) throw new Error(`Stored project ${record.uid} is invalid (${opened.diagnostics[0]?.code ?? "unknown"}).`);
  return {
    uid: opened.value.project.uid,
    title: opened.value.project.title,
    revision: record.revision,
    updatedAt: record.updatedAt,
    project: opened.value,
  };
}

function factoryOrGlobal(factory: IDBFactory | undefined): IDBFactory {
  if (factory !== undefined) return factory;
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB is not available in this environment.");
  return indexedDB;
}

function recoveryRecord(record: StoredProject, kind: StudioProjectRecoveryKind, createdAt: string, sequence: string, options: { readonly recoverable?: boolean; readonly message?: string } = {}): StoredRecovery {
  return {
    id: `${record.uid}:${kind}:${record.revision}:${sequence}`,
    projectUid: record.uid,
    title: record.title,
    revision: record.revision,
    createdAt,
    kind,
    recoverable: options.recoverable ?? kind !== "corrupt",
    source: record.source,
    ...(options.message === undefined ? {} : { message: options.message }),
  };
}

function recoverySummary(record: StoredRecovery): StudioProjectRecoverySummary {
  return {
    id: record.id,
    projectUid: record.projectUid as Uid,
    title: record.title,
    revision: record.revision,
    createdAt: record.createdAt,
    kind: record.kind,
    recoverable: record.recoverable,
    ...(record.message === undefined ? {} : { message: record.message }),
  };
}

async function rotateBackups(store: IDBObjectStore, projectUid: string): Promise<void> {
  const records = await requestResult(store.getAll() as IDBRequest<StoredRecovery[]>);
  const backups = records
    .filter((entry) => entry.projectUid === projectUid && entry.kind === "backup")
    .sort((left, right) => right.revision - left.revision || right.createdAt.localeCompare(left.createdAt));
  for (const expired of backups.slice(BACKUP_LIMIT)) store.delete(expired.id);
}

export function createIndexedDbProjectRepository(options: {
  readonly factory?: IDBFactory;
  readonly now?: () => Date;
  readonly supportedDefinitions?: Readonly<Record<string, readonly number[]>>;
} = {}): StudioProjectRepository {
  const now = options.now ?? (() => new Date());
  const supportedDefinitions = options.supportedDefinitions ?? {};
  let sequence = 0;
  const nextSequence = () => String(++sequence);
  const database = () => openDatabase(factoryOrGlobal(options.factory));

  const save = async (project: StudioProjectDocument, expectedRevision: number | null, minimumRevision = 0): Promise<StudioProjectSnapshot> => {
    const db = await database();
    try {
      const transaction = db.transaction([PROJECT_STORE, RECOVERY_STORE], "readwrite");
      const projects = transaction.objectStore(PROJECT_STORE);
      const recovery = transaction.objectStore(RECOVERY_STORE);
      const current = await requestResult(projects.get(project.project.uid) as IDBRequest<StoredProject | undefined>);
      const actualRevision = current?.revision ?? null;
      if (actualRevision !== expectedRevision) {
        transaction.abort();
        try { await transactionDone(transaction); } catch { /* expected abort */ }
        throw new StudioProjectConflictError(expectedRevision, actualRevision);
      }
      const timestamp = now().toISOString();
      if (current) recovery.put(recoveryRecord(current, "backup", timestamp, nextSequence()));
      const record: StoredProject = {
        uid: project.project.uid,
        title: project.project.title,
        revision: Math.max(actualRevision ?? 0, minimumRevision) + 1,
        updatedAt: timestamp,
        source: serializeStudioProject(project),
      };
      projects.put(record);
      await rotateBackups(recovery, record.uid);
      await transactionDone(transaction);
      return parseStored(record, supportedDefinitions);
    } finally {
      db.close();
    }
  };

  return {
    async list(): Promise<readonly StudioProjectSummary[]> {
      const db = await database();
      try {
        const transaction = db.transaction(PROJECT_STORE, "readonly");
        const records = await requestResult(transaction.objectStore(PROJECT_STORE).getAll() as IDBRequest<StoredProject[]>);
        await transactionDone(transaction);
        return records.map(({ source: _source, ...summary }) => ({ ...summary, uid: summary.uid as Uid }))
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      } finally { db.close(); }
    },
    async load(uid): Promise<StudioProjectSnapshot | undefined> {
      const db = await database();
      let record: StoredProject | undefined;
      try {
        const transaction = db.transaction(PROJECT_STORE, "readonly");
        record = await requestResult(transaction.objectStore(PROJECT_STORE).get(uid) as IDBRequest<StoredProject | undefined>);
        await transactionDone(transaction);
      } finally { db.close(); }
      if (record === undefined) return undefined;
      try {
        return parseStored(record, supportedDefinitions);
      } catch (error: unknown) {
        const quarantineDb = await database();
        let replacement: StoredProject | undefined;
        try {
          const transaction = quarantineDb.transaction([PROJECT_STORE, RECOVERY_STORE], "readwrite");
          const projects = transaction.objectStore(PROJECT_STORE);
          const current = await requestResult(projects.get(uid) as IDBRequest<StoredProject | undefined>);
          if (current?.revision === record.revision && current.source === record.source) {
            transaction.objectStore(RECOVERY_STORE).put(recoveryRecord(record, "corrupt", now().toISOString(), nextSequence(), {
              recoverable: false,
              message: error instanceof Error ? error.message : "Stored project data is invalid.",
            }));
            projects.delete(uid);
          } else replacement = current;
          await transactionDone(transaction);
        } finally { quarantineDb.close(); }
        if (replacement !== undefined) return parseStored(replacement, supportedDefinitions);
        throw new StudioProjectCorruptionError(uid);
      }
    },
    save,
    async delete(uid, expectedRevision): Promise<void> {
      const db = await database();
      try {
        const transaction = db.transaction([PROJECT_STORE, RECOVERY_STORE], "readwrite");
        const projects = transaction.objectStore(PROJECT_STORE);
        const current = await requestResult(projects.get(uid) as IDBRequest<StoredProject | undefined>);
        const actualRevision = current?.revision ?? null;
        if (actualRevision !== expectedRevision) {
          transaction.abort();
          try { await transactionDone(transaction); } catch { /* expected abort */ }
          throw new StudioProjectConflictError(expectedRevision, actualRevision);
        }
        if (current) transaction.objectStore(RECOVERY_STORE).put(recoveryRecord(current, "deleted", now().toISOString(), nextSequence()));
        projects.delete(uid);
        await transactionDone(transaction);
      } finally { db.close(); }
    },
    async listRecovery(projectUid): Promise<readonly StudioProjectRecoverySummary[]> {
      const db = await database();
      try {
        const transaction = db.transaction(RECOVERY_STORE, "readonly");
        const records = await requestResult(transaction.objectStore(RECOVERY_STORE).getAll() as IDBRequest<StoredRecovery[]>);
        await transactionDone(transaction);
        return records.filter((entry) => projectUid === undefined || entry.projectUid === projectUid)
          .map(recoverySummary)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.revision - left.revision);
      } finally { db.close(); }
    },
    async restore(recoveryId, expectedRevision): Promise<StudioProjectSnapshot> {
      const db = await database();
      let entry: StoredRecovery | undefined;
      try {
        const transaction = db.transaction(RECOVERY_STORE, "readonly");
        entry = await requestResult(transaction.objectStore(RECOVERY_STORE).get(recoveryId) as IDBRequest<StoredRecovery | undefined>);
        await transactionDone(transaction);
      } finally { db.close(); }
      if (!entry?.recoverable) throw new Error("Recovery copy is unavailable or invalid.");
      const opened = openStudioProject(entry.source, { supportedDefinitions });
      if (!opened.ok) throw new Error("Recovery copy is invalid and cannot be restored.");
      return save(opened.value, expectedRevision, entry.revision);
    },
    async discardRecovery(recoveryId): Promise<void> {
      const db = await database();
      try {
        const transaction = db.transaction(RECOVERY_STORE, "readwrite");
        transaction.objectStore(RECOVERY_STORE).delete(recoveryId);
        await transactionDone(transaction);
      } finally { db.close(); }
    },
  };
}
