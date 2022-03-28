import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

function FormPage() {
    const [data, setData] = useState({});
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                isDisabled
                config={{
                    fields: () => {
                        return [
                            {
                                id: "text",
                                label: "Text",
                                type: "text"
                            },
                            {
                                id: "duration",
                                label: "Cookie löschen nach",
                                type: "select",
                                options: [
                                    { value: "", text: "Bitte wählen ..." },
                                    { value: "7", text: "1 Woche" },
                                    { value: "31", text: "1 Monat" },
                                    { value: "365", text: "1 Jahr" }
                                ]
                            },
                            {
                                id: "onTheRadio",
                                label: "What song?",
                                type: "radio",
                                options: [
                                    { value: "", text: "Bitte wählen ..." },
                                    { value: "A", text: "Lose Yourself" },
                                    { value: "B", text: "Stan" },
                                    { value: "C", text: "8 Mile" }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            <p>
                                A simple example of a disabled form. Useful for example to prevent user inputs while sending data. 
                                All fields in the form will be set to isDisabled, no matter what the config says.
                            </p>
                            <br />
                            {fieldProps.fields.text}
                            <br />
                            {fieldProps.fields.duration}
                            <br />
                            {fieldProps.fields.onTheRadio}
                        </div>
                        <br />
                        <hr />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            style={actionProps.isDisabled ? { pointerEvents: "none", opacity: 0.3 } : {}}
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