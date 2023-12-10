import { useState, useEffect } from 'react';
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';
import { pathIsSelected } from './helpers';

const EditableBlock = ({ field, path, selectedElement, inGroup, contextMenuRef, isFieldConfigEditor }) => {
    const store = useStagesStore();
    const [isInEditMode, setIsInEditMode] = useState(store.isEditMode && pathIsSelected(path, selectedElement));

    useEffect(() => {
        if (!pathIsSelected(path, selectedElement)) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div className={inGroup ? "flex-1" : undefined} style={{
            position: "relative",
            padding: "8px",
            borderRadius: "5px",
            border: isInEditMode && store.isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor && store.isEditMode ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
            maxWidth: inGroup ? "33%" : "100%",
            background: !isFieldConfigEditor ? "rgba(255, 255, 255, 0.2)" : "transparent"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                store.setActiveContextMenuInput(path);
            }
        }} onMouseOver={() => setIsInEditMode(store.isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement) ? true : false)}
        onClick={(e) => {
            e.stopPropagation();
            if (isInEditMode && store.isEditMode && !isFieldConfigEditor) {
                store.setSelectedElement(path, e.shiftKey);
                store.setEditorTabIndex(1);
            }
        }}
        >
            {store.isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={path} isHovered={isInEditMode} type="field" /> : null}
            {field}
        </div>
    );
};

export default EditableBlock;