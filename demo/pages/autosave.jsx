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
                autoSave="session"
                config={{
                    fields: () => {
                        return [
                            {
                                id: "field1",
                                label: "Required field",
                                type: "text",
                                isRequired: true
                            },
                            {
                                id: "field2",
                                label: "Non required field",
                                type: "text"
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <Heading>Auto Save</Heading>
                        <Paragraph>
                            If you enable Auto Save, than Stages automatically saves a users data in local or session storage. In 
                            this example, only if data is valid, so only if the required field is set. On all reseting actions, 
                            the data is cleared. Try it out by adding data and than reloading the page.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.field1}
                            <br />
                            {fieldProps.fields.field2}
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
                        {" "}
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(() => {}, false, true)}
                        >
                            Reset
                        </button>
                    </>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;