import { isValidElement } from 'react';
import get from "lodash.get";
import findIndex from "lodash.findindex";
import EditableBlock from './EditableBlock';
import InsertBlock from './InsertBlock';
import GroupContainer from './GroupContainer';
import CollectionContainer from './CollectionContainer';

const createKey = (parent, key) => {
    if (!parent) return key;
    return `${parent}.${key}`;
}

export const renderFields = (handleEditCollection, handleEditGroup, parent, setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, fields, type = "field") => {
    if (typeof fields !== "object") return null;
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
                                <CollectionContainer key={key} handleEditCollection={handleEditCollection} isEditMode={isEditMode} path={createKey(parent, key)}>
                                    {field.map((entry, index) => (
                                        <div key={`field-${key}-${index}`} className="flex">
                                            {renderFields(handleEditCollection, handleEditGroup, createKey(parent, key), setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, entry, "group")}
                                            <div className="flex-1" style={{ marginTop: "32px" }}>
                                                <button type="button" onClick={() => fieldProps.onCollectionAction(key, "remove", index)}>remove</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                                </CollectionContainer>
                            </>
                        );
                    } else {
                        return <GroupContainer handleEditGroup={handleEditGroup} isEditMode={isEditMode} path={createKey(parent, Object.keys(fields)[0])} key={key}>{renderFields(handleEditCollection, handleEditGroup, createKey(parent, key), setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, field, "group")}</GroupContainer>;
                    }
                }
            })}
            <InsertBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} isEditMode={isEditMode} path={createKey(parent, Object.keys(fields)[Object.keys(fields).length - 1]) + "+"} direction={type === "group" ? "column" : "row"} />
        </>
    );
};

export const getConfigPathFromDataPath = (path, config) => {
    const pathSplit = path.split(".");
    let realPath = '';
    pathSplit.forEach((key) => {
        const index = findIndex(realPath ? get(config, realPath) : config, { id: key.replace(/\[(\d+)\]/, "") });
        if (index > -1) {
            realPath = realPath === "" ? `[${index}]` : `${realPath}[${index}]`;
            const thisConfig = get(config, realPath);
            if (thisConfig.fields) realPath += ".fields";
        }
    });
    return realPath;
};