const initialConfig = [
    {
        id: "textgroup",
        type: "group",
        fields: [  
            {
                id: "field1",
                label: "Text 1",
                type: "text",
                isRequired: true
            },
            {
                id: "field2",
                label: "Text 2",
                type: "text",
                isRequired: true
            },
        ]
    },
    {
        id: "textcollection",
        type: "collection",
        min: 1,
        init: true,
        fields: [  
            {
                id: "field1",
                label: "Text 1",
                type: "text",
                isRequired: true
            },
            {
                id: "field2",
                label: "Text 2",
                type: "text",
                isRequired: true
            },
        ]
    },
    {
        id: "field2",
        label: "Textarea",
        type: "textarea",
        isRequired: true
    },
    {
        id: "field3",
        label: "Select",
        type: "select",
        options: [
            {
                text: "Option 1",
                value: "option1"
            },
            {
                text: "Option 2",
                value: "option2"
            }
        ],
        isRequired: true
    },
    {
        id: "field4",
        label: "Calendar",
        type: "calendar",
        isRequired: true
    },
    {
        id: "field5",
        label: "Checkbox",
        type: "checkbox",
        isRequired: true
    },
    {
        id: "field6",
        label: "Switch",
        type: "switch",
        isRequired: true
    },
    {
        id: "field7",
        label: "Number",
        type: "number",
        isRequired: true
    },
    {
        id: "field8",
        label: "Rating",
        type: "rating",
        isRequired: true
    },
    {
        id: "field9",
        label: "Buttons",
        type: "buttons",
        options: [
            {
                text: "Option 1",
                value: "option1"
            },
            {
                text: "Option 2",
                value: "option2"
            }
        ],
        isRequired: true
    },
    {
        id: "field10",
        label: "Slider",
        type: "slider",
        isRequired: true
    },
    {
        id: "field11",
        label: "Toggle",
        type: "toggle",
        isRequired: true
    },
    {
        id: "field12",
        label: "Editor",
        type: "editor",
        isRequired: true
    },
    {
        id: "field13",
        label: "Chips",
        type: "chips",
        isRequired: true
    },
    {
        id: "field14",
        label: "Color",
        type: "color",
        isRequired: true
    },
    {
        id: "field15",
        label: "Mask",
        type: "mask",
        mask: "99-999999",
        isRequired: true
    },
    {
        id: "field16",
        label: "Password",
        type: "password",
        isRequired: true
    }
];

export default initialConfig;