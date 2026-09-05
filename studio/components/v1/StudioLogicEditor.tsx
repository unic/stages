import { StudioHelp } from "./StudioHelp";
import type {
  StudioEventDefinition,
  StudioFormDocument,
  StudioLogicRule,
  StudioNode,
  StudioPatchAction,
  Uid,
} from "../../src/document";
import type { StudioExpression } from "../../src/expressions";
import { Button } from "../ui/button";
import { StudioExpressionEditor, type StudioExpressionReferenceOption } from "./StudioExpressionEditor";

const literalTrue: StudioExpression = { kind: "literal", value: true };

function targetNodes(form: StudioFormDocument): readonly StudioNode[] {
  return Object.values(form.nodes).filter((node) => node.kind !== "block" && node.kind !== "stage" && node.kind !== "variant");
}

function label(node: StudioNode): string {
  return node.kind === "block" ? node.definition.key : node.runtimeId;
}

function nextId(prefix: string, current: readonly { readonly id: string }[]): string {
  const ids = new Set(current.map(({ id }) => id));
  let index = current.length + 1;
  while (ids.has(`${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
}

const eventReferences: readonly StudioExpressionReferenceOption[] = [
  { scope: "event", path: ["name"], label: "Event name" },
  { scope: "event", path: ["payload"], label: "Event payload" },
  { scope: "event", path: ["source"], label: "Event source" },
];

export function StudioLogicEditor({ kind, rules, form, references, onChange }: {
  readonly kind: "reducer" | "transform";
  readonly rules: readonly StudioLogicRule[] | undefined;
  readonly form: StudioFormDocument;
  readonly references: readonly StudioExpressionReferenceOption[];
  readonly onChange: (rules: readonly StudioLogicRule[] | undefined, label: string) => void;
}) {
  const current = rules ?? [];
  const update = (index: number, rule: StudioLogicRule) => onChange(current.map((item, itemIndex) => itemIndex === index ? rule : item), `Edit ${kind}`);
  const nodes = targetNodes(form);
  const expressionReferences = [...references, ...eventReferences];
  return <fieldset className="studio-v1-logic-editor">
    <legend>{kind === "reducer" ? "Field reducers" : "Transforms"}</legend>
    {current.map((rule, ruleIndex) => <fieldset key={`${rule.id}:${ruleIndex}`}>
      <legend>{rule.id}</legend>
      <label className="studio-field"><span>Rule ID</span><input className="ui-input" value={rule.id} onChange={(event) => update(ruleIndex, { ...rule, id: event.currentTarget.value })} /></label>
      <label className="studio-field"><span>Event name</span><input className="ui-input" value={typeof rule.on === "string" ? rule.on : rule.on.join(", ")} onChange={(event) => {
        const names = event.currentTarget.value.split(",").map((name) => name.trim()).filter(Boolean);
        update(ruleIndex, { ...rule, on: names.length <= 1 ? names[0] ?? "" : names });
      }} /></label>
      <label><input type="checkbox" checked={rule.when !== undefined} onChange={(event) => {
        if (event.currentTarget.checked) update(ruleIndex, { ...rule, when: literalTrue });
        else { const { when: _when, ...withoutWhen } = rule; update(ruleIndex, withoutWhen); }
      }} /> Predicate</label>
      {rule.when !== undefined && <StudioExpressionEditor expression={rule.when} label={`${rule.id} predicate`} references={expressionReferences} onChange={(when) => update(ruleIndex, { ...rule, when })} />}
      <ol>
        {rule.actions.map((action, actionIndex) => <li key={actionIndex}>
          <label className="studio-field"><span>Patch</span><select value={action.op} onChange={(event) => {
            const op = event.currentTarget.value;
            const next: StudioPatchAction = op === "remove" ? { op, target: action.target } : { op: "set", target: action.target, value: literalTrue };
            update(ruleIndex, { ...rule, actions: rule.actions.map((item, index) => index === actionIndex ? next : item) });
          }}><option value="set">Set</option><option value="remove">Remove</option></select></label>
          <label className="studio-field"><span>Target</span><select value={action.target.kind === "event-target" ? "event-target" : action.target.uid} onChange={(event) => {
            const value = event.currentTarget.value;
            const target = value === "event-target" ? { kind: "event-target" as const } : { kind: "node" as const, uid: value as Uid };
            update(ruleIndex, { ...rule, actions: rule.actions.map((item, index) => index === actionIndex ? { ...item, target } : item) });
          }}><option value="event-target">Current event target</option>{nodes.map((node) => <option key={node.uid} value={node.uid}>{label(node)}</option>)}</select></label>
          {action.op === "set" && <StudioExpressionEditor expression={action.value} label={`${rule.id} patch value`} references={expressionReferences} onChange={(value) => update(ruleIndex, { ...rule, actions: rule.actions.map((item, index) => index === actionIndex ? { ...action, value } : item) })} />}
          <Button type="button" variant="outline" size="sm" onClick={() => update(ruleIndex, { ...rule, actions: rule.actions.filter((_, index) => index !== actionIndex) })}>Remove patch</Button>
        </li>)}
      </ol>
      <Button type="button" variant="outline" size="sm" onClick={() => update(ruleIndex, { ...rule, actions: [...rule.actions, { op: "set", target: { kind: "event-target" }, value: literalTrue }] })}>Add patch</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(current.filter((_, index) => index !== ruleIndex), `Remove ${kind}`)}>Remove {kind}</Button>
    </fieldset>)}
    <Button type="button" variant="outline" size="sm" onClick={() => onChange([...current, { id: nextId(kind, current), on: "input", actions: [{ op: "set", target: { kind: "event-target" }, value: { kind: "reference", scope: "event", path: ["payload"] } }] }], `Add ${kind}`)}>Add {kind}</Button>
  </fieldset>;
}

export function StudioEventEditor({ events, form, references, onChange }: {
  readonly events: readonly StudioEventDefinition[] | undefined;
  readonly form: StudioFormDocument;
  readonly references: readonly StudioExpressionReferenceOption[];
  readonly onChange: (events: readonly StudioEventDefinition[] | undefined, label: string) => void;
}) {
  const current = events ?? [];
  const nodes = targetNodes(form);
  const update = (index: number, event: StudioEventDefinition) => onChange(current.map((item, itemIndex) => itemIndex === index ? event : item), "Edit event definition");
  return <fieldset className="studio-v1-event-editor">
    <legend>Named events <StudioHelp topic="Events & proposals" compact /></legend>
    {current.map((definition, index) => <fieldset key={`${definition.id}:${index}`}>
      <legend>{definition.title}</legend>
      <label className="studio-field"><span>Event ID</span><input className="ui-input" value={definition.id} onChange={(event) => update(index, { ...definition, id: event.currentTarget.value })} /></label>
      <label className="studio-field"><span>Title</span><input className="ui-input" value={definition.title} onChange={(event) => update(index, { ...definition, title: event.currentTarget.value })} /></label>
      <label className="studio-field"><span>Event name</span><input className="ui-input" value={definition.name} onChange={(event) => update(index, { ...definition, name: event.currentTarget.value })} /></label>
      <label className="studio-field"><span>Target</span><select value={definition.target.kind === "form" ? "form" : definition.target.uid} onChange={(event) => update(index, { ...definition, target: event.currentTarget.value === "form" ? { kind: "form" } : { kind: "node", uid: event.currentTarget.value as Uid } })}><option value="form">Form</option>{nodes.map((node) => <option key={node.uid} value={node.uid}>{label(node)}</option>)}</select></label>
      <label className="studio-field"><span>Source</span><select value={definition.source ?? "user"} onChange={(event) => update(index, { ...definition, source: event.currentTarget.value as "adapter" | "system" | "user" })}><option value="user">User</option><option value="adapter">Adapter</option><option value="system">System</option></select></label>
      <label><input type="checkbox" checked={definition.payload !== undefined} onChange={(event) => {
        if (event.currentTarget.checked) update(index, { ...definition, payload: literalTrue });
        else { const { payload: _payload, ...withoutPayload } = definition; update(index, withoutPayload); }
      }} /> Payload</label>
      {definition.payload !== undefined && <StudioExpressionEditor expression={definition.payload} label={`${definition.title} payload`} references={references} onChange={(payload) => update(index, { ...definition, payload })} />}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(current.filter((_, itemIndex) => itemIndex !== index), "Remove event definition")}>Remove event</Button>
    </fieldset>)}
    <Button type="button" variant="outline" size="sm" onClick={() => onChange([...current, { id: nextId("event", current), title: "Custom action", name: "custom:action", target: { kind: "form" }, source: "user" }], "Add event definition")}>Add event</Button>
  </fieldset>;
}
