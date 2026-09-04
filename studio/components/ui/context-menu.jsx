import { forwardRef } from "react";
import { ChevronRight } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;

export const ContextMenuContent = forwardRef(function ContextMenuContent({ className, ...props }, ref) {
  return <ContextMenuPrimitive.Content ref={ref} className={cn("ui-context-menu-content", className)} {...props} />;
});

export const ContextMenuItem = forwardRef(function ContextMenuItem({ className, inset, ...props }, ref) {
  return <ContextMenuPrimitive.Item ref={ref} className={cn("ui-context-menu-item", inset && "ui-context-menu-item--inset", className)} {...props} />;
});

export const ContextMenuSeparator = forwardRef(function ContextMenuSeparator({ className, ...props }, ref) {
  return <ContextMenuPrimitive.Separator ref={ref} className={cn("ui-context-menu-separator", className)} {...props} />;
});

export const ContextMenuSubTrigger = forwardRef(function ContextMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <ContextMenuPrimitive.SubTrigger ref={ref} className={cn("ui-context-menu-item", className)} {...props}>
      {children}<ChevronRight aria-hidden="true" className="ui-context-menu-chevron" size={14} />
    </ContextMenuPrimitive.SubTrigger>
  );
});

export const ContextMenuSubContent = forwardRef(function ContextMenuSubContent({ className, ...props }, ref) {
  return <ContextMenuPrimitive.SubContent ref={ref} className={cn("ui-context-menu-content", className)} {...props} />;
});
