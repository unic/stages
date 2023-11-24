import { isValidElement } from 'react';
import get from "lodash.get";
import findIndex from "lodash.findindex";
import EditableBlock from './EditableBlock';

export const renderFields = (setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, fields, type = "field") => {
    if (typeof fields !== "object") return null;
    return (
        <>
            {Object.keys(fields).map(key => {
                const field = fields[key];
                if (isValidElement(field)) {
                    if (type === "group") return <EditableBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} setSelectedElement={setSelectedElement} inGroup field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />;
                    return <EditableBlock setActiveContextMenuInput={setActiveContextMenuInput} contextMenuRef={contextMenuRef} setSelectedElement={setSelectedElement} field={field} path={field.key} isEditMode={isEditMode} selectedElement={selectedElement} />;
                } else if (typeof field === "object") {
                    if (Array.isArray(field)) {
                        // collection array
                        return (
                            <div style={{ margin: "16px 0 32px 0" }}>
                                {field.map((entry, index) => (
                                    <div className="flex">
                                        {renderFields(setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, entry, "group")}
                                        <div className="flex-1" style={{ marginTop: "32px" }}>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction(key, "remove", index)}>remove</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => fieldProps.onCollectionAction(key, "add")}>add</button>
                            </div>
                        );
                    } else {
                        return <div className="flex">{renderFields(setActiveContextMenuInput, contextMenuRef, setSelectedElement, isEditMode, selectedElement, fieldProps, field, "group")}</div>;
                    }
                }
            })}
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