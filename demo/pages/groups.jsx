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
                                id: "field",
                                label: "Field",
                                type: "text"
                            },
                            {
                                id: "mygroup",
                                type: "group",
                                fields: [
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
                                        id: "mysubgroup",
                                        type: "group",
                                        fields: [
                                            {
                                                id: "field1",
                                                label: "Field 1",
                                                type: "text"
                                            },
                                            {
                                                id: "field2",
                                                label: "Field 2",
                                                type: "text"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]                        
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <h3>Simple nested groups</h3>
                        <p>Nest you data as deeply as you want. (open the Debugger on the right to see how the data is structured)</p>
                        <div>
                            {fieldProps.fields.field}
                            <br />
                            <fieldset>
                                {fieldProps.fields.mygroup.field1}
                                <br />
                                {fieldProps.fields.mygroup.field2}
                                <br />
                                <fieldset>
                                    {fieldProps.fields.mygroup.mysubgroup.field1}
                                    <br />
                                    {fieldProps.fields.mygroup.mysubgroup.field2}
                                </fieldset>
                            </fieldset>
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