import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button as PrimeButton } from "@primereact/ui/button";
import { InputText as PrimeInputText } from "@primereact/ui/inputtext";

const optionValue = (option, key = "value") =>
  option && typeof option === "object" ? option[key] : option;
const optionLabel = (option, key = "label") =>
  option && typeof option === "object" ? option[key] ?? option.value : option;

export const Button = ({ label, children, link, severity, ...props }) => (
  <PrimeButton {...props} variant={link ? "text" : props.variant}>
    {children ?? label}
  </PrimeButton>
);

export const InputText = forwardRef(function InputText(props, ref) {
  const { tooltipOptions, ...inputProps } = props;
  return <PrimeInputText ref={ref} {...inputProps} />;
});

export const InputTextarea = forwardRef(function InputTextarea(props, ref) {
  const { tooltipOptions, ...inputProps } = props;
  return <textarea ref={ref} {...inputProps} />;
});

export function Dropdown({
  options = [],
  optionLabel: labelKey = "label",
  optionValue: valueKey = "value",
  placeholder,
  value = "",
  onChange,
  filter,
  ...props
}) {
  return (
    <select {...props} value={value ?? ""} onChange={onChange}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option, index) => (
        <option key={String(optionValue(option, valueKey) ?? index)} value={optionValue(option, valueKey)}>
          {optionLabel(option, labelKey)}
        </option>
      ))}
    </select>
  );
}

export function MultiSelect({
  options = [],
  optionLabel: labelKey = "label",
  optionValue: valueKey = "value",
  value = [],
  onChange,
  filter,
  ...props
}) {
  return (
    <select
      {...props}
      multiple
      value={value}
      onChange={(event) => {
        const nextValue = [...event.currentTarget.selectedOptions].map(({ value }) => value);
        onChange?.({ originalEvent: event, value: nextValue, target: { value: nextValue } });
      }}
    >
      {options.map((option, index) => (
        <option key={String(optionValue(option, valueKey) ?? index)} value={optionValue(option, valueKey)}>
          {optionLabel(option, labelKey)}
        </option>
      ))}
    </select>
  );
}

export function Calendar({ value, onChange, showIcon, locale, ...props }) {
  const normalized = value instanceof Date && !Number.isNaN(value.valueOf())
    ? value.toISOString().slice(0, 10)
    : typeof value === "string" ? value.slice(0, 10) : "";
  return (
    <input
      {...props}
      type="date"
      value={normalized}
      onChange={(event) => {
        const nextValue = event.target.value ? new Date(`${event.target.value}T00:00:00`) : "";
        onChange?.({ originalEvent: event, value: nextValue, target: { value: nextValue } });
      }}
    />
  );
}

export function Checkbox({ checked, value, onChange, ...props }) {
  return (
    <input
      {...props}
      type="checkbox"
      checked={checked ?? Boolean(value)}
      onChange={(event) => onChange?.({
        originalEvent: event,
        checked: event.target.checked,
        value: event.target.checked,
        target: { checked: event.target.checked, value: event.target.checked },
      })}
    />
  );
}

export function InputSwitch(props) {
  return <Checkbox {...props} role="switch" />;
}

export function ToggleButton({ checked, onChange, onLabel = "On", offLabel = "Off", ...props }) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={Boolean(checked)}
      onClick={(event) => onChange?.({ originalEvent: event, value: !checked, checked: !checked, target: { value: !checked } })}
    >
      {checked ? onLabel : offLabel}
    </button>
  );
}

export function InputNumber({ value, onChange, min, max, step, ...props }) {
  return (
    <input
      {...props}
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      onChange={(event) => {
        const nextValue = event.target.value === "" ? null : event.target.valueAsNumber;
        onChange?.({ originalEvent: event, value: nextValue, target: { value: nextValue } });
      }}
    />
  );
}

export function Rating({ value = 0, onChange, stars = 5, ...props }) {
  return (
    <select {...props} value={value} onChange={(event) => onChange?.({ originalEvent: event, value: Number(event.target.value) })}>
      {Array.from({ length: stars + 1 }, (_, index) => <option key={index} value={index}>{index}</option>)}
    </select>
  );
}

