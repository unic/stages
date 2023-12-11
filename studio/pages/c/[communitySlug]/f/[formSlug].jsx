import { useRef } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import Sugar from "sugar";
import { TabMenu } from 'primereact/tabmenu';
import { ScrollPanel } from 'primereact/scrollpanel';
import primeFields from '../../../../components/primeFields';
import set from "lodash.set";
import get from "lodash.get";
import unset from "lodash.unset";
import { ContextMenu } from 'primereact/contextmenu';
import FieldConfigEditor from '../../../../components/FieldConfigEditor';
import useStagesStore from '../../../../components/store';
import StagesIcon from '../../../../components/StagesIcon';
import GeneralConfig from '../../../../components/GeneralConfig';
import DataInspector from '../../../../components/DataInspector';
import InspectorHeader from '../../../../components/InspectorHeader';
import { GitFork } from 'lucide-react';
import { Button } from 'primereact/button';

import { getConfigPathFromDataPath, createNewFieldID, downloadFile } from '../../../../components/helpers';
import { FieldRenderer } from '../../../../components/FieldRenderer';

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const contextMenuRef = useRef(null);
    const store = useStagesStore();

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
    ];

    const handleCutField = (path) => {
        console.log("--> handleCutField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        store.setClipboard(get(newConfig, realPath));
        unset(newConfig, realPath);
        store.updateCurrentConfig(Array.isArray(newConfig) ? newConfig.filter(item => item) : newConfig);
        // If field is selected, unselect it
        store.removePathFromSelectedElements(path);
    };

    const handleGroupField = (path) => {
        console.log("--> handleGroupField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = get(newConfig, realPath);
        const newFieldConfig = {
            id: createNewFieldID(path, "group", store),
            type: "group",
            fields: [oldFieldConfig]
        }
        set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);
    };

    const handleCollectionField = (path) => {
        console.log("--> handleCollectionField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = get(newConfig, realPath);
        const newTempId = createNewFieldID(path, "collection", store);
        const newFieldConfig = {
            id: newTempId,
            type: "collection",
            init: true,
            min: 1,
            fields: [oldFieldConfig]
        }
        set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);

        // Update data (for collections, a new empty array has to be addeed):
        const newData = {...store.data};
        newData[newTempId] = [{}];
        store.setData(newData);
    };

    const handleCopyField = (path) => {
        console.log("--> handleCopyField <--");
        const realPath = getConfigPathFromDataPath(path, store.currentConfig);
        store.setClipboard(get(store.currentConfig, realPath));
    };

    const handlePasteField = (path) => {
        console.log("--> handlePasteField <--");
        if (store.clipboard) {
            const newConfig = [...store.currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            set(newConfig, realPath, store.clipboard);
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
            arrayToInsertInto = get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        arrayToInsertInto.splice(index, 0, {
            id: createNewFieldID(path, "text", store),
            type: "text",
            label: "Field",
        });
        set(newConfig, parentOfRealPath, arrayToInsertInto);
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
            arrayToInsertInto = get(newConfig, parentOfRealPath);
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
        set(newConfig, parentOfRealPath, arrayToInsertInto);
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
        store.updateCurrentConfig(newConfig);

        // Update data (for collections, a new empty array has to be addeed):
        const newData = {...store.data};
        newData[newTempId] = [{}];
        store.setData(newData);

        store.setSelectedElement('');
    };

    const handlePasteBetweenFields = (path) => {
        console.log("--> handlePasteBetweenFields <--");
        // Add clipboard content after path:
        if (store.clipboard) {
            let newConfig = [...store.currentConfig];
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
            arrayToInsertInto.splice(index, 0, {...store.clipboard, id: createNewFieldID(path, store.clipboard.type, store)});
            if (parentOfRealPath) {
                set(newConfig, parentOfRealPath, arrayToInsertInto);
            } else {
                newConfig = arrayToInsertInto;
            }
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
    };

    const handleEditFieldConfig = (path, config) => {
        console.log("--> handleEditFieldConfig <--");
        if (Array.isArray(path)) {
            const newConfig = [...store.currentConfig];
            path.forEach(p => {
                // p = path, config = diff 
                const realPath = getConfigPathFromDataPath(p, newConfig);
                if (realPath && config.length > 0) {
                    const editedConfig = get(store.currentConfig, realPath);
                    config.forEach(c => {
                        editedConfig[c[0]] = c[1];
                    });
                    set(newConfig, realPath, editedConfig);
                }
            });
            store.updateCurrentConfig(newConfig);
        } else {
            if (!config.id) return;
            const newConfig = [...store.currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            if (realPath && Object.keys(config).length > 0) {
                const oldConfig = get(store.currentConfig, realPath);
                if (config.type === "group" || config.type === "collection") {
                    set(newConfig, realPath.substring(0, realPath.length - 7), {...config, fields: config.fields});
                } else {
                    set(newConfig, realPath, config);
                }
                if (oldConfig.id !== config.id) store.setSelectedElement(config.id);
            }
            store.updateCurrentConfig(newConfig);
            store.setEditorTabIndex(1);
        }
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

    const handleExportToJson = e => {
        e.preventDefault();
        downloadFile({
            data: JSON.stringify(store.currentConfig),
            fileName: 'stages-config.json',
            fileType: 'text/json',
        })
    }

    const fromDate = store.generalConfig.date.from ? new Sugar.Date(store.generalConfig.date.from) : "";
    const toDate = store.generalConfig.date.to ? new Sugar.Date(store.generalConfig.date.to) : "";
    const now = new Date();

    return (
        <div style={{ marginTop: "-16px", paddingTop: "16px", marginLeft: "-16px", paddingLeft: "16px", marginRight: store.isEditMode ? "350px" : 0, position: "relative", background: store.isEditMode ? "url(/editor-bg-pattern.svg)" : "transparent" }}>
            <div style={{ position: "absolute", top: "18px", right: "16px", cursor: "pointer" }}>
                <span onClick={() => store.isEditMode ? store.setPreviewMode() : store.setEditMode()}><StagesIcon /></span>
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
            {store.isEditMode ? <ContextMenu model={store.activeContextMenuInput.startsWith("insert > ") ? insertContextMenuItems : fieldContextMenuItems} ref={contextMenuRef} breakpoint="767px" /> : null}
            {!store.isEditMode ? <div><br /></div> : null}
            <Form
                id="myForm"
                data={store.data}
                fields={primeFields}
                config={{
                    fields: () => {
                        return store.currentConfig;
                    }
                }}
                render={({ actionProps, fieldProps }) => {
                    return (
                        <>
                            <form>
                                <div style={{ position: "relative", maxWidth: "940px", margin: "0 auto" }}>
                                    <FieldRenderer
                                        handleEditCollection={handleEditCollection}
                                        handleEditGroup={handleEditGroup}
                                        parent=""
                                        setActiveContextMenuInput={store.setActiveContextMenuInput}
                                        contextMenuRef={contextMenuRef}
                                        setSelectedElement={store.setSelectedElement}
                                        isEditMode={store.isEditMode}
                                        selectedElement={store.selectedElement}
                                        fieldProps={fieldProps}
                                        fields={fieldProps.fields}
                                    />
                                </div>
                            </form>
                            {store.isEditMode ? (
                                <ScrollPanel style={{ width: '350px', height: '100vh', position: "fixed", top: 0, right: 0, backgroundColor: "#FCFCFC", boxShadow: "0px 0px 32px 0px rgba(0,0,0,0.2)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "column", height: "100%" }}>
                                        <InspectorHeader />
                                        <div style={{ backgroundColor: "#fff", padding: "0 12px 0 12px" }}>
                                            <TabMenu model={[
                                                {label: 'General Config'},
                                                {label: 'Inspector'},
                                                {label: 'Data'}
                                            ]} activeIndex={store.editorTabIndex} onTabChange={(e) => store.setEditorTabIndex(e.index)} />
                                        </div>
                                        <div style={{ padding: "16px 12px", flexGrow: 1 }}>
                                            {store.editorTabIndex === 1 ? (
                                                <FieldConfigEditor
                                                    key={store.selectedElement}
                                                    path={store.selectedElement}
                                                    config={Array.isArray(store.selectedElement) ? store.selectedElement.map(item => fieldProps.getConfig(item)).filter(item => item) : fieldProps.getConfig(store.selectedElement)}
                                                    handleEditFieldConfig={handleEditFieldConfig}
                                                />
                                            ) : null}
                                            {store.editorTabIndex === 0 ? <GeneralConfig /> : null}
                                            {store.editorTabIndex === 2 ? <DataInspector /> : null}
                                        </div>
                                        <div style={{ backgroundColor: "#fff", padding: "16px 12px", borderTop: "1px #EAEAEA solid", display: "flex", justifyContent: "space-between" }}>
                                            <div style={{ paddingTop: "4px" }}><GitFork color="#000" size={16} /></div>
                                            <div>
                                            <Button link severity="secondary" onClick={handleExportToJson} style={{ padding: 0, fontSize: "14px" }}>
                                                Export Config
                                            </Button>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#999", paddingTop: "6px" }}>v 2023-03-27 16:11</div>
                                        </div>
                                    </div>
                                </ScrollPanel> 
                            ) : null}
                         </>
                    );
                }}
                onChange={payload => store.setData(payload)}
            />
        </div>
    )
};

export default CommunityForm;