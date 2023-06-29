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
    asyncDataLoader: async () => {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
        return {
            posts: response && response.data || []
        };
    },
    fieldConfigs: {
        coordinates: (data, asyncData) => {
            return {
                id: "coords",
                type: "group",
                fields: [
                    {
                        id: "lng",
                        label: "Longitude",
                        type: "text"
                    },
                    {
                        id: "lat",
                        label: "Latitude",
                        type: "text"
                    }
                ]
            };
        }
    }, 
    fields: (data, asyncData, interfaceState) => {
        const posts = asyncData && asyncData.posts ? asyncData.posts.map(item => {
            return {
                value: item.id,
                text: item.title
            };
        }) : [];
        posts.unshift({ value: "", text: "Select a post ..." });

        return [
            {
                id: "email1",
                labelFn: ({ fieldData }) => `Email 1 (${fieldData})`,
                type: "email",
                isRequired: true
            },
            {
                id: "email2",
                label: "Email 2",
                type: "email",
                isRequired: true
            },
            {
                id: "phone",
                label: "Phone",
                type: "tel",
                isRequired: true
            },
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
                id: "participants",
                label: "Participants",
                type: "collection",
                init: true,
                fields: [
                    {
                        id: "prename",
                        label: "Prename",
                        type: "text"
                    },
                    {
                        id: "lastname",
                        label: "Lastname",
                        type: "text"
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
            },
        ];
    }
};

export default config;