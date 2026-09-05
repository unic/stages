import { createContext, useContext, useState, type ComponentType } from 'react';
import { matchesPortableValue, portableFieldToken, type PortableFieldDescriptor } from '@stages/authoring';
import type { ResolvedPortableField, JsonObject, JsonValue } from '@stages/authoring/studio';

export interface StudioCustomFieldViewProps {
  readonly id: string;
  readonly value: unknown;
  readonly props: JsonObject;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly descriptionId: string;
  readonly onInput: (value: JsonValue) => void;
  readonly onBlur: () => void;
  readonly onFocus: () => void;
}
export interface StudioCustomFields {
  readonly fields: readonly ResolvedPortableField[];
  readonly views: Readonly<Record<string, ComponentType<StudioCustomFieldViewProps>>>;
}
export const StudioCustomFieldsContext = createContext<StudioCustomFields>({ fields: [], views: {} });
export function useStudioCustomFields() { return useContext(StudioCustomFieldsContext); }

export function StudioCustomFieldControl({ descriptor, ...props }: StudioCustomFieldViewProps & { readonly descriptor: PortableFieldDescriptor }) {
  const { views } = useStudioCustomFields();
  const View = views[portableFieldToken(descriptor)];
  if (!View) return <p role="alert">No preview component registered for {portableFieldToken(descriptor)}.</p>;
  return <View {...props} />;
}

export function StudioCustomPropsInspector({ descriptor, value, onChange }: {
  readonly descriptor: PortableFieldDescriptor;
  readonly value: JsonObject;
  readonly onChange: (value: JsonObject) => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  return <label className="studio-field"><span>{descriptor.displayName} properties</span>
    <textarea aria-invalid={Boolean(error)} value={draft} onChange={event => {
      const next = event.currentTarget.value;
      setDraft(next);
      try {
        const parsed: unknown = JSON.parse(next);
        if (!matchesPortableValue({ kind: 'object', properties: descriptor.props }, parsed)) { setError('Properties must match the registered field contract.'); return; }
        setError('');
      } catch { setError('Enter valid JSON properties.'); }
    }} onBlur={() => {
      try {
        const parsed: unknown = JSON.parse(draft);
        if (matchesPortableValue({ kind: 'object', properties: descriptor.props }, parsed)) onChange(parsed as JsonObject);
      } catch { /* Keep the invalid draft available for correction. */ }
    }} />
    {error && <small role="alert">{error}</small>}
  </label>;
}
