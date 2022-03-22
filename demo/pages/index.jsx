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
                            },
                            {
                                id: "hints",
                                label: "Hints",
                                type: "collection",
                                isRequired: false,
                                init: true,
                                fields: [
                                    {
                                        id: "hint",
                                        label: "Password Hint",
                                        type: "text",
                                        isRequired: true
                                    },
                                    {
                                        id: "mainHint",
                                        label: "Is main hint?",
                                        type: "checkbox",
                                        isRequired: false
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            {fieldProps.fields.email}
                            <br />
                            {fieldProps.fields.password}
                            <br />
                            <h3>Password Hints:</h3>
                            <div className="pure-g" style={{ border: "1px #ccc dashed" }}>
                                <div className="pure-u-2-3">
                                    {fieldProps.fields.hints ? fieldProps.fields.hints.map((subFields, index) => (
                                        <div key={`hint-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                                            <div className="pure-u-8-24">{subFields.hint}</div>
                                            <div className="pure-u-16-24">{subFields.mainHint}</div>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("hints", "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                                        </div>)
                                    ) : null}
                                </div>
                                <div className="pure-u-1-3">
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("hints", "add")} style={{ float: "right" }}>+</button>
                                </div>
                            </div>
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