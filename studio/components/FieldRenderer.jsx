// @ts-nocheck
import { isValidElement } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import EditableBlock from './EditableBlock';
import InsertBlock from './InsertBlock';
import GroupContainer from './GroupContainer';
import CollectionContainer from './CollectionContainer';

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
    setSelectedElement,
    isEditMode,
    selectedElement,
    fieldProps,
    fields,
    type
}) => {
    if (typeof fields !== "object" || !typeof window) return null;
    if (!type) type = "field";

    const getListStyle = isDraggingOver => ({
        background: "f8f8f8",
        width: "calc(100% - 16px)",
        padding: "8px"
    });
    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: "none",
        width: "calc(100% - 32px)",
        margin: "8px",
        padding: "8px",
        position: "relative",
        background: isDragging ? "#f8f8f8" : "#fbfbfb",
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
            <InsertBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} isEditMode={isEditMode} path={createKey(parent, Object.keys(fields)[0])} direction={type === "group" ? "column" : "row"} />
            {Object.keys(fields).map((key, index) => {
                const field = fields[key];
                if (isValidElement(field)) {
                    if (type === "group") {
                        return (
                            <>
                                {index > 0 && <InsertBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} isEditMode={isEditMode} path={createKey(parent, key)} direction="column" />}
                                <EditableBlock key={createKey(parent, key)} setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} setSelectedElement={setSelectedElement} inGroup field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />
                            </>
                        );
                    }
                    return (
                        <>
                            {index > 0 && <InsertBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} isEditMode={isEditMode} path={createKey(parent, key)} direction="row" />}
                            <EditableBlock key={createKey(parent, key)} setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} setSelectedElement={setSelectedElement} field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />
                        </>
                    );
                } else if (typeof field === "object") {
                    if (Array.isArray(field)) {
                        // collection array
                        return (
                            <>
                                <InsertBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} isEditMode={isEditMode} path={createKey(parent, key)} direction="row" />
                                <CollectionContainer key={key} selectedElement={selectedElement} handleEditCollection={handleEditCollection} isEditMode={isEditMode} path={createKey(parent, key)}>
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
                                                                    <div className="flex" style={{ position: "relative" }}>
                                                                        <FieldRenderer
                                                                            handleEditCollection={handleEditCollection}
                                                                            handleEditGroup={handleEditGroup}
                                                                            parent={createKey(parent, key)}
                                                                            setActiveContextMenuInput={setActiveContextMenuInput}
                                                                            contextMenuRef={contextMenuRef}
                                                                            setSelectedElement={setSelectedElement}
                                                                            isEditMode={isEditMode}
                                                                            selectedElement={selectedElement}
                                                                            fieldProps={fieldProps}
                                                                            fields={entry}
                                                                            type="group"
                                                                        />
                                                                        <div style={{ position: "absolute", right: "8px", top: "calc(50% - 4px)" }}>
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
                                    <button type="button" onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                                </CollectionContainer>
                            </>
                        );
                    } else {
                        return <GroupContainer selectedElement={selectedElement} handleEditGroup={handleEditGroup} isEditMode={isEditMode} path={createKey(parent, Object.keys(fields)[0])} key={key}>
                            <FieldRenderer
                                handleEditCollection={handleEditCollection}
                                handleEditGroup={handleEditGroup}
                                parent={createKey(parent, key)}
                                setActiveContextMenuInput={setActiveContextMenuInput}
                                contextMenuRef={contextMenuRef}
                                setSelectedElement={setSelectedElement}
                                isEditMode={isEditMode}
                                selectedElement={selectedElement}
                                fieldProps={fieldProps}
                                fields={field}
                                type="group"
                            />
                        </GroupContainer>;
                    }
                }
            })}
            <InsertBlock grow setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} isEditMode={isEditMode} path={createKey(parent, Object.keys(fields)[Object.keys(fields).length - 1]) + "+"} direction={type === "group" ? "column" : "row"} />
        </>
    );
};