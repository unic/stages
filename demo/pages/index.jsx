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
                            },
                            {
                                id: "signedIn",
                                label: "Cookie behaviour?",
                                secondaryText: "stay signed in",
                                type: "checkbox"
                            },
                            {
                                id: "country",
                                label: "Country:",
                                type: "select",
                                options: [
                                    { value: "", text: "Please select ..." },
                                    { value: "CH", text: "Switzerland" },
                                    { value: "LI", text: "Liechtenstein" },
                                    { value: "AT", text: "Austria" },
                                    { value: "DE", text: "Germany" }
                                ]
                            },
                            {
                                id: "gender",
                                label: "Gender:",
                                type: "radio",
                                options: [
                                    { value: "", text: "Please select ..." },
                                    { value: "male", text: "Male" },
                                    { value: "female", text: "Female" }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <Heading>Simple Form</Heading>
                        <Paragraph>
                            A simple form with all plain fields from the default field library extended with additional 
                            info for demo purposes. The flags "isDirty" and "hasFocus" is indicated with left borders and 
                            background colors. Additionally field path and field type is mentioned right below the field labels.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.email}
                            <br />
                            {fieldProps.fields.password}
                            <br />
                            {fieldProps.fields.signedIn}
                            <br />
                            {fieldProps.fields.country}
                            <br />
                            {fieldProps.fields.gender}
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