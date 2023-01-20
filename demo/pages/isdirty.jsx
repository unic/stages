import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

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
                        <Heading>Is Dirty?</Heading>
                        <Paragraph>
                            A form always knows if data it contains is dirty or not (has been changed since initialization). In 
                            this example, the border becomes red when the form becomes dirty, and returns to grey as soon as the 
                            data returns to the initial values. This can be very useful to decide if a save is necessary or not.
                        </Paragraph>
                        <Paragraph>
                            Additionally, you can track each field individually, which is shown in this demo with a red border around it.
                        </Paragraph>
                        <br />
                        <div>
                            <div style={{ border: fieldProps.dirtyFields.email ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                                {fieldProps.fields.email}
                            </div>
                            <br />
                            <div style={{ border: fieldProps.dirtyFields.password ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                                {fieldProps.fields.password}
                            </div>
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
                    </div>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;