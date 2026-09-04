import type { StudioProjectDocument, Uid } from "../document";

export function copyStudioProject(
  project: StudioProjectDocument,
  uid: Uid,
  title: string,
): StudioProjectDocument {
  return structuredClone({
    ...project,
    project: { ...project.project, uid, title },
  });
}

export function projectUidFromRandomId(randomId: () => string = () => crypto.randomUUID()): Uid {
  return `project_${randomId().replaceAll("-", "_")}` as Uid;
}
