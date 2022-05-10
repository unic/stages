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
    fields: (data, asyncData) => {
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
                isRequired: true
            },
            {
                id: "city",
                label: "City",
                type: "text",
                isRequired: true
            },
            {
                id: "post",
                label: "Choose a post:",
                type: "select",
                options: posts,
                isRequired: true
            },
            {
                id: "comment",
                label: "Comment",
                type: "select",
                options: [{
                    value: "", text: "Select a posts comment ..."
                }],
                dynamicOptions: {
                    watchFields: ['post'],
                    events: ["init", "change"],
                    loader: async (data) => {
                        if (!data || !data.post) return { value: "", text: "Select a posts comment ..." };
                        const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${data.post}/comments`);
                        return response.data.map(comment => {
                            return {
                                value: comment.id, text: comment.name
                            }
                        });
                    }
                },
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