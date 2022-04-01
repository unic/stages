import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";

import Layout from "../components/Layout";

const addressConfig = {
    fields: () => {
        return [
            {
                id: "name",
                label: "Name",
                type: "text",
                isRequired: true
            },
            {
                id: "street",
                label: "Street & Nr",
                type: "text",
                isRequired: true
            },
            {
                id: "poBox",
                label: "P.O. Box",
                type: "text",
                isRequired: false
            },
            {
                id: "postalcode",
                label: "Postalcode",
                type: "text",
                isRequired: true
            },
            {
                id: "city",
                label: "City",
                type: "text",
                isRequired: true
            }
        ];
    }
};

const AddressRender = ({ fields }) => {
    return (
        <div>
            <div className="pure-g">
                <div className="pure-u-24-24">{fields.name}</div>
            </div>
            <br />
            <div className="pure-g">
                <div className="pure-u-12-24">{fields.street}</div>
                <div className="pure-u-12-24">{fields.poBox}</div>
            </div>
            <br />
            <div className="pure-g">
                <div className="pure-u-12-24">{fields.postalcode}</div>
                <div className="pure-u-12-24">{fields.city}</div>
            </div>
        </div>
    );
};

function InceptionPage() {
    const [data, setData] = useState({
        billingSame: true,
        shippingSame: true
    });
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: (data) => {
                        const fieldConfig = [];

                        fieldConfig.push(
                            {
                                id: "mainAddress",
                                type: "subform",
                                config: addressConfig,
                                render: AddressRender
                            }
                        );

                        fieldConfig.push(
                            {
                                id: "billingSame",
                                label: "Same as main address?",
                                type: "checkbox"
                            }
                        );
                        if (!data.billingSame) {
                            fieldConfig.push(
                                {
                                    id: "billingAddress",
                                    type: "subform",
                                    config: addressConfig,
                                    render: AddressRender
                                }
                            );
                        }

                        fieldConfig.push(
                            {
                                id: "shippingSame",
                                label: "Same as main address?",
                                type: "checkbox"
                            }
                        );
                        if (!data.shippingSame) {
                            fieldConfig.push(
                                {
                                    id: "shippingAddress",
                                    type: "subform",
                                    config: addressConfig,
                                    render: AddressRender
                                }
                            );
                        }
                        
                        return fieldConfig;
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            <p>
                                This is a demonstration of using a single address form as a subform in a larger form which contains up to 
                                three different addresses:
                            </p>
                            <br />
                            <h3>Main Address:</h3>
                            {fieldProps.fields.mainAddress}
                            <br />
                            <hr />
                            <h3>Billing Address:</h3>
                            {fieldProps.fields.billingSame}
                            <br />
                            {fieldProps.fields.billingAddress}
                            <br />
                            <hr />
                            <h3>Shipping Address:</h3>
                            {fieldProps.fields.shippingSame}
                            <br />
                            {fieldProps.fields.shippingAddress}
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
  
export default InceptionPage;