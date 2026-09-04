import { forwardRef } from "react";
import { cn, pickDOMProps } from "../../lib/utils";

const INPUT_PROPS = [
  "accept", "alt", "autoComplete", "capture", "checked", "disabled", "form",
  "formAction", "formEncType", "formMethod", "formNoValidate", "formTarget",
  "height", "list", "max", "maxLength", "min", "minLength", "multiple",
  "pattern", "placeholder", "readOnly", "required", "size", "src", "step", "width",
];

export const Input = forwardRef(function Input({ className, type = "text", label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, value, defaultValue, ...props }, ref) {
  return <input ref={ref} type={type} className={cn("ui-input", className)} value={value} {...(value === undefined ? { defaultValue } : {})} {...pickDOMProps(props, INPUT_PROPS)} />;
});
