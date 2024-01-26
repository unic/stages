const templatingConfig = [
  {
    id: "heading",
    type: "heading",
    title: "Team Registration",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    level: 2,
    text: "Add your team members and than submit them for registration",
  },
  {
    id: "eventName",
    type: "text",
    label: "Event Name",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    isRequired: true,
  },
  { id: "divider", type: "divider" },
  {
    id: "members",
    type: "collection",
    init: true,
    min: 1,
    fields: [
      {
        id: "name",
        label: "Name",
        type: "text",
        isRequired: true,
        blockWidth: {
          desktop: "medium",
          tablet: "medium",
          mobile: "large",
        },
      },
      {
        id: "email",
        label: "Email",
        type: "text",
        isRequired: true,
        blockWidth: {
          desktop: "medium",
          tablet: "medium",
          mobile: "large",
        },
      },
    ],
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    label: "Members",
    secondaryText: "Add team menbers",
  },
  { id: "divider2", type: "divider" },
  {
    id: "summary",
    type: "group",
    fields: [
      {
        id: "heading",
        type: "heading",
        title: "Summary",
        blockWidth: {
          desktop: "medium",
          mobile: "large",
          tablet: "large",
        },
        level: 3,
        text: `Click submit to register team members {{#members}}{{name}}, {{/members}}{{^members}}(fill in above){{/members}} to your {{eventName}}{{^eventName}}No Name{{/eventName}} event.`,
      },
      {
        id: "comments",
        label: "Comments",
        type: "textarea",
        blockWidth: {
          desktop: "medium",
          tablet: "medium",
          mobile: "large",
        },
        autoResize: true,
      },
    ],
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "group",
    type: "group",
    fields: [
      {
        id: "group",
        type: "group",
        blockWidth: {
          desktop: "medium",
          mobile: "large",
          tablet: "large",
        },
      },
    ],
  },
];

export default templatingConfig;