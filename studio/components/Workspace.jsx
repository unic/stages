import { useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from "framer-motion";
import _ from "lodash";
import Sugar from "sugar";
import { ContextMenu } from 'primereact/contextmenu';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Toast } from 'primereact/toast';
import {
    Undo,
    Redo,
    Monitor,
    Tablet,
    Smartphone,
    Camera,
    ChevronRight,
    Scissors,
    Copy,
    ClipboardPaste,
    Link2,
    ArrowUpToLine,
    ArrowDownToLine,
    MoveUp,
    MoveDown,
    Group,
    Ungroup,
    Brackets,
    Braces,
    Unplug
} from 'lucide-react';
import { Form } from "react-stages";
import StagesIcon from './StagesIcon';
import primeFields from './primeFields';
import initialConfig from './initialConfig';
import useStagesStore from './store';
import { initNewCollections, removeEmptyElements } from "./helpers";

import { getConfigPathFromDataPath, createNewFieldID, parseJSONConfig, arrayMove } from './helpers';
import { FieldRenderer } from './FieldRenderer';

const Workspace = () => {
    const toast = useRef(null);
    const contextMenuRef = useRef(null);
    const store = useStagesStore();

    console.log({store});

    const onKeyPress = (e) => {
        if (e.key === "c" && (e.ctrlKey || e.metaKey) && store.selectedElement) {
            handleCopyField(store.selectedElement);
        }
        if (e.key === "v" && (e.ctrlKey || e.metaKey) && store.selectedElement) {
            handlePasteField(store.selectedElement);
        }
        if (e.key === "x" && (e.ctrlKey || e.metaKey) && store.selectedElement) {
            handleCutField(store.selectedElement);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyPress);
    }, []);

    const rootContextMenuItems = [
        { label: 'Clear', command: () => handleInitConfig([{
            id: "field1",
            type: "text",
            label: "Field 1",
        }]) },
        { label: 'Init with Demo Form', command: () => handleInitConfig(initialConfig) },
    ];

    const fieldContextMenuItems = [
        { label: 'Cut', icon: <Scissors size={16} style={{ marginRight: "8px" }} />, command: () => handleCutField(store.activeContextMenuInput) },
        { label: 'Copy', icon: <Copy size={16} style={{ marginRight: "8px" }} />, command: () => handleCopyField(store.activeContextMenuInput) },
        { label: 'Paste', icon: <ClipboardPaste size={16} style={{ marginRight: "8px" }} />, command: () => handlePasteField(store.activeContextMenuInput) },
        { label: 'Copy Path', icon: <Link2 size={16} style={{ marginRight: "8px" }} />, command: () => handleCopyFieldPath(store.activeContextMenuInput) },
        { separator: true },
        { label: 'Move Up', icon: <MoveUp size={16} style={{ marginRight: "8px" }} />, command: () => handleMoveField(store.activeContextMenuInput, "up") },
        { label: 'Move Down', icon: <MoveDown size={16} style={{ marginRight: "8px" }} />, command: () => handleMoveField(store.activeContextMenuInput, "down") },
        { label: 'Move Top', icon: <ArrowUpToLine size={16} style={{ marginRight: "8px" }} />, command: () => handleMoveField(store.activeContextMenuInput, "top") },
        { label: 'Move Bottom', icon: <ArrowDownToLine size={16} style={{ marginRight: "8px" }} />, command: () => handleMoveField(store.activeContextMenuInput, "bottom") },
        { separator: true },
        { label: 'Group', icon: <Group size={16} style={{ marginRight: "8px" }} />, command: () => handleGroupField(store.activeContextMenuInput) },
        { label: 'Ungroup', icon: <Ungroup size={16} style={{ marginRight: "8px" }} />, command: () => handleUngroupField(store.activeContextMenuInput) },
        { label: 'Create Collection', icon: <Brackets size={16} style={{ marginRight: "8px" }} />, command: () => handleCollectionField(store.activeContextMenuInput) },
        { separator: true },
        { label: 'Create Fieldset', icon: <Braces size={16} style={{ marginRight: "8px" }} />, command: () => handleCreateFieldset(store.activeContextMenuInput) },
        { label: 'Disconnect Fieldset', icon: <Unplug size={16} style={{ marginRight: "8px" }} />, command: () => handleDisconnectFieldset(store.activeContextMenuInput) },
    ];

    const insertContextMenuItems = [
        { label: 'Paste', icon: <ClipboardPaste size={16} style={{ marginRight: "8px" }} />, command: () => handlePasteBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { separator: true },
        { label: 'Insert Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", "")), items: [
            { label: 'Insert Text Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "text") },
            { label: 'Insert Textarea Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "textarea") },
            { label: 'Insert Select', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "select") },
            { label: 'Insert Multi Select', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "multiselect") },
            { label: 'Insert Calendar', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "calendar") },
            { label: 'Insert Checkbox', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "checkbox") },
            { label: 'Insert Switch', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "switch") },
            { label: 'Insert Number Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "number") },
            { label: 'Insert Rating Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "rating") },
            { label: 'Insert Buttons', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "buttons") },
            { label: 'Insert Slider', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "slider") },
            { label: 'Insert Toggle', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "toggle") },
            { label: 'Insert Editor', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "editor") },
            { label: 'Insert Chips Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "chips") },
            { label: 'Insert Color Picker', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "color") },
            { label: 'Insert Mask Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "mask") },
            { label: 'Insert Password Field', command: () => handleInsertFieldBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), "password") },
        ] },
        { label: 'Insert Group', command: () => handleInsertGroupBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Collection', command: () => handleInsertCollectionBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Wizard', command: () => handleInsertWizardBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { separator: true },
        { label: 'Insert Divider', command: () => handleInsertDividerBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Heading', command: () => handleInsertHeadingBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { label: 'Insert Message', command: () => handleInsertMessageBetweenFields(store.activeContextMenuInput.replace("insert > ", "")) },
        { separator: true },
        { label: 'Insert Fieldset', items: store.fieldsets.map(fieldset => {
            return { label: fieldset.label, command: () => handleInsertFieldsetBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), fieldset.id, fieldset.label) };
        })},
    ];

    const stageContextMenuItems = [
        { label: 'Insert Stage', command: () => handleInsertStage(store.activeContextMenuInput.replace("stage > ", "")) }
    ];

    const handleInitConfig = (config) => {
        console.log("--> handleClearConfig <--");
        store.updateCurrentConfig(config);
        store.setSelectedElement("");
    };

    const handleCopyFieldPath = (path) => {
        if (typeof navigator !== "undefined") navigator.clipboard.writeText(path);
    };

    const handleCutField = (path) => {
        console.log("--> handleCutField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        store.setClipboard(_.get(newConfig, realPath));
        _.unset(newConfig, realPath);
        store.updateCurrentConfig(removeEmptyElements(newConfig));
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

    const handleCreateFieldset = (path) => {
        console.log("--> handleCreateFieldset <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const newFieldConfig = {
            id: oldFieldConfig.id,
            type: oldFieldConfig.id,
            fields: [oldFieldConfig]
        };
        _.set(newConfig, realPath, newFieldConfig);
        store.addFieldset(oldFieldConfig.id, oldFieldConfig.label || oldFieldConfig.id, Array.isArray(oldFieldConfig) ? oldFieldConfig : [oldFieldConfig], path);
        store.updateCurrentConfig(newConfig);
    };

    const handleUngroupField = (path) => {
        console.log("--> handleUngroupField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        let index = parseInt(realPath.substring(lastArrayIndex + 1));
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        if ((oldFieldConfig.type === "group" || oldFieldConfig.type === "collection") && oldFieldConfig.fields) {
            _.unset(newConfig, realPath);
            oldFieldConfig.fields.forEach(field => {
                arrayToInsertInto.splice(index, 0, {...field, id: createNewFieldID(path, field.id, store)});
                index++;
            });
            _.set(newConfig, parentOfRealPath, arrayToInsertInto);
            store.updateCurrentConfig(removeEmptyElements(newConfig));
            store.setSelectedElement('');
        }
    };

    const handleMoveField = (path, to) => {
        console.log("--> handleUngroupField <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const lastArrayIndex = realPath.lastIndexOf("[");
        const parentOfRealPath = realPath.substring(0, lastArrayIndex);
        let index = parseInt(realPath.substring(lastArrayIndex + 1));
        let arrayToInsertInto;
        if (parentOfRealPath !== "") {
            arrayToInsertInto = _.get(newConfig, parentOfRealPath);
        } else {
            arrayToInsertInto = newConfig;
        }
        if (to === "up" && index > 0) arrayMove(arrayToInsertInto, index, index - 1);
        if (to === "down" && index < arrayToInsertInto.length - 1) arrayMove(arrayToInsertInto, index, index + 1);
        if (to === "top") arrayMove(arrayToInsertInto, index, 0);
        if (to === "bottom") arrayMove(arrayToInsertInto, index, arrayToInsertInto.length - 1);
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(removeEmptyElements(newConfig));
    };

    const handleDisconnectFieldset = (path) => {
        console.log("--> handleDisconnectFieldset <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const fieldset = _.find(store.fieldsets, { id: oldFieldConfig.type });
        if (fieldset) {
            _.unset(newConfig, realPath);
            _.set(newConfig, realPath, {
                id: oldFieldConfig.id,
                type: "group",
                fields: fieldset.config
            });
            store.updateCurrentConfig(newConfig);
        }
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
        store.setData(initNewCollections(newConfig, store.data));
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

    const handleInsertFieldBetweenFields = (path, fieldType) => {
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
            type: fieldType || "text",
            label: "Field",
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement('');
    };

    const handleInsertFieldsetBetweenFields = (path, fieldsetType, label) => {
        console.log("--> handleInsertFieldsetBetweenFields <--");
        // Add new fieldset between fields:
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
            id: createNewFieldID(path, fieldsetType, store),
            type: fieldsetType,
            label: label,
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
        store.setData(initNewCollections(newConfig, store.data));

        store.setSelectedElement('');
    };

    const handleInsertWizardBetweenFields = (path) => {
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
            id: createNewFieldID(path, "wizard", store),
            type: "wizard",
            label: "Wizard",
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
                },
                {
                    id: "step3",
                    type: "stage",
                    label: "Step 3",
                    fields: [
                        {
                            id: "field1",
                            type: "text",
                            label: "Field 1 (Step 3)",
                            isRequired: true
                        },
                        {
                            id: "field2",
                            type: "text",
                            label: "Field 2 (Step 3)"
                        },
                    ]
                }
            ]
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement('');
    };

    const handleInsertStage = (path) => {
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
            id: createNewFieldID(path, "stage", store),
            type: "stage",
            label: "Stage",
            fields: [
                {
                    id: "field1",
                    type: "text",
                    label: "Field 1",
                    isRequired: true
                }
            ]
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        store.updateCurrentConfig(newConfig);
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

    const handleInsertMessageBetweenFields = (path) => {
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
            id: createNewFieldID(path, "message", store),
            type: "message",
            text: "Your message ...",
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

    const createFieldsets = () => {
        const fieldSets = {};
        store.fieldsets.forEach(fieldset => {
            fieldSets[fieldset.id] = {
                params: {},
                config: () => {
                    return fieldset.config;
                },
                render: ({ fieldProps }) => {
                    return (
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
                            fieldsetId={fieldset.id}
                        />
                    );
                }
            }
        });
        return fieldSets;
    };

    const fromDate = store?.generalConfig?.date?.from ? new Sugar.Date(store.generalConfig.date.from) : "";
    const toDate = store?.generalConfig?.date?.to ? new Sugar.Date(store.generalConfig.date.to) : "";
    const now = new Date();

    return (
        <ScrollPanel style={{ width: "100%",height: '100vh', background: store.isEditMode ? "url(/editor-bg-pattern.svg)" : "transparent" }}>
            <Toast position="center" ref={toast} />
            <div style={{ padding: "16px", position: "relative", }}>
                <div style={{ position: "absolute", top: "18px", right: "24px", cursor: "pointer" }}>
                    <span onClick={() => store.isEditMode ? store.setPreviewMode() : store.setEditMode()}><StagesIcon /></span>
                </div>
                {store.isEditMode ? (
                    <div style={{ position: "absolute", top: "24px", right: "68px", border: "1px #ddd solid", background: "#fff", borderRadius: "3px", height: "24px", padding: "2px 0" }}>
                        <button title="undo" type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.undo()}><Undo color="#999" size={16} /></button>
                        <button title="redo" type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.redo()}><Redo color="#999" size={16} /></button>
                    </div>
                ) : null}
                {store.isEditMode ? (
                    <div style={{ position: "absolute", top: "24px", right: "134px", border: "1px #ddd solid", background: "#fff", borderRadius: "3px", height: "24px", padding: "2px 0" }}>
                        <button
                            title="add snapshot"
                            type="button"
                            style={{ border: "none", background: "transparent", cursor: "pointer" }}
                            onClick={() => {
                                store.addSnapshot();
                                toast.current.show({severity:'success', summary: 'Success!', detail:'New data snapshot created.', life: 2000});
                            }}
                        ><Camera color="#999" size={16} /></button>
                    </div>
                ) : null}
                {store.isEditMode ? (
                    <div style={{ position: "absolute", top: "24px", right: "172px", border: "1px #ddd solid", background: "#fff", borderRadius: "3px", height: "24px", padding: "2px 0" }}>
                        <button title="mobile" type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.switchPreviewSize("mobile")}><Smartphone color={store.previewSize === "mobile" ? "#000" : "#999"} size={16} /></button>
                        <button title="tablet" type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.switchPreviewSize("tablet")}><Tablet color={store.previewSize === "tablet" ? "#000" : "#999"} size={16} /></button>
                        <button title="desktop" type="button" style={{ border: "none", background: "transparent", cursor: "pointer" }} onClick={() => store.switchPreviewSize("desktop")}><Monitor color={store.previewSize === "desktop" ? "#000" : "#999"} size={16} /></button>
                    </div>
                ) : null}
                {!store.isEditMode ? (
                    <motion.div
                        style={{
                            position: "absolute",
                            top: "25px",
                            right: "60px",
                            color: "#666",
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            right: ["60px", "50px", "60px"],
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >click to edit form <ChevronRight color="#000" size={16} style={{ verticalAlign: "-3px" }} /></motion.div>
                ) : null}
                {store.generalConfig.locales.length > 1 ? (
                    <div style={{ position: "absolute", top: "28px", right: "276px", fontSize: "14px" }}>
                        <ul style={{ display: "flex",margin: 0, padding: 0, listStyleType: "none" }}>
                            {store.generalConfig.locales.map((locale, index) => (
                                <li key={locale} style={{ margin: 0, marginRight: "8px", padding: 0, color: index === 0 ? "#000" : "#999", cursor: "pointer" }}>{locale}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
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
                        model={
                            store.activeContextMenuInput === "." ? 
                            rootContextMenuItems : store.activeContextMenuInput.startsWith("insert > ") ? 
                            insertContextMenuItems : store.activeContextMenuInput.startsWith("stage > ") ? 
                            stageContextMenuItems : fieldContextMenuItems
                        }
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
                                <form
                                    onContextMenu={(e) => {
                                        if (contextMenuRef && contextMenuRef.current) {
                                            contextMenuRef.current.show(e);
                                            store.setActiveContextMenuInput(".");
                                        }
                                    }} onClick={() => {
                                        store.setSelectedElement("");
                                        store.setEditorTabIndex(0);
                                    }}
                                >
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
                    fieldsets={createFieldsets()}
                />
            </div>
        </ScrollPanel>
    );
};

export default Workspace;