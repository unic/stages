import axios from "axios";

const config = {
    asyncDataLoader: async () => {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
        return {
            posts: response && response.data || []
        };
    },
    fields: (data, asyncData) => {
        return [
            {
                id: "prename",
                label: "Prename",
                secondaryText: asyncData && asyncData.posts ? asyncData.posts[0].title : "",
                type: "text",
                isRequired: true
            },
            {
                id: "lastname",
                label: "Lastname",
                type: "text",
                isRequired: true
            }
        ];
    }
};

export default config;