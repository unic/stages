import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";
import LexicalInput from "../components/LexicalInput";
import TiptapInput from "../components/TiptapInput";

fields.lexical = {
    component: LexicalInput,
    isValid: () => true
};

fields.tiptap = {
    component: TiptapInput,
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
                                label: "Lexical WYSIWYG Input Demo (WIP)",
                                secondaryText: "Example of a WYSIWYG (Lexical) input used inside Stages.",
                                type: "lexical"
                            },
                            {
                                id: "tiptap",
                                label: "Tiptap WYSIWYG Input Demo (WIP)",
                                secondaryText: "Another popular editor, Tiptap. Select some text and see what happens.",
                                type: "tiptap"
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div style={{ borderBottom: fieldProps.dirtyFields.lexical ? "4px #f30 solid" : "4px #eee solid", paddingBottom: "16px" }}>
                            {fieldProps.fields.lexical}
                        </div>
                        <p>
                            As Lexical is initially firing an onChange with initialized empty content, you need to capture that 
                            and return an empty string. The line above illustrates how that solves the isDirty calculation of Stages.
                        </p>
                        <br />
                        <div style={{ borderBottom: fieldProps.dirtyFields.tiptap ? "4px #f30 solid" : "4px #eee solid", paddingBottom: "16px" }}>
                            {fieldProps.fields.tiptap}
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