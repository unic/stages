import { Component, computed, signal } from "@angular/core";
import { formEvent, nodeEvent, stages, type SerializedStagesState, type StagesChange, type StagesController } from "@stages/core";
import { StagesFieldComponent, collectionSignal, injectStages, wizardSignal } from "@stages/angular";
import { EVENT_LAUNCH_AGENDA_ADDRESS, EVENT_LAUNCH_STORAGE_KEY, clearEventLaunchDraft, createAgendaItem, createEventLaunchSchema, createTicketTier, defaultEventLaunchContext, defaultEventLaunchValue, eventLaunchValueCodec, readEventLaunchDraft, saveEventLaunchDraft, type AgendaItem, type EventLaunchContext, type EventLaunchValue } from "../../shared/event-launch/index.js";
import { eventLaunchAngularFields } from "./fields.js";

type Controller = StagesController<EventLaunchValue, typeof eventLaunchAngularFields, EventLaunchContext>;
const schema = createEventLaunchSchema();

@Component({
  selector: "stages-event-launch",
  standalone: true,
  imports: [StagesFieldComponent],
  template: `
    <main class="event-shell">
      <header class="event-hero"><div><span class="eyebrow">Canonical cross-adapter example</span><h1>Launch an event people remember.</h1><p>One framework-neutral Stages workflow, composed with idiomatic adapter bindings.</p></div><span class="adapter-badge">Angular</span></header>
      <div class="event-layout">
        <form class="event-card" data-testid="event-launch-form" (submit)="publish($event)">
          <ol class="wizard-progress" data-testid="wizard-progress" aria-label="Event launch progress">@for (stage of wizard().stages; track stage.id; let index = $index) { <li><button type="button" [attr.data-testid]="'wizard-stage-' + stage.id" [attr.aria-current]="stage.active ? 'step' : null" (click)="go(index)">{{ stage.id }}</button></li> }</ol>
          <section class="stage-panel" aria-labelledby="stage-heading">
            <div class="stage-heading"><h2 id="stage-heading">{{ stageTitle() }}</h2><p>Domain behavior is shared; this composition belongs to Angular signals.</p></div>
            @if (snapshot().validation.visibleIssues.length) { <section class="validation-summary" data-testid="validation-summary"><h3>Check these details</h3><ul>@for (issue of snapshot().validation.visibleIssues; track issue.id + issue.path.join('.')) { <li>{{ issue.message ?? issue.code }}</li> }</ul></section> }
            @if (published()) { <pre class="published-payload" data-testid="published-payload">{{ published() }}</pre> }
            @switch (wizard().activeStage) {
              @case ('basics') { <div class="field-grid"><stages-field [controller]="controller" [path]="['launch','basics','identity','title']"/><stages-field [controller]="controller" [path]="['launch','basics','identity','slug']"/><stages-field [controller]="controller" [path]="['launch','basics','identity','description']"/><stages-field [controller]="controller" [path]="['launch','basics','schedule','startsAt']"/><stages-field [controller]="controller" [path]="['launch','basics','schedule','endsAt']"/><stages-field [controller]="controller" [path]="['launch','basics','schedule','timezone']"/><stages-field [controller]="controller" [path]="['launch','basics','deliveryMode']"/><stages-field [controller]="controller" [path]="['launch','basics','accessModel']"/></div> }
              @case ('venue') { <div class="field-grid"><stages-field [controller]="controller" [path]="['launch','venue','name']"/><stages-field [controller]="controller" [path]="['launch','venue','capacity']"/><stages-field [controller]="controller" [path]="['launch','venue','address','street']"/><stages-field [controller]="controller" [path]="['launch','venue','address','city']"/><stages-field [controller]="controller" [path]="['launch','venue','address','country']"/><stages-field [controller]="controller" [path]="['launch','venue','accessibilityNotes']"/></div> }
              @case ('streaming') { <div class="field-grid"><stages-field [controller]="controller" [path]="['launch','streaming','platform']"/><stages-field [controller]="controller" [path]="['launch','streaming','url']"/><stages-field [controller]="controller" [path]="['launch','streaming','recordEvent']"/>@if (snapshot().value.launch.streaming.recordEvent) { <stages-field [controller]="controller" [path]="['launch','streaming','recordingConsent']"/> }</div> }
              @case ('agenda') { <div class="collection-toolbar"><strong>{{ agenda().items.length }} agenda items</strong><div class="row-actions"><button type="button" (click)="addAgenda('session')">Add session</button><button type="button" (click)="addAgenda('workshop')">Add workshop</button><button type="button" (click)="addAgenda('break')">Add break</button><button type="button" (click)="sortBreaksLast()">Sort breaks last</button></div></div><ol class="collection-list">@for (item of agenda().items; track item.key) { <li class="collection-row" [attr.data-testid]="'agenda-row-' + item.value.id"><div class="row-header"><span class="row-kind">{{ item.value.kind }}</span><span class="row-key">{{ item.key }}</span></div><div class="field-grid">@if (item.value.kind === 'break') { <stages-field [controller]="controller" [path]="['launch','agenda','items',item.index,'label']"/> } @else { <stages-field [controller]="controller" [path]="['launch','agenda','items',item.index,'title']"/> @if (item.value.kind === 'session') { <stages-field [controller]="controller" [path]="['launch','agenda','items',item.index,'speaker']"/> } @else { <stages-field [controller]="controller" [path]="['launch','agenda','items',item.index,'facilitator']"/> } }<stages-field [controller]="controller" [path]="['launch','agenda','items',item.index,'durationMinutes']"/>@if (item.value.kind === 'workshop') { <stages-field [controller]="controller" [path]="['launch','agenda','items',item.index,'capacity']"/> }</div><div class="row-actions"><button type="button" class="quiet" [disabled]="!item.canMovePrevious" (click)="item.moveTo(item.index - 1)">Move up</button><button type="button" class="quiet" [disabled]="!item.canMoveNext" (click)="item.moveTo(item.index + 1)">Move down</button><button type="button" class="quiet danger" [disabled]="!item.canRemove" (click)="item.remove()">Remove</button></div></li> }</ol> }
              @case ('tickets') { <div class="field-grid"><stages-field [controller]="controller" [path]="['launch','tickets','currency']"/></div><div class="collection-toolbar"><strong>{{ tickets().items.length }} ticket tiers</strong><button type="button" (click)="addTicket()">Add tier</button></div><ol class="collection-list">@for (item of tickets().items; track item.key) { <li class="collection-row" [attr.data-testid]="'ticket-row-' + item.value.id"><div class="field-grid"><stages-field [controller]="controller" [path]="['launch','tickets','tiers',item.index,'name']"/><stages-field [controller]="controller" [path]="['launch','tickets','tiers',item.index,'price']"/><stages-field [controller]="controller" [path]="['launch','tickets','tiers',item.index,'quantity']"/></div><div class="row-actions"><button type="button" class="quiet" [disabled]="!item.canMovePrevious" (click)="item.moveTo(item.index - 1)">Move up</button><button type="button" class="quiet danger" [disabled]="!item.canRemove" (click)="item.remove()">Remove</button></div></li> }</ol> }
              @case ('compliance') { <div class="field-grid"><stages-field [controller]="controller" [path]="['launch','compliance','dataProcessingAccepted']"/></div> }
              @case ('review') { <dl class="summary-list"><div><dt>Event</dt><dd>{{ snapshot().value.launch.basics.identity.title }}</dd></div><div><dt>Delivery</dt><dd>{{ snapshot().value.launch.basics.deliveryMode }}</dd></div></dl><div class="field-grid"><stages-field [controller]="controller" [path]="['launch','review','termsAccepted']"/><stages-field [controller]="controller" [path]="['launch','review','confirmation']"/></div> }
            }
            <p class="form-status" role="status" aria-live="polite" data-testid="form-status">{{ message() }}</p><div class="stage-actions"><button type="button" class="secondary" [disabled]="!wizard().canPrevious" (click)="wizard().previous()">Previous</button>@if (wizard().canNext) { <button type="button" class="primary" (click)="next()">Next</button> } @else { <button type="submit" class="primary">Publish event</button> }</div>
          </section>
        </form>
        <aside class="summary-rail"><h2>Launch summary</h2><dl class="summary-list"><div><dt>Current stage</dt><dd>{{ wizard().activeStage }}</dd></div><div><dt>Visible stages</dt><dd>{{ wizard().stages.length }}</dd></div><div><dt>Validation</dt><dd>{{ snapshot().validation.status }}</dd></div></dl><div class="utility-actions"><button type="button" data-testid="apply-template" (click)="applyTemplate()">Apply conference template</button><button type="button" data-testid="save-draft" (click)="save()">Save draft</button><button type="button" data-testid="resume-draft" [disabled]="!hasDraft()" (click)="resume()">Resume draft</button><button type="button" data-testid="start-over" (click)="startOver()">Start over</button></div><label class="context-toggle"><input type="checkbox" [checked]="context().requiresDataProcessingAgreement" (change)="toggleCompliance($event)"/>Require data-processing agreement</label><details class="inspector" data-testid="stages-inspector"><summary>Stages inspector</summary><pre>{{ inspector() }}</pre></details></aside>
      </div>
    </main>
  `,
})
export class EventLaunchAppComponent {
  readonly context = signal(defaultEventLaunchContext);
  readonly value = signal<EventLaunchValue>(structuredClone(defaultEventLaunchValue));
  readonly message = signal("");
  readonly published = signal<string | undefined>(undefined);
  readonly lastChange = signal<StagesChange<EventLaunchValue> | undefined>(undefined);
  private readonly restored: SerializedStagesState | undefined = sessionStorage.getItem("event-launch-resume") === "true" ? readEventLaunchDraft(localStorage) : undefined;
  readonly binding = injectStages(() => {
    sessionStorage.removeItem("event-launch-resume");
    let created: Controller;
    const onChange = (change: StagesChange<EventLaunchValue>) => { this.value.set(change.value); this.lastChange.set(change); };
    created = this.restored === undefined ? stages<EventLaunchValue, typeof eventLaunchAngularFields, EventLaunchContext>({ schema, fields: eventLaunchAngularFields, value: this.value(), context: this.context(), codec: eventLaunchValueCodec, onChange }) : stages<EventLaunchValue, typeof eventLaunchAngularFields, EventLaunchContext>({ schema, fields: eventLaunchAngularFields, state: this.restored, context: this.context(), codec: eventLaunchValueCodec, onChange });
    if (this.restored !== undefined) this.value.set(structuredClone(created.getSnapshot().value) as EventLaunchValue);
    return created;
  }, computed(() => ({ value: this.value(), context: this.context() })));
  readonly controller = this.binding.controller;
  readonly snapshot = this.binding.snapshot;
  readonly wizard = wizardSignal(this.controller, ["launch"]);
  readonly agenda = collectionSignal(this.controller, ["launch", "agenda", "items"] as const);
  readonly tickets = collectionSignal(this.controller, ["launch", "tickets", "tiers"] as const);
  readonly hasDraft = signal(localStorage.getItem(EVENT_LAUNCH_STORAGE_KEY) !== null);
  readonly stageTitle = computed(() => ({ basics: "Event basics", venue: "Venue", streaming: "Streaming", agenda: "Agenda", tickets: "Ticket tiers", compliance: "Data processing", review: "Review and publish" }[this.wizard().activeStage ?? ""] ?? "Event launch"));
  readonly inspector = computed(() => JSON.stringify({ value: this.snapshot().value, validation: this.snapshot().validation, activeStage: this.wizard().activeStage, visibleStages: this.wizard().stages.map((stage) => stage.id), lastTransaction: this.lastChange(), diagnostics: this.snapshot().diagnostics, envelope: this.controller.serialize() }, null, 2));
  private agendaId = 10; private ticketId = 10;
  private async validateActive(): Promise<boolean> { const active = this.wizard().stages.find((stage) => stage.active); if (active === undefined) return false; const result = await this.controller.validate({ scope: { address: active.address }, event: "submit", reveal: true }); if (!result.isValid) this.message.set("Please fix the highlighted fields before continuing."); return result.isValid; }
  async next(): Promise<void> { if (await this.validateActive()) this.wizard().next(); }
  async go(index: number): Promise<void> { const current = this.wizard().stages.findIndex((stage) => stage.active); const target = this.wizard().stages[index]; if (target !== undefined && (index <= current || await this.validateActive())) this.wizard().go(target.id); }
  async publish(event: Event): Promise<void> { event.preventDefault(); const result = await this.controller.validate({ scope: "form", event: "submit", reveal: true }); if (result.isValid) { this.published.set(JSON.stringify(this.snapshot().value, null, 2)); this.message.set("Event payload is ready. Publishing remains application policy."); } else this.message.set("Please resolve the highlighted issues before publishing."); }
  addAgenda(kind: AgendaItem["kind"]): void { this.agenda().add(createAgendaItem(kind, `agenda-${kind}-${this.agendaId}`)); this.agendaId += 1; }
  sortBreaksLast(): void { const order = this.agenda().items.map((item, index) => ({ index, break: item.value.kind === "break" })).sort((a, b) => Number(a.break) - Number(b.break)).map((entry) => entry.index); this.controller.dispatch(nodeEvent("collection:sort", EVENT_LAUNCH_AGENDA_ADDRESS, { payload: { order } })); }
  addTicket(): void { this.tickets().add(createTicketTier(`ticket-${this.ticketId}`)); this.ticketId += 1; }
  applyTemplate(): void { this.controller.dispatch(formEvent("apply-template")); }
  save(): void { saveEventLaunchDraft(localStorage, this.controller); this.hasDraft.set(true); this.message.set("Draft saved by the application."); }
  resume(): void { sessionStorage.setItem("event-launch-resume", "true"); location.reload(); }
  startOver(): void { this.controller.dispatch(formEvent("form:reset")); clearEventLaunchDraft(localStorage); this.hasDraft.set(false); }
  toggleCompliance(event: Event): void { if (event.currentTarget instanceof HTMLInputElement) this.context.update((context) => ({ ...context, requiresDataProcessingAgreement: event.currentTarget instanceof HTMLInputElement && event.currentTarget.checked })); }
}
