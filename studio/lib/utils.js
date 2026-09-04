import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const GLOBAL_DOM_PROPS = new Set([
  "accessKey", "autoFocus", "dir", "draggable", "hidden", "id", "lang",
  "name", "role", "slot", "spellCheck", "style", "tabIndex", "title",
]);

export function pickDOMProps(props, allowed = []) {
  const allowedProps = new Set([...GLOBAL_DOM_PROPS, ...allowed]);
  return Object.fromEntries(Object.entries(props).filter(([key]) =>
    allowedProps.has(key)
    || key.startsWith("aria-")
    || key.startsWith("data-")
    || /^on[A-Z]/.test(key)
  ));
}
