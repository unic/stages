export type DeliveryMode = "in-person" | "virtual" | "hybrid";
export type AccessModel = "free" | "paid";

export type AgendaItem =
  | { id: string; kind: "session"; title: string; speaker: string; durationMinutes: number | undefined }
  | { id: string; kind: "workshop"; title: string; facilitator: string; durationMinutes: number | undefined; capacity: number | undefined }
  | { id: string; kind: "break"; label: string; durationMinutes: number | undefined };

export interface TicketTier {
  id: string;
  name: string;
  price: number | undefined;
  quantity: number | undefined;
}

export interface EventLaunchValue {
  launch: {
    basics: {
      identity: { title: string; slug: string; description: string };
      schedule: { startsAt: string; endsAt: string; timezone: string };
      deliveryMode: DeliveryMode;
      accessModel: AccessModel;
    };
    venue: {
      name: string;
      address: { street: string; city: string; country: string };
      capacity: number | undefined;
      accessibilityNotes: string;
    };
    streaming: { platform: string; url: string; recordEvent: boolean; recordingConsent: boolean };
    agenda: { items: AgendaItem[] };
    tickets: { currency: string; tiers: TicketTier[] };
    compliance: { dataProcessingAccepted: boolean };
    review: { termsAccepted: boolean; confirmation: string };
  };
}

export interface EventLaunchMessages {
  readonly slugHelp: string;
  readonly streamHelp: string;
  readonly confirmationPrefix: string;
}

export interface EventLaunchContext {
  readonly locale: string;
  readonly currency: string;
  readonly requiresDataProcessingAgreement: boolean;
  readonly reservedSlugs: ReadonlySet<string>;
  readonly validationDelayMs: number;
  readonly messages: EventLaunchMessages;
}

export const EVENT_LAUNCH_STORAGE_KEY = "stages:event-launch:v1";
export const EVENT_LAUNCH_WIZARD_ADDRESS = [{ kind: "node", id: "launch" }] as const;
export const EVENT_LAUNCH_AGENDA_ADDRESS = [
  ...EVENT_LAUNCH_WIZARD_ADDRESS,
  { kind: "node", id: "agenda" },
  { kind: "node", id: "items" },
] as const;
export const EVENT_LAUNCH_TICKETS_ADDRESS = [
  ...EVENT_LAUNCH_WIZARD_ADDRESS,
  { kind: "node", id: "tickets" },
  { kind: "node", id: "tiers" },
] as const;
