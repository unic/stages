import get from "lodash.get";
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
            "coords"
        ];
    }
};

export default config;