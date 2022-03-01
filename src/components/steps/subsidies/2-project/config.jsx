const config = locale => {
    return {
        fields: (data) => {
            return [
                {
                    id: "topic",
                    label: "Handlungsfeld/Thema des Projekts",
                    type: "text",
                    isRequired: true
                },
                {
                    id: "projectTitle",
                    label: "Titel des Projekts",
                    type: "text",
                    isRequired: true
                },
                {
                    id: "fromDate",
                    label: "Projektstart",
                    type: "date",
                    isRequired: true
                },
                {
                    id: "toDate",
                    label: "Projektabschluss",
                    type: "date",
                    isRequired: true
                },
                {
                    id: "initialSituation",
                    label: "Ausgangslage",
                    type: "textarea",
                    isRequired: true
                },
                {
                    id: "descriptionAndProcedure",
                    label: "Beschreibung und Vorgehen",
                    type: "textarea",
                    isRequired: true
                },
                {
                    id: "requirements",
                    label: "Bedarf",
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
                    type: "textarea",
                    isRequired: true
                }
            ];
        }
    }
};

export default config;