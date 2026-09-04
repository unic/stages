import type { StagesSchema, StagesSchemaFactory, ValidationIssue, ValidatorConfig } from "@stages/core";
import type { EventLaunchFields } from "./field-contract.js";
import { conferenceTemplatePatches } from "./fixtures.js";
import type { EventLaunchContext, EventLaunchValue } from "./model.js";
import {
  agendaValidator,
  recordingConsentValidator,
  reviewConfirmationValidator,
  scheduleValidator,
  slugAvailabilityValidator,
  slugSyntaxValidator,
  streamUrlValidator,
  ticketsValidator,
  workshopCapacityValidator,
} from "./validators.js";

const issue = (id: string, message: string, path: readonly (string | number)[]): ValidationIssue => ({
  id,
  code: id,
  message,
  path,
  severity: "error",
});

const requiredNumber = (id: string, message: string): ValidatorConfig<EventLaunchValue, EventLaunchContext> => ({
  id,
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate: ({ fieldValue, path }) => typeof fieldValue === "number" && fieldValue > 0 ? [] : [issue(id, message, path)],
});

const requiredTrue = (id: string, message: string): ValidatorConfig<EventLaunchValue, EventLaunchContext> => ({
  id,
  on: ["input", "submit"],
  revealOn: ["blur", "submit"],
  validate: ({ fieldValue, path }) => fieldValue === true ? [] : [issue(id, message, path)],
});

const venueCapacityValidator = requiredNumber("venue.capacity", "Enter a venue capacity.");
const agendaDurationValidator = requiredNumber("agenda.duration", "Enter a duration.");
const complianceRequiredValidator = requiredTrue("compliance.required", "Accept the data-processing agreement.");
const reviewTermsValidator = requiredTrue("review.terms", "Accept the publishing terms.");

