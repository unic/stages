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
                isDisabled
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
                                id: "continents",
                                label: "Visited Continents:",
                                type: "multiselect",
                                options: [
                                    { value: "europe", text: "Europe" },
                                    { value: "asia", text: "Asia" },
                                    { value: "northamerica", text: "North America" },
                                    { value: "southamerica", text: "South America" },
                                    { value: "africa", text: "Africa" },
                                    { value: "oceanica", text: "Oceanica" },
                                    { value: "antarctica", text: "Antarctica" }
                                ]
                            },
                            {
                                id: "gender",
                                label: "Gender:",
                                type: "radio",
                                options: [
                                    { value: "male", text: "Male" },
                                    { value: "female", text: "Female" }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <div>
                            <Heading>Disabled Form</Heading>
                            <Paragraph>
                                A simple example of a disabled form. Useful for example to prevent user inputs while sending data. 
                                All fields in the form will be set to isDisabled, no matter what the config says.
                            </Paragraph>
                            <br />
                            {fieldProps.fields.email}
                            <br />
                            {fieldProps.fields.password}
                            <br />
                            {fieldProps.fields.signedIn}
                            <br />
                            {fieldProps.fields.country}
                            <br />
                            {fieldProps.fields.continents}
                            <br />
                            {fieldProps.fields.gender}
                        </div>
                        <br />
                        <HR isDirty={fieldProps.isDirty} />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            style={actionProps.isDisabled ? { pointerEvents: "none", opacity: 0.3 } : {}}
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