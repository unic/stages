import { forwardRef } from "react";
import { cn, pickDOMProps } from "../../lib/utils";

export const Textarea = forwardRef(function Textarea({ className, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, value, defaultValue, ...props }, ref) {
  return <textarea ref={ref} className={cn("ui-textarea", className)} value={value} {...(value === undefined ? { defaultValue } : {})} {...pickDOMProps(props, ["autoComplete", "cols", "disabled", "form", "maxLength", "minLength", "placeholder", "readOnly", "required", "rows", "wrap"])} />;
});
