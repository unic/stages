import {
  nodeEvent,
  type FieldDefinition,
  type NodeAddress,
  type StagesController,
  type StagesSchema,
} from "@stages/core";

interface TextProps {
  readonly label: string;
}

const text = {
  view: "text",
  initialValue: "",
  reduce: ({ event }) => event.name === "input" && typeof event.payload === "string"
    ? { value: event.payload }
    : undefined,
} satisfies FieldDefinition<string, TextProps, "text">;

const fields = { text } as const;

interface ProfileForm {
  profile: {
    displayName: string;
    location: { city: string };
  };
}

// source:start group-schema
export const profileSchema = {
  id: "profile-editor",
  version: 1,
  nodes: [{
    kind: "group",
    id: "profile",
    nodes: [
      {
        kind: "field",
        id: "displayName",
        type: "text",
        props: { label: "Display name" },
      },
      {
        kind: "group",
        id: "location",
        disabled: ({ value }) => value.profile.displayName === "",
        nodes: [{
          kind: "field",
          id: "city",
          type: "text",
          props: { label: "City" },
        }],
      },
    ],
  }],
} as const satisfies StagesSchema<ProfileForm, typeof fields>;
// source:end group-schema

interface Member {
  id: string;
  name: string;
}

interface TeamForm {
  members: Member[];
}

// source:start homogeneous-collection
export const teamSchema = {
  id: "team-editor",
  version: 1,
  nodes: [{
    kind: "collection",
    id: "members",
    min: 1,
    max: 12,
    nodes: [{
      kind: "field",
      id: "name",
      type: "text",
      props: { label: "Member name" },
    }],
  }],
} as const satisfies StagesSchema<TeamForm, typeof fields>;
// source:end homogeneous-collection

const membersAddress = [{ kind: "node", id: "members" }] as const;

// source:start collection-events
export function editMembers(
  controller: StagesController<TeamForm, typeof fields>,
  rowAddress: NodeAddress,
) {
  controller.dispatch(nodeEvent("collection:add", membersAddress, {
    payload: { value: { id: "member-9", name: "Lin" }, index: 1 },
  }));
  controller.dispatch(nodeEvent("collection:replace", rowAddress, {
    payload: { value: { id: "member-7", name: "Grace" } },
  }));
  controller.dispatch(nodeEvent("collection:duplicate", rowAddress));
  controller.dispatch(nodeEvent("collection:move", rowAddress, {
    payload: { to: 0 },
  }));
  controller.dispatch(nodeEvent("collection:sort", membersAddress, {
    payload: { order: [1, 0, 2] },
  }));
  controller.dispatch(nodeEvent("collection:remove", rowAddress));
}
// source:end collection-events

// source:start collection-identity
export const engineKeySchema = teamSchema;

export const domainKeySchema = {
  ...teamSchema,
  id: "domain-keyed-team",
  nodes: [{
    ...teamSchema.nodes[0],
    // Use a durable domain ID, not the row's current array index.
    itemKey: item => (item as Member).id,
  }],
} as const satisfies StagesSchema<TeamForm, typeof fields>;
// source:end collection-identity

type Contact =
  | { id: string; kind: "person"; name: string; email: string }
  | { id: string; kind: "company"; legalName: string };

interface ContactsForm {
  contacts: Contact[];
}

// source:start discriminated-collection
export const contactsSchema = {
  id: "contacts-editor",
  version: 1,
  nodes: [{
    kind: "collection",
    id: "contacts",
    discriminator: "kind",
    itemKey: item => (item as Contact).id,
    variants: {
      person: {
        nodes: [
          { kind: "field", id: "name", type: "text", props: { label: "Name" } },
          { kind: "field", id: "email", type: "text", props: { label: "Email" } },
        ],
      },
      company: {
        nodes: [{
          kind: "field",
          id: "legalName",
          type: "text",
          props: { label: "Legal name" },
        }],
      },
    },
  }],
} as const satisfies StagesSchema<ContactsForm, typeof fields>;

