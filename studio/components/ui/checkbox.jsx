import { forwardRef } from "react";
import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn, pickDOMProps } from "../../lib/utils";

export const Checkbox = forwardRef(function Checkbox({ className, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root ref={ref} className={cn("ui-checkbox", className)} {...pickDOMProps(props, ["checked", "defaultChecked", "disabled", "required", "value"])}>
      <CheckboxPrimitive.Indicator className="ui-checkbox__indicator">
        <Check aria-hidden="true" size={13} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
