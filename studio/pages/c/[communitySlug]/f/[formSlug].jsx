import { useState, useEffect, useRef, isValidElement } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import { ScrollPanel } from 'primereact/scrollpanel';
import primeFields from '../../../../components/primeFields';
import set from "lodash.set";
import get from "lodash.get";
import findIndex from "lodash.findindex";
import unset from "lodash.unset";
import { ContextMenu } from 'primereact/contextmenu';

const globalFieldProps = {
    id: {
        id: "id",
        type: "text",
        label: "ID",
        isRequired: true,
    },
    label: {
        id: "label",
        type: "text",
        label: "Label",
        isRequired: true,
    },
    secondaryText: {
        id: "secondaryText",
        type: "text",
        label: "Secondary Text"
    },
    type: {
        id: "type",
        type: "select",
        label: "Type",
        isRequired: true,
        options: [
            {
                value: "text",
                text: "Textfield"
            },
            {
                value: "textarea",
                text: "Textarea"
            },
            {
                value: "select",
                text: "Select"
            },
            {
                value: "calendar",
                text: "Calendar"
            },
            {
                value: "checkbox",
                text: "Checkbox"
            },
            {
                value: "switch",
                text: "Switch"
            },
            {
                value: "number",
                text: "Number"
            },
            {
                value: "rating",
                text: "Rating"
            },
            {
                value: "buttons",
                text: "Buttons"
            },
            {
                value: "slider",
                text: "Slider"
            },
            {
                value: "toggle",
                text: "Toggle"
            },
            {
                value: "editor",
                text: "Editor"
            },
            {
                value: "chips",
                text: "Chips"
            },
            {
                value: "color",
                text: "Color"
            },
            {
                value: "mask",
                text: "Mask"
            },
            {
                value: "password",
                text: "Password"
            }
        ]
    },
    isRequired: {
        id: "isRequired",
        type: "checkbox",
        label: "Required?"
    },
    tooltip: {
        id: "tooltip",
        type: "text",
        label: "Tooltip"
    },
    options: {
        id: "options",
        type: "collection",
        min: 1,
        init: true,
        fields: [
            {
                id: "value",
                label: "Value",
                type: "text",
                isRequired: true
            },
            {
                id: "text",
                label: "Text",
                type: "text",
                isRequired: true
            }
        ]
    },
    autoResize: {
        id: "autoResize",
        type: "checkbox",
        label: "Auto resize?"
    },
    placeholder: {
        id: "placeholder",
        type: "text",
        label: "Placeholder"
    }
}

const fieldProps = {
    text: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.tooltip
    ],
    textarea: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.tooltip,
        globalFieldProps.autoResize
    ],
    select: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.options,
        globalFieldProps.placeholder,
        globalFieldProps.tooltip
    ],
    calendar: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.tooltip,
        {
            id: "numberOfMonths",
            type: "number",
            label: "Number of Months"
        },
        {
            id: "selectionMode",
            type: "select",
            label: "Selection Mode",
            options: [
                {
                    value: "single",
                    text: "Single"
                },
                {
                    value: "range",
                    text: "Range"
                },
                {
                    value: "multiple",
                    text: "Multiple"
                }
            ]
        },
        {
            id: "inline",
            type: "checkbox",
            label: "Inline?"
        },
        {
            id: "showButtonBar",
            type: "checkbox",
            label: "Show button bar?"
        },
        {
            id: "showIcon",
            type: "checkbox",
            label: "Show icon?"
        },
        {
            id: "showTime",
            type: "checkbox",
            label: "Show time?"
        },
    ],
    checkbox: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    switch: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    number: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    rating: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    buttons: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired,
        globalFieldProps.options
    ],
    slider: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    toggle: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    editor: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    chips: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    color: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    mask: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
    password: [
        globalFieldProps.id,
        globalFieldProps.label,
        globalFieldProps.secondaryText,
        globalFieldProps.type,
        globalFieldProps.isRequired
    ],
};

