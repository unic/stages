import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

function FormPage() {
    const [data, setData] = useState({});
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
                                labelFn: ({ fieldData }) => {
                                    if (fieldData && fieldData.indexOf('@') > -1 && fieldData.indexOf('.') > -1) return "Email 😎";
                                    if (fieldData && (fieldData.indexOf('@') === -1 || fieldData.indexOf('.') === -1)) return "Email 🤕";
                                    return "Email";
                                },
                                type: "email",
                                isRequired: true
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <Heading>Function Props</Heading>
                        <Paragraph>
                            In this demo, we use function props to indicate if an email is valid, by dynamically rendering 
                            an emoticon in the label based on the input data.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.email}
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
  
export default FormPage;