const globalFieldProps = {
    id: {
        id: "id",
        type: "text",
        label: "ID",
        isRequired: true,
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
    }
}

const fieldProps = {
    text: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.tooltip
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