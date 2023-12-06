import { useState, useEffect } from 'react';

const EditableBlock = ({ field, path, isEditMode, selectedElement, inGroup, setSelectedElement, contextMenuRef, setActiveContextMenuInput }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && selectedElement === path);

    useEffect(() => {
        if (selectedElement !== path) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && isEditMode ? "1px dashed #0A94F8" : "1px solid rgba(0,0,0,0)",
            position: "relative",
            maxWidth: inGroup ? "33%" : "100%"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                setActiveContextMenuInput(path);
            }
        }} onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}
        onClick={() => isInEditMode && isEditMode ? setSelectedElement(path) : null}
        >
            {isInEditMode && isEditMode ? (
                <span style={{ position: "absolute", top: "6px", right: "6px", color: "#0A94F8", fontSize: "11px" }}>edit</span>
            ) : null}
            {field}
        </div>
    );
};

export default EditableBlock;