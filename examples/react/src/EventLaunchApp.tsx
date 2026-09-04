import { useEffect, useRef, useState, type FormEvent } from "react";
import { formEvent, nodeEvent, stages, type SerializedStagesState, type StagesChange, type StagesController } from "@stages/core";
import { StagesField, useStages, useStagesCollection, useStagesWizard } from "@stages/react";
import {
  EVENT_LAUNCH_AGENDA_ADDRESS,
  EVENT_LAUNCH_STORAGE_KEY,
  EVENT_LAUNCH_TICKETS_ADDRESS,
  EVENT_LAUNCH_WIZARD_ADDRESS,
  clearEventLaunchDraft,
  createAgendaItem,
  createEventLaunchSchema,
  createTicketTier,
  debounceDraftSave,
  defaultEventLaunchContext,
  defaultEventLaunchValue,
  eventLaunchValueCodec,
  readEventLaunchDraft,
  saveEventLaunchDraft,
  smokeTestValue,
  type AgendaItem,
  type EventLaunchContext,
  type EventLaunchValue,
} from "../../shared/event-launch/index.js";
import { eventLaunchReactFields } from "./fields.js";

type Controller = StagesController<EventLaunchValue, typeof eventLaunchReactFields, EventLaunchContext>;
const schema = createEventLaunchSchema();
const stageCopy: Readonly<Record<string, readonly [string, string]>> = {
  basics: ["Event basics", "Start with the public identity, timing, delivery, and registration model."],
  venue: ["Venue", "Capture the place and the practical details attendees need."],
  streaming: ["Streaming", "Configure the attendee link and recording consent."],
  agenda: ["Agenda", "Mix sessions, workshops, and breaks while preserving stable row identity."],
  tickets: ["Ticket tiers", "Set paid tiers and keep the totals within venue capacity."],
  compliance: ["Data processing", "This stage is inserted by external organization context."],
  review: ["Review and publish", "Confirm the final details before producing the application-owned payload."],
};

function Field({ path }: { readonly path: readonly (string | number)[] }) {
  return <StagesField controller={useController()} path={path} />;
}

const ControllerContext = (() => {
  let current: Controller | undefined;
  return {
    set(value: Controller) { current = value; },
    get() { if (current === undefined) throw new Error("Event Launch controller is unavailable."); return current; },
  };
})();
function useController(): Controller { return ControllerContext.get(); }

function BasicsStage() { return <div className="field-grid">
  <Field path={["launch", "basics", "identity", "title"]} /><Field path={["launch", "basics", "identity", "slug"]} />
  <Field path={["launch", "basics", "identity", "description"]} /><Field path={["launch", "basics", "schedule", "startsAt"]} />
  <Field path={["launch", "basics", "schedule", "endsAt"]} /><Field path={["launch", "basics", "schedule", "timezone"]} />
  <Field path={["launch", "basics", "deliveryMode"]} /><Field path={["launch", "basics", "accessModel"]} />
</div>; }
function VenueStage() { return <div className="field-grid"><Field path={["launch", "venue", "name"]} /><Field path={["launch", "venue", "capacity"]} /><Field path={["launch", "venue", "address", "street"]} /><Field path={["launch", "venue", "address", "city"]} /><Field path={["launch", "venue", "address", "country"]} /><Field path={["launch", "venue", "accessibilityNotes"]} /></div>; }
function StreamingStage() { return <div className="field-grid"><Field path={["launch", "streaming", "platform"]} /><Field path={["launch", "streaming", "url"]} /><Field path={["launch", "streaming", "recordEvent"]} /><Field path={["launch", "streaming", "recordingConsent"]} /></div>; }

