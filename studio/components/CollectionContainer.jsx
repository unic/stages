import { useState, useEffect } from 'react';
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';
import { pathIsSelected, getWidth } from './helpers';

const CollectionContainer = ({ children, handleEditCollection, isEditMode, path, label, secondaryText, selectedElement, isFieldConfigEditor, contextMenuRef, fieldsetId, width, inGroup }) => {
    const store = useStagesStore();
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && pathIsSelected(path, selectedElement, fieldsetId));

    useEffect(() => {
        if (!pathIsSelected(path, selectedElement, fieldsetId)) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div
            className="flex"
            style={{
                position: "relative",
                flexWrap: "wrap",
                border: isInEditMode && isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor && isEditMode ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
                borderRadius: "5px",
                padding: "2px",
                rowGap: "16px",
                background: isEditMode && !isFieldConfigEditor ? "#fff" : "transparent",
                boxShadow: isEditMode && !isFieldConfigEditor ? "1px 1px 1px 0px rgba(0,0,0,0.05)" : "none",
                minWidth: !isFieldConfigEditor ? getWidth(inGroup, isFieldConfigEditor, store.previewSize, store.isEditMode, width) : "auto",
                maxWidth: getWidth(inGroup, isFieldConfigEditor, store.previewSize, store.isEditMode, width)
            }}
            onContextMenu={(e) => {
                if (contextMenuRef && contextMenuRef.current) {
                    contextMenuRef.current.show(e);
                    store.setActiveContextMenuInput(path);
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) handleEditCollection(fieldsetId ? `{${fieldsetId}}.${path}` : path, e.shiftKey);
            }}
            onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement, fieldsetId) ? true : false)}
        >
            {isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={path} isHovered={isInEditMode} type="collection" /> : null}
            {label ? <label style={{ marginLeft: "6px", flex: "0 0 100%", margin: "6px 0 8px 8px" }}>{label}</label> : null}
            {secondaryText ? <div style={{ margin: "-4px 0 0 8px", color: "#999", flex: "0 0 100%" }}>{secondaryText}</div> : null}
            {children}
        </div>
    );
};

export default CollectionContainer;