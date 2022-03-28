import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import axios from "axios";

import Layout from "../components/Layout";

function AsyncPage() {
    const [data, setData] = useState({});
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
                    asyncDataLoader: async () => {
                        const response = await axios.get('https://jsonplaceholder.typicode.com/users');
                        return {
                            users: response && response.data || []
                        };
                    },
                    fields: (daat, asyncData) => {
                        const users = asyncData && asyncData.users ? asyncData.users.map(item => {
                            return {
                                value: item.id,
                                text: `${item.name} (${item.email})`
                            };
                        }) : [];

                        users.unshift({ value: "", text: "Please select ..." });

                        return [
                            {
                                id: "user",
                                label: "Choose user:",
                                type: "select",
                                options: users,
                                isRequired: true
                            },
                            {
                                id: "selecteduser",
                                label: "Selected user:",
                                type: "select",
                                value: 4,
                                options: users
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            <p>
                                In this example, the options of the select are populated from data loaded asynchronously from "jsonplaceholder". 
                                You can construct the whole structure and form of your form from asynchronously loaded data if you so wish.
                            </p>
                            <br />
                            {fieldProps.fields.user}
                            <br />
                            <p>Even with async data, the form will select the correct item if the value is set (user with id 4 in this case):</p>
                            {fieldProps.fields.selecteduser}
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