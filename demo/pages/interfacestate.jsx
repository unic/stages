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
                                id: "field1",
                                label: "Factor 1",
                                type: "number"
                            },
                            {
                                id: "field2",
                                label: "Factor 2",
                                type: "number"
                            },
                            {
                                id: "sum",
                                label: "Summary of both fields",
                                type: "number",
                                isDisabled: true,
                                isInterfaceState: true,
                                computedValue: (data) => {
                                    let result = 0;
                                    if (data.field1) result = result + Number(data.field1);
                                    if (data.field2) result = result + Number(data.field2);
                                    return result !== 0 ? result : "";
                                }
                            },
                            {
                                id: "advanced",
                                label: "Advanced Options:",
                                type: "checkbox",
                                isInterfaceState: true

                            },
                            {
                                id: "advancedoption",
                                label: "Some Advanced Option",
                                type: "text"
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <Heading>Interface State</Heading>
                        <Paragraph>
                            In this demo, we declare the summary as interface state, so that it doesn't show up in the exposed data. 
                            You can check this by opening the debugger and inspect the data. For a comparison, in the "Dynamic Values" 
                            demo, we didn't set this field as interface state, so it shows up in the data as you can check in the debugger.
                        </Paragraph>
                        <br />
                        <div className="pure-g">
                            <div className="pure-u-1-3">{fieldProps.fields.field1}</div>
                            <div className="pure-u-1-3">{fieldProps.fields.field2}</div>
                            <div className="pure-u-1-3">{fieldProps.fields.sum}</div>
                        </div>
                        <br />
                        <Paragraph>
                            Another good use for interface state is something like advanced options. Here the "checkbox" to 
                            open the advanced options is interface state and not exposed in the data. You can access it in the render prop with 
                            "fieldProps.interfaceState.advanced".
                        </Paragraph>
                        {fieldProps.fields.advanced}
                        {fieldProps.interfaceState.advanced ? (
                            <div>{fieldProps.fields.advancedoption}</div>
                        ) : null}
                        <br />
                        <Paragraph>Again check the data in the debugger. Only the "advancedoption" data is exposed, not the checkbox.</Paragraph>
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