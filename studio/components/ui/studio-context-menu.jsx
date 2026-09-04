import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Separator } from "./separator";

function MenuItems({ items, close }) {
  return items.map((item, index) => {
    if (item.separator) return <Separator key={`separator-${index}`} className="ui-context-menu-separator" />;
    if (item.items) {
      return (
        <div className="ui-context-menu-sub" key={String(item.label ?? index)}>
          <Button className="ui-context-menu-item" variant="ghost">{item.icon}{item.label}<ChevronRight className="ui-context-menu-chevron" size={14} /></Button>
          <div className="ui-context-menu-content ui-context-menu-sub__content"><MenuItems items={item.items} close={close} /></div>
        </div>
      );
    }
    return <Button key={String(item.label ?? index)} className="ui-context-menu-item" variant="ghost" disabled={item.disabled} onClick={(event) => { item.command?.({ originalEvent: event, item }); close(); }}>{item.icon}{item.label}</Button>;
  });
}

export const StudioContextMenu = forwardRef(function StudioContextMenu({ model = [] }, ref) {
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0 });
  const close = () => setMenu((current) => ({ ...current, open: false }));
  useImperativeHandle(ref, () => ({
    show(event) {
      event?.preventDefault?.();
      setMenu({ open: true, x: event?.clientX ?? 0, y: event?.clientY ?? 0 });
    },
    hide: close,
  }), []);
  useEffect(() => {
    if (!menu.open) return undefined;
    const dismiss = () => close();
    window.addEventListener("click", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      window.removeEventListener("click", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [menu.open]);
  if (!menu.open || typeof document === "undefined") return null;
  return createPortal(
    <div role="menu" aria-label="Editor actions" className="ui-context-menu-content" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
      <MenuItems items={model} close={close} />
    </div>,
    document.body,
  );
});
