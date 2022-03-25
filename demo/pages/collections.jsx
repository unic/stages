import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

const Collection = ({ title, description, collectionKey, fieldProps, errors }) => {
    return (
        <>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="pure-g" style={{ border: "1px #ccc dashed" }}>
                <div className="pure-u-2-3">
                    {fieldProps.fields[collectionKey] ? fieldProps.fields[collectionKey].map((subFields, index) => (
                        <div key={`${collectionKey}-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                            <div className="pure-u-8-24">{subFields.field1}</div>
                            <div className="pure-u-16-24">{subFields.field2}</div>
                            <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                        </div>)
                    ) : null}
                </div>
                <div className="pure-u-1-3">
                    <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "add")} style={{ float: "right", margin: "8px" }}>+</button>
                </div>
            </div>
            {errors && errors[collectionKey] ? <div style={{ color: "red", marginTop: "8px" }}>Please add at least one entry!</div> : null}
        </>
    );
};

function CollectionsPage() {
    const [data, setData] = useState({
        collection6: [
            { field1: "Field 1 sample text", field2: "Field 2 sample text" },
            { field1: "Another sample" }
        ]
    });

    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "collection1",
                                type: "collection",
                                fields: [
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
                                        isRequired: false
                                    }
                                ]
                            },
                            {
                                id: "collection2",
                                type: "collection",
                                init: true,
                                fields: [
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
                                        isRequired: false
                                    }
                                ]
                            },
                            {
                                id: "collection3",
                                type: "collection",
                                init: true,
                                isRequired: true,
                                fields: [
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
                                        isRequired: false
                                    }
                                ]
                            },
                            {
                                id: "collection4",
                                type: "collection",
                                init: true,
                                min: 2,
                                max: 5,
                                fields: [
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
                                        isRequired: false
                                    }
                                ]
                            },
                            {
                                id: "collection5",
                                type: "collection",
                                init: true,
                                isRequired: true,
                                min: 2,
                                max: 5,
                                fields: [
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
                                        isRequired: false
                                    }
                                ]
                            },
                            {
                                id: "collection6",
                                type: "collection",
                                fields: [
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
                                        isRequired: false
                                    }
                                ]
                            },
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            <Collection
                                title="Simple, non required, non initialized collection:"
                                description="User can add as many entries or as little as he wishes. No minimum or maximum requirements. And no entry is initialized."
                                collectionKey="collection1"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="Initialized collection:"
                                description="This will render the first empty entry and filling out data is optional."
                                collectionKey="collection2"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="Initialized and required collection:"
                                description="This will render the first empty entry and throw a collection error if you don't add any entries."
                                collectionKey="collection3"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="A minimum of 2 and maximum of 4 initialized entries:"
                                description="This will initialize two entries which are empty. You can't remove for less than two. They are not required, so can be left empty."
                                collectionKey="collection4"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="A minimum of 2 and maximum of 4 initialized entries, all required:"
                                description="This will initialize two entries which are required. If you don't fill out the required collection fields, it will show an error on all required fields."
                                collectionKey="collection5"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="Initial data:"
                                description="This one has initial data defined, so it will render those initial data, even without init being true."
                                collectionKey="collection6"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                        </div>
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
  
export default CollectionsPage;