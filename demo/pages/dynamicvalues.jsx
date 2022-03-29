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
                                id: "onlyNumbers",
                                label: "Only numbers allowed",
                                type: "text",
                                filter: value => value.replace(/\D/g,'')
                            },
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
                                computedValue: (data) => {
                                    let result = 0;
                                    if (data.field1) result = result + Number(data.field1);
                                    if (data.field2) result = result + Number(data.field2);
                                    return result !== 0 ? result : "";
                                }
                            },
                            {
                                id: "maths",
                                label: "Maths",
                                type: "collection",
                                init: true,
                                fields: [
                                    {
                                        id: "factor1",
                                        label: "Factor 1",
                                        type: "number"
                                    },
                                    {
                                        id: "factor2",
                                        label: "Factor 2",
                                        type: "number"
                                    },
                                    {
                                        id: "result",
                                        label: "Result of Factor 1 x Factor 2",
                                        type: "number",
                                        isDisabled: true,
                                        computedValue: (data, itemData) => {
                                            let result = 0;
                                            if (itemData.factor1 && itemData.factor2) {
                                                result = Number(itemData.factor1) * Number(itemData.factor2);
                                            }
                                            return result !== 0 ? result : "";
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <p>There are two types of dynamic values: Computed values which compute a value based on other fields and filtered values which filter user input.</p>
                        <br />
                        <p>The first example filters away all non numbers which you enter:</p>
                        <div>
                            {fieldProps.fields.onlyNumbers}
                        </div>
                        <br />
                        <p>In this example, we compute the sum of Field 1 and Filed 2 and display it in the Sum field:</p>
                        <div className="pure-g">
                            <div className="pure-u-1-3">{fieldProps.fields.field1}</div>
                            <div className="pure-u-1-3">{fieldProps.fields.field2}</div>
                            <div className="pure-u-1-3">{fieldProps.fields.sum}</div>
                        </div>
                        <br />
                        <p>And you can compute collection item specific data, as well:</p>
                        <fieldset>
                            {fieldProps.fields.maths ? fieldProps.fields.maths.map((subFields, index) => (
                                <div key={`math-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                    <div className="pure-g">
                                        <div className="pure-u-1-3">{subFields.factor1}</div>
                                        <div className="pure-u-1-3">{subFields.factor2}</div>
                                        <div className="pure-u-1-3">{subFields.result}</div>
                                    </div>
                                    <br />
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("maths", "remove", index)}>-</button>
                                </div>)
                            ) : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction("maths", "add")}>+</button>
                        </fieldset>
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