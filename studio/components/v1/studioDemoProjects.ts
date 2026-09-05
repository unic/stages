import agenda from "../../src/document/fixtures/event-launch-agenda.json";
import { toUid } from "../../src/document/uid";
import type { JsonObject, StudioFieldNode, StudioNode, StudioProjectDocument } from "../../src/document/types";

function field(id: string, label: string, key = "text", props: JsonObject = {}): StudioFieldNode {
  return {
    uid: toUid(`demo_${id}`), kind: "field", runtimeId: id, definition: { key, version: 1 },
    props: { label, ...props },
    presentation: { layout: { width: { mobile: "full", tablet: "half", desktop: "half" } } },
  };
}

function project(id: string, title: string, nodes: readonly StudioNode[], value: JsonObject): StudioProjectDocument {
  const uid = toUid(`demo_form_${id}`);
  return {
    format: "stages-studio", formatVersion: 1,
    project: { uid: toUid(`demo_project_${id}`), title, defaultLocale: "en" },
    forms: { [uid]: {
      uid, title, runtime: { schemaId: `demo-${id}`, schemaVersion: 1 },
      rootNodeUids: nodes.map((node) => node.uid),
      nodes: Object.fromEntries(nodes.map((node) => [node.uid, node])),
      scenarios: [{ uid: toUid(`demo_scenario_${id}`), title: "Example answers", value },
        { uid: toUid(`demo_empty_${id}`), title: "Empty form", value: {} }], settings: {},
    } }, fragments: {}, resources: {},
  };
}

const contact = project("contact", "Simple contact", [
  { ...field("name", "Full name"), validators: [{ id: "name.required", kind: "required", on: "submit", message: "Enter your name." }] },
  field("email", "Email address"), field("message", "Message", "textarea", { rows: 4 }),
], { name: "Ada Lovelace", email: "ada@example.com", message: "I'd like to learn more." });

const controls = project("controls", "Registration & preferences", [
  field("name", "Full name"), field("tickets", "Tickets", "number", { min: 1, max: 10 }),
  field("track", "Track", "choice", { options: "Design\nEngineering\nProduct" }),
  field("date", "Arrival date", "date"), field("notes", "Accessibility requests", "textarea"),
  field("updates", "Send event updates", "checkbox"),
], { name: "Sam Rivera", tickets: 2, track: "Design", date: "2026-10-12", notes: "", updates: true });

const guest = field("guest", "Guest name");
const attendeesBase = project("attendees", "Team registration", [
  field("team", "Team name"),
  { uid: toUid("demo_guests"), kind: "collection", runtimeId: "guests", childUids: [guest.uid], min: 1, max: 5, presentation: { label: "Guests" } },
], { team: "Studio team", guests: [{ guest: "Ada" }, { guest: "Sam" }] });
const attendeesForm = Object.values(attendeesBase.forms)[0]!;
const attendees: StudioProjectDocument = { ...attendeesBase, forms: { [attendeesForm.uid]: {
  ...attendeesForm, nodes: { ...attendeesForm.nodes, [guest.uid]: guest },
} } };

export const STUDIO_DEMO_PROJECTS = [
  { id: "contact", label: "1 · Simple contact", description: "Text, textarea, required validation and responsive columns.", project: contact },
  { id: "controls", label: "2 · Registration & preferences", description: "Numbers, dates, dropdowns, checkboxes and example answers.", project: controls },
  { id: "attendees", label: "3 · Team registration", description: "Repeatable guests with minimum and maximum row limits.", project: attendees },
  { id: "agenda", label: "4 · Event launch wizard", description: "Multiple steps, conditional logic and nested agenda variants.", project: agenda as unknown as StudioProjectDocument },
] as const;
