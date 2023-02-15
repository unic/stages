const config = {
    fields: (data) => {
        return [
            {
                id: "program",
                label: "Program",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "sport",
                        label: "Sport",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "time",
                        label: "Time",
                        type: "text",
                        isRequired: true
                    }
                ]
            }
        ];
    }
};

export default config;