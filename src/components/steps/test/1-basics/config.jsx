const addressConfig = {
    fields: () => {
        return [
            {
                id: "prename",
                label: "Prename",
                type: "text",
                isRequired: true
            },
            {
                id: "lastname",
                label: "Lastname",
                type: "text",
                isRequired: true
            },
        ];
    }
};

const AddressRender = ({ fields }) => {
    return (
        <div>
            {fields.prename}
            <br />
            {fields.lastname}
        </div>
    );
};

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
                id: "address",
                type: "subform",
                config: addressConfig,
                render: AddressRender,
                isRequired: true,
                isDisabled: false
            },
            {
                id: "onlyNumbers",
                label: "Only numbers",
                type: "text",
                filter: value => value.replace(/\D/g,'')
            },
            {
                id: "signedIn",
                label: "eingelloged bleiben?",
                type: "checkbox"
            },
            {
                id: "test",
                type: "dummy",
                customValidation: ({ allData }) => {
                    return allData.onlyNumbers || allData.signedIn;
                },
                errorRenderer: (error) => <div style={{ color: "#f30" }}>Please fill out at least one of the fields "Only numbers" or "signed in".</div>,
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
            },
            {
                id: "maths",
                label: "Maths",
                type: "collection",
                init: true,
                min: 2,
                max: 5,
                fields: [
                    {
                        id: "factor1",
                        label: "Factor 1",
                        type: "text",
                        filter: value => value.replace(/\D/g,'')
                    },
                    {
                        id: "factor2",
                        label: "Factor 2",
                        type: "number"
                    },
                    {
                        id: "result",
                        label: "Result of Factor 1 x Factor 2",
                        type: "number",
                        isDisabled: true,
                        computedValue: (data, itemData) => {
                            let result = 0;
                            if (itemData.factor1 && itemData.factor2) {
                                result = Number(itemData.factor1) * Number(itemData.factor2);
                            }
                            return result !== 0 ? result : "";
                        }
                    }
                ]
            }
        ];
    }
};

export default config;