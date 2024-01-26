const layoutingConfig = [
  { id: "text", type: "text", label: "Field" },
  {
    id: "group",
    type: "group",
    fields: [
      {
        id: "heading",
        type: "heading",
        title: "Heading",
        blockWidth: { desktop: "medium" },
        level: 3,
        text: "This is an example to demonstrate how to layout a form by using groups and block widths.",
      },
      {
        id: "group",
        type: "group",
        fields: [
          {
            id: "field2",
            label: "Field 2",
            type: "text",
            isRequired: true,
            blockWidth: {
              desktop: "large",
              tablet: "large",
              mobile: "large",
            },
          },
          { id: "text", type: "text", label: "Field" },
        ],
        blockWidth: { desktop: "medium" },
      },
    ],
  },
];

export default layoutingConfig;
