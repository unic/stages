import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";
import Fieldset from "../components/demofields/parts/Fieldset";

function FormPage() {
    const [data, setData] = useState({price: 2.55});
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
                            },
                            {
                                id: "price",
                                label: "Price",
                                type: "text",
                                prefix: "$ ",
                                precision: 2
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <Heading>Dynamic Values</Heading>
                        <Paragraph>There are two types of dynamic values: Computed values which compute a value based on other fields and filtered values which filter user input.</Paragraph>
                        <Paragraph>The first example filters away all non numbers which you enter:</Paragraph>
                        <div>
                            {fieldProps.fields.onlyNumbers}
                        </div>
                        <br />
                        <Paragraph>In this example, we compute the sum of Field 1 and Filed 2 and display it in the Sum field:</Paragraph>
                        <div className="pure-g">
                            <div className="pure-u-1-3">{fieldProps.fields.field1}</div>
                            <div className="pure-u-1-3">{fieldProps.fields.field2}</div>
                            <div className="pure-u-1-3">{fieldProps.fields.sum}</div>
                        </div>
                        <br />
                        <Paragraph>And you can compute collection item specific data, as well:</Paragraph>
                        <Fieldset>
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
                        </Fieldset>
                        <br />
                        <Paragraph>
                            Another special type of dynamic value is a field using the "precision" option, which is very useful for price values. 
                            Try entering some other value, for example "40.1234" or just "40".
                        </Paragraph>
                        <div>
                            {fieldProps.fields.price}
                        </div>
                        <br />
                        <HR isDirty={fieldProps.isDirty} />
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