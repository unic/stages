const interfaceStateConfig = [
  {
    id: "heading1",
    type: "heading",
    title: "Sign Up",
    text: "This is an example sign up form.",
  },
  {
    id: "name",
    label: "Project Name",
    type: "text",
    isRequired: true,
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "divider3",
    type: "divider",
  },
  {
    id: "showAdvanced",
    type: "checkbox",
    label: "Advanced Options",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    isInterfaceState: true,
  },
  {
    id: "advanced",
    type: "group",
    fields: [
      {
        id: "opt1",
        label: "Advanced Option 1",
        type: "text",
        blockWidth: {
          desktop: "medium",
          tablet: "medium",
          mobile: "large",
        },
      },
      {
        id: "opt2",
        label: "Advanced Option 2",
        type: "text",
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
    isRendered: "!!interfaceState.showAdvanced",
  },
];

export default interfaceStateConfig;
