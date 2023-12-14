import { useRef, useEffect } from 'react';
import _ from "lodash";
import Sugar from "sugar";
import { ContextMenu } from 'primereact/contextmenu';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Undo } from 'lucide-react';
import { Redo } from 'lucide-react';
import { Monitor } from 'lucide-react';
import { Tablet } from 'lucide-react';
import { Smartphone } from 'lucide-react';
import { Form } from "react-stages";
import StagesIcon from './StagesIcon';
import primeFields from './primeFields';
import initialConfig from './initialConfig';
import useStagesStore from './store';

import { getConfigPathFromDataPath, createNewFieldID, parseJSONConfig } from './helpers';
import { FieldRenderer } from './FieldRenderer';

const Workspace = () => {
    const contextMenuRef = useRef(null);
    const store = useStagesStore();

    const rootContextMenuItems = [
        { label: 'Clear', icon: 'pi pi-fw pi-trash', command: () => handleInitConfig([{
            id: "field1",
            type: "text",
            label: "Field 1",
        }]) },
        { label: 'Init with Demo Form', icon: 'pi pi-fw pi-trash', command: () => handleInitConfig(initialConfig) },
    ];

    const fieldContextMenuItems = [
        { label: 'Cut', icon: 'pi pi-fw pi-trash', command: () => handleCutField(store.activeContextMenuInput) },
        { label: 'Copy', icon: 'pi pi-fw pi-trash', command: () => handleCopyField(store.activeContextMenuInput) },
        { label: 'Paste', icon: 'pi pi-fw pi-trash', command: () => handlePasteField(store.activeContextMenuInput) },
        { label: 'Group', icon: 'pi pi-fw pi-trash', command: () => handleGroupField(store.activeContextMenuInput) },
        { label: 'Add to collection', icon: 'pi pi-fw pi-trash', command: () => handleCollectionField(store.activeContextMenuInput) }
    ];

    const insertContextMenuItems = [
        { label: 'Paste', icon: 'pi pi-fw pi-trash', command: () => handlePasteBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Field', icon: 'pi pi-fw pi-trash', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Group', icon: 'pi pi-fw pi-trash', command: () => handleInsertGroupBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Collection', icon: 'pi pi-fw pi-trash', command: () => handleInsertCollectionBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Divider', icon: 'pi pi-fw pi-trash', command: () => handleInsertDividerBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Heading', icon: 'pi pi-fw pi-trash', command: () => handleInsertHeadingBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
    ];

    const handleInitConfig = (config) => {
        console.log("--> handleClearConfig <--");
        store.updateCurrentConfig(config);
        store.setSelectedElement("");
    };

    const handleCutField = (path) => {
        console.log("--> handleCutField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        store.setClipboard(_.get(newConfig, realPath));
        _.unset(newConfig, realPath);
        store.updateCurrentConfig(Array.isArray(newConfig) ? newConfig.filter(item => item) : newConfig);
        // If field is selected, unselect it
        store.removePathFromSelectedElements(path);
    };

    const handleGroupField = (path) => {
        console.log("--> handleGroupField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const newFieldConfig = {
            id: createNewFieldID(path, "group", store),
            type: "group",
            fields: [oldFieldConfig]
        }
        _.set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);
    };

    const handleCollectionField = (path) => {
        console.log("--> handleCollectionField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const newTempId = createNewFieldID(path, "collection", store);
        const newFieldConfig = {
            id: newTempId,
            type: "collection",
            init: true,
            min: 1,
            fields: [oldFieldConfig]
        }
        _.set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);

        // Update data (for collections, a new empty array has to be addeed):
        const newData = {...store.data};
        newData[newTempId] = [{}];
        store.setData(newData);
    };

    const handleCopyField = (path) => {
        console.log("--> handleCopyField <--");
        const realPath = getConfigPathFromDataPath(path, store.currentConfig);
        store.setClipboard(_.get(store.currentConfig, realPath));
    };

    const handlePasteField = (path) => {
        console.log("--> handlePasteField <--");
        if (store.clipboard) {
            const newConfig = [...store.currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            _.set(newConfig, realPath, store.clipboard);
            store.updateCurrentConfig(newConfig);
        }
    };

    const handleInsertFieldBetweenFields = (path) => {
        console.log("--> handleInsertFieldBetweenFields <--");
        // Add new group between fields:
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "text", store),
            type: "text",
            label: "Field",
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement('');
    };

    const handleInsertGroupBetweenFields = (path) => {
        console.log("--> handleInsertGroupBetweenFields <--");
        // Add new group between fields:
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "group", store),
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
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement('');
    };

    const handleInsertCollectionBetweenFields = (path) => {
        console.log("--> handleInsertCollectionBetweenFields <--");
        // Add new group between fields:
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1));
        const newTempId = createNewFieldID(path, "collection", store);
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
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
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);

        // Update data (for collections, a new empty array has to be addeed):
        const newData = {...store.data};
        newData[newTempId] = [{}];
        store.setData(newData);

        store.setSelectedElement('');
    };

    const handleInsertDividerBetweenFields = (path) => {
        console.log("--> handleInsertDividerBetweenFields <--");
        // Add new group between fields:
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "divider", store),
            type: "divider"
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement('');
    };

    const handleInsertHeadingBetweenFields = (path) => {
        console.log("--> handleInsertDividerBetweenFields <--");
        // Add new group between fields:
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "heading", store),
            type: "heading",
            title: "Heading",
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement('');
    };

    const handlePasteBetweenFields = (path) => {
        console.log("--> handlePasteBetweenFields <--");
        // Add clipboard content after path:
        if (store.clipboard) {
            const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
            let newConfig = [...store.currentConfig];
            const realPath = getConfigPathFromDataPath(path.slice(-1) === "+" ? path.slice(0, -1) : path, newConfig);
            const lastArrayIndex = realPath.lastIndexOf("[");
            const parentOfRealPath = realPath.substring(0, lastArrayIndex);
            const index = parseInt(realPath.substring(lastArrayIndex + 1)) + addIndexOffset;
            let arrayToInsertInto;
            if (parentOfRealPath !== "") {
                arrayToInsertInto = _.get(newConfig, parentOfRealPath);
            } else {
                arrayToInsertInto = newConfig;
            }
            arrayToInsertInto.splice(index, 0, {...store.clipboard, id: createNewFieldID(path, store.clipboard.type, store)});
            if (parentOfRealPath) {
                _.set(newConfig, parentOfRealPath, arrayToInsertInto);
            } else {
                newConfig = arrayToInsertInto;
            }
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
    };

    const handleEditCollection = (path, isShiftKey) => {
        console.log("--> handleEditCollection <--");
        store.setSelectedElement(path, isShiftKey);
        store.setEditorTabIndex(1);
    };
    
    const handleEditGroup = (path, isShiftKey) => {
        console.log("--> handleEditGroup <--");
        store.setSelectedElement(path, isShiftKey);
        store.setEditorTabIndex(1);
    };

    const fromDate = store?.generalConfig?.date?.from ? new Sugar.Date(store.generalConfig.date.from) : "";
    const toDate = store?.generalConfig?.date?.to ? new Sugar.Date(store.generalConfig.date.to) : "";
    const now = new Date();

    return (
        <ScrollPanel style={{ width: "100%",height: '100vh', background: store.isEditMode ? "url(/editor-bg-pattern.svg)" : "transparent" }}>
            <div style={{ padding: "16px", position: "relative", }}>
                <div style={{ position: "absolute", top: "18px", right: "24px", cursor: "pointer" }}>
                    <span onClick={() => store.isEditMode ? store.setPreviewMode() : store.setEditMode()}><StagesIcon /></span>
                </div>
                {store.isEditMode ? (
                    <div style={{ position: "absolute", top: "24px", right: "68px", border: "1px #ddd solid", background: "#fff", borderRadius: "3px", height: "24px", padding: "2px 0" }}>
                        <button type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.undo()}><Undo color="#999" size={16} /></button>
                        <button type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.redo()}><Redo color="#999" size={16} /></button>
                    </div>
                ) : null}
                <div style={{ position: "absolute", top: "24px", right: "134px", border: "1px #ddd solid", background: "#fff", borderRadius: "3px", height: "24px", padding: "2px 0" }}>
                    <button type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.switchPreviewSize("mobile")}><Smartphone color={store.previewSize === "mobile" ? "#000" : "#999"} size={16} /></button>
                    <button type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.switchPreviewSize("tablet")}><Tablet color={store.previewSize === "tablet" ? "#000" : "#999"} size={16} /></button>
                    <button type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.switchPreviewSize("desktop")}><Monitor color={store.previewSize === "desktop" ? "#000" : "#999"} size={16} /></button>
                </div>
                <div style={{ marginLeft: "8px", marginTop: "-11px" }}>
                    <h2>
                        {store.generalConfig.title}
                        <span style={{ color: "#999", fontSize: "12px", fontWeight: "300", marginLeft: "16px", display: "inline-block" }}>
                            {fromDate ? `From ${fromDate.long()}, in ${fromDate.relativeTo(now)}` : ""}
                            {fromDate && toDate ? " - " : ""}
                            {toDate ? `Due date ${toDate.long()}, in ${toDate.relativeTo(now)}` : ""}
                        </span>
                    </h2>
                </div>
                {store.isEditMode ? (
                    <ContextMenu
                        model={store.activeContextMenuInput === "." ? rootContextMenuItems : store.activeContextMenuInput.startsWith("insert > ") ? insertContextMenuItems : fieldContextMenuItems}
                        ref={contextMenuRef}
                        breakpoint="767px"
                    />
                ) : null}
                {!store.isEditMode ? <div><br /></div> : null}
                <Form
                    id="myForm"
                    data={store.data}
                    fields={primeFields}
                    config={{
                        fields: () => {
                            return parseJSONConfig(store.currentConfig, store.data);
                        }
                    }}
                    render={({ actionProps, fieldProps }) => {
                        return (
                            <>
                                <form onContextMenu={(e) => {
                                    if (contextMenuRef && contextMenuRef.current) {
                                        contextMenuRef.current.show(e);
                                        store.setActiveContextMenuInput(".");
                                    }
                                }} onClick={() => {
                                    store.setSelectedElement("");
                                    store.setEditorTabIndex(0);
                                }}>
                                    <div style={{ position: "relative", maxWidth: store.previewSize === "mobile" ? "480px" : store.previewSize === "tablet" ? "640px" : "960px", margin: "0 auto", paddingBottom: "64px" }}>
                                        <FieldRenderer
                                            handleEditCollection={handleEditCollection}
                                            handleEditGroup={handleEditGroup}
                                            parent=""
                                            setActiveContextMenuInput={store.setActiveContextMenuInput}
                                            contextMenuRef={contextMenuRef}
                                            isEditMode={store.isEditMode}
                                            selectedElement={store.selectedElement}
                                            fieldProps={fieldProps}
                                            fields={fieldProps.fields}
                                        />
                                        <br />
                                        <Button
                                            type="button"
                                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                </form>
                            </>
                        );
                    }}
                    onChange={payload => store.setData(payload)}
                />
            </div>
        </ScrollPanel>
    );
};

export default Workspace;