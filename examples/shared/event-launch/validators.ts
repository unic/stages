import type { DataPath, ValidationIssue, ValidatorConfig } from "@stages/core";
import type { AgendaItem, EventLaunchContext, EventLaunchValue, TicketTier } from "./model.js";
import { checkSlugAvailability } from "./services.js";

function issue(id: string, code: string, message: string, path: DataPath, severity: "error" | "warning" = "error"): ValidationIssue {
  return { id, code, message, path, severity };
}

export const slugSyntaxValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "slug.syntax",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate({ fieldValue, path }) {
    return typeof fieldValue === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fieldValue)
      ? []
      : [issue("slug.syntax", "slug-syntax", "Use lowercase letters, numbers, and single hyphens.", path)];
  },
};

export const slugAvailabilityValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "slug.availability",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  async validate({ fieldValue, path, context, signal }) {
    if (typeof fieldValue !== "string" || fieldValue.length === 0) return [];
    const result = await checkSlugAvailability(fieldValue, context, signal);
    return result === "reserved" ? [issue("slug.availability", "slug-reserved", "That event URL is already reserved.", path)] : [];
  },
};

export const scheduleValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "schedule.order",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  dependencies: [["launch", "basics", "schedule", "startsAt"], ["launch", "basics", "schedule", "endsAt"]],
  validate({ value }) {
    const { startsAt, endsAt } = value.launch.basics.schedule;
    return startsAt !== "" && endsAt !== "" && new Date(endsAt).getTime() > new Date(startsAt).getTime()
      ? []
      : [issue("schedule.order", "date-order", "The event must end after it starts.", ["launch", "basics", "schedule", "endsAt"])];
  },
};

export const streamUrlValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "stream.url",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate({ fieldValue, path }) {
    if (typeof fieldValue !== "string") return [issue("stream.url", "url", "Enter a public HTTPS stream URL.", path)];
    try {
      const url = new URL(fieldValue);
      return url.protocol === "https:" ? [] : [issue("stream.url", "url", "Enter a public HTTPS stream URL.", path)];
    } catch {
      return [issue("stream.url", "url", "Enter a public HTTPS stream URL.", path)];
    }
  },
};

export const recordingConsentValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "recording.consent",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate({ fieldValue, path }) {
    return fieldValue === true ? [] : [issue("recording.consent", "consent", "Confirm that speakers have consented to recording.", path)];
  },
};

export const agendaValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "agenda.unique-titles",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate({ fieldValue, path }) {
    const items = Array.isArray(fieldValue) ? fieldValue as readonly AgendaItem[] : [];
    const seen = new Map<string, number>();
    const issues: ValidationIssue[] = [];
    items.forEach((item, index) => {
      const title = item.kind === "break" ? item.label : item.title;
      const key = title.trim().toLocaleLowerCase();
      if (key !== "" && seen.has(key)) {
        issues.push(issue(`agenda.title.${item.id}`, "duplicate-title", "Agenda titles must be unique.", [...path, index, item.kind === "break" ? "label" : "title"]));
      } else if (key !== "") seen.set(key, index);
      if ((item.durationMinutes ?? 0) >= 120 || (item.kind === "workshop" && (item.capacity ?? 0) >= 200)) {
        issues.push(issue(`agenda.warning.${item.id}`, "agenda-capacity", "Consider a break or additional facilitator for this agenda item.", [...path, index, "durationMinutes"], "warning"));
      }
    });
    return issues;
  },
};

export const ticketsValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "tickets.valid",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate({ fieldValue, path }) {
    const tiers = Array.isArray(fieldValue) ? fieldValue as readonly TicketTier[] : [];
    const names = new Set<string>();
    const issues: ValidationIssue[] = [];
    tiers.forEach((tier, index) => {
      const key = tier.name.trim().toLocaleLowerCase();
      if (key !== "" && names.has(key)) issues.push(issue(`ticket.name.${tier.id}`, "duplicate-tier", "Ticket tier names must be unique.", [...path, index, "name"]));
      names.add(key);
      if (tier.price === undefined || tier.price <= 0) issues.push(issue(`ticket.price.${tier.id}`, "positive-price", "Enter a price greater than zero.", [...path, index, "price"]));
      if (tier.quantity === undefined || tier.quantity <= 0) issues.push(issue(`ticket.quantity.${tier.id}`, "positive-quantity", "Enter a quantity greater than zero.", [...path, index, "quantity"]));
    });
    return issues;
  },
};

export const reviewConfirmationValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "review.confirmation",
  on: "submit",
  revealOn: "submit",
  dependencies: [["launch", "basics", "identity", "title"]],
  validate({ fieldValue, path, value }) {
    return fieldValue === value.launch.basics.identity.title
      ? []
      : [issue("review.confirmation", "confirmation", "Type the event title exactly to publish.", path)];
  },
};

export const workshopCapacityValidator: ValidatorConfig<EventLaunchValue, EventLaunchContext> = {
  id: "workshop.capacity",
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  dependencies: [["launch", "venue", "capacity"]],
  validate({ fieldValue, path, value }) {
    const venue = value.launch.venue.capacity;
    return typeof fieldValue === "number" && fieldValue > 0 && (venue === undefined || fieldValue <= venue)
      ? []
      : [issue("workshop.capacity", "capacity", "Workshop capacity must be positive and cannot exceed venue capacity.", path)];
  },
};