export function addPerson(
  controller: StagesController<ContactsForm, typeof fields>,
) {
  controller.dispatch(nodeEvent("collection:add", [
    { kind: "node", id: "contacts" },
  ], {
    payload: {
      value: { id: "contact-12", kind: "person", name: "Ada", email: "ada@example.com" },
    },
  }));
}
// source:end discriminated-collection

interface OnboardingForm {
  allowReview: boolean;
  onboarding: {
    account: { name: string };
    profile: { bio: string };
    review: Record<string, never>;
  };
}

// source:start wizard-schema
export const onboardingSchema = {
  id: "onboarding",
  version: 1,
  nodes: [{
    kind: "wizard",
    id: "onboarding",
    initialStage: "account",
    navigation: {
      validateCurrent: true,
      nonLinear: true,
      guard: (value, _from, to) => to !== "review" || value.allowReview,
    },
    stages: [
      {
        id: "account",
        nodes: [{
          kind: "field",
          id: "name",
          type: "text",
          props: { label: "Account name" },
          validators: [{
            id: "account.name.required",
            on: "submit",
            validate: ({ fieldValue, path }) => fieldValue === ""
              ? [{ id: "account.name.required", code: "required", path, severity: "error" }]
              : [],
          }],
        }],
      },
      {
        id: "profile",
        nodes: [{
          kind: "field",
          id: "bio",
          type: "text",
          props: { label: "Biography" },
        }],
      },
      { id: "review", when: ({ value }) => value.allowReview, nodes: [] },
    ],
  }],
} as const satisfies StagesSchema<OnboardingForm, typeof fields>;
// source:end wizard-schema

const wizardAddress = [{ kind: "node", id: "onboarding" }] as const;
const accountStageAddress = [
  ...wizardAddress,
  { kind: "node", id: "account" },
] as const;

// source:start wizard-navigation
export async function validateAndAdvance(
  controller: StagesController<OnboardingForm, typeof fields>,
) {
  // `validateCurrent` reads cached status, so validate the stage explicitly.
  const result = await controller.validate({
    scope: { address: accountStageAddress },
    event: "submit",
    reveal: true,
  });

  if (result.status === "valid") {
    controller.dispatch(nodeEvent("wizard:next", wizardAddress));
  }
}

export function openReview(
  controller: StagesController<OnboardingForm, typeof fields>,
) {
  controller.dispatch(nodeEvent("wizard:go", wizardAddress, {
    payload: { stage: "review" },
  }));
}
// source:end wizard-navigation

interface PortfolioForm {
  organization: {
    projects: Array<{
      id: string;
      onboarding: {
        basics: { details: { title: string } };
        team: { roster: { members: Member[] } };
      };
    }>;
  };
}

// source:start recursive-structure
export const portfolioSchema = {
  id: "portfolio",
  version: 1,
  nodes: [{
    kind: "group",
    id: "organization",
    nodes: [{
      kind: "collection",
      id: "projects",
      itemKey: item => (item as PortfolioForm["organization"]["projects"][number]).id,
      nodes: [{
        kind: "wizard",
        id: "onboarding",
        stages: [
          {
            id: "basics",
            nodes: [{
              kind: "group",
              id: "details",
              nodes: [{ kind: "field", id: "title", type: "text", props: { label: "Title" } }],
            }],
          },
          {
            id: "team",
            nodes: [{
              kind: "group",
              id: "roster",
              nodes: [{
                kind: "collection",
                id: "members",
                itemKey: item => (item as Member).id,
                nodes: [{ kind: "field", id: "name", type: "text", props: { label: "Name" } }],
              }],
            }],
          },
        ],
      }],
    }],
  }],
} as const satisfies StagesSchema<PortfolioForm, typeof fields>;

export const memberNamePath = [
  "organization", "projects", 0, "onboarding", "team", "roster", "members", 0, "name",
] as const;

export const memberNameAddress = [
  { kind: "node", id: "organization" },
  { kind: "node", id: "projects" },
  { kind: "row", id: "project-7" },
  { kind: "node", id: "onboarding" },
  { kind: "node", id: "team" },
  { kind: "node", id: "roster" },
  { kind: "node", id: "members" },
  { kind: "row", id: "member-3" },
  { kind: "node", id: "name" },
] as const;
// source:end recursive-structure
