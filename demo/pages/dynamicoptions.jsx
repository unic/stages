import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import axios from "axios";

import Layout from "../components/Layout";

function AsyncPage() {
    const [data, setData] = useState({ post: 3 });
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
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
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            <p>
                                In this example, the options of the second select are dynamically loaded based on what was choosen in the first select.
                            </p>
                            <br />
                            {fieldProps.fields.post}
                            <br />
                            {fieldProps.fields.comment}
                        </div>
                        <br />
                        <hr />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                        >
                            Submit
                        </button>
                    </>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default AsyncPage;