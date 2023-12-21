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

function capitalize(s) {
    if (!s) return s;
    return s[0].toUpperCase() + s.slice(1);
}

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

const WizardNavigation = ({ config, fieldKey, onAction, getHash }) => {
    return (
        <div>
            {config.label && <h3 style={{ marginBottom: "4px" }}>{config.label}</h3>}
            <ul style={{ margin: "0 0 16px 0", padding: 0, listStyleType: "none", display: "flex" }}>
                {Array.isArray(config.stages) && config.stages.map((stage) => (
                    <li style={{ padding: 0, margin: "0 8px 0 0" }} key={`#${fieldKey}.${stage.id}`}>
                        <a href={getHash(fieldKey, stage.id)} onClick={() => onAction(fieldKey, stage.id)}>{stage.label}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

function App() {
    const [data, setData] = useState({
        mycollection: [
            { f1: "jhj", f2: "dskjlf" },
            { f1: "2r2", f2: "fgrt3" },
            { f1: "yxcds", f2: "u7k6" }
        ]
    });
    const [errors, setErrors] = useState({});
    const onSubmit = () => {
        console.log("submit:", data);
    };

    console.log({ errors, data });

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

    const customValidation = ({ data, isValid }) => {
        return isValid && data.replace(/[^a-z0-9-]/gi, "") === data;
    };

    return (
        <>
            <Debugger />
            <Form
                id="wizard"
                data={data}
                onChange={(payload, errors, id, fieldKey, interfaceState, allErrors) => {
                    setData(payload);
                    setErrors(errors);
                    console.log({allErrors});
                }}
                fields={fields}
                config={{ fields: () => {
                    return [
                        {
                            id: "field1",
                            type: "text",
                            label: "Field 1",
                            isRequired: true
                        },
                        {
                            id: "myGroup",
                            type: "group",
                            label: "Group",
                            fields: [
                                {
                                    id: "field1",
                                    type: "text",
                                    label: "Field 1"
                                },
                                {
                                    id: "field2",
                                    type: "text",
                                    label: "Field 2"
                                },
                                {
                                    id: "wizardInsideGroup",
                                    type: "wizard",
                                    label: "Wizard inside Group",
                                    options: {},
                                    stages: [
                                        {
                                            id: "step1",
                                            type: "stage",
                                            label: "Step 1",
                                            fields: [
                                                {
                                                    id: "field1",
                                                    type: "text",
                                                    label: "Field 1 (Step 1)",
                                                    isRequired: true
                                                },
                                                {
                                                    id: "field2",
                                                    type: "text",
                                                    label: "Field 2 (Step 1)"
                                                },
                                            ]
                                        },
                                        {
                                            id: "step2",
                                            type: "stage",
                                            label: "Step 2",
                                            fields: [
                                                {
                                                    id: "field1",
                                                    type: "text",
                                                    label: "Field 1 (Step 2)",
                                                    isRequired: true
                                                },
                                                {
                                                    id: "field2",
                                                    type: "text",
                                                    label: "Field 2 (Step 2)"
                                                },
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: "wizard1",
                            type: "wizard",
                            label: "Wizard 1",
                            options: {},
                            stages: [
                                {
                                    id: "step1",
                                    type: "stage",
                                    label: "Step 1",
                                    fields: [
                                        {
                                            id: "field1",
                                            type: "text",
                                            label: "Field 1 (Step 1)",
                                            isRequired: true
                                        },
                                        {
                                            id: "field2",
                                            type: "text",
                                            label: "Field 2 (Step 1)"
                                        },
                                    ]
                                },
                                {
                                    id: "step2",
                                    type: "stage",
                                    label: "Step 2",
                                    fields: [
                                        {
                                            id: "field1",
                                            type: "text",
                                            label: "Field 1 (Step 2)",
                                            isRequired: true
                                        },
                                        {
                                            id: "field2",
                                            type: "text",
                                            label: "Field 2 (Step 2)"
                                        },
                                    ]
                                }
                            ]
                        }
                    ];
                } }}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <div>
                            {fieldProps.fields.field1}
                            <br />
                            <div style={{ border: "1px #999 solid", padding: "8px" }}>
                                {fieldProps.fields.myGroup.field1}
                                {fieldProps.fields.myGroup.field2}
                                {fieldProps.fields.myGroup.wizardInsideGroup ? (
                                    <div>
                                        <WizardNavigation
                                            fieldKey="myGroup.wizardInsideGroup"
                                            config={fieldProps.getConfig("myGroup.wizardInsideGroup")}
                                            onAction={fieldProps.onWizardAction}
                                            getHash={fieldProps.getWizardNavHash}
                                        />
                                        {fieldProps.fields.myGroup.wizardInsideGroup.step1 && (
                                            <div>
                                                {fieldProps.fields.myGroup.wizardInsideGroup.step1.field1}
                                                {fieldProps.fields.myGroup.wizardInsideGroup.step1.field2}
                                            </div>
                                        )}
                                        {fieldProps.fields.myGroup.wizardInsideGroup.step2 && (
                                            <div>
                                                {fieldProps.fields.myGroup.wizardInsideGroup.step2.field1}
                                                {fieldProps.fields.myGroup.wizardInsideGroup.step2.field2}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <br />
                            {fieldProps.fields.wizard1 ? (
                                <div>
                                    <WizardNavigation
                                        fieldKey="wizard1"
                                        config={fieldProps.getConfig("wizard1")}
                                        onAction={fieldProps.onWizardAction}
                                        getHash={fieldProps.getWizardNavHash}
                                    />
                                    {fieldProps.fields.wizard1.step1 && (
                                        <div>
                                            {fieldProps.fields.wizard1.step1.field1}
                                            {fieldProps.fields.wizard1.step1.field2}
                                        </div>
                                    )}
                                    {fieldProps.fields.wizard1.step2 && (
                                        <div>
                                            {fieldProps.fields.wizard1.step2.field1}
                                            {fieldProps.fields.wizard1.step2.field2}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                            <br />
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            >
                                Submit
                            </button>
                        </div>
                    );
                }}
            />
            {/*
            <Form
                data={data}
                onChange={(payload, errors, id, fieldKey, interfaceState, allErrors) => {
                    setData(payload);
                    setErrors(errors);
                    console.log({allErrors});
                }}
                fields={fields}
                id="test"
                customEvents={{
                    'onBlurAndChangeIfLong': ({ fieldValue, triggeringEvent }) => {
                        if (!fieldValue && triggeringEvent === "blur") return true;
                        if (typeof fieldValue === "string" && fieldValue.length > 5 && triggeringEvent === "change") return true;
                        if (typeof fieldValue === "string" && fieldValue.length < 5 && triggeringEvent === "blur") return true;
                        return false;
                    }
                }}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "input1",
                                label: "Input 1 (default)",
                                type: "text",
                                isRequired: true,
                                customValidation: customValidation
                            },
                            {
                                id: "input2",
                                label: "Input 2 (on blur and action, excluded from autoSave)",
                                type: "text",
                                isRequired: true,
                                disableAutoSave: true,
                                validateOn: ["blur", "action"],
                                customValidation: customValidation
                            },
                            {
                                id: "input3",
                                label: "Input 3 (on change and action)",
                                type: "text",
                                isRequired: true,
                                validateOn: ["change", "action"],
                                customValidation: customValidation
                            },
                            {
                                id: "input4",
                                label: "Input 4 (on throttledChange and action)",
                                type: "text",
                                isRequired: true,
                                cleanUp: (value) => value.replace(/ +/g, ' ').trim(),
                                validateOn: ["throttledChange", "action"],
                                customValidation: customValidation
                            },
                            {
                                id: "input5",
                                label: "Input 5 (on init and action)",
                                type: "text",
                                isRequired: true,
                                validateOn: ["init", "action"],
                                customValidation: customValidation
                            },
                            {
                                id: "input6",
                                label: "Input 6 (on focus, blur and action)",
                                type: "text",
                                isRequired: true,
                                validateOn: ["focus", "blur", "action"],
                                customValidation: customValidation
                            },
                            {
                                id: "input7",
                                label: "Input 7 (on onBlurAndChangeIfLong and action)",
                                type: "text",
                                isRequired: true,
                                validateOn: ["onBlurAndChangeIfLong", "action"],
                                customValidation: customValidation
                            },
                            {
                                id: "mycollection",
                                label: "Collection",
                                type: "collection",
                                init: true,
                                min: 1,
                                validateOn: ["collectionAction"],
                                fields: [
                                    {
                                        id: "f1",
                                        label: "Col Field 1",
                                        type: "text",
                                        isRequired: true
                                    },
                                    {
                                        id: "f2",
                                        label: "Col Field 2",
                                        type: "text",
                                        isRequired: true
                                    }
                                ]
                            }
                        ];
                    }
                }}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <div style={{ border: `2px solid ${fieldProps.isDirty ? "red" : "gray"}`, padding: "8px" }}>
                            {fieldProps.fields.input1}
                            <br />
                            {fieldProps.fields.input2}
                            <br />
                            {fieldProps.fields.input3}
                            <br />
                            {fieldProps.fields.input4}
                            <br />
                            {fieldProps.fields.input5}
                            <br />
                            {fieldProps.fields.input6}
                            <br />
                            {fieldProps.fields.input7}
                            <br />
                            {fieldProps.fields.mycollection ? fieldProps.fields.mycollection.map((subFields, index) => {
                                return (
                                    <div key={`mycollection-${index}`} style={{ background: "#fff", margin: "8px", padding: "8px", display: "flex" }}>
                                        {subFields.f1}
                                        {subFields.f2}
                                        <button type="button" onClick={() => fieldProps.onCollectionAction("mycollection", "remove", index)}>-</button>
                                    </div>
                                );
                            }) : null}
                            <button
                                type="button"
                                onClick={() => fieldProps.onCollectionAction("mycollection", "add")}
                            >+</button>
                            <br />
                            <br />
                            <button type="button" onClick={() => actionProps.updateData({
                                input1: 'Test 1',
                                input4: 'test 4',
                                mycollection: [
                                    {
                                        f1: 'Collection Test 1',
                                    }
                                ]
                            })}>Update Data</button>
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            >
                                Submit
                            </button>
                            {" | "}
                            <button onClick={actionProps.handleUndo}>Undo</button>
                            {" "}
                            <button onClick={actionProps.handleRedo}>Redo</button>
                        </div>
                    );
                }}      
            />
            */}
            {/*
            <br /><br />
            <Form
                data={data}
                onChange={payload => setData(payload)}
                fields={fields}
                id="test"
                config={(data) => [
                    {
                        id: "title",
                        label: `Title (${data.title || ''})`,
                        type: "text",
                        isRequired: true
                    }
                ]}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <div>
                            {fieldProps.fields.title}
                            <br />
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            >
                                Submit
                            </button>
                        </div>
                    );
                }}      
            />
            <br /><br />
            <Form
                data={data}
                onChange={payload => setData(payload)}
                fields={fields}
                id="test"
                config={[
                    {
                        id: "title",
                        label: "Title",
                        type: "text",
                        isRequired: true
                    }
                ]}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <div>
                            {fieldProps.fields.title}
                            <br />
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            >
                                Submit
                            </button>
                        </div>
                    );
                }}      
            />
            <br /><br />
            <Form
                data={data}
                onChange={payload => setData(payload)}
                fields={fields}
                id="test"
                config={{
                    fieldConfigs: {
                        requiredUppercaseInput: () => {
                            return {
                                id: "input",
                                type: "text",
                                isRequired: true,
                                filter: value => typeof value === "string" ? value.toUpperCase() : value
                            };
                        }
                    },
                    fields: () => [
                        {
                            id: "title1",
                            label: "Title 1",
                            type: "requiredUppercaseInput"
                        },
                        {
                            id: "title2",
                            label: "Title 2",
                            type: "requiredUppercaseInput"
                        }
                    ]
                }}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <div>
                            {fieldProps.fields.title1}
                            <br />
                            {fieldProps.fields.title2}
                            <br />
                            <br />
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                            >
                                Submit
                            </button>
                        </div>
                    );
                }}      
            />
            <br /><br />
            <Form
                data={data}
                onChange={payload => setData(payload)}
                fields={fields}
                config={[
                    {
                        id: "title",
                        label: "Title",
                        type: "text",
                        isRequired: true
                    }
                ]}
                renderFields={fields => (
                    <div>
                        {fields.title}
                    </div>
                )}      
            />

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
                                id: "title",
                                label: "Title",
                                type: "text",
                                isRequired: true,
                                customValidation: async ({ data }) => {
                                    await new Promise(resolve => setTimeout(resolve, 3000));
                                    return data && data.length % 2 === 1;
                                },
                                validateOn: ["blur", "action"]
                            },
                            {
                                id: "password",
                                label: "Password",
                                type: "password",
                                isRequired: false,
                                regexValidation: "^[0-9]{4}[A-Z]{1}$"
                            },
                            {
                                id: "myradio",
                                label: "Radio Example",
                                type: "radio",
                                options: [
                                    {value: 1, text: "1"},
                                    {value: 2, text: "2"},
                                    {value: 3, text: "3"}
                                ],
                                isRequired: true
                            },
                            {
                                id: "range",
                                label: "Date range",
                                type: "dateRange",
                                params: {
                                    required: false
                                }
                            },
                            {
                                id: "prename",
                                label: "Prename",
                                type: "text",
                                filter: (data) => capitalize(data)
                            },
                            {
                                id: "grouprange",
                                label: "Group range",
                                type: "group",
                                fields: [
                                    {
                                        id: "range",
                                        label: "Date range",
                                        type: "dateRange",
                                        params: {
                                            required: true
                                        }
                                    }
                                ]
                            },
                            {
                                id: "collectionrange",
                                label: "Collection range",
                                type: "collection",
                                init: true,
                                min: 1,
                                fields: [
                                    {
                                        id: "range",
                                        label: "Date range",
                                        type: "dateRange"
                                    }
                                ]
                            }
                        ];
                    }
                }}
                render={({ fieldProps, actionProps }) => {
                    return (
                        <form>
                            {fieldProps.fields.title}
                            <br />
                            {fieldProps.fields.password}
                            <br />
                            {fieldProps.fields.myradio}
                            <br />
                            {fieldProps.fields.prename}
                            <br />
                            {fieldProps.fields.range}
                            <br />
                            {fieldProps.fields.grouprange.range}
                            <br />
                            {fieldProps.fields.collectionrange ? fieldProps.fields.collectionrange[0].range : null}
                            <br />
                            <br />
                            <button
                                type="button"
                                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                                disabled={actionProps.isDisabled}
                            >
                                Submit
                            </button>
                        </form>
                    );
                }}
                onChange={payload => setData(payload)}
            />
            */}
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