export function SelectButton({ options = [], value, onChange, optionLabel: labelKey = "label", optionValue: valueKey = "value", ...props }) {
  return (
    <div {...props} role="group">
      {options.map((option, index) => {
        const nextValue = optionValue(option, valueKey);
        return (
          <button
            type="button"
            key={String(nextValue ?? index)}
            aria-pressed={nextValue === value}
            onClick={(event) => onChange?.({ originalEvent: event, value: nextValue, target: { value: nextValue } })}
          >
            {optionLabel(option, labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({ value = 0, onChange, ...props }) {
  return <input {...props} type="range" value={value} onChange={(event) => onChange?.({ originalEvent: event, value: Number(event.target.value) })} />;
}

export function Editor({ value = "", onChange, ...props }) {
  return <textarea {...props} value={value} onChange={onChange} />;
}

export function Chips({ value = [], onChange, ...props }) {
  const text = Array.isArray(value) ? value.join(", ") : value;
  return (
    <input
      {...props}
      value={text}
      onChange={(event) => onChange?.({
        originalEvent: event,
        value: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
      })}
    />
  );
}

export function ColorPicker({ value = "ffffff", onChange, format, ...props }) {
  const normalized = String(value).startsWith("#") ? value : `#${value}`;
  return <input {...props} type="color" value={normalized} onChange={(event) => onChange?.({ originalEvent: event, value: event.target.value.slice(1) })} />;
}

export function InputMask({ mask, ...props }) {
  return <InputText {...props} />;
}

export function Password({ feedback, toggleMask, ...props }) {
  return <InputText {...props} type="password" />;
}

export function Divider({ children, layout = "horizontal", align, pt, ...props }) {
  const rootStyle = { ...pt?.root?.style, ...props.style };
  return (
    <div {...props} style={rootStyle} role="separator" aria-orientation={layout}>
      <hr />
      {children ? <div style={pt?.content?.style}>{children}</div> : null}
    </div>
  );
}

export function Message({ text, severity = "info", ...props }) {
  return <div {...props} role={severity === "error" ? "alert" : "status"} className={`p-message p-message-${severity}`}>{text}</div>;
}

export function AutoComplete({ value = "", suggestions = [], completeMethod, onChange, onSelect, dropdown, dropdownIcon, ...props }) {
  const listId = useMemo(() => `autocomplete-${Math.random().toString(36).slice(2)}`, []);
  return (
    <span>
      <input
        {...props}
        list={listId}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          completeMethod?.({ originalEvent: event, query: nextValue });
          onChange?.({ originalEvent: event, value: nextValue, target: { value: nextValue } });
          if (suggestions.includes(nextValue)) onSelect?.({ originalEvent: event, value: nextValue });
        }}
      />
      <datalist id={listId}>{suggestions.map((suggestion) => <option key={String(suggestion)} value={suggestion} />)}</datalist>
      {dropdown ? dropdownIcon : null}
    </span>
  );
}

export function TabMenu({ model = [], activeIndex = 0, onTabChange }) {
  return (
    <div role="tablist" className="p-tabmenu-nav">
      {model.map((item, index) => (
        <button key={item.label ?? index} type="button" role="tab" aria-selected={index === activeIndex} onClick={(event) => onTabChange?.({ originalEvent: event, index })}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export const ScrollPanel = forwardRef(function ScrollPanel({ children, style, ...props }, ref) {
  return <div ref={ref} {...props} style={{ overflow: "auto", ...style }}>{children}</div>;
});

export const Toast = forwardRef(function Toast({ position, ...props }, ref) {
  const [message, setMessage] = useState(null);
  useImperativeHandle(ref, () => ({
    show(nextMessage) {
      setMessage(nextMessage);
    },
    clear() {
      setMessage(null);
    },
  }), []);
  useEffect(() => {
    if (!message?.life) return undefined;
    const timer = window.setTimeout(() => setMessage(null), message.life);
    return () => window.clearTimeout(timer);
  }, [message]);
  return message ? <div {...props} role="status" className={`p-toast p-toast-${position ?? "top-right"}`}><strong>{message.summary}</strong> {message.detail}</div> : null;
});

function MenuItems({ model, hide }) {
  return model.map((item, index) => item.separator
    ? <hr key={`separator-${index}`} />
    : <button key={item.label ?? index} type="button" disabled={item.disabled} onClick={(event) => { item.command?.({ originalEvent: event, item }); hide(); }}>{item.label}</button>);
}

export const ContextMenu = forwardRef(function ContextMenu({ model = [], ...props }, ref) {
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const hide = () => setMenu((current) => ({ ...current, visible: false }));
  useImperativeHandle(ref, () => ({
    show(event) {
      event?.preventDefault?.();
      setMenu({ visible: true, x: event?.clientX ?? 0, y: event?.clientY ?? 0 });
    },
    hide,
  }), []);
  return menu.visible ? <div {...props} role="menu" style={{ position: "fixed", zIndex: 1000, left: menu.x, top: menu.y }}><MenuItems model={model} hide={hide} /></div> : null;
});

export function Splitter({ children, gutterSize, stateStorage, stateKey, style, ...props }) {
  return <div {...props} style={{ display: "flex", ...style }}>{children}</div>;
}

export function SplitterPanel({ children, size, style, ...props }) {
  return <div {...props} style={{ flex: `${size ?? 1} 1 0`, minWidth: 0, ...style }}>{children}</div>;
}
