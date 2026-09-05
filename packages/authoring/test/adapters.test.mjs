import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import * as authoring from '../dist/index.js';
import { stages } from '../../core/dist/index.js';
import { customBindings } from './fixtures/custom-bindings.mjs';

const dom = new JSDOM('<body></body>');
for (const name of ['window', 'document', 'navigator', 'Element', 'HTMLElement', 'Node', 'SVGElement']) Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const definition = JSON.parse(readFileSync(new URL('./fixtures/custom-form-v1.json', import.meta.url)));
const contact = JSON.parse(readFileSync(new URL('./fixtures/contact-form-v1.json', import.meta.url)));
const result = authoring.loadPortableForm(definition, customBindings(authoring, definition.fieldDescriptors));
assert.equal(result.ok, true, JSON.stringify(result));
const custom = result.value;
const standard = authoring.loadPortableForm(contact).value;

function open(loaded, view) {
  const bound = authoring.bindPortableViews(loaded, Object.fromEntries(Object.values(loaded.fields).map(field => [field.view, view])));
  const controller = stages({ schema: bound.schemaInput, fields: bound.fields, value: loaded.initialValue, onChange: change => controller.update({ value: change.value }) });
  return controller;
}
function nextValue(path) { return path === 'name' ? 'Ada' : path === 'person' ? { given: 'Ada', family: 'Lovelace' } : { minorUnits: 1234, currency: 'CHF' }; }
function root(tag = 'main') { const node = document.createElement(tag); document.body.append(node); return node; }

for (const [label, loaded, path] of [['contact', standard, 'name'], ['money', custom, 'money'], ['person', custom, 'person']]) {
  test(`DOM renders portable ${label} with a custom layout and preserves semantic bindings`, async () => {
    const { mountStages } = await import('../../dom/dist/index.js');
    const target = root();
    const view = { render: ({ document, field, emit, id }) => {
      const container = document.createElement('label'); container.textContent = field.props.label;
      const input = document.createElement('input'); input.id = id; input.dataset.path = field.path.join('.'); input.value = JSON.stringify(field.value);
      input.addEventListener('input', () => emit('input', nextValue(path))); container.append(input); return container;
    } };
    const controller = open(loaded, view);
    const mounted = mountStages(target, controller);
    try {
      const input = target.querySelector(`input[data-path="${path}"]`); assert(input);
      input.dispatchEvent(new dom.window.Event('input'));
      await tick(); assert.deepEqual(controller.getSnapshot().value[path], nextValue(path));
      await controller.validate({ scope: 'form' });
    } finally { mounted.destroy(); controller.destroy(); target.remove(); }
  });
  test(`React renders portable ${label} through two replaceable component systems`, async () => {
    const { createElement: h, act } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { StagesField } = await import('../../react/dist/index.js');
    for (const system of ['native', 'application']) {
      const Control = system === 'native' ? 'input' : (await import('react-bootstrap')).FormControl;
      const View = ({ field, props, emit, id }) => h('label', { className: system }, props.label, h(Control, { id, value: JSON.stringify(field.value), readOnly: true }), h('button', { onClick: () => emit('input', nextValue(path)) }, 'Update'));
      const controller = open(loaded, View);
      const target = root(); const app = createRoot(target);
      try {
        await act(async () => app.render(h('section', { 'aria-label': 'Custom layout' }, h(StagesField, { controller, path: [path] }))));
        assert(target.querySelector(`label.${system} input`));
        await act(async () => { target.querySelector('button').click(); await tick(); });
        assert.deepEqual(controller.getSnapshot().value[path], nextValue(path));
      } finally { await act(async () => app.unmount()); controller.destroy(); target.remove(); }
    }
  });
  test(`Vue renders portable ${label} with an application component`, async () => {
    const { createApp, h, nextTick } = await import('vue');
    const { StagesField } = await import('../../vue/dist/index.js');
    const View = ({ field, props, emit }) => h('label', null, [props.label, h('input', { value: JSON.stringify(field.value), onInput: () => emit('input', nextValue(path)) })]);
    const controller = open(loaded, View); const target = root();
    const app = createApp({ render: () => h('section', { 'aria-label': 'Custom layout' }, [h(StagesField, { controller, path: [path] })]) });
    try {
      app.mount(target); target.querySelector('input').dispatchEvent(new dom.window.Event('input'));
      await tick(); await nextTick(); assert.deepEqual(controller.getSnapshot().value[path], nextValue(path));
    } finally { app.unmount(); controller.destroy(); target.remove(); }
  });
  test(`Angular renders portable ${label} with an application component`, async () => {
    await import('@angular/compiler');
    const { Component, Input } = await import('@angular/core');
    const { bootstrapApplication } = await import('@angular/platform-browser');
    const { StagesFieldComponent } = await import('../../angular/dist/index.js');
    class View { update() { this.emit('input', nextValue(path)); } }
    for (const name of ['id', 'field', 'props', 'emit']) Input()(View.prototype, name);
    Component({ selector: `portable-view-${label}`, standalone: true, template: '<label>{{ props.label }}<input [id]="id" [value]="field.value" (input)="update()" /></label>' })(View);
    const controller = open(loaded, View);
    class App { controller = controller; path = [path]; }
    Component({ selector: `portable-${label}`, standalone: true, imports: [StagesFieldComponent], template: '<section aria-label="Custom layout"><stages-field [controller]="controller" [path]="path" /></section>' })(App);
    const target = root(`portable-${label}`); const app = await bootstrapApplication(App);
    try {
      await app.whenStable(); const input = target.querySelector('input'); assert(input);
      input.dispatchEvent(new dom.window.Event('input')); await tick(); await app.whenStable();
      assert.deepEqual(controller.getSnapshot().value[path], nextValue(path));
    } finally { app.destroy(); controller.destroy(); target.remove(); }
  });
}