function AgendaStage({ controller }: { readonly controller: Controller }) {
  const collection = useStagesCollection(controller, ["launch", "agenda", "items"] as const);
  const nextId = useRef(10);
  const dispatchRow = (name: string, address: typeof collection.items[number]["address"], payload?: unknown) => controller.dispatch(nodeEvent(name, address, { payload }));
  const add = (kind: AgendaItem["kind"]) => { collection.add(createAgendaItem(kind, `agenda-${kind}-${nextId.current}`)); nextId.current += 1; };
  const sortBreaksLast = () => {
    const order = collection.items.map((item, index) => ({ index, isBreak: item.value.kind === "break" })).sort((a, b) => Number(a.isBreak) - Number(b.isBreak)).map((entry) => entry.index);
    controller.dispatch(nodeEvent("collection:sort", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { order } }));
  };
  return <>
    <div className="collection-toolbar"><div><strong>{collection.items.length} agenda items</strong><p className="field-description">Collection controls dispatch standard node events.</p></div><div className="row-actions"><button type="button" disabled={!collection.canAdd} onClick={() => add("session")}>Add session</button><button type="button" disabled={!collection.canAdd} onClick={() => add("workshop")}>Add workshop</button><button type="button" disabled={!collection.canAdd} onClick={() => add("break")}>Add break</button><button type="button" onClick={sortBreaksLast}>Sort breaks last</button></div></div>
    <ol className="collection-list">{collection.items.map((item) => <li className="collection-row" key={item.key} data-testid={`agenda-row-${item.value.id}`}>
      <div className="row-header"><span className="row-kind">{item.value.kind}</span><span className="row-key">{item.key}</span></div>
      <div className="field-grid">
        {item.value.kind === "break" ? <Field path={["launch", "agenda", "items", item.index, "label"]} /> : <><Field path={["launch", "agenda", "items", item.index, "title"]} /><Field path={["launch", "agenda", "items", item.index, item.value.kind === "session" ? "speaker" : "facilitator"]} /></>}
        <Field path={["launch", "agenda", "items", item.index, "durationMinutes"]} />
        {item.value.kind === "workshop" && <Field path={["launch", "agenda", "items", item.index, "capacity"]} />}
      </div>
      <div className="row-actions"><button type="button" className="quiet" disabled={!item.canMovePrevious} onClick={() => item.moveTo(item.index - 1)}>Move up</button><button type="button" className="quiet" disabled={!item.canMoveNext} onClick={() => item.moveTo(item.index + 1)}>Move down</button><button type="button" className="quiet" disabled={!collection.canAdd} onClick={() => { const value = item.value; collection.add({ ...value, id: `agenda-${value.kind}-${nextId.current}` } as AgendaItem); nextId.current += 1; }}>Duplicate</button>{item.value.kind === "session" && <button type="button" className="quiet" onClick={() => { const value = item.value; if (value.kind === "session") dispatchRow("collection:replace", item.address, { value: { id: value.id, kind: "workshop", title: value.title, facilitator: value.speaker, durationMinutes: value.durationMinutes, capacity: 30 } }); }}>Convert to workshop</button>}<button type="button" className="quiet danger" disabled={!item.canRemove} onClick={item.remove}>Remove</button></div>
    </li>)}</ol>
  </>;
}

function TicketsStage({ controller, value }: { readonly controller: Controller; readonly value: EventLaunchValue }) {
  const collection = useStagesCollection(controller, ["launch", "tickets", "tiers"] as const);
  const nextId = useRef(10);
  const sold = value.launch.tickets.tiers.reduce((sum, tier) => sum + (tier.quantity ?? 0), 0);
  const gross = value.launch.tickets.tiers.reduce((sum, tier) => sum + (tier.quantity ?? 0) * (tier.price ?? 0), 0);
  return <><div className="field-grid"><Field path={["launch", "tickets", "currency"]} /></div><p><strong>{Math.max(0, (value.launch.venue.capacity ?? 0) - sold)}</strong> places remain · gross potential <strong>{new Intl.NumberFormat(defaultEventLaunchContext.locale, { style: "currency", currency: value.launch.tickets.currency }).format(gross)}</strong></p><div className="collection-toolbar"><strong>{collection.items.length} ticket tiers</strong><button type="button" disabled={!collection.canAdd} onClick={() => { collection.add(createTicketTier(`ticket-${nextId.current}`)); nextId.current += 1; }}>Add tier</button></div><ol className="collection-list">{collection.items.map((item) => <li className="collection-row" key={item.key} data-testid={`ticket-row-${item.value.id}`}><div className="row-header"><span className="row-kind">Ticket</span><span className="row-key">{item.key}</span></div><div className="field-grid"><Field path={["launch", "tickets", "tiers", item.index, "name"]} /><Field path={["launch", "tickets", "tiers", item.index, "price"]} /><Field path={["launch", "tickets", "tiers", item.index, "quantity"]} /></div><div className="row-actions"><button type="button" className="quiet" disabled={!item.canMovePrevious} onClick={() => item.moveTo(item.index - 1)}>Move up</button><button type="button" className="quiet" disabled={!item.canMoveNext} onClick={() => item.moveTo(item.index + 1)}>Move down</button><button type="button" className="quiet danger" disabled={!item.canRemove} onClick={item.remove}>Remove</button></div></li>)}</ol></>;
}

function ReviewStage({ value }: { readonly value: EventLaunchValue }) { return <><dl className="summary-list"><div><dt>Event</dt><dd>{value.launch.basics.identity.title}</dd></div><div><dt>Delivery</dt><dd>{value.launch.basics.deliveryMode}</dd></div><div><dt>Agenda</dt><dd>{value.launch.agenda.items.length} items</dd></div><div><dt>Registration</dt><dd>{value.launch.basics.accessModel}</dd></div></dl><div className="field-grid"><Field path={["launch", "review", "termsAccepted"]} /><Field path={["launch", "review", "confirmation"]} /></div></>; }

