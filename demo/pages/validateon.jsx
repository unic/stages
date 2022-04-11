import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

function FormPage() {
    const [data, setData] = useState({});
    return (
        <Layout>
            <p>
                You can set different validation behaviours on a field. Below are some examples. You have to interact with the form to experience the different behaviours.
            </p>
            <br />
            <h3>Default: Validate on Form Button Actions (Submit):</h3>
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "required",
                                label: "Required Field",
                                type: "text",
                                isRequired: true
                            },
                            {
                                id: "email",
                                label: "Email Validated Field",
                                type: "email",
                                isRequired: true
                            },
                            {
                                id: "optional",
                                label: "Optional Field",
                                type: "text",
                                isRequired: false
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div className="pure-g">
                            <div className="pure-u-8-24">{fieldProps.fields.required}</div>
                            <div className="pure-u-8-24">{fieldProps.fields.email}</div>
                            <div className="pure-u-8-24">{fieldProps.fields.optional}</div>
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
            <br /><br />
            <h3>Validate on blur (and submit):</h3>
            <Form
                data={data}
                fields={fields}
                validateOn={["action", "blur"]}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "required",
                                label: "Required Field",
                                type: "text",
                                isRequired: true
                            },
                            {
                                id: "email",
                                label: "Email Validated Field",
                                type: "email",
                                isRequired: true
                            },
                            {
                                id: "optional",
                                label: "Optional Field",
                                type: "text",
                                isRequired: false
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div className="pure-g">
                            <div className="pure-u-8-24">{fieldProps.fields.required}</div>
                            <div className="pure-u-8-24">{fieldProps.fields.email}</div>
                            <div className="pure-u-8-24">{fieldProps.fields.optional}</div>
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
            <br /><br />
            <h3>Validate on chnage (and submit):</h3>
            <Form
                data={data}
                fields={fields}
                validateOn={["action", "change"]}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "required",
                                label: "Required Field",
                                type: "text",
                                isRequired: true
                            },
                            {
                                id: "email",
                                label: "Email Validated Field",
                                type: "email",
                                isRequired: true
                            },
                            {
                                id: "optional",
                                label: "Optional Field",
                                type: "text",
                                isRequired: false
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div className="pure-g">
                            <div className="pure-u-8-24">{fieldProps.fields.required}</div>
                            <div className="pure-u-8-24">{fieldProps.fields.email}</div>
                            <div className="pure-u-8-24">{fieldProps.fields.optional}</div>
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