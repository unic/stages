import React, { useState } from "react";
import { Form, plainFields as fields, get } from "react-stages";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";

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
                        <Heading>Plain Form</Heading>
                        <Paragraph>
                            For testing purposes, a form with the plain fields from Stages.
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
                            {fieldProps.fields.continents}
                            <br />
                            {fieldProps.fields.gender}
                        </div>
                        <br />
                        Get test (email field data): {get(fieldProps.data, "email")}
                        <br />
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