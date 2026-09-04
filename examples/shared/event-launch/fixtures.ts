import type { AgendaItem, EventLaunchContext, EventLaunchValue, TicketTier } from "./model.js";

export const defaultEventLaunchContext: EventLaunchContext = {
  locale: "en-CH",
  currency: "CHF",
  requiresDataProcessingAgreement: false,
  reservedSlugs: new Set(["stages-conf", "design-systems-day", "launch-week"]),
  validationDelayMs: 180,
  messages: {
    slugHelp: "Lowercase letters, numbers, and hyphens. Availability is checked locally for this demo.",
    streamHelp: "Use the public attendee URL supplied by your streaming provider.",
    confirmationPrefix: "Type the event title exactly:",
  },
};

export const defaultEventLaunchValue: EventLaunchValue = {
  launch: {
    basics: {
      identity: {
        title: "Stages Community Summit",
        slug: "stages-conf",
        description: "A practical day for teams building dependable product workflows.",
      },
      schedule: { startsAt: "2026-10-15T09:00", endsAt: "2026-10-15T17:00", timezone: "Europe/Zurich" },
      deliveryMode: "hybrid",
      accessModel: "paid",
    },
    venue: {
      name: "Kraftwerk",
      address: { street: "Selnaustrasse 25", city: "Zurich", country: "CH" },
      capacity: 240,
      accessibilityNotes: "Step-free entrance and reserved seating are available.",
    },
    streaming: { platform: "youtube", url: "https://example.com/live/stages", recordEvent: true, recordingConsent: true },
    agenda: {
      items: [
        { id: "agenda-session-1", kind: "session", title: "Opening keynote", speaker: "Ada Lovelace", durationMinutes: 45 },
        { id: "agenda-break-1", kind: "break", label: "Coffee break", durationMinutes: 20 },
      ],
    },
    tickets: { currency: "CHF", tiers: [{ id: "ticket-general-1", name: "General", price: 89, quantity: 180 }] },
    compliance: { dataProcessingAccepted: false },
    review: { termsAccepted: false, confirmation: "" },
  },
};

export const conferenceTemplatePatches = [
  { op: "set", path: ["launch", "basics", "identity", "title"], value: "Product Systems Conference" },
  { op: "set", path: ["launch", "basics", "identity", "slug"], value: "product-systems-conf" },
  { op: "set", path: ["launch", "basics", "identity", "description"], value: "A focused conference for teams designing scalable product systems." },
  { op: "set", path: ["launch", "basics", "schedule", "startsAt"], value: "2026-11-12T09:00" },
  { op: "set", path: ["launch", "basics", "schedule", "endsAt"], value: "2026-11-12T17:30" },
  { op: "set", path: ["launch", "basics", "deliveryMode"], value: "hybrid" },
  { op: "set", path: ["launch", "agenda", "items"], value: [
    { id: "agenda-template-1", kind: "session", title: "Systems that scale", speaker: "Grace Hopper", durationMinutes: 50 },
    { id: "agenda-template-2", kind: "break", label: "Lunch", durationMinutes: 60 },
  ] },
] as const;

export function createAgendaItem(kind: AgendaItem["kind"], id: string): AgendaItem {
  if (kind === "break") return { id, kind, label: "Break", durationMinutes: 15 };
  if (kind === "workshop") return { id, kind, title: "New workshop", facilitator: "", durationMinutes: 60, capacity: 30 };
  return { id, kind, title: "New session", speaker: "", durationMinutes: 30 };
}

export function createTicketTier(id: string): TicketTier {
  return { id, name: "New tier", price: 0, quantity: 0 };
}

export const smokeTestValue: EventLaunchValue = {
  launch: {
    ...defaultEventLaunchValue.launch,
    basics: {
      ...defaultEventLaunchValue.launch.basics,
      identity: { title: "Smoke Test Live", slug: "smoke-test-live", description: "Deterministic browser-test fixture." },
      accessModel: "free",
    },
    agenda: { items: [{ id: "agenda-smoke-1", kind: "session", title: "Verified session", speaker: "Test Speaker", durationMinutes: 30 }] },
    review: { termsAccepted: true, confirmation: "Smoke Test Live" },
  },
};
