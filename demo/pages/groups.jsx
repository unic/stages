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
                            },
                            {
                                id: "deepcollection",
                                type: "collection",
                                fields: [
                                    {
                                        id: "field1",
                                        label: "Field 1",
                                        type: "text",
                                        isRequired: true
                                    },
                                    {
                                        id: "field2",
                                        label: "Field 2",
                                        type: "text",
                                        isRequired: false
                                    },
                                    {
                                        id: "colGroup",
                                        type: "group",
                                        fields: [
                                            {
                                                id: "field",
                                                label: "Field",
                                                type: "text",
                                                isRequired: true
                                            },
                                            {
                                                id: "subcollection",
                                                type: "collection",
                                                fields: [
                                                    {
                                                        id: "field",
                                                        label: "Field",
                                                        type: "text",
                                                        isRequired: true
                                                    }
                                                ]
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
                        <h3>Deeply nested groups and collections</h3>
                        <p>An example with a group inside of a collection, which contains another collection. Start adding entries to see the behaviour:</p>
                        <div>
                            <fieldset>
                                {fieldProps.fields.deepcollection ? fieldProps.fields.deepcollection.map((subFields, index) => (
                                    <div key={`deepcollection-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                        <div className="pure-g">
                                            <div className="pure-u-1-3">{subFields.field1}</div>
                                            <div className="pure-u-1-3">{subFields.field2}</div>
                                        </div>
                                        <br />
                                        <div className="pure-g">
                                            <fieldset>
                                                <div className="pure-u-1-3">{subFields.colGroup.field}</div>
                                                <br /><br />
                                                <fieldset>
                                                    {subFields.colGroup.subcollection ? subFields.colGroup.subcollection.map((subSubFields, subIndex) => (
                                                        <div key={`subcollection-${subIndex}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                                            <div className="pure-g">
                                                                <div className="pure-u-1-3">{subSubFields.field}</div>
                                                            </div>
                                                            <br />
                                                            <button type="button" onClick={() => fieldProps.onCollectionAction(`deepcollection[${index}].colGroup.subcollection`, "remove", subIndex)}>-</button>
                                                        </div>)
                                                    ) : null}
                                                    <button type="button" onClick={() => fieldProps.onCollectionAction(`deepcollection[${index}].colGroup.subcollection`, "add")}>+</button>
                                                </fieldset>
                                            </fieldset>
                                        </div>
                                        <button type="button" onClick={() => fieldProps.onCollectionAction("deepcollection", "remove", index)}>-</button>
                                    </div>)
                                ) : null}
                                <button type="button" onClick={() => fieldProps.onCollectionAction("deepcollection", "add")}>+</button>
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