const renderFields = (setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, fields, type = "field") => {
    if (typeof fields !== "object") return null;
    return (
        <>
            {Object.keys(fields).map(key => {
                const field = fields[key];
                if (isValidElement(field)) {
                    if (type === "group") return <EditableBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} setSelectedElement={setSelectedElement} inGroup field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />;
                    return <EditableBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} setSelectedElement={setSelectedElement} field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />;
                } else if (typeof field === "object") {
                    if (Array.isArray(field)) {
                        // collection array
                        return (
                            <div style={{ margin: "16px 0 32px 0" }}>
                                {field.map((entry, index) => (
                                    <div className="flex">
                                        {renderFields(setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, entry, "group")}
                                        <div className="flex-1" style={{ marginTop: "32px" }}>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction(key, "remove", index)}>remove</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                            </div>
                        );
                    } else {
                        return <div className="flex">{renderFields(setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, field, "group")}</div>;
                    }
                }
            })}
        </>
    );
};

const getConfigPathFromDataPath = (path, config) => {
    const pathSplit = path.split(".");
    let realPath = '';
    pathSplit.forEach((key) => {
        const index = findIndex(realPath ? get(config, realPath) : config, { id: key.replace(/\[(\d+)\]/, "") });
        if (index > -1) {
            realPath = realPath === "" ? `[${index}]` : `${realPath}[${index}]`;
            const thisConfig = get(config, realPath);
            if (thisConfig.fields) realPath += ".fields";
        }
    });
    return realPath;
}

const EditableBlock = ({ field, path, isEditMode, selectedElement, inGroup, setSelectedElement, contextMenuRef, setActiveContextMenuInput }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && selectedElement === path);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && isEditMode ? "1px dashed #0A94F8" : "1px solid rgba(0,0,0,0)",
            position: "relative"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                setActiveContextMenuInput(path);
            }
        }} onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}>
            {isInEditMode && isEditMode ? <button style={{ position: "absolute", top: "4px", right: "4px" }} type="button" onClick={() => setSelectedElement(path)}>edit</button> : null}
            {field}
        </div>
    );
};

