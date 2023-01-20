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
                    fieldConfigs: {
                        coordinates: (data) => {
                            return {
                                id: "coords",
                                type: "group",
                                fields: [
                                    {
                                        id: "lat",
                                        label: "Latitude",
                                        type: "number"
                                    },
                                    {
                                        id: "lng",
                                        label: "Longitude",
                                        type: "number"
                                    }
                                ]
                            };
                        }
                    },
                    fields: () => {
                        return [   
                            {
                                id: "field",
                                label: "Field",
                                type: "text"
                            },
                            "coordinates",
                            {
                                id: "mygroup",
                                type: "group",
                                fields: [
                                    {
                                        id: "field1",
                                        label: "Field 1",
                                        type: "text"
                                    },
                                    {
                                        id: "field2",
                                        label: "Field 2",
                                        type: "text"
                                    },
                                    "coordinates",
                                    {
                                        id: "mysubgroup",
                                        type: "group",
                                        fields: [
                                            {
                                                id: "field1",
                                                label: "Field 1",
                                                type: "text"
                                            },
                                            {
                                                id: "field2",
                                                label: "Field 2",
                                                type: "text"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]                        
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <Heading>Config Templates</Heading>
                        <Paragraph>
                            In this demo we're using a coordinates group temnplate with lat and lng fields multiple times. 
                            And we're adding the coordinates group dynamically nested deep down the structure.
                        </Paragraph>
                        <div>
                            {fieldProps.fields.field}
                            <br />
                            <fieldset>
                                {fieldProps.fields.coords.lat}
                                <br />
                                {fieldProps.fields.coords.lng}
                            </fieldset>
                            <br />
                            <fieldset>
                                {fieldProps.fields.mygroup.field1}
                                <br />
                                {fieldProps.fields.mygroup.field2}
                                <br />
                                <fieldset>
                                    {fieldProps.fields.mygroup.coords.lat}
                                    <br />
                                    {fieldProps.fields.mygroup.coords.lng}
                                </fieldset>
                                <br />
                                <fieldset>
                                    {fieldProps.fields.mygroup.mysubgroup.field1}
                                    <br />
                                    {fieldProps.fields.mygroup.mysubgroup.field2}
                                    <br />
                                    {fieldProps.fields.mygroup.mysubgroup.coords ? (
                                        <>
                                            <fieldset>
                                                {fieldProps.fields.mygroup.mysubgroup.coords.lng}
                                                <br />
                                                {fieldProps.fields.mygroup.mysubgroup.coords.lat}
                                            </fieldset>
                                            <br />
                                        </>
                                    ) : null}
                                    {!fieldProps.fields.mygroup.mysubgroup.coords ? (
                                        <button onClick={() => fieldProps.modifyConfig("mygroup.mysubgroup", "coordinates", "add")}>
                                            Add Coordinate Fields
                                        </button>
                                    ) : null}
                                    {fieldProps.fields.mygroup.mysubgroup.coords ? (
                                        <button onClick={() => fieldProps.modifyConfig("mygroup.mysubgroup", "coordinates", "remove")}>
                                            Remove Coordinate Fields
                                        </button>
                                    ) : null}
                                </fieldset>
                            </fieldset>
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