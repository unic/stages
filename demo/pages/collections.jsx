import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

const Collection = ({ title, description, collectionKey, fieldProps, errors, addMoveButtons, addDragAndDrop }) => {
    if (addDragAndDrop && process.browser) {
        const getListStyle = isDraggingOver => ({
            background: "f8f8f8",
            width: "calc(100% - 16px)",
            padding: "8px"
        });
        const getItemStyle = (isDragging, draggableStyle) => ({
            userSelect: "none",
            width: "calc(100% - 32px)",
            margin: "8px",
            padding: "8px",
            position: "relative",
            background: isDragging ? "#e6e6e6" : "#f2f2f2",
            ...draggableStyle
        });
        const onDragEnd = (result) => {
            // dropped outside the list
            if (!result.destination) {
                return;
            }

            fieldProps.onCollectionAction(collectionKey, "move", result.source.index, result.destination.index)
        };

        return (
            <>
                <h3>{title}</h3>
                <p>{description}</p>
                <div style={{ border: "1px #ccc dashed" }}>
                    <div>
                        <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "add")} style={{ float: "right", marginRight: "-32px" }}>+</button>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="droppable">
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={getListStyle(snapshot.isDraggingOver)}
                                >
                                    {fieldProps.fields[collectionKey] ? fieldProps.fields[collectionKey].map((subFields, index) => (
                                        <Draggable key={`${collectionKey}-ìtem-${index}`} draggableId={`${collectionKey}-ìtem-${index}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={getItemStyle(
                                                        snapshot.isDragging,
                                                        provided.draggableProps.style
                                                    )}
                                                >
                                                    <div className="pure-g">
                                                        <div className="pure-u-12-24">{subFields.field1}</div>
                                                        <div className="pure-u-12-24">{subFields.field2}</div>
                                                        <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    )) : null}
                                    {provided.placeholder}
                                </div>
                            )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            </>
        );
    }
    if (addDragAndDrop && !process.browser) return null;
    return (
        <>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="pure-g" style={{ border: "1px #ccc dashed" }}>
                <div className="pure-u-4-5">
                    {fieldProps.fields[collectionKey] ? fieldProps.fields[collectionKey].map((subFields, index) => (
                        <div key={`${collectionKey}-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                            <div className="pure-u-8-24">{subFields.field1}</div>
                            <div className="pure-u-16-24">{subFields.field2}</div>
                            {subFields.result ? <div className="pure-u-8-24"><br />{subFields.result}</div> : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                            {addMoveButtons ? (
                                <div>
                                    <br />
                                    <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "move", index, 0)}>Move to top</button>
                                    <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "move", index, fieldProps.fields[collectionKey].length - 1)}>Move to bottom</button>
                                </div>
                            ) : null}
                        </div>)
                    ) : null}
                </div>
                <div className="pure-u-1-5">
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
        ],
        collection10: [
            { field1: "Field 1 sample text", field2: "Field 2 sample text" },
            { field1: "Field 1 sample text", field2: "Field 2 sample text" },
            { field1: "Field 1 sample text", field2: "Field 2 sample text" },
            { field1: "Field 1 sample text", field2: "Field 2 sample text" }
        ],
        collection11: [
            { field1: "Field 1 sample text 1", field2: "Field 2 sample text 1" },
            { field1: "Field 1 sample text 2", field2: "Field 2 sample text 2" },
            { field1: "Field 1 sample text 3", field2: "Field 2 sample text 3" },
            { field1: "Field 1 sample text 4", field2: "Field 2 sample text 4" },
            { field1: "Field 1 sample text 5", field2: "Field 2 sample text 5" },
            { field1: "Field 1 sample text 6", field2: "Field 2 sample text 6" },
            { field1: "Field 1 sample text 7", field2: "Field 2 sample text 7" }
        ],
        collection12: [
            { field1: "Field 1 sample text 1", field2: "Field 2 sample text 1" },
            { field1: "Field 1 sample text 2", field2: "Field 2 sample text 2" },
            { field1: "Field 1 sample text 3", field2: "Field 2 sample text 3" },
            { field1: "Field 1 sample text 4", field2: "Field 2 sample text 4" },
            { field1: "Field 1 sample text 5", field2: "Field 2 sample text 5" },
            { field1: "Field 1 sample text 6", field2: "Field 2 sample text 6" },
            { field1: "Field 1 sample text 7", field2: "Field 2 sample text 7" }
        ],
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
                            {
                                id: "collection7",
                                type: "collection",
                                init: true,
                                fields: [
                                    {
                                        id: "field1",
                                        label: "Factor 1",
                                        type: "number"
                                    },
                                    {
                                        id: "field2",
                                        label: "Factor 2",
                                        type: "number"
                                    },
                                    {
                                        id: "result",
                                        label: "Result of Factor 1 x Factor 2",
                                        type: "number",
                                        isDisabled: true,
                                        computedValue: (data, itemData) => {
                                            let result = 0;
                                            if (itemData.field1 && itemData.field2) {
                                                result = Number(itemData.field1) * Number(itemData.field2);
                                            }
                                            return result !== 0 ? result : "";
                                        }
                                    }
                                ]
                            },
                            {
                                id: "collection8",
                                type: "collection",
                                isRequired: true,
                                uniqEntries: true,
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
                                id: "collection9",
                                type: "collection",
                                isRequired: true,
                                init: "food",
                                fields: {
                                    food: [
                                        {
                                            id: "name",
                                            label: "Food Name",
                                            type: "text",
                                            isRequired: true
                                        },
                                        {
                                            id: "calories",
                                            label: "Calories",
                                            type: "text"
                                        }
                                    ],
                                    drink: [
                                        {
                                            id: "name",
                                            label: "Drink Name",
                                            type: "text",
                                            isRequired: true
                                        },
                                        {
                                            id: "alcohol",
                                            label: "Alcohol Percentage",
                                            type: "text"
                                        },
                                        {
                                            id: "fullName",
                                            label: "Full Name",
                                            type: "text",
                                            isDisabled: true,
                                            computedValue: (data, itemData) => {
                                                if (itemData.alcohol) {
                                                    return `${itemData.name} ${itemData.alcohol}%`;
                                                }
                                                return itemData.name;
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "collection10",
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
                                        isRequired: false,
                                        isRendered: (path, data, allData) => {
                                            // Just an example, this code could definitely be improved massively!
                                            if (path.includes("[0]")) return false;
                                            if (path.includes("[2]")) return false;
                                            if (path.includes("[4]")) return false;
                                            if (path.includes("[6]")) return false;
                                            if (path.includes("[8]")) return false;
                                            if (path.includes("[10]")) return false;
                                            return true;
                                        }
                                    }
                                ]
                            },
                            {
                                id: "collection11",
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
                                id: "collection12",
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
                            }
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
                            <Collection
                                title="Computed data on individual items:"
                                description="You can compute field values based on data of the same item. Try it out by adding numbers and additional collection items!"
                                collectionKey="collection7"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="Force entries to be uniq:"
                                description="Sometimes you only want uniq entries in a collection. With the isUniq property you can force Stages to validate that. Add two entries with the same values and submit to see the error:"
                                collectionKey="collection8"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <Collection
                                title="Dynamic fields per item:"
                                description="Deciding which fields to display based on the index of the collection item (Field 2 is only shown every second entry)."
                                collectionKey="collection10"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                            />
                            <h3>Union Type Collections</h3>
                            <p>These ones can have multiple different field configs, here "food" and "drink". When you add an entry, you have to choose the type which you want to add.</p>
                            <div className="pure-g" style={{ border: "1px #ccc dashed" }}>
                                <div className="pure-u-4-5">
                                    {fieldProps.fields.collection9 ? fieldProps.fields.collection9.map((subFields, index) => (
                                        <div key={`meal-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                                            <div className="pure-u-8-24">{subFields.name}</div>
                                            <div className="pure-u-16-24">{subFields.calories || subFields.alcohol}</div>
                                            {subFields.fullName ? <div className="pure-u-8-24"><br />{subFields.fullName}</div> : null}
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("collection9", "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                                        </div>)
                                    ) : null}
                                    <div className="pure-u-1-5">
                                        <br />
                                        <button type="button" onClick={() => fieldProps.onCollectionAction("collection9", "add", "food")}>+ Food</button> 
                                        {" "}
                                        <button type="button" onClick={() => fieldProps.onCollectionAction("collection9", "add", "drink")}>+ Drink</button>
                                    </div>
                                    {fieldProps.errors && fieldProps.errors.collection9 ? <div style={{ color: "red" }}>Please add at least one meal!</div> : null}
                                </div>
                            </div>
                            <Collection
                                title="Move items:"
                                description="Move items to the top or bottom of the collection (simple version with buttons)."
                                collectionKey="collection11"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                                addMoveButtons
                            />
                            <Collection
                                title="Drag and drop items:"
                                description="Using the move action together with Beautiful DnD, we get a nice drag and drop behaviour."
                                collectionKey="collection12"
                                fieldProps={fieldProps}
                                errors={fieldProps.errors}
                                addDragAndDrop
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