const FieldConfigEditor = ({ path, config, handleEditFieldConfig }) => {
    const [data, setData] = useState(config);

    useEffect(() => {
        setData(config);
    }, [config]);

    return (
        <>
            <code>{path}</code>
            <br /><br />
            {typeof config === "object" ? (
                <Form
                    key={`configForm-${config.type}`}
                    id={`configForm-${config.type}`}
                    data={data}
                    fields={primeFields}
                    config={{
                        fields: () => {
                            return fieldProps[config.type];
                        }
                    }}
                    render={({ actionProps, fieldProps }) => {
                        return (
                            <>
                                <form>
                                    <div style={{ position: "relative" }}>
                                        {renderFields(() => {}, null, () => {}, false, '', fieldProps, fieldProps.fields)}
                                    </div>
                                </form>
                            </>
                        );
                    }}
                    onChange={payload => {
                        setData(payload);
                        handleEditFieldConfig(path, payload);
                    }}
                />
            ) : null}
        </>
    );
};

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const [data, setData] = useState({});
    const contextMenuRef = useRef(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedElement, setSelectedElement] = useState('');
    const [activeContextMenuInput, setActiveContextMenuInput] = useState('');
    const [currentConfig, setCurrentConfig] = useState([
        {
            id: "textgroup",
            type: "group",
            fields: [  
                {
                    id: "field1",
                    label: "Text 1",
                    type: "text",
                    isRequired: true
                },
                {
                    id: "field2",
                    label: "Text 2",
                    type: "text",
                    isRequired: true
                },
            ]
        },
        {
            id: "textcollection",
            type: "collection",
            min: 1,
            init: true,
            fields: [  
                {
                    id: "field1",
                    label: "Text 1",
                    type: "text",
                    isRequired: true
                },
                {
                    id: "field2",
                    label: "Text 2",
                    type: "text",
                    isRequired: true
                },
            ]
        },
        {
            id: "field2",
            label: "Textarea",
            type: "textarea",
            isRequired: true
        },
        {
            id: "field3",
            label: "Select",
            type: "select",
            options: [
                {
                    text: "Option 1",
                    value: "option1"
                },
                {
                    text: "Option 2",
                    value: "option2"
                }
            ],
            isRequired: true
        },
        {
            id: "field4",
            label: "Calendar",
            type: "calendar",
            isRequired: true
        },
        {
            id: "field5",
            label: "Checkbox",
            type: "checkbox",
            isRequired: true
        },
        {
            id: "field6",
            label: "Switch",
            type: "switch",
            isRequired: true
        },
        {
            id: "field7",
            label: "Number",
            type: "number",
            isRequired: true
        },
        {
            id: "field8",
            label: "Rating",
            type: "rating",
            isRequired: true
        },
        {
            id: "field9",
            label: "Buttons",
            type: "buttons",
            options: [
                {
                    text: "Option 1",
                    value: "option1"
                },
                {
                    text: "Option 2",
                    value: "option2"
                }
            ],
            isRequired: true
        },
        {
            id: "field10",
            label: "Slider",
            type: "slider",
            isRequired: true
        },
        {
            id: "field11",
            label: "Toggle",
            type: "toggle",
            isRequired: true
        },
        {
            id: "field12",
            label: "Editor",
            type: "editor",
            isRequired: true
        },
        {
            id: "field13",
            label: "Chips",
            type: "chips",
            isRequired: true
        },
        {
            id: "field14",
            label: "Color",
            type: "color",
            isRequired: true
        },
        {
            id: "field15",
            label: "Mask",
            type: "mask",
            mask: "99-999999",
            isRequired: true
        },
        {
            id: "field16",
            label: "Password",
            type: "password",
            isRequired: true
        }
    ]);

    const contextMenuItems = [
        { label: 'Delete', icon: 'pi pi-fw pi-trash', command: () => handleRemoveField(activeContextMenuInput) },
    ];

    const handleRemoveField = (path) => {
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        unset(newConfig, realPath);
        setCurrentConfig(newConfig);
    };

    const handleEditFieldConfig = (path, config) => {
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        if (realPath && Object.keys(config).length > 0) {
            const oldConfig = get(currentConfig, realPath);
            if (oldConfig.id !== config.id) setSelectedElement(config.id);
            set(newConfig, realPath, config);
        }
        setCurrentConfig(newConfig);
    };

    return (
        <div style={{ marginRight: "350px" }}>
            <h2>Community "{communitySlug}" - Form "{formSlug}"</h2>
            {isEditMode ? <ContextMenu model={contextMenuItems} ref={contextMenuRef} breakpoint="767px" /> : null}
            {isEditMode ? <button type="button" onClick={() => setIsEditMode(false)}>Preview</button> : <button type="button" onClick={() => setIsEditMode(true)}>Edit</button>}
            <Form
                id="myForm"
                data={data}
                fields={primeFields}
                config={{
                    fields: () => {
                        return currentConfig;
                    }
                }}
                render={({ actionProps, fieldProps }) => {
                    return (
                        <>
                            <form>
                                <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto" }}>
                                    {renderFields(setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, fieldProps.fields)}
                                </div>
                            </form>
                            {isEditMode ? (
                                <ScrollPanel style={{ width: '350px', height: '100vh', position: "fixed", top: 0, right: 0, borderLeft: "1px solid #ccc", padding: "12px" }}>
                                    <h3>Inspector:</h3>
                                    {selectedElement ? <FieldConfigEditor path={selectedElement} config={fieldProps.getConfig(selectedElement)} handleEditFieldConfig={handleEditFieldConfig} /> : null}
                                </ScrollPanel> 
                            ) : null}
                         </>
                    );
                }}
                onChange={payload => setData(payload)}
            />
        </div>
    )
};

export default CommunityForm;