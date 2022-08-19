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
                isRequired: true,
                cleanUp: value => value.trim(),
                validateOn: ["change", "blur", "action"],
                customValidation: ({ data, allData, isValid }) => isValid && data.length % 2 === 1
            },
            {
                id: "city",
                label: "City",
                type: "text",
                isRequired: true,
                validateOn: ["throttledChange", "blur", "action"],
                customValidation: ({ data, allData, isValid }) => isValid && data.length % 2 === 1
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
                id: "post",
                label: "Choose a post:",
                type: "select",
                options: posts,
                isRequired: true
            },
            {
                id: "comment1",
                label: "Comment 1",
                type: "select",
                options: [{
                    value: "", text: "Select a posts comment ..."
                }],
                dynamicOptions: {
                    watchFields: ['post'],
                    events: ["init", "change"],
                    enableCaching: true,
                    loader: async (data) => {
                        if (!data || !data.post) return [{ value: "", text: "Select a posts comment ..." }];
                        console.log(`${data.post}.1 start`);
                        const response = await axios.get(`https://fakeql.com/fragilegraphql/3f6450ed0949588b5fe109a740272754?query={users{id,firstname,age}}`);
                        console.log(`${data.post}.1 end`);
                        return response.data.data.users.map(entry => {
                            return {
                                value: entry.id, text: entry.firstname
                            }
                        });
                    }
                },
                isRequired: true
            },
            {
                id: "comment2",
                label: "Comment 2",
                type: "select",
                options: [{
                    value: "", text: "Select another posts comment ..."
                }],
                dynamicOptions: {
                    watchFields: ['post', 'comment'],
                    events: ["init", "change"],
                    enableCaching: true,
                    loader: async (data) => {
                        if (!data || !data.post) return [{ value: "", text: "Select a posts comment ..." }];
                        console.log(`${data.post}.2 start`);
                        const response = await axios.get(`https://fakeql.com/fragilegraphql/3f6450ed0949588b5fe109a740272754?query={users{id,firstname,age}}`);
                        console.log(`${data.post}.2 end`);
                        return response.data.data.users.map(entry => {
                            return {
                                value: entry.id, text: entry.firstname
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
            }
        ];
    }
};

export default config;