import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

function FormPage() {
    const [data1, setData1] = useState({});
    const [data2, setData2] = useState({});
    const [data3, setData3] = useState({});
    const [data4, setData4] = useState({});
    const [data5, setData5] = useState({});
    return (
        <Layout>
            <Heading>Validate On (Event)</Heading>
            <Paragraph>
                You can set different validation behaviours on a field. Below are some examples. You have to interact with the form to experience the different behaviours.
            </Paragraph>
            <br />
            <Heading>Default: Validate on Form Button Actions (Submit):</Heading>
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
                    <form>
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
                    </form>
                )}
                onChange={payload => setData1(payload)}
            />
            <br /><br />
            <Heading>Validate on blur (and submit):</Heading>
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
                    <form>
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
                    </form>
                )}
                onChange={payload => setData2(payload)}
            />
            <br /><br />
            <Heading>Validate on change (and submit):</Heading>
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
                    <form>
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
                    </form>
                )}
                onChange={payload => setData3(payload)}
            />
            <br /><br />
            <Heading>Validate on throttled change (and submit):</Heading>
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
                    <form>
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
                    </form>
                )}
                onChange={payload => setData4(payload)}
            />
            <br /><br />
            <Heading>Dynamic validation based on length of input, first only on blur, than after five characters on change:</Heading>
            <Form
                id="form4"
                data={data4}
                fields={fields}
                validateOn={["action", "throttledChange"]}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "dynamicValidate",
                                label: "Valid on even length (2, 4, 6 ...)",
                                type: "text",
                                isRequired: true,
                                cleanUp: value => value.trim(),
                                validateOn: ({ data, fieldIsDirty, fieldConfig }) => data && data.length > 5 ? ["change", "blur", "action"] : ["blur", "action"],
                                customValidation: ({ data, allData, isValid }) => {
                                    if (isValid && data.length % 2 === 1) return "UNEVEN";
                                    return isValid;
                                }
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <div className="pure-g">
                            <div className="pure-u-8-24">{fieldProps.fields.dynamicValidate}</div>
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
                    </form>
                )}
                onChange={payload => setData4(payload)}
            />
            <br /><br />
            <Heading>Custom validation event:</Heading>
            <Paragraph>
                In this example, the form is validated on change, but the city field, is validated on countryChange, which 
                is defined as "only validate on change, if country is selected and has less than 3 characters".
            </Paragraph>
            <Form
                id="form4"
                data={data5}
                fields={fields}
                customEvents={{
                    'countryChange': ({ data, dirtyFields, optionsLoaded, asyncData, errors, focusedField, triggeringEvent }) => {
                        if (data.country && triggeringEvent === "change") return true;
                        return false;
                    }
                }}
                validateOn={["change"]}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "country",
                                label: "Country",
                                type: "select",
                                options: [
                                    { value: "", text: "Please select ..." },
                                    { value: "CH", text: "Switzerland" },
                                    { value: "DE", text: "Germany" },
                                    { value: "AT", text: "Austria" }
                                ],
                            },
                            {
                                id: "city",
                                label: "City (at least 3 chars)",
                                type: "text",
                                isRequired: true,
                                validateOn: ["countryChange", "change"],
                                customValidation: ({ data, allData, isValid, triggeringEvent }) => {
                                    if (triggeringEvent === "countryChange") return isValid && data.length > 3;
                                    return isValid;
                                }
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <div className="pure-g">
                            <div className="pure-u-8-24">{fieldProps.fields.country}</div>
                        </div>
                        <br />
                        <div className="pure-g">
                            <div className="pure-u-8-24">{fieldProps.fields.city}</div>
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
                    </form>
                )}
                onChange={payload => setData5(payload)}
            />
        </Layout>
    );
};
  
export default FormPage;