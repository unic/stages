const config = {
    fields: (data) => {
        return [
            {
                id: "internalExpenses",
                label: "Interne Personalkosten",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "date",
                        placeholder: "Datum",
                        type: "date"
                    },
                    {
                        id: "milestone",
                        placeholder: "Meilenstein",
                        type: "text"
                    },
                    {
                        id: "workPackage",
                        placeholder: "Arbeitspaket",
                        type: "text"
                    },
                    {
                        id: "function",
                        placeholder: "Funktion (Mitarbeiter/in)",
                        type: "text"
                    },
                    {
                        id: "hourlyRate",
                        placeholder: "Stundensatz (CHF/h)",
                        type: "number"
                    },
                    {
                        id: "hourEffort",
                        placeholder: "Aufwand (h)",
                        type: "number"
                    },
                    {
                        id: "costs",
                        placeholder: "Kosten (CHF)",
                        type: "number",
                        isDisabled: true,
                        computedValue: (data, collection) => {
                            let total = 0;
                            if (collection.hourlyRate && collection.hourEffort) {
                                total = collection.hourlyRate * collection.hourEffort;
                            }
                            return total;
                        }
                    }
                ]
            },
            {
                id: "otherExpenses",
                label: "Übrige Kosten",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "date",
                        placeholder: "Datum",
                        type: "date"
                    },
                    {
                        id: "milestone",
                        placeholder: "Meilenstein",
                        type: "text"
                    },
                    {
                        id: "workPackage",
                        placeholder: "Arbeitspaket",
                        type: "text"
                    },
                    {
                        id: "expenseType",
                        placeholder: "Kostenart",
                        type: "select",
                        options: [
                            { value: "donation", text: "Spende" }
                        ]
                    },
                    {
                        id: "derivation",
                        placeholder: "Herleitung der Kosten",
                        type: "text"
                    },
                    {
                        id: "expenses",
                        placeholder: "Kosten (CHF)",
                        type: "number"
                    }
                ]
            },
            {
                id: "total",
                label: "Total anrechenbare Projektkosten",
                secondaryText: "Lorem ipsum dolor sit amet",
                type: "number",
                isDisabled: true,
                required: true,
                computedValue: (data, collection) => {
                    let total = 0;
                    if (data.internalExpenses) {
                        data.internalExpenses.forEach(cost => {
                            if (cost.costs) total = total + Number(cost.costs);
                        });
                    }
                    if (data.otherExpenses) {
                        data.otherExpenses.forEach(cost => {
                            if (cost.expenses) total = total + Number(cost.expenses);
                        });
                    }
                    return total;
                }
            }
        ];
    }
};

export default config;