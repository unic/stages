const config = locale => {
    return {
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
                            type: "text",
                            isRequired: false
                        }
                    ]
                }
            ];
        }
    }
};

export default config;