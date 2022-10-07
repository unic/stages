import axios from "axios";

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
    fields: (data, asyncData) => {
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
                isRequired: true,
                cleanUp: value => value.trim(),
                validateOn: ({ data, fieldIsDirty, fieldConfig }) => data && data.length > 5 ? ["change", "blur", "action"] : ["blur", "action"],
                customValidation: ({ data, allData, isValid }) => {
                    if (isValid && data.length % 2 === 1) return "UNEVEN";
                    return isValid;
                }
            },
            {
                id: "city",
                label: "City",
                type: "text",
                isRequired: true,
                validateOn: data.city && data.city.length > 5 ? ["change", "blur", "action"] : ["blur", "action"],
                customValidation: ({ data, allData, isValid }) => {
                    if (isValid && data.length % 2 === 1) return "UNEVEN";
                    return isValid;
                }
            },
            {
                id: "city2",
                label: "City on Blur validated",
                type: "text",
                isRequired: true,
                validateOn: ["blur", "action"],
                customValidation: ({ data, allData, isValid }) => isValid && data.length % 2 === 1
            },
            {
                id: "collection1",
                type: "collection",
                fields: [
                    {
                        id: "field1",
                        label: "Field 1",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "field2",
                        label: "Field 2",
                        type: "text",
                        isRequired: false
                    }
                ]
            },
            {
                id: "q1",
                label: "Question 1: What is biggest?",
                options: [
                    { value: "a", text: "Earth" },
                    { value: "b", text: "Moon" },
                    { value: "c", text: "Sun" } // correct
                ],
                type: "radio",
                isRequired: true,
                isDisabled: !!data.q1
            }
        ];
    }
};

export default config;