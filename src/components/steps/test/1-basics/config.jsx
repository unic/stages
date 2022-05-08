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
            },
            {
                id: "meals",
                type: "collection",
                isRequired: true,
                init: "food",
                fields: {
                    food: [
                        {
                            id: "name",
                            label: "Food Name",
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "calories",
                            label: "Calories",
                            type: "text"
                        }
                    ],
                    drink: [
                        {
                            id: "name",
                            label: "Drink Name",
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "alcohol",
                            label: "Alcohol Percentage",
                            type: "text"
                        },
                        {
                            id: "fullName",
                            label: "Full Name",
                            type: "text",
                            isDisabled: true,
                            computedValue: (data, itemData) => {
                                return `${itemData.name} ${itemData.alcohol}%`;
                            }
                        }
                    ]
                }
            }
        ];
    }
};

export default config;