import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from "framer-motion";
import sanitizeHtml from "sanitize-html";
import _ from "lodash";
import Sugar from "sugar";
import { DndContext } from '@dnd-kit/core';
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
import kitchensinkConfig from './kitchensinkConfig';

const Workspace = () => {
    const toast = useRef(null);
    const contextMenuRef = useRef(null);
    const store = useStagesStore();
    const [formCounter, setFormCounter] = useState(1);
    const [formTitle, setFormTitle] = useState(store.generalConfig.title || "Form");

    console.log({store});

    const handleEditFormTitle = useCallback(evt => {
        const sanitizeConf = {
            allowedTags: [],
            allowedAttributes: {}
        };
        const newTitle = sanitizeHtml(evt.currentTarget.innerHTML, sanitizeConf);
        setFormTitle(newTitle);
        store.onUpdateFormTitle(newTitle);
    }, []);

    const onKeyPress = (e) => {
        if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
            if (store.selectedElement && typeof store.selectedElement === "string") handleCopyField(store.selectedElement);
        }
        if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
            handlePasteField(store.selectedElement);
        }
        if (e.key === "x" && (e.ctrlKey || e.metaKey)) {
            if (store.selectedElement && typeof store.selectedElement === "string") handleCutField(store.selectedElement);
        }
        if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
            store.undo();
        }
        if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            store.redo();
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyPress);
    }, []);

    const rootContextMenuItems = [
      { label: "Clear", command: () => handleInitConfig([]) },
      {
        label: "Init with Templating Example",
        command: () =>
          handleInitConfig([
            {
              id: "heading",
              type: "heading",
              title: "Team Registration",
              blockWidth: {
                mobile: "large",
                tablet: "large",
                desktop: "large",
              },
              level: 2,
              text: "Add your team members and than submit them for registration",
            },
            {
              id: "eventName",
              type: "text",
              label: "Event Name",
              blockWidth: {
                mobile: "large",
                tablet: "large",
                desktop: "large",
              },
              isRequired: true,
            },
            { id: "divider", type: "divider" },
            {
              id: "members",
              type: "collection",
              init: true,
              min: 1,
              fields: [
                {
                  id: "name",
                  label: "Name",
                  type: "text",
                  isRequired: true,
                  blockWidth: {
                    desktop: "medium",
                    tablet: "medium",
                    mobile: "large",
                  },
                },
                {
                  id: "email",
                  label: "Email",
                  type: "text",
                  isRequired: true,
                  blockWidth: {
                    desktop: "medium",
                    tablet: "medium",
                    mobile: "large",
                  },
                },
              ],
              blockWidth: {
                mobile: "large",
                tablet: "large",
                desktop: "large",
              },
              label: "Members",
              secondaryText: "Add team menbers",
            },
            { id: "divider2", type: "divider" },
            {
              id: "summary",
              type: "group",
              fields: [
                {
                  id: "heading",
                  type: "heading",
                  title: "Summary",
                  blockWidth: {
                    desktop: "medium",
                    mobile: "large",
                    tablet: "large",
                  },
                  level: 3,
                  text: `Click submit to register team members {{#members}}{{name}}, {{/members}}{{^members}}(fill in above){{/members}} to your {{eventName}}{{^eventName}}No Name{{/eventName}} event.`,
                },
                {
                  id: "comments",
                  label: "Comments",
                  type: "textarea",
                  blockWidth: {
                    desktop: "medium",
                    tablet: "medium",
                    mobile: "large",
                  },
                  autoResize: true,
                },
              ],
              blockWidth: {
                mobile: "large",
                tablet: "large",
                desktop: "large",
              },
            },
            {
              id: "group",
              type: "group",
              fields: [
                {
                  id: "group",
                  type: "group",
                  blockWidth: {
                    desktop: "medium",
                    mobile: "large",
                    tablet: "large",
                  },
                },
              ],
            },
          ]),
      },
      {
        label: "Init with Layout Example",
        command: () =>
          handleInitConfig([
            { id: "text", type: "text", label: "Field" },
            {
              id: "group",
              type: "group",
              fields: [
                {
                  id: "heading",
                  type: "heading",
                  title: "Heading",
                  blockWidth: { desktop: "medium" },
                  level: 3,
                  text: "This is an example to demonstrate how to layout a form by using groups and block widths.",
                },
                {
                  id: "group",
                  type: "group",
                  fields: [
                    {
                      id: "field2",
                      label: "Field 2",
                      type: "text",
                      isRequired: true,
                      blockWidth: {
                        desktop: "large",
                        tablet: "large",
                        mobile: "large",
                      },
                    },
                    { id: "text", type: "text", label: "Field" },
                  ],
                  blockWidth: { desktop: "medium" },
                },
              ],
            },
          ]),
      },
      {
        label: "Init with Interface State Example",
        command: () => handleInitConfig([
            {
              "id": "heading1",
              "type": "heading",
              "title": "Sign Up",
              "text": "This is an example sign up form."
            },
            {
              "id": "name",
              "label": "Project Name",
              "type": "text",
              "isRequired": true,
              "blockWidth": {
                "mobile": "large",
                "tablet": "large",
                "desktop": "large"
              }
            },
            {
              "id": "divider3",
              "type": "divider"
            },
            {
              "id": "showAdvanced",
              "type": "checkbox",
              "label": "Advanced Options",
              "blockWidth": {
                "mobile": "large",
                "tablet": "large",
                "desktop": "large"
              },
              "isInterfaceState": true
            },
            {
              "id": "advanced",
              "type": "group",
              "fields": [
                {
                  "id": "opt1",
                  "label": "Advanced Option 1",
                  "type": "text",
                  "blockWidth": {
                    "desktop": "medium",
                    "tablet": "medium",
                    "mobile": "large"
                  }
                },
                {
                  "id": "opt2",
                  "label": "Advanced Option 2",
                  "type": "text",
                  "blockWidth": {
                    "desktop": "medium",
                    "tablet": "medium",
                    "mobile": "large"
                  }
                }
              ],
              "blockWidth": {
                "mobile": "large",
                "tablet": "large",
                "desktop": "large"
              },
              "isRendered": "!!interfaceState.showAdvanced"
            }
          ]),
      },
      {
        label: "Init with Field Kitchensink",
        command: () => handleInitConfig(kitchensinkConfig),
      },
      {
        label: "Init with Demo Form",
        command: () => handleInitConfig(initialConfig),
      },
    ];

    const fieldContextMenuItems = [
        { label: <div style={{width: "198px"}}><span>Cut</span><span style={{float: "right", color: "#999"}}>⌘ X</span></div>, icon: <Scissors size={16} style={{ marginRight: "8px" }} />, command: () => handleCutField(store.activeContextMenuInput) },
        { label: <div style={{width: "198px"}}><span>Copy</span><span style={{float: "right", color: "#999"}}>⌘ C</span></div>, icon: <Copy size={16} style={{ marginRight: "8px" }} />, command: () => handleCopyField(store.activeContextMenuInput) },
        { label: <div style={{width: "198px"}}><span>Paste</span><span style={{float: "right", color: "#999"}}>⌘ V</span></div>, icon: <ClipboardPaste size={16} style={{ marginRight: "8px" }} />, command: () => handlePasteField(store.activeContextMenuInput) },
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
        { label: 'Convert to Group', icon: <Group size={16} style={{ marginRight: "8px" }} />, command: () => handleConvertToGroup(store.activeContextMenuInput) },
        { label: 'Convert to Collection', icon: <Group size={16} style={{ marginRight: "8px" }} />, command: () => handleConvertToCollection(store.activeContextMenuInput) },
        { label: 'Convert to Wizard', icon: <Group size={16} style={{ marginRight: "8px" }} />, command: () => handleConvertToWizard(store.activeContextMenuInput) },
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
        { label: 'Insert Fieldset', items: [
            ...store.fieldsets.filter(fieldset => !fieldset.path).map(fieldset => {
                return { label: fieldset.label, command: () => handleInsertFieldsetBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), fieldset.id, fieldset.label) };
            }),
            { separator: true },
            ...store.fieldsets.filter(fieldset => fieldset.path).map(fieldset => {
                return { label: fieldset.label, command: () => handleInsertFieldsetBetweenFields(store.activeContextMenuInput.replace("insert > ", ""), fieldset.id, fieldset.label) };
            })
        ]},
    ];

    const stageContextMenuItems = [
        { label: 'Insert Stage', command: () => handleInsertStage(store.activeContextMenuInput.replace("stage > ", "")) }
    ];

    const handleInitConfig = (config) => {
        console.log("--> handleClearConfig <--");
        store.setData({});
        setFormCounter(formCounter => formCounter + 1);
        store.updateCurrentConfig(config);
        store.setSelectedElement("");
        contextMenuRef?.current?.hide();
    };

    const handleCopyFieldPath = (path) => {
        if (typeof navigator !== "undefined") navigator.clipboard.writeText(path);
        contextMenuRef?.current?.hide();
    };

    const handleCutField = (path) => {
        console.log("--> handleCutField <--");
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        if (path === fieldsetId) fieldset = undefined;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        store.setClipboard(_.get(newConfig, realPath));
        _.unset(newConfig, realPath);
        if (fieldset) {
            store.updateFieldsetConfig(removeEmptyElements(newConfig), fieldsetId);
        } else {
            store.updateCurrentConfig(removeEmptyElements(newConfig));
        }
        // If field is selected, unselect it
        store.removePathFromSelectedElements(path);
        contextMenuRef?.current?.hide();
    };

    const handleGroupField = (path) => {
        console.log("--> handleGroupField <--");
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const newFieldConfig = {
            id: createNewFieldID(path, "group", store),
            type: "group",
            fields: [oldFieldConfig]
        }
        _.set(newConfig, realPath, newFieldConfig);
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        contextMenuRef?.current?.hide();
    };

    const handleConvertToGroup = (path) => {
        console.log("--> handleConvertToGroup <--");
        store.removePathFromSelectedElements(path);
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const newFieldConfig = _.get(newConfig, realPath);
        if (newFieldConfig.type !== "collection" && newFieldConfig.type !== "wizard") return;
        if (newFieldConfig.type === "wizard") {
            newFieldConfig.fields = [...newFieldConfig.stages[0]?.fields] || [];
            delete newFieldConfig.stages;
        }
        if (newFieldConfig.type === "collection") {
            delete newFieldConfig.init;
            delete newFieldConfig.min;
        }
        newFieldConfig.type = "group";
        delete newFieldConfig.init;
        delete newFieldConfig.min;
        _.set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);
        contextMenuRef?.current?.hide();
    };

    const handleConvertToCollection = (path) => {
        console.log("--> handleConvertToCollection <--");
        store.removePathFromSelectedElements(path);
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const newFieldConfig = _.get(newConfig, realPath);
        if (newFieldConfig.type !== "group" && newFieldConfig.type !== "wizard") return;
        if (newFieldConfig.type === "wizard") {
            newFieldConfig.fields = [...newFieldConfig.stages[0]?.fields] || [];
            delete newFieldConfig.stages;
        }
        newFieldConfig.type = "collection";
        newFieldConfig.init = true;
        newFieldConfig.min = 1;
        _.set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);
        contextMenuRef?.current?.hide();
        setFormCounter(formCounter => formCounter + 1);
    };

    const handleConvertToWizard = (path) => {
        console.log("--> handleConvertToWizard <--");
        store.removePathFromSelectedElements(path);
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const newFieldConfig = _.get(newConfig, realPath);
        if (newFieldConfig.type !== "group" && newFieldConfig.type !== "collection") return;
        newFieldConfig.type = "wizard";
        newFieldConfig.stages = [{
            id:"step1",
            label:"Step 1",
            type: "stage",
            fields: newFieldConfig?.fields || []
        }];
        delete newFieldConfig.fields;
        _.set(newConfig, realPath, newFieldConfig);
        store.updateCurrentConfig(newConfig);
        contextMenuRef?.current?.hide();
    };

    const handleCreateFieldset = (path) => {
        console.log("--> handleCreateFieldset <--");
        const newConfig = [...store.currentConfig];
        const realPath = getConfigPathFromDataPath(path, newConfig);
        const oldFieldConfig = _.get(newConfig, realPath);
        const newFieldConfig = {
            id: oldFieldConfig.id,
            type: oldFieldConfig.id
        };
        _.set(newConfig, realPath, newFieldConfig);
        store.addFieldset(oldFieldConfig.id, oldFieldConfig.label || oldFieldConfig.id, Array.isArray(oldFieldConfig) ? oldFieldConfig : [oldFieldConfig], path);
        store.updateCurrentConfig(newConfig);
        store.setSelectedElement("");
        contextMenuRef?.current?.hide();
    };

    const handleUngroupField = (path) => {
        console.log("--> handleUngroupField <--");
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
            if (fieldset) {
                store.updateFieldsetConfig(removeEmptyElements(newConfig), fieldsetId);
            } else {
                store.updateCurrentConfig(removeEmptyElements(newConfig));
            }
            store.setSelectedElement('');
        }
        contextMenuRef?.current?.hide();
    };

    const handleMoveField = (path, to) => {
        console.log("--> handleMoveField <--", { path, to });
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (to !== "" && to !== "up" && to !== "down" && to !== "top" && to !== "bottom") {
            const realToPath = getConfigPathFromDataPath(to, newConfig);
            const lastArrayIndex = realToPath.lastIndexOf("[");
            let toIndex = parseInt(realToPath.substring(lastArrayIndex + 1));
            arrayMove(arrayToInsertInto, index, toIndex > index ? toIndex - 1 : toIndex);
        }
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        if (fieldset) {
            store.updateFieldsetConfig(removeEmptyElements(newConfig), fieldsetId);
        } else {
            store.updateCurrentConfig(removeEmptyElements(newConfig));
        }
        contextMenuRef?.current?.hide();
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
        contextMenuRef?.current?.hide();
    };

    const handleCollectionField = (path) => {
        console.log("--> handleCollectionField <--");
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }

        // Update data (for collections, a new empty array has to be addeed):
        store.setData(initNewCollections(newConfig, store.data));
        contextMenuRef?.current?.hide();
    };

    const handleCopyField = (path) => {
        console.log("--> handleCopyField <--");
        const realPath = getConfigPathFromDataPath(path, store.currentConfig);
        store.setClipboard(_.get(store.currentConfig, realPath));
        contextMenuRef?.current?.hide();
    };

    const handlePasteField = (path) => {
        console.log("--> handlePasteField <--");
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        if (store.clipboard) {
            const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            const configToInsert = {...store.clipboard, id: createNewFieldID(path, store.clipboard.id, store)};
            console.log({ realPath, configToInsert });
            _.set(newConfig, realPath, configToInsert);
            if (fieldset) {
                store.updateFieldsetConfig(newConfig, fieldsetId);
            } else {
                store.updateCurrentConfig(newConfig);
            }
        }
        contextMenuRef?.current?.hide();
    };

    const handleInsertFieldBetweenFields = (path, fieldType) => {
        console.log("--> handleInsertFieldBetweenFields <--");
        // Add new field between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        const newFieldId = createNewFieldID(path, fieldType || "text", store);
        arrayToInsertInto.splice(index, 0, {
            id: newFieldId,
            type: fieldType || "text",
            label: "Field",
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement(parentOfRealPath ? `${parentOfRealPath}.${newFieldId}` : newFieldId);
        contextMenuRef?.current?.hide();
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
        contextMenuRef?.current?.hide();
    };

    const handleInsertGroupBetweenFields = (path) => {
        console.log("--> handleInsertGroupBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
                    isRequired: true,
                    blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" }
                },
                {
                    id: "field2",
                    label: "Field 2",
                    type: "text",
                    isRequired: true,
                    blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" }
                }
            ]
        });
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleInsertCollectionBetweenFields = (path) => {
        console.log("--> handleInsertCollectionBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
                    isRequired: true,
                    blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" }
                },
                {
                    id: "field2",
                    label: "Field 2",
                    type: "text",
                    isRequired: true,
                    blockWidth: { desktop: "medium", tablet: "medium", mobile: "large" }
                }
            ]
        });

        // Update config:
        _.set(newConfig, parentOfRealPath, arrayToInsertInto);
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }

        // Update data (for collections, a new empty array has to be addeed):
        store.setData(initNewCollections(newConfig, store.data));

        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleInsertWizardBetweenFields = (path) => {
        console.log("--> handleInsertGroupBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleInsertStage = (path) => {
        console.log("--> handleInsertDividerBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleInsertDividerBetweenFields = (path) => {
        console.log("--> handleInsertDividerBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleInsertHeadingBetweenFields = (path) => {
        console.log("--> handleInsertDividerBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleInsertMessageBetweenFields = (path) => {
        console.log("--> handleInsertDividerBetweenFields <--");
        // Add new group between fields:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
        const newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
        if (fieldset) {
            store.updateFieldsetConfig(newConfig, fieldsetId);
        } else {
            store.updateCurrentConfig(newConfig);
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handlePasteBetweenFields = (path) => {
        console.log("--> handlePasteBetweenFields <--");
        // Add clipboard content after path:
        let fieldsetId = '';
        let fieldset;
        if (path[0] === "{") {
            fieldsetId = path.slice(path.indexOf("{") + 1, path.indexOf("}"));
            fieldset = _.find(store.fieldsets, { id: fieldsetId });
            path = path.slice(path.indexOf("}") + 2);
        }
        if (store.clipboard) {
            const addIndexOffset = path.slice(-1) === "+" ? 1 : 0;
            let newConfig = fieldset ? [...fieldset.config] : [...store.currentConfig];
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
            if (fieldset) {
                store.updateFieldsetConfig(newConfig, fieldsetId);
            } else {
                store.updateCurrentConfig(newConfig);
            }
        }
        store.setSelectedElement('');
        contextMenuRef?.current?.hide();
    };

    const handleEditCollection = (path, isShiftKey) => {
        console.log("--> handleEditCollection <--");
        store.setSelectedElement(path, isShiftKey);
        store.setEditorTabIndex(1);
        contextMenuRef?.current?.hide();
    };
    
    const handleEditGroup = (path, isShiftKey) => {
        console.log("--> handleEditGroup <--");
        store.setSelectedElement(path, isShiftKey);
        store.setEditorTabIndex(1);
        contextMenuRef?.current?.hide();
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

    const handleDragEnd = (event) => {
        console.log("--> handleDragEnd <--", { event });
        if (event?.active?.id && event?.over?.id) {
            handleMoveField(event.active.id.substring(10), event.over.id.substring(10));
        }
    };

    const fromDate = store?.generalConfig?.date?.from ? new Sugar.Date(store.generalConfig.date.from) : "";
    const toDate = store?.generalConfig?.date?.to ? new Sugar.Date(store.generalConfig.date.to) : "";
    const now = new Date();

    return (
        <ScrollPanel style={{ width: "100%",height: '100vh', background: store.isEditMode ? "url(/editor-bg-pattern.svg)" : "transparent" }}>
            <Toast position="center" ref={toast} />
            <div style={{ padding: "16px", position: "relative", minHeight: "100vh" }} onContextMenu={(e) => {
                    if (contextMenuRef && contextMenuRef.current) {
                        contextMenuRef.current.show(e);
                        store.setActiveContextMenuInput(".");
                    }
                }}>
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
                        <span contentEditable dangerouslySetInnerHTML={{__html: formTitle}} onClick={(e) => e.preventDefault()} onBlur={handleEditFormTitle} />
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
                    key={`form${formCounter}`}
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
                                <form>
                                    <div style={{ position: "relative", maxWidth: store.previewSize === "mobile" ? "480px" : store.previewSize === "tablet" ? "640px" : "960px", margin: "0 auto", paddingBottom: "64px" }}>
                                        <DndContext onDragEnd={handleDragEnd}>
                                            <FieldRenderer
                                                handleEditCollection={handleEditCollection}
                                                handleEditGroup={handleEditGroup}
                                                setFormCounter={setFormCounter}
                                                parent=""
                                                setActiveContextMenuInput={store.setActiveContextMenuInput}
                                                contextMenuRef={contextMenuRef}
                                                isEditMode={store.isEditMode}
                                                selectedElement={store.selectedElement}
                                                fieldProps={fieldProps}
                                                fields={fieldProps.fields}
                                            />
                                        </DndContext>
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
                    onChange={payload => {
                        store.setData(payload);
                    }}
                    fieldsets={createFieldsets()}
                />
            </div>
        </ScrollPanel>
    );
};

export default Workspace;