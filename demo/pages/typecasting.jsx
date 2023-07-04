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
                                id: "mybool",
                                label: "Boolean Field",
                                type: "checkbox",
                                cast: {
                                    data: (value) => value ? "yes" : "no",
                                    field: (value) => value === "yes" ? true : false
                                }
                            },
                            {
                                id: "mydate",
                                label: "Date Field",
                                type: "date",
                                cast: {
                                    data: (value) => new Date(value),
                                    field: (value) => {
                                        if (value instanceof Date) {
                                            let month = value.getUTCMonth() + 1;
                                            if (month < 10) month = `0${month}`;
                                            let day = value.getUTCDate();
                                            if (day < 10) day = `0${day}`;
                                            const year = value.getUTCFullYear();
                                            return `${year}-${month}-${day}`;
                                        }
                                        return "";
                                    }
                                }
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <Heading>Typecasting</Heading>
                        <Paragraph>
                            Ideally you always want the right kind of type in the data you receive from Stages. However, sometimes you 
                            work with 3rd party fields which use a different type. You can solve this problem in Stages with Typecasting.
                        </Paragraph>
                        <Paragraph>
                            In this first example, our component creates a boolean, but our backend API expects "yes" and "no" strings. 
                            We use custom typecasting to solve this. Check the data in the debugger where the correct type (and value) is set.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.mybool}
                        </div>
                        <br />
                        <Paragraph>
                            In this next example, we have a field which returns a string which looke like "2022-08-23". But our 
                            JavaScript code which receives the data expects a Date object. So we typecast it. Check the code of 
                            this example to get an idea how.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.mydate}
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