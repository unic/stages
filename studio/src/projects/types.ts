import type { StudioProjectDocument, Uid } from "../document";

export interface StudioProjectSummary {
  readonly uid: Uid;
  readonly title: string;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface StudioProjectSnapshot extends StudioProjectSummary {
  readonly project: StudioProjectDocument;
}

export type StudioProjectRecoveryKind = "backup" | "corrupt" | "deleted";

export interface StudioProjectRecoverySummary {
  readonly id: string;
  readonly projectUid: Uid;
  readonly title: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly kind: StudioProjectRecoveryKind;
  readonly recoverable: boolean;
  readonly message?: string;
}

export interface StudioProjectRepository {
  list(): Promise<readonly StudioProjectSummary[]>;
  load(uid: Uid): Promise<StudioProjectSnapshot | undefined>;
  save(project: StudioProjectDocument, expectedRevision: number | null): Promise<StudioProjectSnapshot>;
  delete(uid: Uid, expectedRevision: number): Promise<void>;
  listRecovery(projectUid?: Uid): Promise<readonly StudioProjectRecoverySummary[]>;
  restore(recoveryId: string, expectedRevision: number | null): Promise<StudioProjectSnapshot>;
  discardRecovery(recoveryId: string): Promise<void>;
}

export class StudioProjectCorruptionError extends Error {
  readonly projectUid: Uid;

  constructor(projectUid: Uid, message = "The stored project was quarantined because it is invalid.") {
    super(message);
    this.name = "StudioProjectCorruptionError";
    this.projectUid = projectUid;
  }
}

export class StudioProjectConflictError extends Error {
  readonly expectedRevision: number | null;
  readonly actualRevision: number | null;

  constructor(expectedRevision: number | null, actualRevision: number | null) {
    super(`Project revision conflict: expected ${expectedRevision ?? "new"}, found ${actualRevision ?? "missing"}.`);
    this.name = "StudioProjectConflictError";
    this.expectedRevision = expectedRevision;
    this.actualRevision = actualRevision;
  }
}
