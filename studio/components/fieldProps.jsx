const globalFieldProps = {
    id: {
        id: "id",
        type: "text",
        label: "ID",
        isRequired: true,
        isDisabled: true
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
    group: [
        globalFieldProps.id,
    ],
    collection: [
        globalFieldProps.id,
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
        globalFieldProps.tooltip,
        globalFieldProps.textValidation
    ],
    textarea: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.tooltip,
        globalFieldProps.autoResize
    ],
    select: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
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
        globalFieldProps.isRequired
    ],
    switch: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    number: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    rating: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    buttons: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.options
    ],
    slider: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    toggle: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    editor: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
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
        globalFieldProps.isRequired
    ],
    mask: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    password: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
};

export default fieldProps;