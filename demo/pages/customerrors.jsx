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
                                id: "username",
                                label: "Username",
                                type: "text",
                                isRequired: true,
                                customValidation: ({ data, isValid }) => {
                                    return isValid && data.replace(/[^a-z0-9-]/gi, "") === data;
                                },
                                errorRenderer: (error) => <div style={{ color: "#f30" }}><br />Please fill out this field. Only alphanumeric values and '-' is allowed.</div>,
                            },
                            {
                                id: "field1",
                                label: "Field 1",
                                type: "text"
                            },
                            {
                                id: "field2",
                                label: "Field 2",
                                type: "text"
                            },
                            {
                                id: "atLeastOne",
                                type: "dummy",
                                customValidation: ({ allData }) => {
                                    return !!allData.field1 || !!allData.field2;
                                },
                                errorRenderer: (error) => <div style={{ color: "#f30" }}><br />Please fill out at least one of the two fields.</div>,
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <p>
                            In this first field, we wrote a custom validation which only accepts alphanumeric values and "-". Try entering 
                            something different to see the custom error message.
                        </p>
                        {fieldProps.fields.username}
                        <br />
                        <p>
                            Sometimes you have situations where you can't just make a field required, because for example the user only 
                            needs to fill out one or the other. You can solve this situation with a dummy field and a custom validation 
                            function. Hit submit without entering data to see the behaviour. Than add data in only one field and try again.
                        </p>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.field1}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.field2}</div>
                        </div>
                        {fieldProps.fields.atLeastOne}
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