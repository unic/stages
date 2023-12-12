const initialConfig = [
    {
        id: "username",
        label: "Username",
        type: "text",
        isRequired: true
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
        id: "hobbies",
        type: "collection",
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
        id: "comments",
        label: "Comments",
        type: "textarea",
        isRequired: false
    },
];

export default initialConfig;