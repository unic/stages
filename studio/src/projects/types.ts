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

export interface StudioProjectRepository {
  list(): Promise<readonly StudioProjectSummary[]>;
  load(uid: Uid): Promise<StudioProjectSnapshot | undefined>;
  save(project: StudioProjectDocument, expectedRevision: number | null): Promise<StudioProjectSnapshot>;
  delete(uid: Uid, expectedRevision: number): Promise<void>;
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
