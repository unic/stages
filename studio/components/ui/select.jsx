import { forwardRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

export function Select({ value, defaultValue, onValueChange, children, ...props }) {
  return <SelectPrimitive.Root value={value === "" ? undefined : value} defaultValue={defaultValue} onValueChange={onValueChange} {...props}>{children}</SelectPrimitive.Root>;
}

export const SelectTrigger = forwardRef(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger ref={ref} className={cn("ui-select-trigger", className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown aria-hidden="true" size={15} /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = forwardRef(function SelectContent({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} position="popper" sideOffset={4} className={cn("ui-select-content", className)} {...props}>
        <SelectPrimitive.Viewport className="ui-select-viewport">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item ref={ref} className={cn("ui-select-item", className)} {...props}>
      <span className="ui-select-item__indicator"><SelectPrimitive.ItemIndicator><Check aria-hidden="true" size={14} /></SelectPrimitive.ItemIndicator></span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
