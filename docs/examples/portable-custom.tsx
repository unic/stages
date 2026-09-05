// source:start portable-custom
import { useState } from 'react';
import { StagesField } from '@stages/react';
import type { ReactFieldProps, ReactFieldView } from '@stages/react';
import {
  bindPortableViews, composePortableForm, definePortableFieldBindings,
  loadPortableForm, matchesPortableValue, portableFieldToken,
  type PortableFieldDescriptor,
} from '@stages/authoring';

export const moneyDescriptor: PortableFieldDescriptor = {
  key: 'app/money', version: 1, displayName: 'Money',
  value: { kind: 'object', properties: {
    minorUnits: { kind: 'number' }, currency: { kind: 'enum', values: ['CHF', 'EUR'] },
  } },
  emptyValue: { minorUnits: 0, currency: 'CHF' },
  props: { label: { kind: 'string' } }, defaultProps: { label: 'Budget' },
  input: { draft: 'string', parsing: 'At most two decimal places; safe integer minor units.', formatting: 'Two decimal places.' },
  accessibility: { role: 'textbox', label: 'label', description: 'helpText', keyboard: ['text entry', 'Tab'] },
};
const fieldBindings = definePortableFieldBindings([{
  key: moneyDescriptor.key, version: moneyDescriptor.version,
  field: {
    reduce: ({ event }) => event.name === 'input' && matchesPortableValue(moneyDescriptor.value, event.payload)
      ? { value: event.payload } : undefined,
    validators: [{ id: 'precision', validate: value => {
      const money = value as { minorUnits: number };
      return Number.isSafeInteger(money.minorUnits) ? [] : [{ id: 'precision', code: 'precision', severity: 'error', message: 'Use safe integer minor units.' }];
    } }],
  },
}]);

export function MoneyInput({ field, props, emit, id }: ReactFieldProps) {
  const money = field.value as { minorUnits: number; currency: string };
  const [draft, setDraft] = useState((money.minorUnits / 100).toFixed(2));
  const [accepted, setAccepted] = useState(field.value);
  if (accepted !== field.value) {
    setAccepted(field.value);
    setDraft((money.minorUnits / 100).toFixed(2));
  }
  const issue = field.state.visibleIssues[0];
  return <label>{String(props['label'])}<input id={id} inputMode="decimal"
    disabled={field.state.disabled} value={draft}
    aria-invalid={issue?.severity === 'error'} aria-describedby={issue ? `${id}-issue` : undefined}
    onFocus={() => emit('focus')} onBlur={() => emit('blur')}
    onChange={event => {
      const text = event.currentTarget.value;
      setDraft(text); // Incomplete drafts stay local; they are never interpreted as zero.
      if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) return;
      const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
      const magnitude = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
      const minorUnits = text.startsWith('-') ? -magnitude : magnitude;
      if (Number.isSafeInteger(minorUnits)) emit('input', { ...money, minorUnits });
    }} />{issue && <small id={`${id}-issue`}>{issue.message ?? issue.code}</small>}</label>;
}

export function loadMoneyForm(json: string, standardViews: Readonly<Record<string, ReactFieldView>>) {
  const result = loadPortableForm(json, { fieldBindings });
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  const loaded = composePortableForm(result.value, {
    schemaId: 'app/money-deployment', schemaVersion: 1,
    validators: [{ id: 'host-rule', on: 'submit', dependencies: [['budget']], validate: async ({ signal, value }) => {
      if (signal.aborted) return [];
      const budget = (value as { budget: { minorUnits: number } }).budget;
      return budget.minorUnits <= 100_000 ? [] : [{ id: 'budget', code: 'budget', path: ['budget'], severity: 'error', message: 'Budget exceeds the limit.' }];
    } }],
  });
  return bindPortableViews(loaded, { ...standardViews, [portableFieldToken(moneyDescriptor)]: MoneyInput });
}

// A custom layout consumes the same public adapter; it need not use the render plan.
export function MoneyLayout({ controller }: Pick<Parameters<typeof StagesField>[0], 'controller'>) {
  return <section aria-label="Budget"><StagesField controller={controller} path={['budget']} /></section>;
}
// source:end portable-custom
