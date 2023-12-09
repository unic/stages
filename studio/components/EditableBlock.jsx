import { useState, useEffect } from 'react';
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';

const EditableBlock = ({ field, path, selectedElement, inGroup, contextMenuRef, isFieldConfigEditor }) => {
    const store = useStagesStore();
    const [isInEditMode, setIsInEditMode] = useState(store.isEditMode && selectedElement === path);

    useEffect(() => {
        if (selectedElement !== path) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            position: "relative",
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && store.isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
            maxWidth: inGroup ? "33%" : "100%",
            background: !isFieldConfigEditor ? "rgba(255, 255, 255, 0.2)" : "transparent"
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
            {!isFieldConfigEditor ? <BlockPathLabel path={path} /> : null}
            {field}
        </div>
    );
};

export default EditableBlock;