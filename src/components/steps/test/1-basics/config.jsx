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
                id: "country",
                label: "Country",
                type: "select",
                options: [
                    { value: "", text: "Bitte wählen ..." },
                    { value: "CH", text: "Switzerland" },
                    { value: "DE", text: "Germany" },
                    { value: "AT", text: "Austria" }
                ],
                clearFields: ["postalcode", "city"]
            },
            {
                id: "postalcode",
                label: "Postalcode",
                type: "text",
                isRequired: true
            },
            {
                id: "city",
                label: "City",
                type: "text",
                isRequired: true
            },
            {
                id: "username",
                label: "Username",
                type: "text",
                isRequired: true
            }
        ];
    }
};

export default config;