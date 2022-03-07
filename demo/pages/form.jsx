import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import DemoNav from "../components/DemoNav";

function FormPage() {
    const [data, setData] = useState({});
    return (
        <div>
            <DemoNav />
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "email",
                                label: "Email",
                                type: "email",
                                isRequired: true
                            },
                            {
                                id: "password",
                                label: "Password",
                                type: "password",
                                isRequired: true
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            {fieldProps.fields.email}
                            <br />
                            {fieldProps.fields.password}
                        </div>
                        <hr />
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
        </div>
    );
};
  
export default FormPage;