const config = locale => {
    return {
        fields: (data) => {
            return [
                {
                    id: "projectIncome",
                    label: "Projekteinnnahmen",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    min: 1,
                    max: 1,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "total",
                            label: "Total",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        },
                    ]
                },
                {
                    id: "echSubvention",
                    label: "Beantragte Subvention EnergieSchweiz",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    min: 1,
                    max: 1,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "percentageOfTotalCosts",
                            label: "Anteil Subvention ECH an den Gesamtkosten (%)",
                            type: "number",
                            isRequired: false,
                            isDisabled: true
                        },
                        {
                            id: "total",
                            label: "Total",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        }
                    ]
                },
                {
                    id: "governmentFunding",
                    label: "Weitere Bundesmittel",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    min: 1,
                    max: 1,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "origin",
                            label: "Herkunft der Bundesmittel",
                            type: "text",
                            isRequired: false
                        },
                        {
                            id: "total",
                            label: "Total (CHF)",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        }
                    ]
                },
                {
                    id: "furtherFundings",
                    label: "Weitere Förderbeiträge (Kantone, Gemeinden, Hochschulen, Unternehmen)",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "origin",
                            label: "Herkunft des Förderbeitrags",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "total",
                            label: "Total (CHF)",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        }
                    ]
                },
                {
                    id: "ownResources",
                    label: "Finanzielle Eigenleitstungen",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    min: 1,
                    max: 1,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "total",
                            label: "Total (CHF)",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        }
                    ]
                },
                {
                    id: "unpaidOwnContributions",
                    label: "Unentgeltliche Eigenleistungen",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    min: 1,
                    max: 1,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "total",
                            label: "Total (CHF)",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        }
                    ]
                },
                {
                    id: "thirdPartyContributions",
                    label: "Unentgeltliche Leistungen Dritter",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    min: 1,
                    max: 1,
                    fields: [
                        {
                            id: "firstYear",
                            label: "Kalenderjahr 1 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "secondYear",
                            label: "Kalenderjahr 2 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "thirdYear",
                            label: "Kalenderjahr 3 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "fourthYear",
                            label: "Kalenderjahr 4 (CHF)",
                            type: "number",
                            isRequired: false
                        },
                        {
                            id: "total",
                            label: "Total (CHF)",
                            type: "number",
                            isRequired: false,
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                let result = 0;
                                if (itemData.firstYear) result = result + Number(itemData.firstYear);
                                if (itemData.secondYear) result = result + Number(itemData.secondYear);
                                if (itemData.thirdYear) result = result + Number(itemData.thirdYear);
                                if (itemData.fourthYear) result = result + Number(itemData.fourthYear);
                                return result !== 0 ? result : "";
                            }
                        }
                    ]
                },
                {
                    id: "restMoney",
                    label: "Ungedeckter Restbetrag",
                    type: "number",
                    isRequired: false,
                    isDisabled: true
                },
                {
                    id: "paymentPlan",
                    label: "Zahlungsplan",
                    type: "collection",
                    isRequired: false,
                    init: true,
                    fields: [
                        {
                            id: "date",
                            placeholder: "Datum",
                            type: "date",
                            isRequired: false
                        },
                        {
                            id: "description",
                            placeholder: "Beschreibung/Meilenstein",
                            type: "text",
                            isRequired: false
                        },
                        {
                            id: "amount",
                            placeholder: "Betrag (CHF)",
                            type: "number",
                            isRequired: false
                        }
                    ]
                },
                {
                    id: "justification",
                    label: "Begründung der nicht wirtschaftlichen Tragfähigkeit",
                    type: "textarea",
                    isRequired: true
                }
            ];
        }
    }
};

export default config;