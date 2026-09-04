import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import type { StudioProjectDocument, Uid } from "../../src/document/types";
import {
  createStudioOutlineModel,
  selectStudioUid,
  setStudioExpansion,
  type StudioWorkbenchState,
  type StudioMoveDirection,
  visibleStudioOutlineUids,
} from "../../src/editor";
import { StudioNodeContextMenu, type StudioContextMenuPosition } from "./StudioNodeContextMenu";

function writeStudioDragData(event: DragEvent<HTMLElement>, uid: Uid): void {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-stages-studio-uid", uid);
}

function startStudioDrag(event: DragEvent<HTMLLIElement>, uid: Uid): void {
  if ((event.target as HTMLElement).closest("[role=treeitem]") !== event.currentTarget) return;
  writeStudioDragData(event, uid);
  event.stopPropagation();
}

interface StudioOutlineProps {
  readonly project: StudioProjectDocument;
  readonly state: StudioWorkbenchState;
  readonly onChange: (state: StudioWorkbenchState) => void;
  readonly onActivateForm: (formUid: Uid) => void;
  readonly onMove: (uid: Uid, direction: StudioMoveDirection) => void;
  readonly onDrop: (uid: Uid, targetUid: Uid) => void;
  readonly onCopy: (uids: readonly Uid[]) => void;
  readonly onCut: (uids: readonly Uid[]) => void;
  readonly onPaste: (targetUid: Uid) => void;
  readonly onGroup: (uids: readonly Uid[]) => void;
  readonly onUngroup: (uid: Uid) => void;
  readonly onConvert: (uid: Uid, kind: "collection" | "group" | "wizard") => void;
  readonly canPaste: boolean;
}

