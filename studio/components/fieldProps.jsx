const globalFieldProps = {
    id: {
        id: "id",
        type: "blurtext",
        label: "ID",
        isRequired: true
    },
    label: {
        id: "label",
        type: "text",
        label: "Label",
        isRequired: true,
    },
    secondaryText: {
        id: "secondaryText",
        type: "text",
        label: "Secondary Text"
    },
    type: {
        id: "type",
        type: "select",
        label: "Type",
        isRequired: true,
        options: [
            {
                value: "text",
                text: "Textfield"
            },
            {
                value: "textarea",
                text: "Textarea"
            },
            {
                value: "select",
                text: "Select"
            },
            {
                value: "calendar",
                text: "Calendar"
            },
            {
                value: "checkbox",
                text: "Checkbox"
            },
            {
                value: "switch",
                text: "Switch"
            },
            {
                value: "number",
                text: "Number"
            },
            {
                value: "rating",
                text: "Rating"
            },
            {
                value: "buttons",
                text: "Buttons"
            },
            {
                value: "slider",
                text: "Slider"
            },
            {
                value: "toggle",
                text: "Toggle"
            },
            {
                value: "editor",
                text: "Editor"
            },
            {
                value: "chips",
                text: "Chips"
            },
            {
                value: "color",
                text: "Color"
            },
            {
                value: "mask",
                text: "Mask"
            },
            {
                value: "password",
                text: "Password"
            }
        ]
    },
    isRequired: {
        id: "isRequired",
        type: "checkbox",
        label: "Required?"
    },
    isDisabled: {
        id: "isDisabled",
        type: "checkbox",
        label: "Disabled?"
    },
    tooltip: {
        id: "tooltip",
        type: "text",
        label: "Tooltip"
    },
    options: {
        id: "options",
        type: "collection",
        label: "Options",
        min: 1,
        init: true,
        fields: [
            {
                id: "value",
                label: "Value",
                type: "text",
                isRequired: true
            },
            {
                id: "text",
                label: "Text",
                type: "text",
                isRequired: true
            }
        ]
    },
    autoResize: {
        id: "autoResize",
        type: "checkbox",
        label: "Auto resize?"
    },
    placeholder: {
        id: "placeholder",
        type: "text",
        label: "Placeholder"
    },
    textValidation: {
        id: "validation",
        type: "collection",
        label: "Validations",
        fields: {
            email: [
                {
                    id: "strong",
                    type: "checkbox",
                    label: "Strong email validation?"
                }
            ],
            phone: [
                {
                    id: "type",
                    type: "select",
                    label: "Country specific phone",
                    isRequired: true,
                    options: [
                        {
                            value: "all",
                            text: "All Country Codes"
                        },
                        {
                            value: "CH",
                            text: "Switzerland"
                        }
                    ]
                }
            ],
            regex: [
                {
                    id: "rule",
                    type: "text",
                    label: "Regex"
                }
            ],
        }
    }
}

const fieldProps = {
    heading: [
        globalFieldProps.id,
        {
            id: "title",
            type: "text",
            label: "Title",
            isRequired: true,
        },
        {
            id: "level",
            type: "select",
            label: "Level",
            defaultValue: 2,
            options: [
                {
                    value: 2,
                    text: "2"
                },
                {
                    value: 3,
                    text: "3"
                },
                {
                    value: 4,
                    text: "4"
                }
            ]
        },
        {
            id: "text",
            type: "textarea",
            label: "Text",
            isRequired: false,
        },
    ],
    divider: [
        globalFieldProps.id,
        {
            id: "text",
            type: "text",
            label: "Text",
            isRequired: false,
        },
        {
            id: "align",
            type: "select",
            label: "Text Alignment",
            defaultValue: "right",
            options: [
                {
                    value: "center",
                    text: "Center"
                },
                {
                    value: "left",
                    text: "Left"
                },
                {
                    value: "right",
                    text: "Right"
                },
                {
                    value: "top",
                    text: "Top"
                },
                {
                    value: "bottom",
                    text: "Bottom"
                }
            ]
        },
        {
            id: "layout",
            type: "select",
            label: "Layout",
            defaultValue: "horizontal",
            options: [
                {
                    value: "horizontal",
                    text: "Horizontal"
                },
                {
                    value: "vertical",
                    text: "Vertical"
                }
            ]
        },
        {
            id: "borderType",
            type: "select",
            label: "Border Type",
            defaultValue: "dashed",
            options: [
                {
                    value: "dashed",
                    text: "Dashed"
                },
                {
                    value: "dotted",
                    text: "Dotted"
                },
                {
                    value: "solid",
                    text: "Solid"
                }
            ]
        }
    ],
    group: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
    ],
    collection: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        {
            id: "init",
            type: "checkbox",
            label: "Init?"
        },
        {
            id: "min",
            type: "number",
            label: "Min entries"
        },
        {
            id: "max",
            type: "number",
            label: "Max entries"
        },
    ],
    text: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.tooltip,
        globalFieldProps.textValidation
    ],
    textarea: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.tooltip,
        globalFieldProps.autoResize,
        globalFieldProps.textValidation
    ],
    select: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.options,
        globalFieldProps.placeholder,
        globalFieldProps.tooltip
    ],
    calendar: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.tooltip,
        {
            id: "numberOfMonths",
            type: "number",
            label: "Number of Months"
        },
        {
            id: "selectionMode",
            type: "select",
            label: "Selection Mode",
            options: [
                {
                    value: "single",
                    text: "Single"
                },
                {
                    value: "range",
                    text: "Range"
                },
                {
                    value: "multiple",
                    text: "Multiple"
                }
            ]
        },
        {
            id: "inline",
            type: "checkbox",
            label: "Inline?"
        },
        {
            id: "showButtonBar",
            type: "checkbox",
            label: "Show button bar?"
        },
        {
            id: "showIcon",
            type: "checkbox",
            label: "Show icon?"
        },
        {
            id: "showTime",
            type: "checkbox",
            label: "Show time?"
        },
    ],
    checkbox: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    switch: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    number: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    rating: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    buttons: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.options
    ],
    slider: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    toggle: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    editor: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.textValidation
    ],
    chips: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    color: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
    ],
    mask: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.textValidation
    ],
    password: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.isDisabled,
        globalFieldProps.textValidation
    ],
};

export default fieldProps;