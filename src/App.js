import React, { Fragment, useState } from "react";
import { Form, Actions } from "./lib/form";
import { Stages, HashRouter, Progression, Navigation, Debugger } from "./lib/stages";
import { get } from "./lib/index";
import fields from "./lib/fieldsets/plain";

import {
    basicsConfig, guestsConfig, programConfig,
    BasicsRenderer, GuestsRenderer, ProgramRenderer
} from "./components/steps/test";

import { getDataFromStorage, saveDataToStorage, removeDataFromStorage } from "./lib/utils/storage";

const FormLayout = ({ loading, fields, actions }) => <div>
    {loading ? (
        <div>Loading data, please wait ...</div>
    ) : (
        <>
            {fields}
            <br />
            <hr />
            <br />
            {actions}
        </>
    )}
</div>;

function App() {
    const [data, setData] = useState({});
    const onSubmit = () => {
        console.log("submit:", data);
    };

    const createActionButtonConfig = (type, onNav, onFormSubmit, data, reset) => {
        if (type === "first") {
            return [{
                title: "Next",
                type: "primary",
                validate: true,
                onClick: () => onNav("next")
            }];
        }
        return [
            {
                title: "Prev",
                type: "secondary",
                validate: false,
                onClick: () => onNav("prev")
            },
            {
                title: type === "last" ? "Submit" : "Next",
                type: "primary",
                validate: true,
                onClick: () => {
                    if (type === "last") {
                        onSubmit();
                        reset();
                    } else {
                        onNav("next");
                    }
                }
            }
        ];
    };

    return (
        <>
            <Debugger />
            <Form
                data={data}
                fields={fields}
                id="test"
                fieldsets={{
                    dateRange: {
                        params: {
                            required: {
                                type: "boolean",
                                required: false,
                                default: true
                            }
                        },
                        config: ({ params }) => {
                            return [
                                {
                                    id: "from",
                                    label: "From",
                                    type: "date",
                                    isRequired: params.required
                                },
                                {
                                    id: "to",
                                    label: "To",
                                    type: "date",
                                    isRequired: params.required
                                }
                            ];
                        },
                        render: ({ fieldProps, params }) => {
                            return (
    
                                <div style={{ display: "flex", color: params.required ? "red" : "green" }}>
                                    <div>{fieldProps.fields.from}</div>
                                    <div>{fieldProps.fields.to}</div>
                                </div>
                            );
                        }
                    }
                }}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "family",
                                type: "graph",
                                label: "Family Tree",
                                unidirectional: true,
                                circular: false,
                                fields: [
                                    {
                                        id: "name",
                                        label: "Name",
                                        type: "text",
                                        isRequired: true
                                    },
                                    {
                                        id: "gender",
                                        label: "Gender",
                                        type: "radio",
                                        options: [
                                            {
                                                text: "Male",
                                                value: "male"
                                            },
                                            {
                                                text: "Female",
                                                value: "female"
                                            }
                                        ],
                                        isRequired: true
                                    }
                                ]
                            },
                            {
                                id: "forum",
                                type: "graph",
                                label: "Forum",
                                unidirectional: true,
                                circular: false,
                                fields: {
                                    post: [
                                        {
                                            id: "title",
                                            label: "Title",
                                            type: "text",
                                            isRequired: true
                                        },
                                        {
                                            id: "content",
                                            label: "Content",
                                            type: "textarea",
                                            isRequired: true
                                        }
                                    ],
                                    reply: [
                                        {  
                                            id: "content",
                                            label: "Content",
                                            type: "textarea",
                                            isRequired: true,
                                            allowedEdgesTo: ["post"]
                                        }
                                    ]
                                }
                            }
                        ];
                    }
                }}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <form>
                            <h3>Family Tree</h3>
                            {fieldProps.fields.family ? (
                                <div>
                                    {fieldProps.fields.family.nodes.map(node => (
                                        <div key={node.id}>{node.name} (${node.gender})</div>
                                    ))}
                                    <hr />
                                    {fieldProps.fields.family.edges.map(edge => (
                                        <div key={edge.id}>{edge.fromId} zu (${edge.toId})</div>
                                    ))}
                                </div>
                            ) : <p>No entries</p>}
                            <br />
                            <h3>Forum</h3>
                            {fieldProps.fields.forum ? (
                                <div>
                                    {fieldProps.fields.forum.nodes.map(node => (
                                        <div key={node.id}>{node.name} (${node.gender})</div>
                                    ))}
                                    <hr />
                                    {fieldProps.fields.forum.edges.map(edge => (
                                        <div key={edge.id}>{edge.fromId} zu (${edge.toId})</div>
                                    ))}
                                </div>
                            ) : <p>No entries</p>}
                            <br />
                            <br />
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            >
                                Submit
                            </button>
                        </form>
                    );
                }}
                onChange={payload => setData(payload)}
            />
            {/*
            <Form
                data={data}
                fields={fields}
                id="test"
                autoSave={{
                    type: "custom",
                    validDataOnly: false,
                    save: (id, data) => saveDataToStorage(id, data, "local"),
                    get: (id) => getDataFromStorage(id, "local"),
                    remove: (id) => removeDataFromStorage(id, "local")
                }}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "tasks",
                                label: "Tasks",
                                type: "collection",
                                sort: {
                                    by: ["priority"],
                                    dir: "desc"
                                },
                                init: true,
                                fields: [
                                    {
                                        id: "title",
                                        label: "Title",
                                        type: "text",
                                        isRequired: true
                                    },
                                    {
                                        id: "priority",
                                        label: "Priority",
                                        type: "select",
                                        options: [
                                            { value: 0, text: "Please select" },
                                            { value: 1, text: "Minor" },
                                            { value: 2, text: "Major" },
                                            { value: 3, text: "Blocker" }
                                        ],
                                        isRequired: true
                                    },
                                    {
                                        id: "status",
                                        label: "Status",
                                        type: "select",
                                        options: [
                                            { value: "", text: "Please select" },
                                            { value: "new", text: "New" },
                                            { value: "progress", text: "In Progress" },
                                            { value: "done", text: "Done" }
                                        ],
                                        isRequired: true
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <div>
                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "add")}>+</button>
                            <br /><br />
                            {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData) return null;
                                    return (
                                        <div key={`task-${index}`} style={{ display: "flex" }}>
                                            {subFields.title}
                                            {subFields.priority}
                                            {subFields.status}
                                        </div>
                                    );
                                }) : null}
                        </div>
                        <br />
                        <hr />
                        <br />
                        <div style={{ display: "flex" }}>
                            <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                                <h3 style={{ padding: "8px", margin: 0 }}>New:</h3>
                                {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData !== "new") return null;
                                    return (
                                        <div key={`task-${index}`} style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex" }}>
                                            {subFields.title}
                                            {subFields.priority}
                                            {subFields.status}
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "remove", index)}>-</button>
                                        </div>
                                    );
                                }) : null}
                            </fieldset>
                            <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                                <h3 style={{ padding: "8px", margin: 0 }}>In Progress:</h3>
                                {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData !== "progress") return null;
                                    return (
                                        <div key={`task-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", display: "flex" }}>
                                            {subFields.title}
                                            {subFields.priority}
                                            {subFields.status}
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "remove", index)}>-</button>
                                        </div>
                                    );
                                }) : null}
                            </fieldset>
                            <fieldset style={{ flexGrow: 1, padding: "0", border: "none", background: "#eee" }}>
                                <h3 style={{ padding: "8px", margin: 0 }}>Done:</h3>
                                {fieldProps.fields.tasks ? fieldProps.fields.tasks.map((subFields, index) => {
                                    const itemData = fieldProps.get(fieldProps.data, `tasks[${index}].status`);
                                    if (itemData !== "done") return null;
                                    return (
                                        <div key={`task-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", display: "flex" }}>
                                            {subFields.title}
                                            {subFields.priority}
                                            {subFields.status}
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("tasks", "remove", index)}>-</button>
                                        </div>
                                    );
                                }) : null}
                            </fieldset>
                        </div>
                        <br />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                        >
                            Submit
                        </button>
                        {" "}
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(() => {}, false, true)}
                        >
                            Reset
                        </button>
                    </>
                )}
                onChange={payload => setData(payload)}
            />
            */}
            {/*
            <Stages
                initialData={{}}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div className="pure-g">
                        <div className="pure-u-1-5" style={{ marginTop: "64px" }}>
                            <Navigation {...navigationProps} />
                            <Progression {...progressionProps} /> 
                        </div>
                        <div className="pure-u-4-5">{steps}</div>
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
                autoSave={{
                    type: "custom",
                    validDataOnly: false,
                    save: (id, data) => saveDataToStorage(id, data, "local"),
                    get: (id) => getDataFromStorage(id, "local"),
                    remove: (id) => removeDataFromStorage(id, "local")
                }}
                id="testwizard"
                onChange={result => setData(result.data)}
            >
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing, reset }) => {
                    const key = setStepKey("basics", index);
                    if (initializing) return null;
                    console.log("test:", get(allData, "basics.email1"));
                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Basics:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={basicsConfig}
                                typeValidations={{
                                    email: {
                                        validation: ({ data, isValid }) => {
                                            return isValid && data.indexOf('@') > -1 && data.indexOf('.') > -1;
                                        },
                                        renderer: ({ errorCode }) => (
                                            <div style={{ color: "red" }}>Please enter a valid email address.</div>
                                        )
                                    },
                                    tel: {
                                        validation: ({ data, isValid }) => {
                                            return isValid && data.indexOf('+') === 0 && data.length === 13;
                                        },
                                        renderer: ({ errorCode }) => (
                                            <div style={{ color: "red" }}>Please enter a valid phone number.</div>
                                        )
                                    }
                                }}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<BasicsRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("first", onNav, onSubmit, data, reset)}
                                            {...actionProps}
                                        />}
                                    />
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                            />
                        </Fragment>
                    );
                }}
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing, reset }) => {
                    const key = setStepKey("guests", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Guests:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={guestsConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<GuestsRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data, reset)}
                                            {...actionProps}
                                        />}
                                    />
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                            />
                        </Fragment>
                    );
                }}
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing, reset }) => {
                    const key = setStepKey("program", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Program:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={programConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<ProgramRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("last", onNav, onSubmit, data, reset)}
                                            {...actionProps}
                                        />}
                                    />
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                            />
                        </Fragment>
                    );
                }}
            </Stages>
            */}
        </>
    );
}

export default App;
