// @ts-nocheck
import React, { Fragment, useEffect } from 'react';
import { isValidElement } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Dropdown } from 'primereact/dropdown';
import get from "lodash.get";
import EditableBlock from './EditableBlock';
import InsertBlock from './InsertBlock';
import GroupContainer from './GroupContainer';
import WizardContainer from './WizardContainer';
import CollectionContainer from './CollectionContainer';
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';
import InspectorSpacer from './InspectorSpacer';
import { getConfigPathFromDataPath } from './helpers';

const createKey = (parent, key) => {
    if (!parent) return key;
    return `${parent}.${key}`;
}

export const FieldRenderer = ({
    handleEditCollection,
    handleEditGroup,
    parent,
    setActiveContextMenuInput,
    contextMenuRef,
    isEditMode,
    selectedElement,
    fieldProps,
    fields,
    type,
    isFieldConfigEditor
}) => {
    const store = useStagesStore();

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    if (typeof fields !== "object" || !typeof window) return null;
    if (!type) type = "field";

    const getListStyle = isDraggingOver => ({
        width: "calc(100% - 32px)",
        maxWidth: "calc(100% - 32px)",
        padding: "8px"
    });
    const getItemStyle = (isDragging, draggableStyle, isFieldConfigEditor) => ({
        userSelect: "none",
        width: "calc(100% + 32px)",
        maxWidth: "calc(100% + 32px)",
        margin: isFieldConfigEditor ? "0 0 -16px 0" : "4px 0 8px 0",
        padding: isFieldConfigEditor ? 0 : "4px",
        position: "relative",
        border: isFieldConfigEditor ? "none" : "1px dashed #ddd",
        borderRadius: "3px",
        background: isDragging ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)",
        ...draggableStyle
    });
    const onDragEnd = (key, result) => {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        fieldProps.onCollectionAction(key, "move", result.source.index, result.destination.index)
    };

    const realPath = selectedElement ? getConfigPathFromDataPath(selectedElement, store.currentConfig) : "";
    const selectedElementConfig = realPath ? get(store.currentConfig, realPath) : {};

    return (
        <>
            <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, Object.keys(fields)[0])} direction={type === "group" ? "column" : "row"} />
            {Object.keys(fields).map((key, index) => {
                const field = fields[key];
                const fieldConfig = fieldProps.getConfig(createKey(parent, key));
                if (isValidElement(field)) {
                    if (type === "group") {
                        return (
                            <Fragment key={createKey(parent, key)}>
                                {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="column" />}
                                <EditableBlock isFieldConfigEditor={isFieldConfigEditor} key={createKey(parent, key)} contextMenuRef={contextMenuRef} inGroup field={field} path={field.key} selectedElement={selectedElement} />
                            </Fragment>
                        );
                    }
                    return (
                        <Fragment key={createKey(parent, key)}>
                            {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                            <EditableBlock isFieldConfigEditor={isFieldConfigEditor} key={createKey(parent, key)} contextMenuRef={contextMenuRef} field={field} path={field.key} selectedElement={selectedElement} />
                        </Fragment>
                    );
                } else if (typeof field === "object") {
                    if (Array.isArray(field)) {
                        // collection array
                        const collectionConfig = fieldProps.getConfig(key);
                        return (
                            <Fragment key={createKey(parent, key)}>
                                {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                                <CollectionContainer
                                    key={key}
                                    isFieldConfigEditor={isFieldConfigEditor}
                                    selectedElement={selectedElement}
                                    handleEditCollection={handleEditCollection}
                                    isEditMode={isEditMode}
                                    contextMenuRef={contextMenuRef}
                                    path={createKey(parent, key)}
                                    label={collectionConfig?.label}
                                    secondaryText={collectionConfig?.secondaryText}
                                >
                                    <DragDropContext onDragEnd={(result) => onDragEnd(key, result)}>
                                        <Droppable droppableId="droppable">
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    style={getListStyle(snapshot.isDraggingOver)}
                                                >
                                                    {field.map((entry, index) => (
                                                        <Draggable key={`field-${key}-${index}`} draggableId={`field-${key}-${index}`} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={getItemStyle(
                                                                        snapshot.isDragging,
                                                                        provided.draggableProps.style,
                                                                        isFieldConfigEditor
                                                                    )}
                                                                >
                                                                    <div className="flex" style={{ position: "relative", flexWrap: "wrap", padding: isFieldConfigEditor ? "8px 0" : "8px 2px" }}>
                                                                        {isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={`${createKey(parent, key)}[${index}]`} inCollection /> : null}
                                                                        <FieldRenderer
                                                                            isFieldConfigEditor={isFieldConfigEditor}
                                                                            handleEditCollection={handleEditCollection}
                                                                            handleEditGroup={handleEditGroup}
                                                                            parent={createKey(parent, key)}
                                                                            setActiveContextMenuInput={setActiveContextMenuInput}
                                                                            contextMenuRef={contextMenuRef}
                                                                            isEditMode={isEditMode && !isFieldConfigEditor}
                                                                            selectedElement={selectedElement}
                                                                            fieldProps={fieldProps}
                                                                            fields={entry}
                                                                            type="group"
                                                                        />
                                                                        <div style={{ position: "absolute", right: "8px", top: isFieldConfigEditor ? "calc(50% + 2px)" : "calc(50% - 12px)" }}>
                                                                            <button type="button" onClick={() => fieldProps.onCollectionAction(key, "remove", index)}>remove</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                        </Droppable>
                                    </DragDropContext>
                                    <button type="button" style={{margin: isFieldConfigEditor ? "8px 0 8px 8px" : "-4px 0 8px 8px"}} onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                                </CollectionContainer>
                            </Fragment>
                        );
                    } else {
                        const groupPath = createKey(parent, key);
                        const groupConfig = fieldProps.getConfig(groupPath);
                        if (groupConfig && groupConfig.type === "wizard") {
                            return (
                                <Fragment key={createKey(parent, key)}>
                                    {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                                    <WizardContainer
                                        isFieldConfigEditor={isFieldConfigEditor}
                                        selectedElement={selectedElement}
                                        handleEditGroup={handleEditGroup}
                                        isEditMode={isEditMode}
                                        path={groupPath}
                                        label={groupConfig?.label}
                                        secondaryText={groupConfig?.secondaryText}
                                        contextMenuRef={contextMenuRef}
                                        fieldProps={fieldProps}
                                        key={groupPath}
                                    >
                                        <FieldRenderer
                                            isFieldConfigEditor={isFieldConfigEditor}
                                            handleEditCollection={handleEditCollection}
                                            handleEditGroup={handleEditGroup}
                                            parent={groupPath}
                                            setActiveContextMenuInput={setActiveContextMenuInput}
                                            contextMenuRef={contextMenuRef}
                                            isEditMode={isEditMode && !isFieldConfigEditor}
                                            selectedElement={selectedElement}
                                            fieldProps={fieldProps}
                                            fields={field}
                                            type="group"
                                        />
                                    </WizardContainer>
                                </Fragment>
                            );
                        }
                        return (
                            <Fragment key={createKey(parent, key)}>
                                {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                                <GroupContainer
                                    isFieldConfigEditor={isFieldConfigEditor}
                                    selectedElement={selectedElement}
                                    handleEditGroup={handleEditGroup}
                                    isEditMode={isEditMode}
                                    path={groupPath}
                                    label={groupConfig?.label}
                                    secondaryText={groupConfig?.secondaryText}
                                    contextMenuRef={contextMenuRef}
                                    key={groupPath}
                                >
                                    <FieldRenderer
                                        isFieldConfigEditor={isFieldConfigEditor}
                                        handleEditCollection={handleEditCollection}
                                        handleEditGroup={handleEditGroup}
                                        parent={groupPath}
                                        setActiveContextMenuInput={setActiveContextMenuInput}
                                        contextMenuRef={contextMenuRef}
                                        isEditMode={isEditMode && !isFieldConfigEditor}
                                        selectedElement={selectedElement}
                                        fieldProps={fieldProps}
                                        fields={field}
                                        type="group"
                                    />
                                </GroupContainer>
                            </Fragment>
                        );
                    }
                }
            })}
            <InsertBlock isFieldConfigEditor={isFieldConfigEditor} grow contextMenuRef={contextMenuRef} path={createKey(parent, Object.keys(fields)[Object.keys(fields).length - 1]) + "+"} direction={type === "group" ? "column" : "row"} />
            {isFieldConfigEditor && !parent ? (
                <div style={{ marginLeft: "8px", marginBottom: "32px" }}>
                    <br />
                    <Dropdown options={[
                        { label: "Email", value: "email" },
                        { label: "Phone", value: "phone" },
                        { label: "Regex", value: "regex" }
                    ]} placeholder="Add validation rule ..." onChange={(e) => fieldProps.onCollectionAction("validation", "add", e.target.value)} />
                </div>
            ) : null}
        </>
    );
};