import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { StudioMoveDirection } from "../../src/editor";
import type { StudioNode, Uid } from "../../src/document/types";

export interface StudioContextMenuPosition {
  readonly x: number;
  readonly y: number;
}

interface StudioNodeContextMenuProps {
  readonly node: StudioNode;
  readonly actionUids: readonly Uid[];
  readonly position: StudioContextMenuPosition;
  readonly canPaste: boolean;
  readonly onClose: () => void;
  readonly onMove: (direction: StudioMoveDirection) => void;
  readonly onGroup: () => void;
  readonly onUngroup: () => void;
  readonly onConvert: (kind: "collection" | "group" | "wizard") => void;
  readonly onCopy: () => void;
  readonly onCut: () => void;
  readonly onPaste: () => void;
}

export interface StudioInsertMenuItem {
  readonly group: "content" | "fields" | "structure";
  readonly label: string;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

interface StudioInsertContextMenuProps {
  readonly position: StudioContextMenuPosition;
  readonly items: readonly StudioInsertMenuItem[];
  readonly onClose: () => void;
}

function MenuItem({ children, disabled = false, onSelect }: {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}) {
  return <button role="menuitem" type="button" disabled={disabled} onClick={onSelect}>{children}</button>;
}

export function StudioNodeContextMenu({
  node, actionUids, position, canPaste, onClose, onMove, onGroup, onUngroup, onConvert, onCopy, onCut, onPaste,
}: StudioNodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const single = actionUids.length === 1;
  const convertible = single && (node.kind === "group" || node.kind === "collection" || node.kind === "wizard");
  const unwrappable = single && (node.kind === "group" || node.kind === "collection");
  const run = (action: () => void) => { action(); onClose(); };

  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onCloseRef.current();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("pointerdown", dismiss);
    const blur = () => onCloseRef.current();
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", keyDown);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", keyDown);
    };
  }, []);

  if (typeof document === "undefined") return null;
  const left = Math.max(8, Math.min(position.x, window.innerWidth - 236));
  const top = Math.max(8, Math.min(position.y, window.innerHeight - 430));
  return createPortal(
    <div
      ref={menuRef}
      className="studio-v1-context-menu"
      role="menu"
      aria-label={`Structure actions for ${node.uid}`}
      style={{ left, top }}
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "End", "Home"].includes(event.key)) return;
        const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex = event.key === "Home" ? 0
          : event.key === "End" ? items.length - 1
            : event.key === "ArrowDown" ? (currentIndex + 1) % items.length
              : (currentIndex - 1 + items.length) % items.length;
        items[nextIndex]?.focus();
        event.preventDefault();
      }}
    >
      <MenuItem disabled={!single} onSelect={() => run(() => onMove("up"))}>Move up <kbd aria-hidden="true">Alt ↑</kbd></MenuItem>
      <MenuItem disabled={!single} onSelect={() => run(() => onMove("down"))}>Move down <kbd aria-hidden="true">Alt ↓</kbd></MenuItem>
      <MenuItem disabled={!single} onSelect={() => run(() => onMove("top"))}>Move to top <kbd aria-hidden="true">Alt Home</kbd></MenuItem>
      <MenuItem disabled={!single} onSelect={() => run(() => onMove("bottom"))}>Move to bottom <kbd aria-hidden="true">Alt End</kbd></MenuItem>
      <MenuItem disabled={!single} onSelect={() => run(() => onMove("in"))}>Move into previous <kbd aria-hidden="true">Alt →</kbd></MenuItem>
      <MenuItem disabled={!single} onSelect={() => run(() => onMove("out"))}>Move out <kbd aria-hidden="true">Alt ←</kbd></MenuItem>
      <hr />
      <MenuItem disabled={actionUids.length === 0} onSelect={() => run(onGroup)}>Group <kbd aria-hidden="true">⌘ G</kbd></MenuItem>
      <MenuItem disabled={!unwrappable} onSelect={() => run(onUngroup)}>Ungroup <kbd aria-hidden="true">⇧ ⌘ G</kbd></MenuItem>
      {convertible && <>
        <hr />
        <MenuItem disabled={node.kind === "group"} onSelect={() => run(() => onConvert("group"))}>Convert to group</MenuItem>
        <MenuItem disabled={node.kind === "collection"} onSelect={() => run(() => onConvert("collection"))}>Convert to collection</MenuItem>
        <MenuItem disabled={node.kind === "wizard"} onSelect={() => run(() => onConvert("wizard"))}>Convert to wizard</MenuItem>
      </>}
      <hr />
      <MenuItem disabled={actionUids.length === 0} onSelect={() => run(onCopy)}>Copy <kbd aria-hidden="true">⌘ C</kbd></MenuItem>
      <MenuItem disabled={actionUids.length === 0} onSelect={() => run(onCut)}>Cut <kbd aria-hidden="true">⌘ X</kbd></MenuItem>
      <MenuItem disabled={!canPaste || !single} onSelect={() => run(onPaste)}>Paste <kbd aria-hidden="true">⌘ V</kbd></MenuItem>
    </div>,
    document.body,
  );
}

export function StudioInsertContextMenu({ position, items, onClose }: StudioInsertContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onCloseRef.current();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const blur = () => onCloseRef.current();
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", keyDown);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", keyDown);
    };
  }, []);

  if (typeof document === "undefined") return null;
  const left = Math.max(8, Math.min(position.x, window.innerWidth - 236));
  const top = Math.max(8, Math.min(position.y, window.innerHeight - 430));
  return createPortal(
    <div
      ref={menuRef}
      className="studio-v1-context-menu"
      role="menu"
      aria-label="Insert item"
      style={{ left, top }}
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "End", "Home"].includes(event.key)) return;
        const menuItems = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex = event.key === "Home" ? 0
          : event.key === "End" ? menuItems.length - 1
            : event.key === "ArrowDown" ? (currentIndex + 1) % menuItems.length
              : (currentIndex - 1 + menuItems.length) % menuItems.length;
        menuItems[nextIndex]?.focus();
        event.preventDefault();
      }}
    >
      {items.flatMap((item, index) => {
        const separator = index > 0 && items[index - 1]?.group !== item.group;
        return [
          ...(separator ? [<hr key={`separator-${item.group}`} />] : []),
          <MenuItem key={`${item.group}-${item.label}`} {...(item.disabled === undefined ? {} : { disabled: item.disabled })} onSelect={() => {
            item.onSelect();
            onClose();
          }}>{item.label}</MenuItem>,
        ];
      })}
    </div>,
    document.body,
  );
}
