const config = {
    fields: (data) => {
        return [
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
                id: "password",
                label: "Password",
                type: "password",
                isRequired: true
            },
            {
                id: "signedIn",
                label: "eingelloged bleiben?",
                type: "checkbox"
            },
            {
                id: "duration",
                label: "Cookie löschen nach",
                type: "select",
                options: [
                    { value: "", text: "Bitte wählen ..." },
                    { value: "7", text: "1 Woche" },
                    { value: "31", text: "1 Monat" },
                    { value: "365", text: "1 Jahr" }
                ]
            },
            {
                id: "onTheRadio",
                label: "What song?",
                type: "radio",
                options: [
                    { value: "", text: "Bitte wählen ..." },
                    { value: "A", text: "Lose Yourself" },
                    { value: "B", text: "Stan" },
                    { value: "C", text: "8 Mile" }
                ]
            }
        ];
    }
};

export default config;