// source:start portable-runtime
import { loadPortableForm } from '@stages/authoring';
import { stages } from '@stages/core';

export function openPortableForm(jsonText: string) {
  const result = loadPortableForm(jsonText);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  const loaded = result.value;
  const controller = stages({
    schema: loaded.schemaInput,
    fields: loaded.fields,
    value: loaded.initialValue as unknown,
    onChange: change => controller.update({ value: change.value }),
  });
  return controller; // The owner calls controller.destroy() at teardown.
}
// source:end portable-runtime
