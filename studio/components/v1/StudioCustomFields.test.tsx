import { readFileSync } from 'node:fs';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { definePortableFieldBindings, loadPortableForm, matchesPortableValue, portableFieldToken, type PortableFieldDescriptor } from '@stages/authoring';
import { resolvePortableFields, type StudioProjectDocument, type JsonValue } from '@stages/authoring/studio';
import { createStudioCompilerSession } from '../../src/compiler/session';
import { generateStudioExportBundle } from '../../src/projects/artifacts';
import { dispatchStudioCommand, createStudioHistory } from '../../src/commands/history';
import { toUid } from '../../src/document';
import { ControlledPreview } from './StudioV1Editor';
import { StudioCustomFieldsContext, StudioCustomPropsInspector, type StudioCustomFieldViewProps } from './StudioCustomFields';
import { Input } from '../ui/input';

const descriptors = JSON.parse(readFileSync('../packages/authoring/test/fixtures/custom-descriptors.json', 'utf8')) as PortableFieldDescriptor[];
const project = JSON.parse(readFileSync('../packages/authoring/test/fixtures/custom-project-v1.json', 'utf8')) as StudioProjectDocument;
const bindings = definePortableFieldBindings(descriptors.map(descriptor => ({ key: descriptor.key, version: descriptor.version, field: {
  reduce: ({ event }) => event.name === 'input' && matchesPortableValue(descriptor.value, event.payload) ? { value: event.payload } : undefined,
} })));
const fields = resolvePortableFields(descriptors, bindings);

describe('Custom authoring and preview bindings', () => {
  it.each(['native', 'application'])('authors, exports and renders structured fields with %s controls', async system => {
    const form = project.forms[toUid('custom')]!;
    const removed = { ...form, rootNodeUids: form.rootNodeUids.filter(uid => uid !== 'person'), nodes: Object.fromEntries(Object.entries(form.nodes).filter(([uid]) => uid !== 'person')) };
    const history = createStudioHistory({ ...project, forms: { [form.uid]: removed } });
    const inserted = dispatchStudioCommand(history, { type: 'node.insert', formUid: form.uid, parentUid: null, index: 1, node: form.nodes[toUid('person')]! });
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) return;
    const bundle = generateStudioExportBundle(inserted.history.present, descriptors);
    // Deployment requires explicit trusted bindings; the JSON artifact is still available.
    const artifacts = bundle.ok ? bundle.value.artifacts : bundle.artifacts;
    const artifact = artifacts.find(item => item.path.endsWith('/form.stages.json'))!;
    expect(loadPortableForm(artifact.source, { fieldBindings: bindings }).ok).toBe(true);
    const compiled = createStudioCompilerSession().compile(form, {}, { customFields: fields });
    const View = ({ id, value, props, disabled, invalid, descriptionId, onInput, onFocus, onBlur }: StudioCustomFieldViewProps) => {
      const Control = system === 'native' ? 'input' : Input;
      return <label>{String(props['label'])}<Control id={id} value={JSON.stringify(value)} disabled={disabled} aria-invalid={invalid} aria-describedby={descriptionId} onFocus={onFocus} onBlur={onBlur} onChange={() => onInput(props['label'] === 'Person' ? { given: 'Ada', family: 'Lovelace' } : props['label'] === 'Money' ? { minorUnits: 1234, currency: 'CHF' } : null)} /></label>;
    };
    render(<StudioCustomFieldsContext.Provider value={{ fields, views: Object.fromEntries(descriptors.map(descriptor => [portableFieldToken(descriptor), View])) }}>
      <ControlledPreview form={form} compiled={compiled} defaultLocale="en" onUpdateScenario={() => {}} onAddScenario={() => undefined} />
    </StudioCustomFieldsContext.Provider>);
    fireEvent.change(screen.getByLabelText('Money'), { target: { value: '12.34' } });
    await waitFor(() => expect(screen.getByLabelText('Money')).toHaveValue(JSON.stringify({ minorUnits: 1234, currency: 'CHF' })));
    fireEvent.change(screen.getByLabelText('Person'), { target: { value: 'Ada' } });
    await waitFor(() => expect(screen.getByLabelText('Person')).toHaveValue(JSON.stringify({ given: 'Ada', family: 'Lovelace' })));
  });
  it('retains custom reducer identity across presentation-only edits', () => {
    const session = createStudioCompilerSession();
    const original = project.forms[toUid('custom')]!;
    const money = original.nodes[toUid('money')]!;
    const form = { ...original, nodes: { ...original.nodes, money: { ...money, reducers: [{ id: 'reset', on: 'reset-money', actions: [{ op: 'set' as const, target: { kind: 'event-target' as const }, value: { kind: 'literal' as const, value: { minorUnits: 0, currency: 'CHF' } } }] }] } } };
    const first = session.compile(form, {}, { customFields: fields });
    const second = session.compile({ ...form, settings: { theme: { accent: '#123456' } } }, {}, { customFields: fields });
    expect(second.schema).toBe(first.schema);
    expect(second.fields['example/money@1__studio__money']).toBe(first.fields['example/money@1__studio__money']);
  });
  it('checks structured inspector props before updating the document', () => {
    let accepted: JsonValue | undefined;
    render(<StudioCustomPropsInspector descriptor={descriptors[0]!} value={descriptors[0]!.defaultProps} onChange={value => { accepted = value; }} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '{"label":42}' } });
    expect(accepted).toBeUndefined();
    expect(screen.getByRole('alert')).toBeVisible();
    fireEvent.change(input, { target: { value: '{"label":"Budget","helpText":"CHF"}' } });
    fireEvent.blur(input);
    expect(accepted).toEqual({ label: 'Budget', helpText: 'CHF' });
  });
  it('invalidates semantic compilation when host bindings change, but ignores view replacements', () => {
    const session = createStudioCompilerSession();
    const form = project.forms[toUid('custom')]!;
    const first = session.compile(form, {}, { customFields: fields });
    const second = session.compile(form, {}, { customFields: fields });
    expect(second.schema).toBe(first.schema);
    const rebound = resolvePortableFields(descriptors, bindings);
    expect(session.compile(form, {}, { customFields: rebound }).schema).not.toBe(first.schema);
  });
});