interface InnerProps { readonly adapter: string; readonly initialState: SerializedStagesState | undefined; readonly onResume: (state: SerializedStagesState) => void; }
function EventLaunchInner({ adapter, initialState, onResume }: InnerProps) {
  const [context, setContext] = useState(defaultEventLaunchContext);
  const [message, setMessage] = useState("");
  const [lastChange, setLastChange] = useState<StagesChange<EventLaunchValue>>();
  const [published, setPublished] = useState<EventLaunchValue>();
  const formRef = useRef<HTMLFormElement>(null);
  const { controller, snapshot } = useStages(() => {
    let created: Controller;
    const onChange = (change: StagesChange<EventLaunchValue>) => { created.update({ value: change.value }); setLastChange(change); };
    created = initialState === undefined
      ? stages<EventLaunchValue, typeof eventLaunchReactFields, EventLaunchContext>({ schema, fields: eventLaunchReactFields, value: structuredClone(defaultEventLaunchValue), context, codec: eventLaunchValueCodec, onChange, validationFailureIssue: ({ validatorId }) => ({ message: `The ${validatorId} check could not finish. Try again.`, meta: { recoverable: true } }) })
      : stages<EventLaunchValue, typeof eventLaunchReactFields, EventLaunchContext>({ schema, fields: eventLaunchReactFields, state: initialState, context, codec: eventLaunchValueCodec, onChange, validationFailureIssue: ({ validatorId }) => ({ message: `The ${validatorId} check could not finish. Try again.`, meta: { recoverable: true } }) });
    return created;
  }, { context });
  ControllerContext.set(controller);
  const wizard = useStagesWizard(controller, ["launch"]);
  const currentIndex = wizard.stages.findIndex((stage) => stage.active);
  const active = wizard.stages[currentIndex];
  const pending = active?.validation?.status === "pending" || snapshot.validation.status === "pending";

  useEffect(() => {
    const saver = debounceDraftSave(() => saveEventLaunchDraft(localStorage, controller), 700);
    const unsubscribe = controller.subscribe(() => { if (controller.getSnapshot().revision > 0) saver.schedule(); });
    return () => { unsubscribe(); saver.destroy(); };
  }, [controller]);

  const validateActive = async () => {
    if (active === undefined) return false;
    const result = await controller.validate({ scope: { address: active.address }, event: "submit", reveal: true });
    if (!result.isValid) { setMessage("Please fix the highlighted fields before continuing."); requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], .field-issues")?.focus()); }
    return result.isValid;
  };
  const go = async (index: number) => {
    if (index > currentIndex && !(await validateActive())) return;
    const target = wizard.stages[index];
    if (target !== undefined) controller.dispatch(nodeEvent("wizard:go", EVENT_LAUNCH_WIZARD_ADDRESS, { payload: target.id }));
    setMessage("");
  };
  const next = async () => { if (await validateActive()) { wizard.next(); setMessage(""); } };
  const submit = async (event: FormEvent) => { event.preventDefault(); const result = await controller.validate({ scope: "form", event: "submit", reveal: true }); if (result.isValid) { setPublished(structuredClone(snapshot.value) as EventLaunchValue); setMessage("Event payload is ready. Publishing remains application policy."); } else { setMessage("Please resolve the highlighted issues before publishing."); } };
  const smoke = () => controller.batch(() => {
    const entries: readonly [readonly (string | number)[], unknown][] = [
      [["launch", "basics", "identity", "title"], smokeTestValue.launch.basics.identity.title], [["launch", "basics", "identity", "slug"], smokeTestValue.launch.basics.identity.slug], [["launch", "basics", "accessModel"], "free"], [["launch", "review", "confirmation"], smokeTestValue.launch.review.confirmation], [["launch", "review", "termsAccepted"], true],
    ];
    entries.forEach(([path, payload]) => controller.dispatch({ name: "input", target: { kind: "field", path }, payload }));
  });
  const copy = active === undefined ? ["Event launch", ""] : stageCopy[active.id] ?? [active.id, ""];
  const visibleIssues = snapshot.validation.visibleIssues;
  return <main className="event-shell"><header className="event-hero"><div><span className="eyebrow">Canonical cross-adapter example</span><h1>Launch an event people remember.</h1><p>One framework-neutral Stages workflow, composed with idiomatic adapter bindings.</p></div><span className="adapter-badge">{adapter}</span></header><div className="event-layout"><form className="event-card" data-testid="event-launch-form" ref={formRef} onSubmit={submit} noValidate><ol className="wizard-progress" data-testid="wizard-progress" aria-label="Event launch progress">{wizard.stages.map((stage, index) => <li key={stage.id}><button type="button" data-testid={`wizard-stage-${stage.id}`} aria-current={stage.active ? "step" : undefined} disabled={pending} onClick={() => void go(index)}>{stage.id}</button></li>)}</ol><section className="stage-panel" aria-labelledby="stage-heading"><div className="stage-heading"><h2 id="stage-heading">{copy[0]}</h2><p>{copy[1]}</p></div>{visibleIssues.length > 0 && <section className="validation-summary" data-testid="validation-summary" aria-labelledby="validation-heading"><h3 id="validation-heading">Check these details</h3><ul>{visibleIssues.map((entry) => <li key={`${entry.id}-${entry.path.join(".")}`}>{entry.message ?? entry.code}</li>)}</ul></section>}{published !== undefined && <section className="published" data-testid="published-payload"><h3>Publish payload</h3><pre className="published-payload">{JSON.stringify(published, null, 2)}</pre></section>}{wizard.activeStage === "basics" && <BasicsStage />}{wizard.activeStage === "venue" && <VenueStage />}{wizard.activeStage === "streaming" && <StreamingStage />}{wizard.activeStage === "agenda" && <AgendaStage controller={controller} />}{wizard.activeStage === "tickets" && <TicketsStage controller={controller} value={snapshot.value as EventLaunchValue} />}{wizard.activeStage === "compliance" && <div className="field-grid"><Field path={["launch", "compliance", "dataProcessingAccepted"]} /></div>}{wizard.activeStage === "review" && <ReviewStage value={snapshot.value as EventLaunchValue} />}<p className="form-status" data-testid="form-status" role="status" aria-live="polite">{pending ? "Checking your details…" : message}</p><div className="stage-actions"><button type="button" className="secondary" disabled={!wizard.canPrevious || pending} onClick={wizard.previous}>Previous</button>{wizard.canNext ? <button type="button" className="primary" disabled={pending} onClick={() => void next()}>Next</button> : <button className="primary" type="submit" disabled={pending}>Publish event</button>}</div></section></form><aside className="summary-rail" aria-label="Event summary"><h2>Launch summary</h2><dl className="summary-list"><div><dt>Status</dt><dd>Draft</dd></div><div><dt>Current stage</dt><dd>{wizard.activeStage ?? "None"}</dd></div><div><dt>Visible stages</dt><dd>{wizard.stages.length}</dd></div><div><dt>Validation</dt><dd>{snapshot.validation.status}</dd></div></dl><div className="utility-actions"><button type="button" data-testid="apply-template" onClick={() => controller.dispatch(formEvent("apply-template"))}>Apply conference template</button><button type="button" data-testid="save-draft" onClick={() => { saveEventLaunchDraft(localStorage, controller); setMessage("Draft saved by the application."); }}>Save draft</button><button type="button" data-testid="resume-draft" disabled={localStorage.getItem(EVENT_LAUNCH_STORAGE_KEY) === null} onClick={() => { const saved = readEventLaunchDraft(localStorage); if (saved !== undefined) onResume(saved); }}>Resume draft</button><button type="button" data-testid="start-over" onClick={() => { controller.dispatch(formEvent("form:reset")); clearEventLaunchDraft(localStorage); setMessage("The accepted baseline was restored."); }}>Start over</button>{import.meta.env.DEV && <button type="button" onClick={smoke}>Load smoke-test data</button>}</div><label className="context-toggle"><input type="checkbox" checked={context.requiresDataProcessingAgreement} onChange={(event) => setContext({ ...context, requiresDataProcessingAgreement: event.currentTarget.checked })} />Require data-processing agreement</label><details className="inspector" data-testid="stages-inspector"><summary>Stages inspector</summary><pre>{JSON.stringify({ value: snapshot.value, validation: snapshot.validation, activeStage: wizard.activeStage, visibleStages: wizard.stages.map((stage) => stage.id), lastTransaction: lastChange === undefined ? null : { source: lastChange.source, events: lastChange.events.map((event) => event.name), patchCount: lastChange.patches.length, transactionId: lastChange.transactionId }, diagnostics: snapshot.diagnostics, envelope: controller.serialize() }, null, 2)}</pre></details></aside></div></main>;
}

export function EventLaunchApp({ adapter }: { readonly adapter: string }) {
  const [resume, setResume] = useState<{ readonly key: number; readonly state?: SerializedStagesState }>({ key: 0 });
  return <EventLaunchInner key={resume.key} adapter={adapter} initialState={resume.state} onResume={(state) => setResume(({ key }) => ({ key: key + 1, state }))} />;
}
