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
                                id: "title",
                                label: "Title",
                                type: "text",
                                isRequired: true,
                                customValidation: async ({ data }) => {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                    return data && data.length % 2 !== 1;
                                },
                                validateOn: ["blur", "action"]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <Heading>Async Validation</Heading>
                        <Paragraph>
                            In this demo, we simulate an async validation api call with a random timeout. The validation is simple. 
                            All odd character counts in the title field will be an error. We disable the action button while 
                            async validations happen. Stages meanwhile takes care of any race conditions (each validations can 
                            take between 0 and 2 seconds, so this is necessary as later api calls can finish before earlier calls). 
                            While validating (on init, blur and action), we display a note below the field.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.title}
                        </div>
                        <br />
                        <HR isDirty={fieldProps.isDirty} />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            disabled={actionProps.isDisabled}
                        >
                            Submit
                        </button>
                    </form>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;