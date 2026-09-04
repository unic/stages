import { forwardRef } from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn, pickDOMProps } from "../../lib/utils";

export const Switch = forwardRef(function Switch({ className, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, ...props }, ref) {
  return (
    <SwitchPrimitive.Root ref={ref} className={cn("ui-switch", className)} {...pickDOMProps(props, ["checked", "defaultChecked", "disabled", "required", "value"])}>
      <SwitchPrimitive.Thumb className="ui-switch__thumb" />
    </SwitchPrimitive.Root>
  );
});
