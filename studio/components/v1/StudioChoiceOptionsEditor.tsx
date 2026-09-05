import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

function optionRows(value: string) {
  return value === "" ? [] : value.split("\n").map((label) => ({ id: crypto.randomUUID(), label }));
}

/** Retains the existing newline-delimited option format. */
export function StudioChoiceOptionsEditor({ value, onChange }: {
  readonly value: string;
  readonly onChange: (value: string, coalesce: boolean) => void;
}) {
  const [rows, setRows] = useState(() => optionRows(value));
  const [previousValue, setPreviousValue] = useState(value);
  // Undo or selecting a different document version replaces the external value.
  if (value !== previousValue) {
    setPreviousValue(value);
    setRows(optionRows(value));
  }
  const labels = rows.map(({ label }) => label.trim());
  const invalid = labels.some((label) => label === "") || new Set(labels).size !== labels.length;
  const update = (next: typeof rows, coalesce = false) => {
    setRows(next);
    const values = next.map(({ label }) => label.trim());
    if (values.some((label) => label === "") || new Set(values).size !== values.length) return;
    const serialized = next.map(({ label }) => label).join("\n");
    setPreviousValue(serialized);
    onChange(serialized, coalesce);
  };
  const move = (index: number, offset: number) => {
    const next = [...rows];
    const row = next.splice(index, 1)[0]!;
    next.splice(index + offset, 0, row);
    update(next);
  };
  return <fieldset className="studio-choice-options">
    <legend>Options</legend>
    <p>Each option is also its saved value.</p>
    {rows.length === 0 && <p>No options yet.</p>}
    {rows.map((row, index) => <div className="studio-choice-options__row" key={row.id}>
      <input className="ui-input" aria-label={`Option ${index + 1}`} value={row.label}
        aria-invalid={!labels[index] || labels.indexOf(labels[index]!) !== index || undefined}
        onChange={(event) => update(rows.map((item) => item.id === row.id ? { ...item, label: event.currentTarget.value } : item), true)} />
      <Button variant="ghost" size="icon" aria-label={`Move option ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={13} /></Button>
      <Button variant="ghost" size="icon" aria-label={`Move option ${index + 1} down`} disabled={index === rows.length - 1} onClick={() => move(index, 1)}><ArrowDown size={13} /></Button>
      <Button variant="ghost" size="icon" aria-label={`Remove option ${index + 1}`} onClick={() => update(rows.filter(({ id }) => id !== row.id))}><Trash2 size={13} /></Button>
    </div>)}
    {invalid && <p role="alert">Give each option a unique, non-empty value. Changes apply when all options are valid.</p>}
    <Button variant="outline" size="sm" onClick={() => {
      let index = rows.length + 1;
      while (labels.includes(`Option ${index}`)) index += 1;
      update([...rows, { id: crypto.randomUUID(), label: `Option ${index}` }]);
    }}><Plus size={14} />Add option</Button>
  </fieldset>;
}
