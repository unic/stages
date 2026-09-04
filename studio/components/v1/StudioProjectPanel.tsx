import { useEffect, useState } from "react";
import type { StudioProjectRecoverySummary, StudioProjectSummary } from "../../src/projects";
import type { Uid } from "../../src/document";
import type { LegacyStudioStoragePreview } from "../../src/projects";
import { Button } from "../ui/button";

export interface StudioProjectPanelProps {
  readonly projects: readonly StudioProjectSummary[];
  readonly recovery: readonly StudioProjectRecoverySummary[];
  readonly activeUid: Uid;
  readonly title: string;
  readonly legacy: LegacyStudioStoragePreview;
  readonly disabled: boolean;
  readonly onOpen: (uid: Uid) => void;
  readonly onReload: () => void;
  readonly onCreate: () => void;
  readonly onDuplicate: () => void;
  readonly onRename: (title: string) => void;
  readonly onDelete: () => void;
  readonly onRestore: (entry: StudioProjectRecoverySummary) => void;
  readonly onDiscardRecovery: (id: string) => void;
  readonly onMigrateLegacy: () => void;
}

export function StudioProjectPanel(props: StudioProjectPanelProps) {
  const [title, setTitle] = useState(props.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const [confirmRecoveryId, setConfirmRecoveryId] = useState<string>();
  useEffect(() => { setTitle(props.title); }, [props.title]);

  return (
    <section className="studio-v1-palette studio-v1-projects" aria-labelledby="studio-v1-projects-title">
      <h2 id="studio-v1-projects-title">Projects</h2>
      <label className="studio-field"><span>Local project</span>
        <select aria-label="Local project" value={props.activeUid} disabled={props.disabled} onChange={(event) => props.onOpen(event.currentTarget.value as Uid)}>
          {props.projects.some(({ uid }) => uid === props.activeUid) ? null : <option value={props.activeUid}>{props.title} (unsaved)</option>}
          {props.projects.map((project) => <option key={project.uid} value={project.uid}>{project.title} · r{project.revision}</option>)}
        </select>
      </label>
      <label className="studio-field"><span>Project title</span><input className="ui-input" aria-label="Project title" value={title} disabled={props.disabled} onChange={(event) => setTitle(event.currentTarget.value)} /></label>
      <Button variant="outline" disabled={props.disabled || title.trim() === "" || title === props.title} onClick={() => props.onRename(title)}>Rename project</Button>
      {!confirmReload
        ? <Button variant="outline" disabled={props.disabled} onClick={() => setConfirmReload(true)}>Reload confirmed version…</Button>
        : <div role="group" aria-label="Confirm project reload"><p>Discard unsaved in-memory changes and reload?</p><Button variant="destructive" disabled={props.disabled} onClick={() => { setConfirmReload(false); props.onReload(); }}>Confirm reload</Button><Button variant="outline" onClick={() => setConfirmReload(false)}>Cancel</Button></div>}
      <Button variant="outline" disabled={props.disabled} onClick={props.onCreate}>Create project</Button>
      <Button variant="outline" disabled={props.disabled} onClick={props.onDuplicate}>Duplicate project</Button>
      {!confirmDelete
        ? <Button variant="outline" disabled={props.disabled} onClick={() => setConfirmDelete(true)}>Delete project…</Button>
        : <div role="group" aria-label="Confirm project deletion"><p>Move this project to recovery?</p><Button variant="destructive" disabled={props.disabled} onClick={() => { setConfirmDelete(false); props.onDelete(); }}>Confirm delete</Button><Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button></div>}
      <h3>Recovery</h3>
      {props.recovery.length === 0 ? <p>No recovery copies.</p> : <ul className="studio-v1-recovery-list">{props.recovery.map((entry) => <li key={entry.id}>
        <span>{entry.title} · {entry.kind} r{entry.revision}</span>
        {entry.message && <small>{entry.message}</small>}
        {entry.recoverable && (confirmRecoveryId === entry.id
          ? <span><Button variant="destructive" disabled={props.disabled} onClick={() => { setConfirmRecoveryId(undefined); props.onRestore(entry); }}>Confirm restore</Button><Button variant="outline" onClick={() => setConfirmRecoveryId(undefined)}>Cancel</Button></span>
          : <Button variant="outline" disabled={props.disabled} onClick={() => setConfirmRecoveryId(entry.id)}>Restore…</Button>)}
        <Button variant="outline" disabled={props.disabled} onClick={() => props.onDiscardRecovery(entry.id)}>Discard</Button>
      </li>)}</ul>}
      {props.legacy.kind === "ready" && <div className="studio-v1-legacy-migration">
        <h3>Legacy project found</h3><p>{props.legacy.title} · {props.legacy.blockCount} top-level blocks. Preview only; the old record is unchanged.</p>
        <Button variant="outline" disabled={props.disabled} onClick={props.onMigrateLegacy}>Confirm legacy migration</Button>
      </div>}
      {props.legacy.kind === "invalid" && <p role="alert">{props.legacy.message}</p>}
    </section>
  );
}
