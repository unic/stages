import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import { ScrollPanel } from 'primereact/scrollpanel';
import primeFields from '../../../../components/primeFields';
import set from "lodash.set";
import get from "lodash.get";
import unset from "lodash.unset";
import { ContextMenu } from 'primereact/contextmenu';
import FieldConfigEditor from '../../../../components/FieldConfigEditor';

import { renderFields, getConfigPathFromDataPath } from '../../../../components/helpers';

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const [data, setData] = useState({});
    const contextMenuRef = useRef(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedElement, setSelectedElement] = useState('');
    const [activeContextMenuInput, setActiveContextMenuInput] = useState('');
    const [clipboard, setClipboard] = useState(null);
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

    console.log({ isEditMode, selectedElement, activeContextMenuInput, clipboard, currentConfig, data });

    const fieldContextMenuItems = [
        { label: 'Cut', icon: 'pi pi-fw pi-trash', command: () => handleCutField(activeContextMenuInput) },
        { label: 'Copy', icon: 'pi pi-fw pi-trash', command: () => handleCopyField(activeContextMenuInput) },
        { label: 'Paste', icon: 'pi pi-fw pi-trash', command: () => handlePasteField(activeContextMenuInput) }
    ];

    const insertContextMenuItems = [
        { label: 'Paste', icon: 'pi pi-fw pi-trash', command: () => handlePasteBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Field', icon: 'pi pi-fw pi-trash', command: () => handleInsertFieldBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Group', icon: 'pi pi-fw pi-trash', command: () => handleInsertGroupBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Collection', icon: 'pi pi-fw pi-trash', command: () => handleInsertCollectionBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
    ];

    const handleCutField = (path) => {
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        setClipboard(get(newConfig, realPath));
        unset(newConfig, realPath);
        setCurrentConfig(newConfig);
    };

    const handleCopyField = (path) => {
        const realPath = getConfigPathFromDataPath(path, currentConfig);
        setClipboard(get(currentConfig, realPath));
    };

    const handlePasteField = (path) => {
        if (clipboard) {
            const newConfig = [...currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            set(newConfig, realPath, clipboard);
            setCurrentConfig(newConfig);
        }
    };

    const handleInsertFieldBetweenFields = (path) => {
        // Add new group between fields:
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1));
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: `inserted-${new Date().getTime()}`,
            type: "text",
            label: "Field",
        });
        set(newConfig, parentOfRealPath, arrayToInsertInto);
        setCurrentConfig(newConfig);
    };

    const handleInsertGroupBetweenFields = (path) => {
        // Add new group between fields:
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1));
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: `inserted-${new Date().getTime()}`,
            type: "group",
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
                    isRequired: true
                }
            ]
        });
        set(newConfig, parentOfRealPath, arrayToInsertInto);
        setCurrentConfig(newConfig);
    };

    const handleInsertCollectionBetweenFields = (path) => {
        // Add new group between fields:
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1));
        const newTempId =`inserted-${new Date().getTime()}`
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: newTempId,
            type: "collection",
            init: true,
            min: 1,
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
                    isRequired: true
                }
            ]
        });

        // Update config:
        set(newConfig, parentOfRealPath, arrayToInsertInto);
        setCurrentConfig(newConfig);

        // Update data (for collections, a new empty array has to be addeed):
        const newData = {...data};
        newData[newTempId] = [{}];
        setData(newData);
    };

    const handlePasteBetweenFields = (path) => {
        // Add clipboard content after path:
        if (clipboard) {
            const newConfig = [...currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            const lastArrayIndex = realPath.lastIndexOf("[");
            const parentOfRealPath = realPath.substring(0, lastArrayIndex);
            const index = parseInt(realPath.substring(lastArrayIndex + 1));
            let arrayToInsertInto;
            if (parentOfRealPath !== "") {
                arrayToInsertInto = get(newConfig, parentOfRealPath);
            } else {
                arrayToInsertInto = newConfig;
            }
            arrayToInsertInto.splice(index, 0, {...clipboard, id: `pasted-${new Date().getTime()}`});
            set(newConfig, parentOfRealPath, arrayToInsertInto);
            setCurrentConfig(newConfig);
        }
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
            {isEditMode ? <ContextMenu model={activeContextMenuInput.startsWith("insert > ") ? insertContextMenuItems : fieldContextMenuItems} ref={contextMenuRef} breakpoint="767px" /> : null}
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
                                    {renderFields("", setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, fieldProps.fields)}
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