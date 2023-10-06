import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

function FormPage() {
    const [data, setData] = useState({});
    console.log({data});
    return (
        <Layout>
            <Form
                id="test"
                data={data}
                fields={fields}
                enableUndo
                config={{
                    fields: () => {
                        return [
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
                                isRequired: true
                            },
                            {
                                id: "country",
                                label: "Country",
                                type: "select",
                                options: [
                                    { value: "", text: "Bitte wählen ..." },
                                    { value: "CH", text: "Switzerland" },
                                    { value: "DE", text: "Germany" },
                                    { value: "AT", text: "Austria" }
                                ]
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <Heading>Undo / Redo</Heading>
                        <Paragraph>
                            Add some data to the fields. The undo memory is updated on blur, so change fields between adding data. 
                            Than try out the undo / redo buttons.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.field1}
                            <br />
                            {fieldProps.fields.field2}
                            <br />
                            {fieldProps.fields.country}
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
                        {" | "}
                        <button type="button" onClick={actionProps.handleUndo}>Undo</button>
                        {" "}
                        <button type="button" onClick={actionProps.handleRedo}>Redo</button>
                    </form>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;