export function StudioOutline({
  project, state, onChange, onActivateForm, onMove, onDrop, onCopy, onCut, onPaste, onGroup, onUngroup, onConvert, canPaste,
}: StudioOutlineProps) {
  const model = useMemo(() => createStudioOutlineModel(project), [project]);
  const visibleUids = visibleStudioOutlineUids(model, state.expandedUids);
  const itemRefs = useRef(new Map<Uid, HTMLLIElement>());
  const [contextMenu, setContextMenu] = useState<(StudioContextMenuPosition & { readonly uid: Uid }) | undefined>();

  useEffect(() => {
    if (state.focusedUid !== undefined && document.activeElement?.closest("[role=tree]") !== null) {
      itemRefs.current.get(state.focusedUid)?.focus();
    }
  }, [state.focusedUid]);

  const focusUid = (uid: Uid) => {
    itemRefs.current.get(uid)?.focus();
    onChange({ ...state, focusedUid: uid });
  };
  const select = (uid: Uid, options: { readonly extend?: boolean; readonly toggle?: boolean } = {}) => {
    const item = model.items.get(uid);
    if (item) onActivateForm(item.formUid);
    const crossesForms = item !== undefined && state.selectedUids.some((selectedUid) => (
      model.items.get(selectedUid)?.formUid !== item.formUid
    ));
    const selectableUids = item === undefined
      ? visibleUids
      : visibleUids.filter((visibleUid) => model.items.get(visibleUid)?.formUid === item.formUid);
    onChange(selectStudioUid(state, uid, selectableUids, crossesForms ? {} : options));
  };
  const keyDown = (event: KeyboardEvent<HTMLLIElement>, uid: Uid) => {
    if (event.target !== event.currentTarget && (event.target as HTMLElement).closest("[role=treeitem]") !== event.currentTarget) return;
    const item = model.items.get(uid);
    if (!item) return;
    const primaryModifier = event.metaKey || event.ctrlKey;
    const actionUids = state.selectedUids.includes(uid) ? state.selectedUids.filter((selectedUid) => model.items.get(selectedUid)?.kind !== "form") : [uid];
    if (event.altKey && event.key === "ArrowUp") onMove(uid, "up");
    else if (event.altKey && event.key === "ArrowDown") onMove(uid, "down");
    else if (event.altKey && event.key === "ArrowRight") onMove(uid, "in");
    else if (event.altKey && event.key === "ArrowLeft") onMove(uid, "out");
    else if (event.altKey && event.key === "Home") onMove(uid, "top");
    else if (event.altKey && event.key === "End") onMove(uid, "bottom");
    else if (primaryModifier && event.key.toLowerCase() === "c") onCopy(actionUids);
    else if (primaryModifier && event.key.toLowerCase() === "x") onCut(actionUids);
    else if (primaryModifier && event.key.toLowerCase() === "v") onPaste(uid);
    else if (primaryModifier && event.key.toLowerCase() === "g" && event.shiftKey) onUngroup(uid);
    else if (primaryModifier && event.key.toLowerCase() === "g") onGroup(actionUids);
    else {
    const index = visibleUids.indexOf(uid);
    if (event.key === "ArrowDown" && index < visibleUids.length - 1) focusUid(visibleUids[index + 1]!);
    else if (event.key === "ArrowUp" && index > 0) focusUid(visibleUids[index - 1]!);
    else if (event.key === "Home") focusUid(visibleUids[0]!);
    else if (event.key === "End") focusUid(visibleUids[visibleUids.length - 1]!);
    else if (event.key === "ArrowRight" && item.children.length > 0) {
      if (!state.expandedUids.has(uid)) onChange(setStudioExpansion(state, uid, true));
      else focusUid(item.children[0]!);
    } else if (event.key === "ArrowLeft") {
      if (state.expandedUids.has(uid) && item.children.length > 0) onChange(setStudioExpansion(state, uid, false));
      else {
        const parentUid = model.parentByUid.get(uid);
        if (parentUid !== undefined) focusUid(parentUid);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      select(uid, { extend: event.shiftKey, toggle: event.metaKey || event.ctrlKey });
    } else return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  const click = (event: MouseEvent<HTMLLIElement>, uid: Uid) => {
    if ((event.target as HTMLElement).closest("[role=treeitem]") !== event.currentTarget) return;
    if ((event.target as HTMLElement).closest("button")) return;
    select(uid, { extend: event.shiftKey, toggle: event.metaKey || event.ctrlKey });
  };
  const selectedNodeUids = (uid: Uid): readonly Uid[] => state.selectedUids.includes(uid)
    ? state.selectedUids.filter((selectedUid) => model.items.get(selectedUid)?.kind !== "form")
    : [uid];
  const drop = (event: DragEvent<HTMLLIElement>, targetUid: Uid) => {
    if ((event.target as HTMLElement).closest("[role=treeitem]") !== event.currentTarget) return;
    event.preventDefault();
    const uid = event.dataTransfer.getData("application/x-stages-studio-uid");
    if (uid) onDrop(uid as Uid, targetUid);
    event.stopPropagation();
  };
  const renderItem = (uid: Uid, level: number) => {
    const item = model.items.get(uid);
    if (!item) return null;
    const expandable = item.children.length > 0;
    const expanded = expandable && state.expandedUids.has(uid);
    return (
      <li
        key={uid}
        ref={(element) => { if (element) itemRefs.current.set(uid, element); else itemRefs.current.delete(uid); }}
        role="treeitem"
        aria-level={level}
        aria-selected={state.selectedUids.includes(uid)}
        {...(expandable ? { "aria-expanded": expanded } : {})}
        tabIndex={state.focusedUid === uid ? 0 : -1}
        className="studio-v1-outline__item"
        data-kind={item.kind}
        data-outline-uid={uid}
        draggable={item.kind !== "form"}
        onClick={(event) => click(event, uid)}
        onFocus={(event) => {
          if (event.target === event.currentTarget && state.focusedUid !== uid) focusUid(uid);
        }}
        onKeyDown={(event) => keyDown(event, uid)}
        onContextMenu={(event) => {
          if ((event.target as HTMLElement).closest("[role=treeitem]") !== event.currentTarget) return;
          event.preventDefault();
          if (!state.selectedUids.includes(uid)) select(uid);
          setContextMenu({ uid, x: event.clientX, y: event.clientY });
        }}
        onDragStart={(event) => startStudioDrag(event, uid)}
        onDragOver={(event) => { if (item.kind !== "form") event.preventDefault(); }}
        onDrop={(event) => drop(event, uid)}
      >
        <div className="studio-v1-outline__row">
          {expandable ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
              onClick={() => onChange(setStudioExpansion(state, uid, !expanded))}
            >{expanded ? "−" : "+"}</button>
          ) : <span aria-hidden="true" className="studio-v1-outline__spacer" />}
          <span>{item.label}</span><small>{item.kind}</small>
        </div>
        {expanded && (
          <ul role="group">
            {item.children.map((childUid) => renderItem(childUid, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className="studio-v1-outline" aria-labelledby="studio-v1-outline-title">
      <div className="studio-v1-section-heading"><h2 id="studio-v1-outline-title">Outline</h2><span>{project.project.title}</span></div>
      <ul role="tree" aria-label="Project structure" aria-multiselectable="true">
        {model.roots.map((uid) => renderItem(uid, 1))}
      </ul>
      {contextMenu !== undefined && (() => {
        const item = model.items.get(contextMenu.uid);
        const node = item === undefined ? undefined : project.forms[item.formUid]?.nodes[contextMenu.uid];
        if (node === undefined) return null;
        const actionUids = selectedNodeUids(contextMenu.uid);
        return <StudioNodeContextMenu
          node={node} actionUids={actionUids} position={contextMenu} canPaste={canPaste}
          onClose={() => setContextMenu(undefined)}
          onMove={(direction) => onMove(contextMenu.uid, direction)}
          onGroup={() => onGroup(actionUids)} onUngroup={() => onUngroup(contextMenu.uid)}
          onConvert={(kind) => onConvert(contextMenu.uid, kind)}
          onCopy={() => onCopy(actionUids)} onCut={() => onCut(actionUids)} onPaste={() => onPaste(contextMenu.uid)}
        />;
      })()}
      <div className="studio-v1-outline__resources">
        <h3>Fragments</h3>
        <p>{Object.keys(project.fragments).length === 0 ? "No fragments" : `${Object.keys(project.fragments).length} fragments`}</p>
      </div>
    </aside>
  );
}
