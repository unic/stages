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

    const fieldContextMenuItems = [
        { label: 'Cut', icon: 'pi pi-fw pi-trash', command: () => handleCutField(activeContextMenuInput) },
        { label: 'Copy', icon: 'pi pi-fw pi-trash', command: () => handleCopyField(activeContextMenuInput) },
        { label: 'Paste', icon: 'pi pi-fw pi-trash', command: () => handlePasteField(activeContextMenuInput) },
        { label: 'Group', icon: 'pi pi-fw pi-trash', command: () => handleGroupField(activeContextMenuInput) },
        { label: 'Add to collection', icon: 'pi pi-fw pi-trash', command: () => handleCollectionField(activeContextMenuInput) }
    ];

    const insertContextMenuItems = [
        { label: 'Paste', icon: 'pi pi-fw pi-trash', command: () => handlePasteBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Field', icon: 'pi pi-fw pi-trash', command: () => handleInsertFieldBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Group', icon: 'pi pi-fw pi-trash', command: () => handleInsertGroupBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Collection', icon: 'pi pi-fw pi-trash', command: () => handleInsertCollectionBetweenFields(activeContextMenuInput.replace("insert > ", "")) },
    ];

    const doesPathExist = (path) => {
        const configPath = getConfigPathFromDataPath(path, currentConfig);
        const config = get(currentConfig, configPath);
        return configPath !== '' && config;
    };

    const createNewFieldID = (path, type) => {
        const parentPath = path.substring(0, path.lastIndexOf("."));
        let counter = 1;
        let newFieldID = `${type}${counter}`;
        while (doesPathExist(parentPath ? `${parentPath}.${newFieldID}` : newFieldID)) {
            counter++;
            newFieldID = `${type}${counter}`;
        }
        console.log({path, parentPath, type, newFieldID, currentConfig});
        return newFieldID;
    };

    const handleCutField = (path) => {
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        setClipboard(get(newConfig, realPath));
        unset(newConfig, realPath);
        setCurrentConfig(newConfig);
    };

    const handleGroupField = (path) => {
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = get(newConfig, realPath);
        const newFieldConfig = {
            id: createNewFieldID(path, "group"),
            type: "group",
            fields: [oldFieldConfig]
        }
        set(newConfig, realPath, newFieldConfig);
        setCurrentConfig(newConfig);
    };

    const handleCollectionField = (path) => {
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = get(newConfig, realPath);
        const newTempId = createNewFieldID(path, "collection");
        const newFieldConfig = {
            id: newTempId,
            type: "collection",
            init: true,
            min: 1,
            fields: [oldFieldConfig]
        }
        set(newConfig, realPath, newFieldConfig);
        setCurrentConfig(newConfig);

        // Update data (for collections, a new empty array has to be addeed):
        const newData = {...data};
        newData[newTempId] = [{}];
        setData(newData);
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
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "text"),
            type: "text",
            label: "Field",
        });
        set(newConfig, parentOfRealPath, arrayToInsertInto);
        setCurrentConfig(newConfig);
        setSelectedElement('');
    };

    const handleInsertGroupBetweenFields = (path) => {
        // Add new group between fields:
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "group"),
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
        setSelectedElement('');
    };

    const handleInsertCollectionBetweenFields = (path) => {
        // Add new group between fields:
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1));
        const newTempId = createNewFieldID(path, "collection");
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

        setSelectedElement('');
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
            arrayToInsertInto.splice(index, 0, {...clipboard, id: createNewFieldID(path, clipboard.type)});
            set(newConfig, parentOfRealPath, arrayToInsertInto);
            setCurrentConfig(newConfig);
        }
        setSelectedElement('');
    };

    const handleEditFieldConfig = (path, config) => {
        if (!config.id) return;
        const newConfig = [...currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        if (realPath && Object.keys(config).length > 0) {
            const oldConfig = get(currentConfig, realPath);
            if (config.type === "group" || config.type === "collection") {
                set(newConfig, realPath.substring(0, realPath.length - 7), {...config, fields: config.fields});
            } else {
                set(newConfig, realPath, config);
            }
            if (oldConfig.id !== config.id) setSelectedElement(config.id);
        }
        setCurrentConfig(newConfig);
    };

    const handleEditCollection = (path) => {
        setSelectedElement(path);
    };
    
    const handleEditGroup = (path) => {
        setSelectedElement(path);
    };

    const downloadFile = ({ data, fileName, fileType }) => {
        // Create a blob with the data we want to download as a file
        const blob = new Blob([data], { type: fileType });
        // Create an anchor element and dispatch a click event on it
        // to trigger a download
        const a = document.createElement('a');
        a.download = fileName;
        a.href = window.URL.createObjectURL(blob);
        const clickEvt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        a.dispatchEvent(clickEvt);
        a.remove();
    }

    const exportToJson = e => {
        e.preventDefault();
        downloadFile({
            data: JSON.stringify(currentConfig),
            fileName: 'stages-config.json',
            fileType: 'text/json',
        })
    }

    return (
        <div style={{ marginRight: "350px" }}>
            <h2>Community "{communitySlug}" - Form "{formSlug}"</h2>
            {isEditMode ? <ContextMenu model={activeContextMenuInput.startsWith("insert > ") ? insertContextMenuItems : fieldContextMenuItems} ref={contextMenuRef} breakpoint="767px" /> : null}
            {isEditMode ? <button type="button" onClick={() => setIsEditMode(false)}>Preview</button> : <button type="button" onClick={() => setIsEditMode(true)}>Edit</button>}
            {isEditMode ? (
                <>
                    {" "}
                    <button type='button' onClick={exportToJson}>
                        Export Config
                    </button>
                </>
            ) : null}
            {!isEditMode ? <div><br /></div> : null}
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
                                <div style={{ position: "relative", maxWidth: "960px", margin: "0 auto" }}>
                                    {renderFields(handleEditCollection, handleEditGroup, "", setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, fieldProps.fields)}
                                </div>
                            </form>
                            {isEditMode ? (
                                <ScrollPanel style={{ width: '350px', height: '100vh', position: "fixed", top: 0, right: 0, borderLeft: "1px solid #ccc", padding: "12px" }}>
                                    <h3>Inspector:</h3>
                                    {selectedElement ? <FieldConfigEditor key={selectedElement} path={selectedElement} config={fieldProps.getConfig(selectedElement)} handleEditFieldConfig={handleEditFieldConfig} doesPathExist={doesPathExist} /> : null}
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