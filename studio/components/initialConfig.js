const initialConfig = [
    {
        id: "username",
        label: "Username",
        type: "text",
        isRequired: true
    },
    {
        id: "divider1",
        type: "divider"
    },
    {
        id: "email",
        label: "Email",
        type: "email",
        isRequired: true
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
                isRequired: true
            },
            {
                id: "password2",
                label: "Repeat Password",
                type: "password",
                isRequired: true
            },
        ]
    },
    {
        id: "divider2",
        type: "divider"
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
                isRequired: true
            },
            {
                id: "rating",
                label: "Rating",
                type: "rating",
                isRequired: false
            },
        ]
    },
    {
        id: "divider3",
        type: "divider"
    },
    {
        id: "comments",
        label: "Comments",
        type: "textarea",
        isRequired: false
    },
];

export default initialConfig;