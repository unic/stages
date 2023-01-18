import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";
import WysiwygInput from "../components/WysiwygInput";

fields.wysiwyg = {
    component: WysiwygInput,
    isValid: () => true
};

function FormPage() {
    const [data, setData] = useState({});
    console.log({ data });
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "wysiwyg",
                                label: "Lexical WYSIWYG Input",
                                secondaryText: "Example of a WYSIWYG (Lexical) input used inside Stages.",
                                type: "wysiwyg"
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            {fieldProps.fields.wysiwyg}
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
  
export default FormPage;