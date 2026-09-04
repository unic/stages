import type { DomFieldBinding, DomFieldView } from "@stages/dom";
import { createDomFields } from "@stages/dom";
import { createEventLaunchFields, type BaseFieldProps, type ChoiceFieldProps, type MoneyFieldProps } from "../../shared/event-launch/index.js";

function appendCopy(wrapper: HTMLElement, binding: DomFieldBinding, props: BaseFieldProps, input: HTMLElement): void {
  wrapper.classList.add("field");
  if (binding.field.type === "textarea" || binding.field.type === "checkbox") wrapper.classList.add("span-2");
  const describedBy: string[] = [];
  if (props.description !== undefined) {
    const copy = binding.document.createElement("p");
    copy.id = `${binding.id}-description`;
    copy.className = "field-description";
    copy.textContent = props.description;
    wrapper.append(copy);
    describedBy.push(copy.id);
  }
  if (binding.field.state.visibleIssues.length > 0) {
    const list = binding.document.createElement("ul");
    list.id = `${binding.id}-issues`;
    list.className = "field-issues";
    list.setAttribute("role", "alert");
    binding.field.state.visibleIssues.forEach((entry) => {
      const item = binding.document.createElement("li");
      item.textContent = entry.message ?? entry.code;
      list.append(item);
    });
    wrapper.append(list);
    describedBy.push(list.id);
    if (binding.field.state.visibleIssues.some((entry) => entry.severity === "error")) input.setAttribute("aria-invalid", "true");
  }
  if (describedBy.length > 0) input.setAttribute("aria-describedby", describedBy.join(" "));
}

function textareaView(): DomFieldView {
  return { render(binding) {
    const props = binding.field.props as unknown as BaseFieldProps;
    const wrapper = binding.document.createElement("div");
    const label = binding.document.createElement("label");
    label.htmlFor = binding.id;
    label.textContent = props.label;
    const input = binding.document.createElement("textarea");
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    input.id = binding.id;
    input.value = String(binding.field.value ?? "");
    input.disabled = binding.field.state.disabled;
    input.addEventListener("input", () => { if (focusTimer !== undefined) clearTimeout(focusTimer); const value = input.value; setTimeout(() => { if (!binding.field.state.focused) binding.emit("focus"); binding.emit("input", value); }, 0); });
    input.addEventListener("focus", () => { if (!binding.field.state.focused) focusTimer = setTimeout(() => { if (input.isConnected) binding.emit("focus"); }, 50); });
    input.addEventListener("blur", () => { if (focusTimer !== undefined) clearTimeout(focusTimer); setTimeout(() => { if (input.isConnected) binding.emit("blur"); }, 0); });
    wrapper.append(label, input);
    appendCopy(wrapper, binding, props, input);
    return wrapper;
  } };
}

function choiceView(): DomFieldView {
  return { render(binding) {
    const props = binding.field.props as unknown as ChoiceFieldProps;
    const wrapper = binding.document.createElement("div");
    wrapper.className = "field";
    const fieldset = binding.document.createElement("fieldset");
    fieldset.className = "choice-field";
    fieldset.disabled = binding.field.state.disabled;
    const legend = binding.document.createElement("legend");
    legend.textContent = props.label;
    const options = binding.document.createElement("div");
    options.className = "choice-options";
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    props.options.forEach((option) => {
      const label = binding.document.createElement("label");
      const input = binding.document.createElement("input");
      input.id = `${binding.id}-${option.value}`;
      input.type = "radio";
      input.name = binding.id;
      input.value = option.value;
      input.checked = binding.field.value === option.value;
      input.addEventListener("change", () => { if (focusTimer !== undefined) clearTimeout(focusTimer); setTimeout(() => { if (!binding.field.state.focused) binding.emit("focus"); binding.emit("input", option.value); }, 0); });
      input.addEventListener("focus", () => { if (!binding.field.state.focused) focusTimer = setTimeout(() => { if (input.isConnected) binding.emit("focus"); }, 50); });
      input.addEventListener("blur", () => { if (focusTimer !== undefined) clearTimeout(focusTimer); setTimeout(() => { if (input.isConnected) binding.emit("blur"); }, 0); });
      label.append(input, option.label);
      options.append(label);
    });
    fieldset.append(legend, options);
    wrapper.append(fieldset);
    appendCopy(wrapper, binding, props, fieldset);
    return wrapper;
  } };
}

function moneyView(): DomFieldView {
  return { render(binding) {
    const props = binding.field.props as unknown as MoneyFieldProps;
    const wrapper = binding.document.createElement("div");
    const label = binding.document.createElement("label");
    label.htmlFor = binding.id;
    label.textContent = props.label;
    const row = binding.document.createElement("div");
    row.className = "number-wrap";
    const input = binding.document.createElement("input");
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    input.id = binding.id;
    input.type = "number";
    input.value = binding.field.value === undefined ? "" : String(binding.field.value);
    input.min = String(props.min ?? 0);
    input.step = String(props.step ?? .01);
    input.disabled = binding.field.state.disabled;
    input.addEventListener("input", () => { if (focusTimer !== undefined) clearTimeout(focusTimer); const value = input.value === "" ? undefined : input.valueAsNumber; setTimeout(() => { if (!binding.field.state.focused) binding.emit("focus"); binding.emit("input", value); }, 0); });
    input.addEventListener("focus", () => { if (!binding.field.state.focused) focusTimer = setTimeout(() => { if (input.isConnected) binding.emit("focus"); }, 50); });
    input.addEventListener("blur", () => { if (focusTimer !== undefined) clearTimeout(focusTimer); setTimeout(() => { if (input.isConnected) binding.emit("blur"); }, 0); });
    const currency = binding.document.createElement("span");
    currency.textContent = props.currency;
    row.append(input, currency);
    wrapper.append(label, row);
    appendCopy(wrapper, binding, props, input);
    return wrapper;
  } };
}

const native = createDomFields();
export const eventLaunchDomFields = createEventLaunchFields({
  text: native.text.view,
  textarea: textareaView(),
  choice: choiceView(),
  number: native.number.view,
  money: moneyView(),
  checkbox: native.checkbox.view,
});
