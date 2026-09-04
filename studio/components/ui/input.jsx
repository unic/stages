import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(function Input({ className, type = "text", label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, value, defaultValue, ...props }, ref) {
  return <input ref={ref} type={type} className={cn("ui-input", className)} value={value} {...(value === undefined ? { defaultValue } : {})} {...props} />;
});
