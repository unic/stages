const globalFieldProps = {
    id: {
        id: "id",
        type: "blurtext",
        label: "ID",
        isRequired: true,
        filter: value => value.replace(/[^a-zA-Z0-9-]/g, '')
    },
    basicsDivider: {
        id: "basicsDivider",
        type: "divider",
        text: "Basics"
    },
    specificsDivider: {
        id: "specificsDivider",
        type: "divider",
        text: "Field Specifics"
    },
    advancedDivider: {
        id: "advancedDivider",
        type: "divider",
        text: "Advanced"
    },
    validationsDivider: {
        id: "validationsDivider",
        type: "divider",
        text: "Validations"
    },
    label: {
        id: "label",
        type: "text",
        label: "Label",
        isRequired: true,
        tooltip: "Create dynamic labels with template literals, like: My ${ field1 } is ${ field2 }",
    },
    secondaryText: {
        id: "secondaryText",
        type: "text",
        label: "Secondary Text",
        tooltip: "Create dynamic text with template literals, like: My ${ field1 } is ${ field2 }",
    },
    prefix: {
        id: "prefix",
        type: "text",
        label: "Prefix"
    },
    suffix: {
        id: "suffix",
        type: "text",
        label: "Suffix"
    },
    defaultValueText: {
        id: "defaultValue",
        type: "text",
        label: "Default Value"
    },
    defaultValueBoolean: {
        id: "defaultValue",
        type: "checkbox",
        label: "Default Value"
    },
    defaultValueNumber: {
        id: "defaultValue",
        type: "number",
        label: "Default Value"
    },
    computedValue: {
        id: "computedValue",
        type: "textarea",
        autoResize: true,
        label: "Computed Value",
        placeholder: "data => data.field1 + data.field2",
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
                value: "multiselect",
                text: "Multi Select"
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
    isInterfaceState: {
        id: "isInterfaceState",
        type: "checkbox",
        label: "Interface State?"
    },
    isRendered: {
        id: "isRendered",
        type: "textarea",
        autoResize: true,
        label: "Is Rendered?",
        placeholder: "!!data.myCheckbox",
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
        globalFieldProps.specificsDivider,
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
        globalFieldProps.specificsDivider,
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
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
    ],
    wizard: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
    ],
    stage: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
    ],
    collection: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.specificsDivider,
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
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        globalFieldProps.prefix,
        globalFieldProps.suffix,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.tooltip,
        globalFieldProps.defaultValueText,
        globalFieldProps.computedValue,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
        globalFieldProps.textValidation
    ],
    textarea: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        globalFieldProps.autoResize,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.tooltip,
        globalFieldProps.defaultValueText,
        globalFieldProps.computedValue,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
        globalFieldProps.textValidation
    ],
    select: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        globalFieldProps.options,
        {
            id: "editable",
            type: "checkbox",
            label: "Editable?"
        },
        {
            id: "showFilter",
            type: "checkbox",
            label: "Filter?"
        },
        {
            id: "showFilterClear",
            type: "checkbox",
            label: "Show Filter Clear?"
        },
        {
            id: "showClear",
            type: "checkbox",
            label: "Show Clear Icon?"
        },
        globalFieldProps.placeholder,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.defaultValueText,
        globalFieldProps.tooltip,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    multiselect: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "display",
            type: "select",
            label: "Display Type",
            options: [
                {
                    value: "comma",
                    text: "Comma"
                },
                {
                    value: "chips",
                    text: "Chips"
                }
            ]
        },
        {
            id: "showFilter",
            type: "checkbox",
            label: "Filter?"
        },
        {
            id: "inline",
            type: "checkbox",
            label: "Inline?"
        },
        {
            id: "showClear",
            type: "checkbox",
            label: "Show Clear Icon?"
        },
        {
            id: "showSelectAll",
            type: "checkbox",
            label: "Show Select All?"
        },
        {
            id: "selectionLimit",
            type: "number",
            label: "Selection Limit"
        },
        globalFieldProps.placeholder,
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.options,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    calendar: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
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
        {
            id: "hideOnDateTimeSelect",
            type: "checkbox",
            label: "Hide on Select?"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    checkbox: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "falseValue",
            type: "text",
            label: "False Value"
        },
        {
            id: "trueValue",
            type: "text",
            label: "True Value"
        },
        globalFieldProps.defaultValueBoolean,
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    switch: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "falseValue",
            type: "text",
            label: "False Value"
        },
        {
            id: "trueValue",
            type: "text",
            label: "True Value"
        },
        globalFieldProps.defaultValueBoolean,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    number: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        globalFieldProps.prefix,
        globalFieldProps.suffix,
        {
            id: "buttonLayout",
            type: "select",
            label: "Button Layout",
            options: [
                {
                    value: "horizontal",
                    text: "Horizontal"
                },
                {
                    value: "vertical",
                    text: "Vertical"
                },
                {
                    value: "stacked",
                    text: "Stacked"
                }
            ]
        },
        {
            id: "mode",
            type: "select",
            label: "Mode",
            options: [
                {
                    value: "decimal",
                    text: "Decimal"
                },
                {
                    value: "currency",
                    text: "Currency"
                }
            ]
        },
        {
            id: "currency",
            type: "text",
            label: "Currency (USD etc.)"
        },
        {
            id: "currencyDisplay",
            type: "select",
            label: "Currency Display",
            options: [
                {
                    value: "symbol",
                    text: "Symbol"
                },
                {
                    value: "code",
                    text: "Code"
                },
                {
                    value: "name",
                    text: "Name"
                }
            ]
        },
        {
            id: "format",
            type: "checkbox",
            defaultValue: true,
            label: "Format?"
        },
        {
            id: "useGrouping",
            type: "checkbox",
            defaultValue: true,
            label: "Use Grouping?"
        },
        {
            id: "max",
            type: "number",
            label: "Max Value"
        },
        {
            id: "min",
            type: "number",
            label: "Min Value"
        },
        {
            id: "maxFractionDigits",
            type: "number",
            label: "Max Fraction Digits"
        },
        {
            id: "minFractionDigits",
            type: "number",
            label: "Min Fraction Digits"
        },
        {
            id: "step",
            type: "number",
            label: "Step Increment"
        },
        globalFieldProps.placeholder,
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.defaultValueNumber,
        globalFieldProps.computedValue,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    rating: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "cancel",
            type: "checkbox",
            defaultValue: true,
            label: "Show Cancel Icon?"
        },
        {
            id: "stars",
            type: "number",
            defaultValue: 5,
            label: "Star Count"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    buttons: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        globalFieldProps.options,
        {
            id: "multiple",
            type: "checkbox",
            defaultValue: false,
            label: "Multiple?"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.options,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    slider: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "max",
            type: "number",
            defaultValue: 100,
            label: "Max Value"
        },
        {
            id: "min",
            type: "number",
            defaultValue: 0,
            label: "Min Value"
        },
        {
            id: "range",
            type: "checkbox",
            defaultValue: false,
            label: "Range?"
        },
        {
            id: "step",
            type: "number",
            defaultValue: 1,
            label: "Step Increment"
        },
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    toggle: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "onLabel",
            type: "text",
            label: "On Label"
        },
        {
            id: "offLabel",
            type: "text",
            label: "Off Label"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.defaultValueBoolean,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    editor: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "showHeader",
            type: "checkbox",
            label: "Show Header?"
        }, 
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.textValidation,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    chips: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "allowDuplicate",
            type: "checkbox",
            label: "Allow Duplicate?"
        }, 
        {
            id: "max",
            type: "number",
            label: "Max Entries"
        }, 
        {
            id: "removable",
            type: "checkbox",
            label: "Removable Items"
        }, 
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    color: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "format",
            type: "select",
            label: "Format",
            defaultValue: "hex",
            options: [
                {
                    value: "rgb",
                    text: "RGB"
                },
                {
                    value: "hex",
                    text: "Hex"
                },
                {
                    value: "hsb",
                    text: "HSB"
                }
            ]
        },
        {
            id: "inline",
            type: "checkbox",
            label: "Inline?"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    mask: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "autoClear",
            type: "checkbox",
            label: "Auto Clear?"
        },
        {
            id: "mask",
            type: "text",
            label: "Mask Pattern",
            tooltip: "For example: 99-999999"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.textValidation,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
    password: [
        globalFieldProps.basicsDivider,
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.specificsDivider,
        {
            id: "feedback",
            type: "checkbox",
            label: "Show Feedback?"
        },
        {
            id: "toggleMask",
            type: "checkbox",
            label: "Toggle Mask?"
        },
        globalFieldProps.tooltip,
        globalFieldProps.advancedDivider,
        globalFieldProps.isDisabled,
        globalFieldProps.isInterfaceState,
        globalFieldProps.textValidation,
        globalFieldProps.isRendered,
        globalFieldProps.validationsDivider,
    ],
};

export default fieldProps;