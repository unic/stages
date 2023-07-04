import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import LexicalInput from "../components/LexicalInput";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

fields.lexical = {
    component: LexicalInput,
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
                                id: "lexical",
                                label: "Lexical WYSIWYG Input",
                                secondaryText: "Example of a WYSIWYG (Lexical) input used inside Stages.",
                                type: "lexical"
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <Heading>WYSIWYG Editor Integration</Heading>
                        <Paragraph>Stages makes it easy to integrate complex fields like WYSIWYG editors.</Paragraph>
                        <div>
                            {fieldProps.fields.lexical}
                        </div>
                        <Paragraph>
                            As Lexical is initially firing an onChange with initialized empty content, you need to capture that 
                            and return an empty string. The line below illustrates how that solves the isDirty calculation of Stages.
                        </Paragraph>
                        <br />
                        <HR isDirty={fieldProps.isDirty} />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
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