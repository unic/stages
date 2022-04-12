import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

function FormPage() {
    const [data, setData] = useState({ email: "test@domain.com" });
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "email",
                                label: "Email",
                                type: "email",
                                isRequired: true
                            },
                            {
                                id: "password",
                                label: "Password",
                                type: "password",
                                isRequired: true
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <div style={{ border: fieldProps.isDirty ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                        <p>
                            A form always knows if data it contains is dirty or not (has been changed since initialization). In 
                            this example, the border becomes red when the form becomes dirty, and returns to grey as soon as the 
                            data returns to the initial values. This can be very useful to decide if a save is necessary or not.
                        </p>
                        <br />
                        <div>
                            {fieldProps.fields.email}
                            <br />
                            {fieldProps.fields.password}
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
                    </div>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;