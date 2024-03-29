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
                fieldsets={{
                    dateRange: {
                        params: {
                            required: {
                                type: "boolean",
                                required: false,
                                default: true
                            }
                        },
                        config: ({ params }) => {
                            return [
                                {
                                    id: "from",
                                    label: "From",
                                    type: "date",
                                    isRequired: params.required
                                },
                                {
                                    id: "to",
                                    label: "To",
                                    type: "date",
                                    isRequired: params.required
                                }
                            ];
                        },
                        render: ({ fieldProps, params }) => {
                            return (
                                <div className="pure-g" style={{ background: params.required ? "#ffeeee" : "transparent" }}>
                                    <div className="pure-u-1-3">{fieldProps.fields.from}</div>
                                    <div className="pure-u-1-3">{fieldProps.fields.to}</div>
                                </div>
                            );
                        }
                    }
                }}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "range",
                                label: "Date range",
                                type: "dateRange",
                                params: {
                                    required: false
                                }
                            },
                            {
                                id: "grouprange",
                                label: "Group range",
                                type: "group",
                                fields: [
                                    {
                                        id: "range",
                                        label: "Date range",
                                        type: "dateRange",
                                        params: {
                                            required: true
                                        }
                                    }
                                ]
                            },
                            {
                                id: "collectionrange",
                                label: "Collection range",
                                type: "collection",
                                init: true,
                                min: 1,
                                fields: [
                                    {
                                        id: "range",
                                        label: "Date range",
                                        type: "dateRange"
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <Heading>Fieldsets</Heading>
                        <Paragraph>
                            With fieldsets you can build truly modular forms. Each fieldset you create, contains a 
                            config for it's fields and a render function which creates the output, like a Form does. 
                            Additionally you can define parameters for each fieldset, which are than computed and fed to 
                            the config and render functions.
                        </Paragraph>
                        <Paragraph>
                            In the demo below, we've created a simple date range input made out of two date fields. The 
                            fieldset has a parameter "required" which defines if the fields are required or not. We 
                            additionality highlight the state of the parameter with background colors (red for required). 
                            The dateRange fieldset is than used in the form three times, in the root of the form, in a 
                            group and in a collection with one entry.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.range}
                            <br />
                            {fieldProps.fields.grouprange.range}
                            <br />
                            {fieldProps.fields.collectionrange ? fieldProps.fields.collectionrange[0].range : null}
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
                    </form>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;