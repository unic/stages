import { useState } from 'react';

const EditableBlock = ({ field, path, isEditMode, selectedElement, inGroup, setSelectedElement, contextMenuRef, setActiveContextMenuInput }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && selectedElement === path);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && isEditMode ? "1px dashed #0A94F8" : "1px solid rgba(0,0,0,0)",
            position: "relative"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                setActiveContextMenuInput(path);
            }
        }} onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}>
            {isInEditMode && isEditMode ? <button style={{ position: "absolute", top: "4px", right: "4px" }} type="button" onClick={() => setSelectedElement(path)}>edit</button> : null}
            {field}
        </div>
    );
};

export default EditableBlock;