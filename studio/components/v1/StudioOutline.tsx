import { useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { StudioProjectDocument, Uid } from "../../src/document/types";
import {
  createStudioOutlineModel,
  selectStudioUid,
  setStudioExpansion,
  type StudioWorkbenchState,
  visibleStudioOutlineUids,
} from "../../src/editor";

interface StudioOutlineProps {
  readonly project: StudioProjectDocument;
  readonly state: StudioWorkbenchState;
  readonly onChange: (state: StudioWorkbenchState) => void;
  readonly onActivateForm: (formUid: Uid) => void;
}

export function StudioOutline({ project, state, onChange, onActivateForm }: StudioOutlineProps) {
  const model = useMemo(() => createStudioOutlineModel(project), [project]);
  const visibleUids = visibleStudioOutlineUids(model, state.expandedUids);
  const itemRefs = useRef(new Map<Uid, HTMLLIElement>());

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
    event.preventDefault();
    event.stopPropagation();
  };
  const click = (event: MouseEvent<HTMLLIElement>, uid: Uid) => {
    if ((event.target as HTMLElement).closest("[role=treeitem]") !== event.currentTarget) return;
    if ((event.target as HTMLElement).closest("button")) return;
    select(uid, { extend: event.shiftKey, toggle: event.metaKey || event.ctrlKey });
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
        onClick={(event) => click(event, uid)}
        onFocus={(event) => {
          if (event.target === event.currentTarget && state.focusedUid !== uid) focusUid(uid);
        }}
        onKeyDown={(event) => keyDown(event, uid)}
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
      <div className="studio-v1-outline__resources">
        <h3>Fragments</h3>
        <p>{Object.keys(project.fragments).length === 0 ? "No fragments" : `${Object.keys(project.fragments).length} fragments`}</p>
      </div>
    </aside>
  );
}