function schemaFor(includeCompliance: boolean): StagesSchema<EventLaunchValue, EventLaunchFields, EventLaunchContext> {
  return {
    id: "event-launch",
    version: 1,
    transforms: [{ on: "apply-template", apply: () => conferenceTemplatePatches }],
    nodes: [{
      kind: "wizard",
      id: "launch",
      initialStage: "basics",
      navigation: {
        validateCurrent: true,
        nonLinear: true,
        guard: (value, _from, to) => to !== "review"
          || value.launch.basics.accessModel !== "paid"
          || value.launch.tickets.tiers.length > 0,
      },
      stages: [
        {
          id: "basics",
          nodes: [
            {
              kind: "group",
              id: "identity",
              nodes: [
                {
                  kind: "field",
                  id: "title",
                  type: "text",
                  props: { label: "Event title", description: "The public name shown to attendees.", placeholder: "Product Systems Conference", required: true, autocomplete: "organization-title" },
                  transforms: [{
                    on: "blur",
                    apply: ({ fieldValue, path }) => typeof fieldValue === "string" && fieldValue !== fieldValue.trim()
                      ? [{ op: "set", path, value: fieldValue.trim() }]
                      : [],
                  }],
                },
                {
                  kind: "field",
                  id: "slug",
                  type: "text",
                  props: { label: "Event URL", placeholder: "product-systems-conf", required: true },
                  deriveProps: ({ context }) => ({ description: context.messages.slugHelp }),
                  validators: [slugSyntaxValidator, slugAvailabilityValidator],
                },
                { kind: "field", id: "description", type: "textarea", props: { label: "Description", description: "Tell attendees what they will learn.", required: true } },
              ],
            },
            {
              kind: "group",
              id: "schedule",
              validators: [scheduleValidator],
              nodes: [
                { kind: "field", id: "startsAt", type: "text", props: { label: "Starts", inputType: "datetime-local", required: true } },
                { kind: "field", id: "endsAt", type: "text", props: { label: "Ends", inputType: "datetime-local", required: true } },
                { kind: "field", id: "timezone", type: "choice", props: { label: "Timezone", required: true, options: [
                  { value: "Europe/Zurich", label: "Zurich (CET/CEST)" },
                  { value: "Europe/London", label: "London (GMT/BST)" },
                  { value: "America/New_York", label: "New York (ET)" },
                ] } },
              ],
            },
            { kind: "field", id: "deliveryMode", type: "choice", props: { label: "Delivery", required: true, options: [
              { value: "in-person", label: "In person" }, { value: "virtual", label: "Virtual" }, { value: "hybrid", label: "Hybrid" },
            ] } },
            { kind: "field", id: "accessModel", type: "choice", props: { label: "Registration", required: true, options: [
              { value: "free", label: "Free" }, { value: "paid", label: "Paid" },
            ] } },
          ],
        },
        {
          id: "venue",
          when: ({ value }) => value.launch.basics.deliveryMode !== "virtual",
          nodes: [
            { kind: "field", id: "name", type: "text", props: { label: "Venue name", required: true, placeholder: "Kraftwerk" } },
            {
              kind: "group",
              id: "address",
              disabled: ({ value }) => value.launch.venue.name.trim().length === 0,
              nodes: [
                { kind: "field", id: "street", type: "text", props: { label: "Street address", required: true } },
                { kind: "field", id: "city", type: "text", props: { label: "City", required: true } },
                { kind: "field", id: "country", type: "choice", props: { label: "Country", required: true, options: [
                  { value: "CH", label: "Switzerland" }, { value: "DE", label: "Germany" }, { value: "GB", label: "United Kingdom" },
                ] } },
              ],
            },
            { kind: "field", id: "capacity", type: "number", props: { label: "Venue capacity", min: 1, suffix: "people" }, validators: [venueCapacityValidator] },
            { kind: "field", id: "accessibilityNotes", type: "textarea", props: { label: "Accessibility notes", description: "Share step-free access, seating, captioning, or contact details." } },
          ],
        },
        {
          id: "streaming",
          when: ({ value }) => value.launch.basics.deliveryMode !== "in-person",
          nodes: [
            { kind: "field", id: "platform", type: "choice", props: { label: "Streaming platform", required: true, options: [
              { value: "youtube", label: "YouTube Live" }, { value: "zoom", label: "Zoom" }, { value: "other", label: "Other" },
            ] } },
            { kind: "field", id: "url", type: "text", props: { label: "Attendee stream URL", inputType: "url", required: true }, deriveProps: ({ context, value }) => ({ description: `${context.messages.streamHelp} Selected platform: ${value.launch.streaming.platform || "not selected"}.` }), validators: [streamUrlValidator] },
            { kind: "field", id: "recordEvent", type: "checkbox", props: { label: "Record this event", description: "The recording setting is application policy." } },
            { kind: "field", id: "recordingConsent", type: "checkbox", when: ({ value }) => value.launch.streaming.recordEvent, props: { label: "All speakers have consented to recording", required: true }, validators: [recordingConsentValidator] },
          ],
        },
        {
          id: "agenda",
          nodes: [{
            kind: "collection",
            id: "items",
            min: 1,
            max: 12,
            itemKey: (item) => typeof item === "object" && item !== null && "id" in item ? String(item.id) : "invalid",
            discriminator: "kind",
            validators: [agendaValidator],
            variants: {
              session: { nodes: [
                { kind: "field", id: "title", type: "text", props: { label: "Session title", required: true } },
                { kind: "field", id: "speaker", type: "text", props: { label: "Speaker", required: true } },
                { kind: "field", id: "durationMinutes", type: "number", props: { label: "Duration", min: 5, suffix: "minutes" }, validators: [agendaDurationValidator] },
              ] },
              workshop: { nodes: [
                { kind: "field", id: "title", type: "text", props: { label: "Workshop title", required: true } },
                { kind: "field", id: "facilitator", type: "text", props: { label: "Facilitator", required: true } },
                { kind: "field", id: "durationMinutes", type: "number", props: { label: "Duration", min: 15, suffix: "minutes" }, validators: [agendaDurationValidator] },
                { kind: "field", id: "capacity", type: "number", props: { label: "Workshop capacity", min: 1, suffix: "people" }, validators: [workshopCapacityValidator] },
              ] },
              break: { nodes: [
                { kind: "field", id: "label", type: "text", props: { label: "Break label", required: true } },
                { kind: "field", id: "durationMinutes", type: "number", props: { label: "Duration", min: 5, suffix: "minutes" }, validators: [agendaDurationValidator] },
              ] },
            },
          }],
        },
        {
          id: "tickets",
          when: ({ value }) => value.launch.basics.accessModel === "paid",
          nodes: [
            { kind: "field", id: "currency", type: "choice", props: { label: "Currency", required: true, options: [
              { value: "CHF", label: "Swiss franc (CHF)" }, { value: "EUR", label: "Euro (EUR)" }, { value: "USD", label: "US dollar (USD)" },
            ] } },
            { kind: "collection", id: "tiers", min: 1, max: 4, itemKey: (item) => typeof item === "object" && item !== null && "id" in item ? String(item.id) : "invalid", validators: [ticketsValidator], nodes: [
              { kind: "field", id: "name", type: "text", props: { label: "Tier name", required: true } },
              { kind: "field", id: "price", type: "money", props: { label: "Price", currency: "CHF", locale: "en-CH", min: 0.01, step: 0.01 }, deriveProps: ({ value, context }) => ({ currency: value.launch.tickets.currency || context.currency, locale: context.locale }) },
              { kind: "field", id: "quantity", type: "number", props: { label: "Quantity", min: 1, suffix: "tickets" } },
            ] },
          ],
        },
        ...(includeCompliance ? [{
          id: "compliance",
          nodes: [{ kind: "field" as const, id: "dataProcessingAccepted", type: "checkbox" as const, props: { label: "I accept the organization data-processing agreement", required: true }, validators: [complianceRequiredValidator] }],
        }] : []),
        {
          id: "review",
          nodes: [
            { kind: "field", id: "termsAccepted", type: "checkbox", props: { label: "I accept the publishing terms", required: true }, validators: [reviewTermsValidator] },
            { kind: "field", id: "confirmation", type: "text", props: { label: "Confirm the event title", required: true }, deriveProps: ({ value, context }) => ({ label: `${context.messages.confirmationPrefix} ${value.launch.basics.identity.title}` }), validators: [reviewConfirmationValidator] },
          ],
        },
      ],
    }],
  };
}

export function createEventLaunchSchema(): StagesSchemaFactory<EventLaunchValue, EventLaunchFields, EventLaunchContext> {
  return ({ context }) => schemaFor(context.requiresDataProcessingAgreement);
}
