import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { ToggleGroup } from "radix-ui";
import { cn, pickDOMProps } from "../../lib/utils";
import { Alert, AlertDescription } from "./alert";
import { Button } from "./button";
import { Checkbox as CheckboxPrimitive } from "./checkbox";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Separator } from "./separator";
import { Slider as SliderPrimitive } from "./slider";
import { Switch as SwitchPrimitive } from "./switch";
import { Textarea } from "./textarea";

const optionValue = (option, key = "value") => option && typeof option === "object" ? option[key] : option;
const optionLabel = (option, key = "label") => option && typeof option === "object" ? option[key] ?? option.value : option;
const emitValue = (onChange, value, originalEvent) => onChange?.({ originalEvent, value, checked: value, target: { value, checked: value } });

export const InputText = Input;
export const InputTextarea = Textarea;

export function Dropdown({ options = [], optionLabel: labelKey = "label", optionValue: valueKey = "value", placeholder, value = "", onChange, className, id, name, disabled, ...props }) {
  const selected = options.find((option) => Object.is(optionValue(option, valueKey), value));
  const selectedString = selected === undefined ? undefined : String(optionValue(selected, valueKey));
  return (
    <Select value={selectedString} onValueChange={(nextValue) => {
      const nextOption = options.find((option) => String(optionValue(option, valueKey)) === nextValue);
      emitValue(onChange, nextOption === undefined ? nextValue : optionValue(nextOption, valueKey));
    }} disabled={disabled} name={name}>
      <SelectTrigger id={id} className={className} aria-invalid={props["aria-invalid"]}>
        <SelectValue placeholder={placeholder || "Select an option"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option, index) => {
          const nextValue = optionValue(option, valueKey);
          return <SelectItem key={String(nextValue ?? index)} value={String(nextValue)}>{optionLabel(option, labelKey)}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}

export const MultiSelect = forwardRef(function MultiSelect({ options = [], optionLabel: labelKey = "label", optionValue: valueKey = "value", value = [], onChange, className, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, defaultValue, ...props }, ref) {
  return (
    <select ref={ref} className={cn("ui-input ui-multiselect", className)} multiple value={value.map(String)} onChange={(event) => {
      const stringValues = [...event.currentTarget.selectedOptions].map(({ value: selectedValue }) => selectedValue);
      const nextValue = stringValues.map((selectedValue) => {
        const option = options.find((candidate) => String(optionValue(candidate, valueKey)) === selectedValue);
        return option === undefined ? selectedValue : optionValue(option, valueKey);
      });
      emitValue(onChange, nextValue, event);
    }} {...pickDOMProps(props, ["disabled", "form", "required", "size"])}>
      {options.map((option, index) => <option key={String(optionValue(option, valueKey) ?? index)} value={String(optionValue(option, valueKey))}>{optionLabel(option, labelKey)}</option>)}
    </select>
  );
});

export function Calendar({ value, onChange, ...props }) {
  const normalized = value instanceof Date && !Number.isNaN(value.valueOf()) ? value.toISOString().slice(0, 10) : typeof value === "string" ? value.slice(0, 10) : "";
  return <Input {...props} type="date" value={normalized} onChange={(event) => emitValue(onChange, event.target.value ? new Date(`${event.target.value}T00:00:00`) : "", event)} />;
}

export function Checkbox({ checked, value, onChange, ...props }) {
  return <CheckboxPrimitive {...props} checked={checked ?? Boolean(value)} onCheckedChange={(nextChecked) => emitValue(onChange, nextChecked === true)} />;
}

export function InputSwitch({ checked, value, onChange, ...props }) {
  return <SwitchPrimitive {...props} checked={checked ?? Boolean(value)} onCheckedChange={(nextChecked) => emitValue(onChange, nextChecked)} />;
}

export function ToggleButton({ checked, onChange, onLabel = "On", offLabel = "Off", label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, defaultValue, ...props }) {
  return <Button {...pickDOMProps(props, ["disabled", "form", "formAction", "name"])} variant={checked ? "default" : "outline"} aria-pressed={Boolean(checked)} onClick={(event) => emitValue(onChange, !checked, event)}>{checked ? onLabel : offLabel}</Button>;
}

export function InputNumber({ value, onChange, ...props }) {
  return <Input {...props} type="number" value={value ?? ""} onChange={(event) => emitValue(onChange, event.target.value === "" ? null : event.target.valueAsNumber, event)} />;
}

export function Rating({ value = 0, onChange, stars = 5, className, ...props }) {
  return (
    <div className={cn("ui-rating", className)} role="radiogroup" aria-label={props["aria-label"] || "Rating"}>
      {Array.from({ length: stars }, (_, index) => index + 1).map((rating) => (
        <Button key={rating} size="icon" variant="ghost" role="radio" aria-checked={rating === value} aria-label={`${rating} star${rating === 1 ? "" : "s"}`} onClick={(event) => emitValue(onChange, rating === value ? 0 : rating, event)}>
          <Star size={18} className={rating <= value ? "ui-rating__star--active" : undefined} fill={rating <= value ? "currentColor" : "none"} />
        </Button>
      ))}
    </div>
  );
}

export function SelectButton({ options = [], value, onChange, optionLabel: labelKey = "label", optionValue: valueKey = "value", className, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, defaultValue, ...props }) {
  return (
    <ToggleGroup.Root type="single" className={cn("ui-toggle-group", className)} value={value === undefined ? "" : String(value)} onValueChange={(nextValue) => {
      if (!nextValue) return;
      const option = options.find((candidate) => String(optionValue(candidate, valueKey)) === nextValue);
      emitValue(onChange, option === undefined ? nextValue : optionValue(option, valueKey));
    }} {...pickDOMProps(props, ["disabled", "loop", "orientation", "required"])}>
      {options.map((option, index) => {
        const nextValue = optionValue(option, valueKey);
        return <ToggleGroup.Item className="ui-toggle-group__item" key={String(nextValue ?? index)} value={String(nextValue)}>{optionLabel(option, labelKey)}</ToggleGroup.Item>;
      })}
    </ToggleGroup.Root>
  );
}

export function Slider({ value = 0, onChange, ...props }) {
  return <SliderPrimitive {...props} value={value} onValueChange={(nextValue) => emitValue(onChange, nextValue[0])} />;
}

export const Editor = Textarea;

export function Chips({ value = [], onChange, ...props }) {
  return <Input {...props} value={Array.isArray(value) ? value.join(", ") : value} onChange={(event) => emitValue(onChange, event.target.value.split(",").map((item) => item.trim()).filter(Boolean), event)} />;
}

export function ColorPicker({ value = "ffffff", onChange, ...props }) {
  const normalized = String(value).startsWith("#") ? value : `#${value}`;
  return <Input {...props} className={cn("ui-color-input", props.className)} type="color" value={normalized} onChange={(event) => emitValue(onChange, event.target.value.slice(1), event)} />;
}

export const InputMask = Input;

export function Password({ feedback, toggleMask = true, className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn("ui-password", className)}>
      <Input {...props} className="ui-password__input" type={visible ? "text" : "password"} />
      {toggleMask ? <Button className="ui-password__toggle" size="icon" variant="ghost" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</Button> : null}
    </div>
  );
}

export function Divider({ children, layout = "horizontal", className, pt, type, align, ...props }) {
  if (!children) return <Separator orientation={layout} className={className} />;
  return <div className={cn("ui-divider", `ui-divider--${layout}`, className)} {...pickDOMProps(props)}><Separator orientation={layout} /><span>{children}</span><Separator orientation={layout} /></div>;
}

export function Message({ text, severity = "info", ...props }) {
  const variant = severity === "error" ? "destructive" : severity === "warn" ? "warning" : severity === "success" ? "success" : "default";
  return <Alert variant={variant} {...props}><AlertDescription>{text}</AlertDescription></Alert>;
}

export function AutoComplete({ value = "", suggestions = [], completeMethod, onChange, onSelect, ...props }) {
  const listId = useId();
  return <><Input {...props} list={listId} value={value} onChange={(event) => {
    const nextValue = event.target.value;
    completeMethod?.({ originalEvent: event, query: nextValue });
    emitValue(onChange, nextValue, event);
    if (suggestions.includes(nextValue)) onSelect?.({ originalEvent: event, value: nextValue });
  }} /><datalist id={listId}>{suggestions.map((suggestion) => <option key={String(suggestion)} value={suggestion} />)}</datalist></>;
}
