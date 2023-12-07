import { useState, useEffect } from 'react';
import useStagesStore from './store';

const EditableBlock = ({ field, path, selectedElement, inGroup, contextMenuRef, isFieldConfigEditor }) => {
    const store = useStagesStore();
    const [isInEditMode, setIsInEditMode] = useState(store.isEditMode && selectedElement === path);

    useEffect(() => {
        if (selectedElement !== path) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && store.isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : "1px solid rgba(0,0,0,0)",
            position: "relative",
            maxWidth: inGroup ? "33%" : "100%"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                store.setActiveContextMenuInput(path);
            }
        }} onMouseOver={() => setIsInEditMode(store.isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}
        onClick={(e) => {
            e.stopPropagation();
            if (isInEditMode && store.isEditMode && !isFieldConfigEditor) {
                store.setSelectedElement(path);
                store.setEditorTabIndex(1);
            }
        }}
        >
            {isInEditMode && store.isEditMode && !isFieldConfigEditor ? (
                <span style={{ position: "absolute", top: "6px", right: "6px", color: "#0A94F8", fontSize: "11px" }}>edit</span>
            ) : null}
            {field}
        </div>
    );
};

export default EditableBlock;