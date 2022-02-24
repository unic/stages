const config = {
    fields: (data) => {
        return [
            {
                id: "topic",
                label: "Handlungsfeld/Thema des Projekts",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "text",
                isRequired: true
            },
            {
                id: "projectTitle",
                label: "Titel des Projekts",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "text",
                isRequired: true
            },
            {
                id: "fromDate",
                label: "Projektstart",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "date",
                isRequired: true
            },
            {
                id: "toDate",
                label: "Projektabschluss",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "date",
                isRequired: true
            },
            {
                id: "initialSituation",
                label: "Ausgangslage",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "textarea",
                isRequired: true
            },
            {
                id: "descriptionAndProcedure",
                label: "Beschreibung und Vorgehen",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "textarea",
                isRequired: true
            },
            {
                id: "requirements",
                label: "Bedarf",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "textarea",
                isRequired: true
            },
            {
                id: "goals",
                label: "Projektziele und Messung",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "goal",
                        placeholder: "Projektziel (Outputs) *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "successIndicator",
                        placeholder: "Messen der Projektzielerreichung (Erfolgsindikatoren) *",
                        type: "text",
                        isRequired: true
                    }
                ]
            },
            {
                id: "impactsAndMeasurements",
                label: "Projektwirkungen und Messung",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "impact",
                        placeholder: "Projektwirkungen (Outcomes und Impacts) *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "successIndicator",
                        placeholder: "Messen der Projektwirkung *",
                        type: "text",
                        isRequired: true
                    }
                ]
            },
            {
                id: "targetGroups",
                label: "Zielgruppen",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "group",
                        placeholder: "Zielgruppe *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "groupIdentification",
                        placeholder: "Ansprache der zielgruppe *",
                        type: "text",
                        isRequired: true
                    }
                ]
            },
            {
                id: "regionCoverage",
                label: "Regionale Abdeckung",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "checkBoxGroup",
                options: [
                    { value: "CH_DE", text: "Deutschschweiz" },
                    { value: "CH_FR", text: "Westschweiz" },
                    { value: "CH_IT", text: "Italienischsprachige Schweiz" }
                ]
            },
            {
                id: "services",
                label: "Leistungen",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "textarea",
                isRequired: true
            }
        ];
    }
};

export default config;