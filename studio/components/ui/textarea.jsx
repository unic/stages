import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Textarea = forwardRef(function Textarea({ className, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, value, defaultValue, ...props }, ref) {
  return <textarea ref={ref} className={cn("ui-textarea", className)} value={value} {...(value === undefined ? { defaultValue } : {})} {...props} />;
});
