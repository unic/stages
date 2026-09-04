import { useState } from "react";
import type { StudioValidatorSpec } from "../../src/document";
import type { StudioExpressionReferenceOption } from "./StudioExpressionEditor";
import { StudioExpressionEditor } from "./StudioExpressionEditor";
import { defaultStudioValidator, STUDIO_VALIDATOR_CATALOG } from "../../src/validation/catalog";
import { Button } from "../ui/button";

function events(value: StudioValidatorSpec["on"]): string {
  return typeof value === "string" ? value : (value ?? []).join(", ");
}

function parseEvents(value: string): readonly string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function pathText(paths: StudioValidatorSpec["dependencies"]): string {
  return (paths ?? []).map((path) => path.join(".")).join("\n");
}

function parsePaths(value: string): readonly (readonly (number | string)[])[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => line.split(".").filter(Boolean).map((segment) => /^\d+$/.test(segment) ? Number(segment) : segment));
}

function updateAt(validators: readonly StudioValidatorSpec[], index: number, changes: Readonly<Record<string, unknown>>): readonly StudioValidatorSpec[] {
  return validators.map((validator, current) => current === index ? { ...validator, ...changes } as StudioValidatorSpec : validator);
}

export function StudioValidationEditor({ validators = [], references, ownerLabel, onChange }: {
  readonly validators?: readonly StudioValidatorSpec[] | undefined;
  readonly references: readonly StudioExpressionReferenceOption[];
  readonly ownerLabel: string;
  readonly onChange: (validators: readonly StudioValidatorSpec[] | undefined, label: string) => void;
}) {
  const [kind, setKind] = useState<StudioValidatorSpec["kind"]>("required");
  const add = () => {
    let suffix = validators.length + 1;
    let id = `${kind}.${suffix}`;
    while (validators.some((validator) => validator.id === id)) id = `${kind}.${++suffix}`;
    onChange([...validators, defaultStudioValidator(kind, id)], `Add ${kind} validator`);
  };
  return <fieldset className="studio-v1-validation-inspector">
    <legend>Validation · {ownerLabel}</legend>
    <div className="studio-v1-validation-inspector__add">
      <label className="studio-field"><span>Validator catalog</span><select value={kind} onChange={(event) => setKind(event.currentTarget.value as StudioValidatorSpec["kind"])}>
        {Object.entries(STUDIO_VALIDATOR_CATALOG).map(([key, entry]) => <option key={key} value={key}>{entry.displayName}</option>)}
      </select></label>
      <Button type="button" variant="outline" size="sm" onClick={add}>Add validator</Button>
    </div>
    {validators.length === 0 ? <p><small>No synchronous validators.</small></p> : validators.map((validator, index) => {
      const set = (changes: Readonly<Record<string, unknown>>, label: string) => onChange(updateAt(validators, index, changes), label);
      return <fieldset key={validator.id ?? JSON.stringify(validator)} className="studio-v1-validator">
        <legend>{STUDIO_VALIDATOR_CATALOG[validator.kind].displayName}</legend>
        <label className="studio-field"><span>Stable ID</span><input className="ui-input" value={validator.id ?? ""} onChange={(event) => set({ id: event.currentTarget.value }, "Edit validator ID")} /></label>
        <label className="studio-field"><span>Issue code</span><input className="ui-input" value={validator.code ?? validator.kind} onChange={(event) => set({ code: event.currentTarget.value }, "Edit validator code")} /></label>
        <label className="studio-field"><span>Run on events</span><input className="ui-input" value={events(validator.on)} onChange={(event) => set({ on: parseEvents(event.currentTarget.value) }, "Edit validator events")} /></label>
        <label className="studio-field"><span>Reveal on events</span><input className="ui-input" value={events(validator.revealOn)} onChange={(event) => set({ revealOn: parseEvents(event.currentTarget.value) }, "Edit validator reveal events")} /></label>
        <label className="studio-field"><span>Severity</span><select value={validator.severity ?? "error"} onChange={(event) => set({ severity: event.currentTarget.value }, "Edit validator severity")}><option value="error">Error</option><option value="warning">Warning</option></select></label>
        <label className="studio-field"><span>Message</span><input className="ui-input" value={typeof validator.message === "string" ? validator.message : validator.message?.default ?? ""} onChange={(event) => set({ message: event.currentTarget.value }, "Edit validator message")} /></label>
        <label><input type="checkbox" checked={validator.includeDisabled ?? false} onChange={(event) => set({ includeDisabled: event.currentTarget.checked }, "Edit disabled validation policy")} /> Include disabled owner</label>
        <label className="studio-field"><span>Dependencies (one absolute path per line)</span><textarea className="ui-input" value={pathText(validator.dependencies)} onChange={(event) => set({ dependencies: parsePaths(event.currentTarget.value) }, "Edit validator dependencies")} /></label>
        {(validator.kind === "length" || validator.kind === "range" || validator.kind === "collection") && <div>
          <label className="studio-field"><span>Minimum</span><input className="ui-input" type="number" value={validator.min ?? ""} onChange={(event) => set({ min: event.currentTarget.value === "" ? undefined : Number(event.currentTarget.value) }, "Edit validator minimum")} /></label>
          <label className="studio-field"><span>Maximum</span><input className="ui-input" type="number" value={validator.max ?? ""} onChange={(event) => set({ max: event.currentTarget.value === "" ? undefined : Number(event.currentTarget.value) }, "Edit validator maximum")} /></label>
        </div>}
        {validator.kind === "pattern" && <div>
          <label className="studio-field"><span>Regular expression</span><input className="ui-input" value={validator.pattern} onChange={(event) => set({ pattern: event.currentTarget.value }, "Edit validation pattern")} /></label>
          <label className="studio-field"><span>Flags</span><input className="ui-input" value={validator.flags ?? ""} onChange={(event) => set({ flags: event.currentTarget.value }, "Edit validation flags")} /></label>
        </div>}
        {validator.kind === "comparison" && <div>
          <label className="studio-field"><span>Operator</span><select value={validator.operator} onChange={(event) => set({ operator: event.currentTarget.value }, "Edit comparison operator")}>{["===", "!==", "<", "<=", ">", ">="].map((operator) => <option key={operator}>{operator}</option>)}</select></label>
          <StudioExpressionEditor expression={validator.other} label="Compare with" references={references} onChange={(other) => set({ other }, "Edit comparison value")} />
        </div>}
        {validator.kind === "collection" && <label className="studio-field"><span>Unique row property path</span><input className="ui-input" value={validator.uniqueBy?.join(".") ?? ""} onChange={(event) => set({ uniqueBy: event.currentTarget.value === "" ? undefined : event.currentTarget.value.split(".").filter(Boolean) }, "Edit collection uniqueness")} /></label>}
        {validator.kind === "service" && <div>
          <label className="studio-field"><span>Trusted service name</span><input className="ui-input" value={validator.service.key} onChange={(event) => set({ service: { ...validator.service, key: event.currentTarget.value } }, "Edit service binding")} /></label>
          <label className="studio-field"><span>Service version</span><input className="ui-input" type="number" min={1} value={validator.service.version} onChange={(event) => set({ service: { ...validator.service, version: Number(event.currentTarget.value) } }, "Edit service binding")} /></label>
          <label><input type="checkbox" checked={validator.request !== undefined} onChange={(event) => set({ request: event.currentTarget.checked ? { kind: "reference", scope: "value", path: [] } : undefined }, "Edit service request")} /> Build request from an expression</label>
          {validator.request !== undefined && <StudioExpressionEditor expression={validator.request} label="Service request" references={references} onChange={(request) => set({ request }, "Edit service request")} />}
          <small>Endpoints, credentials, retries, and caches are supplied by the trusted environment.</small>
        </div>}
        <label><input type="checkbox" checked={validator.when !== undefined} onChange={(event) => set({ when: event.currentTarget.checked ? { kind: "literal", value: true } : undefined }, "Edit validator condition")} /> Conditional applicability</label>
        {validator.when !== undefined && <StudioExpressionEditor expression={validator.when} label="Applies when" references={references} onChange={(when) => set({ when }, "Edit validator condition")} />}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(validators.filter((_, current) => current !== index), "Remove validator")}>Remove validator</Button>
      </fieldset>;
    })}
  </fieldset>;
}
