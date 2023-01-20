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
                        <Heading>Dynamic fields</Heading>
                        <Paragraph>Configuration of each field can be dynamic, based on any kind of data entered, interface state or async data</Paragraph>
                        <Heading>Dynamic requirements:</Heading>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.field1}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.field2}</div>
                        </div>
                        <Heading>Dynamicly disabled fields:</Heading>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.field3}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.field4}</div>
                        </div>
                        <Heading>Dynamic labels:</Heading>
                        <div className="pure-g">
                            <div className="pure-u-12-24">{fieldProps.fields.name}</div>
                            <div className="pure-u-12-24">{fieldProps.fields.age}</div>
                        </div>
                        <br />
                        <Paragraph>
                            In summary, basically the whole field config and rendering is dynamic, which is often needed in dynamic wizards, 
                            for example those found in insurance forms. Stages is built for flexibility, making such dynamic configurations easy.
                        </Paragraph>
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