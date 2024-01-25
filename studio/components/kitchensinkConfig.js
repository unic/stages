const kitchensinkConfig = [
  {
    id: "heading2",
    type: "heading",
    title: "Field Kitchensink",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    level: 2,
  },
  {
    id: "divider",
    type: "divider",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    align: "center",
    layout: "horizontal",
    borderType: "dashed",
    text: "Visual Elements",
  },
  {
    id: "heading",
    type: "heading",
    title: "Heading",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    level: 2,
    text: "A heading with an optional text.",
  },
  {
    id: "message",
    type: "message",
    text: "An info message with a severity level.",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    severity: "info",
  },
  {
    id: "divider2",
    type: "divider",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    align: "center",
    layout: "horizontal",
    borderType: "dashed",
    text: "Prime React Fields",
  },
  {
    id: "text",
    type: "text",
    label: "Text",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "textarea",
    type: "textarea",
    label: "Textarea",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "select",
    type: "select",
    label: "Select",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    options: [
      {
        text: "Audi",
        value: "audi",
      },
      {
        value: "bmw",
        text: "BMW",
      },
      {
        value: "ferrari",
        text: "Ferrari",
      },
      {
        value: "honda",
        text: "Honda",
      },
    ],
    placeholder: "Please select ...",
  },
  {
    id: "multiselect",
    type: "multiselect",
    label: "Multi Select",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    options: [
      {
        text: "Audi",
        value: "audi",
      },
      {
        value: "bmw",
        text: "BMW",
      },
      {
        value: "ferrari",
        text: "Ferrari",
      },
      {
        value: "honda",
        text: "Honda",
      },
    ],
    placeholder: "Please select ...",
  },
  {
    id: "calendar",
    type: "calendar",
    label: "Calendar",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "checkbox",
    type: "checkbox",
    label: "Checkbox",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "switch",
    type: "switch",
    label: "Switch",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "number",
    type: "number",
    label: "Number",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    format: true,
    useGrouping: true,
  },
  {
    id: "rating",
    type: "rating",
    label: "Rating",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    cancel: true,
    stars: 5,
  },
  {
    id: "buttons",
    type: "buttons",
    label: "Buttons",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    multiple: false,
    options: [
      {
        text: "Audi",
        value: "audi",
      },
      {
        value: "bmw",
        text: "BMW",
      },
      {
        value: "ferrari",
        text: "Ferrari",
      },
      {
        value: "honda",
        text: "Honda",
      },
    ],
  },
  {
    id: "slider",
    type: "slider",
    label: "Slider",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    max: 100,
    min: 0,
    range: false,
    step: 1,
  },
  {
    id: "toggle",
    type: "toggle",
    label: "Toggle",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "editor",
    type: "editor",
    label: "Editor",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "chips",
    type: "chips",
    label: "Chips",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
  {
    id: "color",
    type: "color",
    label: "Color Picker",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    format: "hex",
  },
  {
    id: "mask",
    type: "mask",
    label: "Input Mask",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
    mask: "99-aa-**",
  },
  {
    id: "password",
    type: "password",
    label: "Password",
    blockWidth: {
      mobile: "large",
      tablet: "large",
      desktop: "large",
    },
  },
];

export default kitchensinkConfig;