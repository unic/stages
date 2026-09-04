import { Component, Input } from "@angular/core";
import type { FieldSnapshot } from "@stages/core";
import type { AngularFieldView } from "@stages/angular";
import { createEventLaunchFields, type CheckboxFieldProps, type ChoiceFieldProps, type MoneyFieldProps, type NumberFieldProps, type TextFieldProps } from "../../shared/event-launch/index.js";

@Component({
  selector: "event-text-field",
  standalone: true,
  template: `
    <div class="field" [class.span-2]="field.type === 'textarea'">
      <label [for]="id">{{ props.label }} @if (props.required) { <span class="required" aria-hidden="true">*</span> }</label>
      @if (field.type === 'textarea') {
        <textarea [id]="id" [value]="field.value" [placeholder]="props.placeholder ?? ''" [disabled]="field.state.disabled" [attr.aria-invalid]="hasErrors() ? 'true' : null" [attr.aria-describedby]="describedBy()" (input)="inputText($event)" (focus)="emit('focus')" (blur)="emit('blur')"></textarea>
      } @else {
        <input [id]="id" [type]="props.inputType ?? 'text'" [value]="field.value" [placeholder]="props.placeholder ?? ''" [disabled]="field.state.disabled" [attr.aria-invalid]="hasErrors() ? 'true' : null" [attr.aria-describedby]="describedBy()" (input)="inputText($event)" (focus)="emit('focus')" (blur)="emit('blur')" />
      }
      @if (props.description) { <p [id]="id + '-description'" class="field-description">{{ props.description }}</p> }
      @if (field.state.visibleIssues.length) { <ul [id]="id + '-issues'" class="field-issues" role="alert">@for (issue of field.state.visibleIssues; track issue.id) { <li>{{ issue.message ?? issue.code }}</li> }</ul> }
    </div>
  `,
})
export class TextFieldComponent implements AngularFieldView<string, TextFieldProps> {
  @Input({ required: true }) id!: string;
  @Input({ required: true }) field!: FieldSnapshot<string, unknown>;
  @Input({ required: true }) props!: TextFieldProps;
  @Input({ required: true }) emit!: (name: string, payload?: unknown) => void;
  inputText(event: Event): void { if (event.currentTarget instanceof HTMLInputElement || event.currentTarget instanceof HTMLTextAreaElement) this.emit("input", event.currentTarget.value); }
  hasErrors(): boolean { return this.field.state.visibleIssues.some((issue) => issue.severity === "error"); }
  describedBy(): string | null { const ids = [this.props.description ? `${this.id}-description` : "", this.field.state.visibleIssues.length ? `${this.id}-issues` : ""].filter(Boolean); return ids.length ? ids.join(" ") : null; }
}

@Component({
  selector: "event-choice-field",
  standalone: true,
  template: `<div class="field"><fieldset class="choice-field" [disabled]="field.state.disabled"><legend>{{ props.label }} @if (props.required) { <span class="required">*</span> }</legend><div class="choice-options">@for (option of props.options; track option.value) { <label><input type="radio" [name]="id" [value]="option.value" [checked]="field.value === option.value" (change)="emit('input', option.value)" (focus)="emit('focus')" (blur)="emit('blur')" />{{ option.label }}</label> }</div></fieldset>@if (props.description) { <p class="field-description">{{ props.description }}</p> }@if (field.state.visibleIssues.length) { <ul class="field-issues" role="alert">@for (issue of field.state.visibleIssues; track issue.id) { <li>{{ issue.message ?? issue.code }}</li> }</ul> }</div>`,
})
export class ChoiceFieldComponent implements AngularFieldView<string, ChoiceFieldProps> {
  @Input({ required: true }) id!: string; @Input({ required: true }) field!: FieldSnapshot<string, unknown>; @Input({ required: true }) props!: ChoiceFieldProps; @Input({ required: true }) emit!: (name: string, payload?: unknown) => void;
}

@Component({
  selector: "event-number-field",
  standalone: true,
  template: `<div class="field"><label [for]="id">{{ props.label }}</label><div class="number-wrap"><input [id]="id" type="number" [value]="field.value ?? ''" [min]="props.min ?? null" [max]="props.max ?? null" [step]="props.step ?? null" [disabled]="field.state.disabled" [attr.aria-invalid]="field.state.visibleIssues.length ? 'true' : null" (input)="inputNumber($event)" (focus)="emit('focus')" (blur)="emit('blur')" /><span>{{ suffix() }}</span></div>@if (field.state.visibleIssues.length) { <ul class="field-issues" role="alert">@for (issue of field.state.visibleIssues; track issue.id) { <li>{{ issue.message ?? issue.code }}</li> }</ul> }</div>`,
})
export class NumberFieldComponent implements AngularFieldView<number | undefined, NumberFieldProps> {
  @Input({ required: true }) id!: string; @Input({ required: true }) field!: FieldSnapshot<number | undefined, unknown>; @Input({ required: true }) props!: NumberFieldProps | MoneyFieldProps; @Input({ required: true }) emit!: (name: string, payload?: unknown) => void;
  inputNumber(event: Event): void { if (event.currentTarget instanceof HTMLInputElement) this.emit("input", event.currentTarget.value === "" ? undefined : event.currentTarget.valueAsNumber); }
  suffix(): string { return "currency" in this.props ? this.props.currency : this.props.suffix ?? ""; }
}

@Component({
  selector: "event-checkbox-field",
  standalone: true,
  template: `<div class="field span-2"><label class="checkbox-label" [for]="id"><input [id]="id" type="checkbox" [checked]="field.value" [disabled]="field.state.disabled" (change)="inputBoolean($event)" (focus)="emit('focus')" (blur)="emit('blur')" />{{ props.label }}</label>@if (props.description) { <p class="field-description">{{ props.description }}</p> }@if (field.state.visibleIssues.length) { <ul class="field-issues" role="alert">@for (issue of field.state.visibleIssues; track issue.id) { <li>{{ issue.message ?? issue.code }}</li> }</ul> }</div>`,
})
export class CheckboxFieldComponent implements AngularFieldView<boolean, CheckboxFieldProps> {
  @Input({ required: true }) id!: string; @Input({ required: true }) field!: FieldSnapshot<boolean, unknown>; @Input({ required: true }) props!: CheckboxFieldProps; @Input({ required: true }) emit!: (name: string, payload?: unknown) => void;
  inputBoolean(event: Event): void { if (event.currentTarget instanceof HTMLInputElement) this.emit("input", event.currentTarget.checked); }
}

export const eventLaunchAngularFields = createEventLaunchFields({ text: TextFieldComponent, textarea: TextFieldComponent, choice: ChoiceFieldComponent, number: NumberFieldComponent, money: NumberFieldComponent, checkbox: CheckboxFieldComponent });
