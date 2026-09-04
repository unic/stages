import type { StagesOptions } from "@stages/core";
import type { DomFieldView } from "@stages/dom";
import type { ReactFieldView } from "@stages/react";
import type { VueFieldView } from "@stages/vue";
import type { AngularFieldComponent } from "@stages/angular";
import { createEventLaunchFields, type BaseFieldProps, type CheckboxFieldProps, type ChoiceFieldProps, type MoneyFieldProps, type NumberFieldProps, type TextFieldProps } from "./shared/event-launch/field-contract.js";
import { defaultEventLaunchContext, defaultEventLaunchValue } from "./shared/event-launch/fixtures.js";
import type { EventLaunchContext, EventLaunchValue } from "./shared/event-launch/model.js";
import { createEventLaunchSchema } from "./shared/event-launch/schema.js";

declare const domView: DomFieldView;
const domFields = createEventLaunchFields({ text: domView, textarea: domView, choice: domView, number: domView, money: domView, checkbox: domView });
declare const reactViews: { text: ReactFieldView<string, TextFieldProps>; textarea: ReactFieldView<string, BaseFieldProps>; choice: ReactFieldView<string, ChoiceFieldProps>; number: ReactFieldView<number | undefined, NumberFieldProps>; money: ReactFieldView<number | undefined, MoneyFieldProps>; checkbox: ReactFieldView<boolean, CheckboxFieldProps> };
const reactFields = createEventLaunchFields(reactViews);
declare const vueViews: { text: VueFieldView<string, TextFieldProps>; textarea: VueFieldView<string, BaseFieldProps>; choice: VueFieldView<string, ChoiceFieldProps>; number: VueFieldView<number | undefined, NumberFieldProps>; money: VueFieldView<number | undefined, MoneyFieldProps>; checkbox: VueFieldView<boolean, CheckboxFieldProps> };
const vueFields = createEventLaunchFields(vueViews);
declare const angularViews: { text: AngularFieldComponent<string, TextFieldProps>; textarea: AngularFieldComponent<string, BaseFieldProps>; choice: AngularFieldComponent<string, ChoiceFieldProps>; number: AngularFieldComponent<number | undefined, NumberFieldProps>; money: AngularFieldComponent<number | undefined, MoneyFieldProps>; checkbox: AngularFieldComponent<boolean, CheckboxFieldProps> };
const angularFields = createEventLaunchFields(angularViews);
const schema = createEventLaunchSchema();
const common = { schema, value: defaultEventLaunchValue, context: defaultEventLaunchContext };

export const compilerSpike = {
  dom: { ...common, fields: domFields } satisfies StagesOptions<EventLaunchValue, typeof domFields, EventLaunchContext>,
  react: { ...common, fields: reactFields } satisfies StagesOptions<EventLaunchValue, typeof reactFields, EventLaunchContext>,
  vue: { ...common, fields: vueFields } satisfies StagesOptions<EventLaunchValue, typeof vueFields, EventLaunchContext>,
  angular: { ...common, fields: angularFields } satisfies StagesOptions<EventLaunchValue, typeof angularFields, EventLaunchContext>,
};
