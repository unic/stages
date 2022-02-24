const config = {
    fields: (data) => {
        return [
            {
                id: "uploads",
                label: "Anhänge",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "upload",
                        label: "Anhang",
                        secondaryText: "Lorem ipsum dolor sit amet",
                        type: "text",
                        isRequired: false
                    }
                ]
            }
        ];
    }
};

export default config;