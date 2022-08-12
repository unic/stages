import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

function FormPage() {
    const [data1, setData1] = useState({});
    const [data2, setData2] = useState({});
    const [data3, setData3] = useState({});
    const [data4, setData4] = useState({});
    return (
        <Layout>
            <p>
                You can set different validation behaviours on a field. Below are some examples. You have to interact with the form to experience the different behaviours.
            </p>
            <br />
            <h3>Default: Validate on Form Button Actions (Submit):</h3>
            <Form
                id="form1"
                data={data1}
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
                                isRequired: true,
                                customValidation: ({ data, allData, isValid }) => isValid && data.indexOf('@') > -1 && data.indexOf('.') > -1
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
                onChange={payload => setData1(payload)}
            />
            <br /><br />
            <h3>Validate on blur (and submit):</h3>
            <Form
                id="form2"
                data={data2}
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
                                isRequired: true,
                                customValidation: ({ data, allData, isValid }) => isValid && data.indexOf('@') > -1 && data.indexOf('.') > -1
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
                onChange={payload => setData2(payload)}
            />
            <br /><br />
            <h3>Validate on change (and submit):</h3>
            <Form
                id="form3"
                data={data3}
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
                                isRequired: true,
                                customValidation: ({ data, allData, isValid }) => isValid && data.indexOf('@') > -1 && data.indexOf('.') > -1
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
                onChange={payload => setData3(payload)}
            />
            <br /><br />
            <h3>Validate on throttled change (and submit):</h3>
            <Form
                id="form4"
                data={data4}
                fields={fields}
                validateOn={["action", "throttledChange"]}
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
                                isRequired: true,
                                customValidation: ({ data, allData, isValid }) => isValid && data.indexOf('@') > -1 && data.indexOf('.') > -1
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
                onChange={payload => setData4(payload)}
            />
        </Layout>
    );
};
  
export default FormPage;