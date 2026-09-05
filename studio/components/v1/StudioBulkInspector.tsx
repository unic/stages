import { useId, useState } from "react";
import { LayoutGrid, SlidersHorizontal } from "lucide-react";
import type { JsonObject, JsonValue, StudioNode } from "../../src/document";
import { studioBlockDefinition, studioFieldDefinition, studioLayout, validateStudioFieldProps, type StudioBreakpoint, type StudioPropControl } from "../../src/registry";
import { Button } from "../ui/button";
import { InspectorSection } from "./StudioInspectorControls";

interface BulkUpdate {
  readonly node: StudioNode;
  readonly changes: Readonly<Record<string, unknown>>;
}

function controls(node: StudioNode): readonly StudioPropControl[] {
  if (node.kind === "field") return studioFieldDefinition(node.definition)?.props ?? [];
  if (node.kind === "block") return studioBlockDefinition(node.definition)?.props ?? [];
  return [];
}

function commonControls(nodes: readonly StudioNode[]): readonly StudioPropControl[] {
  return controls(nodes[0]!).filter((control) => nodes.every((node) => controls(node).some((other) =>
    other.key === control.key && other.control === control.control && other.label === control.label
    && JSON.stringify(other.options) === JSON.stringify(control.options))));
}

function commonValue(values: readonly (JsonValue | undefined)[]): { readonly mixed: boolean; readonly value: JsonValue | undefined } {
  return { mixed: values.some((value) => JSON.stringify(value) !== JSON.stringify(values[0])), value: values[0] };
}

function SharedProperty({ control, values, onApply }: {
  readonly control: StudioPropControl;
  readonly values: readonly (JsonValue | undefined)[];
  readonly onApply: (value: JsonValue | undefined) => string | undefined;
}) {
  const id = useId();
  const common = commonValue(values);
  const [draft, setDraft] = useState(common.mixed ? "" : String(common.value ?? ""));
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string>();
  const change = (value: string) => { setDraft(value); setEdited(true); setError(undefined); };
  const apply = () => {
    let value: JsonValue | undefined = draft;
    if (control.control === "number") {
      if (draft.trim() === "") value = undefined;
      else if (!Number.isFinite(Number(draft))) { setError("Enter a valid number."); return; }
      else value = Number(draft);
    } else if (control.control === "checkbox") value = draft === "true";
    const issue = onApply(value);
    setError(issue);
    if (issue === undefined) setEdited(false);
  };
  const options = control.control === "checkbox" ? [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] : control.options;
  const shared = { id, className: "ui-input", value: draft, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
  return <div className="studio-bulk-property">
    <label htmlFor={id}>{control.label}{common.mixed && <small>Mixed</small>}</label>
    <div className="studio-bulk-property__input">
      {options ? <select {...shared} onChange={(event) => change(event.currentTarget.value)}><option value="" disabled>{common.mixed ? "Mixed values" : "Choose…"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : control.control === "textarea" ? <textarea {...shared} rows={2} placeholder={common.mixed ? "Mixed values" : ""} onChange={(event) => change(event.currentTarget.value)} />
          : <input {...shared} type="text" inputMode={control.control === "number" ? "decimal" : undefined} placeholder={common.mixed ? "Mixed values" : ""} onChange={(event) => change(event.currentTarget.value)} />}
      <Button type="button" variant="outline" size="sm" disabled={!edited} aria-label={`Apply ${control.label} to selection`} onClick={apply}>Apply</Button>
    </div>
    {error && <small id={`${id}-error`} role="alert">{error}</small>}
  </div>;
}

export function StudioBulkInspector({ nodes, onApply }: {
  readonly nodes: readonly StudioNode[];
  readonly onApply: (updates: readonly BulkUpdate[], label: string) => string | undefined;
}) {
  const [breakpoint, setBreakpoint] = useState<StudioBreakpoint>("desktop");
  const shared = commonControls(nodes);
  const layouts = nodes.map((node) => studioLayout(node.presentation?.["layout"]));
  const layoutControls: readonly StudioPropControl[] = [
    { key: "width", label: "Width", control: "select", options: [{ label: "Quarter", value: "quarter" }, { label: "Third", value: "third" }, { label: "Half", value: "half" }, { label: "Two thirds", value: "two-thirds" }, { label: "Three quarters", value: "three-quarters" }, { label: "Full", value: "full" }] },
    { key: "columns", label: "Columns", control: "select", options: [1, 2, 3, 4].map((value) => ({ label: String(value), value: String(value) })) },
    { key: "align", label: "Alignment", control: "select", options: ["start", "center", "end", "stretch"].map((value) => ({ label: value[0]!.toUpperCase() + value.slice(1), value })) },
  ];
  return <div className="studio-v1-inspector__bulk">
    <p><strong>{nodes.length} items selected</strong></p>
    <p className="studio-bulk-hint">Only shared properties are shown. Apply changes to every selected item; other settings stay as they are.</p>
    <InspectorSection title="Shared properties" icon={SlidersHorizontal}>
      {shared.length === 0 && <p>No shared field properties. You can still edit their layout together.</p>}
      {shared.map((control) => {
        const values = nodes.map((node) => (node.kind === "field" || node.kind === "block") ? node.props[control.key] ?? controls(node).find(({ key }) => key === control.key)?.defaultValue : undefined);
        return <SharedProperty key={`${control.key}:${JSON.stringify(values)}`} control={control} values={values} onApply={(value) => {
          const updates: BulkUpdate[] = [];
          for (const node of nodes) {
            if (node.kind !== "field" && node.kind !== "block") continue;
            const props: Record<string, JsonValue> = { ...node.props };
            if (value === undefined) delete props[control.key]; else props[control.key] = value;
            if (node.kind === "field") {
              const definition = studioFieldDefinition(node.definition);
              if (definition) {
                const issue = validateStudioFieldProps(definition, props)[0];
                if (issue) return `${String(node.props["label"] ?? node.runtimeId)}: ${issue.message}`;
              }
            }
            updates.push({ node, changes: { props } });
          }
          return onApply(updates, `Edit ${control.label.toLowerCase()} on ${nodes.length} items`);
        }} />;
      })}
    </InspectorSection>
    <InspectorSection title="Responsive layout" icon={LayoutGrid}>
      <label className="studio-field"><span>Screen size</span><select className="ui-input" value={breakpoint} onChange={(event) => setBreakpoint(event.currentTarget.value as StudioBreakpoint)}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></label>
      {layoutControls.map((control) => {
        const property = control.key as "width" | "columns" | "align";
        const values = layouts.map((layout) => layout[property][breakpoint]);
        return <SharedProperty key={`${breakpoint}:${property}:${JSON.stringify(values)}`} control={control} values={values} onApply={(value) => onApply(nodes.map((node, index) => {
          const layout = layouts[index]!;
          return { node, changes: { presentation: { ...node.presentation, layout: { ...layout, [property]: { ...layout[property], [breakpoint]: property === "columns" ? Number(value) : value } } } as JsonObject } };
        }), `Edit ${breakpoint} ${property} on ${nodes.length} items`)} />;
      })}
    </InspectorSection>
  </div>;
}
