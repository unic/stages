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
                    fields: (data) => {
                        return [
                            {
                                id: "field1",
                                label: "Field 1",
                                type: "text"
                            },
                            {
                                id: "field2",
                                label: "Field 2",
                                secondaryText: "This field is only required if Field 1 is populated. Add something to the first field to see this field getting required.",
                                type: "text",
                                isRequired: data.field1
                            },
                            {
                                id: "field3",
                                label: "Field 3",
                                type: "text"
                            },
                            {
                                id: "field4",
                                label: "Field 4",
                                secondaryText: "This field is only enabled if Field 3 is populated.",
                                type: "text",
                                isDisabled: !data.field3
                            },
                            {
                                id: "name",
                                label: "Name",
                                type: "text",
                                isRequired: true
                            },
                            {
                                id: "age",
                                label: data.name ? `What is the age of ${data.name}?` : "Age",
                                secondaryText: "The label of this field is dynamic.",
                                type: "number"
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <h3>Dynamic requirements:</h3>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.field1}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.field2}</div>
                        </div>
                        <h3>Dynamicly disabled fields:</h3>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.field3}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.field4}</div>
                        </div>
                        <h3>Dynamic labels:</h3>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.name}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.age}</div>
                        </div>
                        <br />
                        <p>
                            In summary, basically the whole field config and rendering is dynamic, which is often needed in dynamic wizards, 
                            for example those found in insurance forms. Stages is built for flexibility, making such dynamic configurations easy.</p>
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