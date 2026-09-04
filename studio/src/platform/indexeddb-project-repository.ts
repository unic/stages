import { openStudioProject } from "../document/migrations";
import { serializeStudioProject } from "../document/serialization";
import type { StudioProjectDocument, Uid } from "../document/types";
import {
  StudioProjectConflictError,
  type StudioProjectRepository,
  type StudioProjectSnapshot,
  type StudioProjectSummary,
} from "../projects/types";

const DATABASE_NAME = "stages-studio-v1";
const DATABASE_VERSION = 1;
const STORE_NAME = "projects";

interface StoredProject {
  readonly uid: string;
  readonly title: string;
  readonly revision: number;
  readonly updatedAt: string;
  readonly source: string;
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
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "uid" });
      }
    });
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error ?? new Error("Could not open the Studio draft database.")), { once: true });
  });
}

function parseStored(
  record: StoredProject,
  supportedDefinitions: Readonly<Record<string, readonly number[]>>,
): StudioProjectSnapshot {
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

export function createIndexedDbProjectRepository(options: {
  readonly factory?: IDBFactory;
  readonly now?: () => Date;
  readonly supportedDefinitions?: Readonly<Record<string, readonly number[]>>;
} = {}): StudioProjectRepository {
  const now = options.now ?? (() => new Date());
  const supportedDefinitions = options.supportedDefinitions ?? {};

  return {
    async list(): Promise<readonly StudioProjectSummary[]> {
      const database = await openDatabase(factoryOrGlobal(options.factory));
      try {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const records = await requestResult(transaction.objectStore(STORE_NAME).getAll() as IDBRequest<StoredProject[]>);
        await transactionDone(transaction);
        return records
          .map(({ source: _source, ...summary }) => ({ ...summary, uid: summary.uid as Uid }))
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      } finally {
        database.close();
      }
    },
    async load(uid): Promise<StudioProjectSnapshot | undefined> {
      const database = await openDatabase(factoryOrGlobal(options.factory));
      try {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const record = await requestResult(transaction.objectStore(STORE_NAME).get(uid) as IDBRequest<StoredProject | undefined>);
        await transactionDone(transaction);
        return record === undefined ? undefined : parseStored(record, supportedDefinitions);
      } finally {
        database.close();
      }
    },
    async save(project: StudioProjectDocument, expectedRevision): Promise<StudioProjectSnapshot> {
      const database = await openDatabase(factoryOrGlobal(options.factory));
      try {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const current = await requestResult(store.get(project.project.uid) as IDBRequest<StoredProject | undefined>);
        const actualRevision = current?.revision ?? null;
        if (actualRevision !== expectedRevision) {
          transaction.abort();
          try { await transactionDone(transaction); } catch { /* expected abort */ }
          throw new StudioProjectConflictError(expectedRevision, actualRevision);
        }
        const record: StoredProject = {
          uid: project.project.uid,
          title: project.project.title,
          revision: (actualRevision ?? 0) + 1,
          updatedAt: now().toISOString(),
          source: serializeStudioProject(project),
        };
        store.put(record);
        await transactionDone(transaction);
        return parseStored(record, supportedDefinitions);
      } finally {
        database.close();
      }
    },
    async delete(uid, expectedRevision): Promise<void> {
      const database = await openDatabase(factoryOrGlobal(options.factory));
      try {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const current = await requestResult(store.get(uid) as IDBRequest<StoredProject | undefined>);
        const actualRevision = current?.revision ?? null;
        if (actualRevision !== expectedRevision) {
          transaction.abort();
          try { await transactionDone(transaction); } catch { /* expected abort */ }
          throw new StudioProjectConflictError(expectedRevision, actualRevision);
        }
        store.delete(uid);
        await transactionDone(transaction);
      } finally {
        database.close();
      }
    },
  };
}
