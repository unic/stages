const initialConfig = [
  {
    id: "heading1",
    type: "heading",
    title: "Sign Up",
    text: "This is an example sign up form.",
  },
  {
    id: "username",
    label: "Username",
    type: "text",
    isRequired: true,
  },
  {
    id: "passwords",
    type: "group",
    label: "Passwords",
    secondaryText: "Must be at least 8 characters.",
    fields: [
      {
        id: "password1",
        label: "Password",
        type: "password",
        isRequired: true,
        blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" },
      },
      {
        id: "password2",
        label: "Repeat Password",
        type: "password",
        isRequired: true,
        blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" },
      },
    ],
  },
  {
    id: "divider2",
    type: "divider",
  },
  {
    id: "hobbies",
    type: "collection",
    label: "Hobbies",
    secondaryText: "List and rate your hobbies.",
    min: 1,
    init: true,
    fields: [
      {
        id: "name",
        label: "Name",
        type: "text",
        isRequired: true,
        blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" },
      },
      {
        id: "rating",
        label: "Rating",
        type: "rating",
        isRequired: false,
        blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" },
      },
    ],
  },
  {
    id: "divider3",
    type: "divider",
  },
  {
    id: "comments",
    label: "Comments",
    type: "textarea",
    isRequired: false,
  },
  {
    id: "divider4",
    type: "divider",
  },
  {
    id: "summed",
    type: "group",
    label: "Computed Data Example",
    secondaryText: "Summing the first two inputs.",
    fields: [
      {
        id: "num1",
        label: "Number 1",
        type: "number",
        defaultValue: 0,
        isRequired: true,
        blockWidth: { desktop: "small", tablet: "small", mobile: "large" },
      },
      {
        id: "num2",
        label: "Number 2",
        type: "number",
        defaultValue: 0,
        isRequired: true,
        blockWidth: { desktop: "small", tablet: "small", mobile: "large" },
      },
      {
        id: "sum",
        label: "Sum",
        type: "number",
        defaultValue: 0,
        isDisabled: true,
        computedValue: "data.summed ? data.summed.num1 + data.summed.num2 : 0",
        blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" },
      },
    ],
  },
];

export default initialConfig;
