// @ts-nocheck
import { isValidElement } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Dropdown } from 'primereact/dropdown';
import EditableBlock from './EditableBlock';
import InsertBlock from './InsertBlock';
import GroupContainer from './GroupContainer';
import CollectionContainer from './CollectionContainer';
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';

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
    if (typeof fields !== "object" || !typeof window) return null;
    if (!type) type = "field";

    const getListStyle = isDraggingOver => ({
        width: "calc(100% - 32px)",
        maxWidth: "calc(100% - 32px)",
        padding: "8px"
    });
    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: "none",
        width: "calc(100% + 32px)",
        maxWidth: "calc(100% + 32px)",
        margin: "4px 0 8px 0",
        padding: "4px",
        position: "relative",
        border: "1px dashed #ddd",
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

    return (
        <>
            <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, Object.keys(fields)[0])} direction={type === "group" ? "column" : "row"} />
            {Object.keys(fields).map((key, index) => {
                const field = fields[key];
                if (isValidElement(field)) {
                    if (type === "group") {
                        return (
                            <>
                                {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="column" />}
                                <EditableBlock isFieldConfigEditor={isFieldConfigEditor} key={createKey(parent, key)} contextMenuRef={contextMenuRef} inGroup field={field} path={field.key} selectedElement={selectedElement} />
                            </>
                        );
                    }
                    return (
                        <>
                            {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                            <EditableBlock isFieldConfigEditor={isFieldConfigEditor} key={createKey(parent, key)} contextMenuRef={contextMenuRef} field={field} path={field.key} selectedElement={selectedElement} />
                        </>
                    );
                } else if (typeof field === "object") {
                    if (Array.isArray(field)) {
                        // collection array
                        const collectionConfig = fieldProps.getConfig(key);
                        return (
                            <>
                                {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                                <CollectionContainer key={key} isFieldConfigEditor={isFieldConfigEditor} selectedElement={selectedElement} handleEditCollection={handleEditCollection} isEditMode={isEditMode} path={createKey(parent, key)}>
                                    {collectionConfig.label ? <label style={{ marginLeft: "6px" }}>{collectionConfig.label}</label> : null}
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
                                                                        provided.draggableProps.style
                                                                    )}
                                                                >
                                                                    <div className="flex" style={{ position: "relative", flexWrap: "wrap", padding: isFieldConfigEditor ? 0 : "8px 2px" }}>
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
                                                                        <div style={{ position: "absolute", right: isFieldConfigEditor ? "2px" : "8px", top: isFieldConfigEditor ? "calc(50% - 6px)" : "calc(50% - 12px)" }}>
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
                                    <button type="button" style={{margin: "-4px 0 8px 8px"}} onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                                </CollectionContainer>
                            </>
                        );
                    } else {
                        const groupPath = createKey(parent, key);
                        return (
                            <>
                                {index > 0 && <InsertBlock isFieldConfigEditor={isFieldConfigEditor} contextMenuRef={contextMenuRef} path={createKey(parent, key)} direction="row" />}
                                <GroupContainer
                                    isFieldConfigEditor={isFieldConfigEditor}
                                    selectedElement={selectedElement}
                                    handleEditGroup={handleEditGroup}
                                    isEditMode={isEditMode}
                                    path={groupPath}
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
                            </>
                        );
                    }
                }
            })}
            <InsertBlock isFieldConfigEditor={isFieldConfigEditor} grow contextMenuRef={contextMenuRef} path={createKey(parent, Object.keys(fields)[Object.keys(fields).length - 1]) + "+"} direction={type === "group" ? "column" : "row"} />
            {isFieldConfigEditor && !parent ? (
                <div style={{ marginLeft: "8px" }}>
                    <br /><br />
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