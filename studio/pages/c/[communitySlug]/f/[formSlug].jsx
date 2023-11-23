import { useState, isValidElement } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import { ScrollPanel } from 'primereact/scrollpanel';
import primeFields from '../../../../components/primeFields';
import { InputText } from 'primereact/inputtext';
import set from "lodash.set";

const globalFieldProps = {
    id: {
        type: "text",
        label: "Text",
        isRequired: true,
    },
    label: {
        type: "text",
        label: "Text",
        isRequired: true,
    },
    type: {
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
            }
        ]
    },
    isRequired: {
        type: "checkbox",
        label: "Required?"
    }
}

const fieldProps = {
    text: {
        id: globalFieldProps.id,
        label: globalFieldProps.label,
        type: globalFieldProps.type,
        isRequired: globalFieldProps.isRequired
    },
    textarea: {
        id: globalFieldProps.id,
        label: globalFieldProps.label,
        type: globalFieldProps.type,
        isRequired: globalFieldProps.isRequired
    },
    select: {
        id: globalFieldProps.id,
        label: globalFieldProps.label,
        type: globalFieldProps.type,
        isRequired: globalFieldProps.isRequired,
        options: {
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
        }
    }
};

const EditableBlock = ({ field, path, isEditMode, selectedElement, inGroup, setSelectedElement }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && selectedElement === path);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && isEditMode ? "1px dashed #0A94F8" : "1px solid rgba(0,0,0,0)",
            position: "relative"
        }} onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}>
            {isInEditMode && isEditMode ? <button style={{ position: "absolute", top: "4px", right: "4px" }} type="button" onClick={() => setSelectedElement(path)}>edit</button> : null}
            {field}
        </div>
    );
};

const FiledConfigEditor = ({ path, config, handleEditFieldConfig }) => {
    return (
        <>
            <code>{path}</code>
            <br /><br />
            {typeof config === "object" ? Object.keys(config).map((key, index) => {
                return (
                    <div>{key}: <InputText value={config[key]} onChange={(e) => {
                        config[key] = e.target.value;
                        handleEditFieldConfig(path, config);
                    }} /></div>
                );
            }) : null}
        </>
    );
};

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const [data, setData] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedElement, setSelectedElement] = useState('');
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

    const handleEditFieldConfig = (path, config) => {
        const newConfig = [...currentConfig];
        setCurrentConfig(set(newConfig, path, config));
    };

    console.log({data, isEditMode, selectedElement, currentConfig});

    const renderFields = (fieldProps, fields, type = "field") => {
        if (typeof fields !== "object") return null;
        return (
            <>
                {Object.keys(fields).map(key => {
                    const field = fields[key];
                    if (isValidElement(field)) {
                        if (type === "group") return <EditableBlock setSelectedElement={setSelectedElement} inGroup field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />;
                        return <EditableBlock setSelectedElement={setSelectedElement} field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />;
                    } else if (typeof field === "object") {
                        if (Array.isArray(field)) {
                            // collection array
                            return (
                                <div style={{ margin: "16px 0 32px 0" }}>
                                    {field.map((entry, index) => (
                                        <div className="flex">
                                            {renderFields(fieldProps, entry, "group")}
                                            <div className="flex-1" style={{ marginTop: "32px" }}>
                                                <button type="button" onClick={() => fieldProps.onCollectionAction(key, "remove", index)}>remove</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                                </div>
                            );
                        } else {
                            return <div className="flex">{renderFields(fieldProps, field, "group")}</div>;
                        }
                    }
                })}
            </>
        );
    };

    return (
        <div style={{ marginRight: "350px" }}>
            <h2>Community "{communitySlug}" - Form "{formSlug}"</h2>
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
                                    {renderFields(fieldProps, fieldProps.fields)}
                                </div>
                            </form>
                            {isEditMode ? (
                                <ScrollPanel style={{ width: '350px', height: '100vh', position: "fixed", top: 0, right: 0, borderLeft: "1px solid #ccc", padding: "12px" }}>
                                    <h3>Inspector:</h3>
                                    <FiledConfigEditor path={selectedElement} config={fieldProps.getConfig(selectedElement)} handleEditFieldConfig={handleEditFieldConfig} />
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