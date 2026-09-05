import { useEffect, useState } from "react";
import type { StudioProjectRecoverySummary, StudioProjectSummary } from "../../src/projects";
import type { Uid } from "../../src/document";
import type { LegacyStudioStoragePreview } from "../../src/projects";
import { Archive, Check, ChevronDown, Copy, FolderOpen, History, MoreHorizontal, Plus, RotateCcw, Trash2 } from "lucide-react";
import { DropdownMenu, Select } from "radix-ui";
import { EditorTooltip, InspectorSection } from "./StudioInspectorControls";
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
      <h2 id="studio-v1-projects-title">Current project</h2>
      <Select.Root value={props.activeUid} disabled={props.disabled} onValueChange={(uid) => props.onOpen(uid as Uid)}>
        <Select.Trigger className="ui-select-trigger studio-project-picker" aria-label="Local project">
          <FolderOpen size={16} aria-hidden="true" /><Select.Value /><Select.Icon><ChevronDown size={14} aria-hidden="true" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal><Select.Content className="ui-select-content studio-project-options" position="popper" sideOffset={5}>
          <Select.Viewport className="ui-select-viewport">
            {!props.projects.some(({ uid }) => uid === props.activeUid) && <Select.Item className="ui-select-item" value={props.activeUid}><Select.ItemText>{props.title} (unsaved)</Select.ItemText></Select.Item>}
            {props.projects.map((project) => <Select.Item className="ui-select-item" key={project.uid} value={project.uid}>
              <Select.ItemText>{project.title} · r{project.revision}</Select.ItemText><Select.ItemIndicator><Check size={14} aria-hidden="true" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
        </Select.Content></Select.Portal>
      </Select.Root>
      <div className="studio-project-title-row">
        <label className="studio-field"><span>Project title</span><input className="ui-input" value={title} disabled={props.disabled} onChange={(event) => setTitle(event.currentTarget.value)} /></label>
        <EditorTooltip label="Rename project"><Button variant="ghost" size="icon" aria-label="Rename project" disabled={props.disabled || title.trim() === "" || title === props.title} onClick={() => props.onRename(title)}><Check size={15} aria-hidden="true" /></Button></EditorTooltip>
      </div>
      <div className="studio-project-actions">
        <Button variant="outline" size="sm" disabled={props.disabled} onClick={props.onCreate} aria-label="Create project"><Plus size={14} aria-hidden="true" />New</Button>
        <Button variant="outline" size="sm" disabled={props.disabled} onClick={props.onDuplicate} aria-label="Duplicate project"><Copy size={14} aria-hidden="true" />Duplicate</Button>
        <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="ghost" size="icon" disabled={props.disabled} aria-label="Project actions"><MoreHorizontal size={16} aria-hidden="true" /></Button></DropdownMenu.Trigger>
          <DropdownMenu.Portal><DropdownMenu.Content className="studio-project-menu" align="end" sideOffset={5}>
            <DropdownMenu.Item onSelect={() => { setConfirmDelete(false); setConfirmReload(true); }}><RotateCcw size={14} aria-hidden="true" />Reload saved version…</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item className="studio-project-menu__danger" onSelect={() => { setConfirmReload(false); setConfirmDelete(true); }}><Trash2 size={14} aria-hidden="true" />Delete project…</DropdownMenu.Item>
          </DropdownMenu.Content></DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {confirmReload && <div className="studio-project-confirm" role="group" aria-label="Confirm project reload"><p>Discard unsaved changes and reload the saved version?</p><Button variant="destructive" size="sm" disabled={props.disabled} onClick={() => { setConfirmReload(false); props.onReload(); }}>Confirm reload</Button><Button variant="ghost" size="sm" onClick={() => setConfirmReload(false)}>Cancel</Button></div>}
      {confirmDelete && <div className="studio-project-confirm" role="group" aria-label="Confirm project deletion"><p>Move this project to recovery?</p><Button variant="destructive" size="sm" disabled={props.disabled} onClick={() => { setConfirmDelete(false); props.onDelete(); }}>Confirm delete</Button><Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button></div>}
      <InspectorSection title={`Recovery (${props.recovery.length})`} icon={History} defaultOpen={false}>
      {props.recovery.length === 0 ? <p>No recovery copies.</p> : <ul className="studio-v1-recovery-list">{props.recovery.map((entry) => <li key={entry.id}>
        <span className="studio-recovery-title">{entry.title} · {entry.kind} r{entry.revision}</span>
        <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
        {entry.message && <small>{entry.message}</small>}
        <div className="studio-recovery-actions">{entry.recoverable && (confirmRecoveryId === entry.id
          ? <span><Button variant="destructive" disabled={props.disabled} onClick={() => { setConfirmRecoveryId(undefined); props.onRestore(entry); }}>Confirm restore</Button><Button variant="outline" onClick={() => setConfirmRecoveryId(undefined)}>Cancel</Button></span>
          : <Button variant="outline" disabled={props.disabled} onClick={() => setConfirmRecoveryId(entry.id)}><RotateCcw size={12} aria-hidden="true" />Restore…</Button>)}
        <EditorTooltip label="Discard recovery copy"><Button variant="ghost" size="icon" aria-label="Discard" disabled={props.disabled} onClick={() => props.onDiscardRecovery(entry.id)}><Trash2 size={13} aria-hidden="true" /></Button></EditorTooltip>
        </div>
      </li>)}</ul>}
      </InspectorSection>
      {props.legacy.kind === "ready" && <div className="studio-v1-legacy-migration">
        <h3><Archive size={14} aria-hidden="true" />Legacy project found</h3><p>{props.legacy.title} · {props.legacy.blockCount} top-level blocks. Preview only; the old record is unchanged.</p>
        <Button variant="outline" disabled={props.disabled} onClick={props.onMigrateLegacy}>Confirm legacy migration</Button>
      </div>}
      {props.legacy.kind === "invalid" && <p role="alert">{props.legacy.message}</p>}
    </section>
  );
}
