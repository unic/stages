import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import axios from "axios";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

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
                            <Heading>Asyncronous Data</Heading>
                            <Paragraph>
                                In this example, the options of the select are populated from data loaded asynchronously from "jsonplaceholder". 
                                You can construct the whole structure and form of your form from asynchronously loaded data if you so wish.
                            </Paragraph>
                            <br />
                            {fieldProps.fields.user}
                            <br />
                            <Paragraph>
                                Even with async data, the form will select the correct item if the value is set (user with id 4 in this case):
                            </Paragraph>
                            {fieldProps.fields.selecteduser}
                        </div>
                        <br />
                        <HR isDirty={fieldProps.isDirty} />
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