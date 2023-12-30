import { useState, useEffect } from 'react';
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';
import { pathIsSelected, getWidth } from './helpers';

const GroupContainer = ({ children, handleEditGroup, isEditMode, path, label, secondaryText, selectedElement, isFieldConfigEditor, contextMenuRef, fieldsetId, width, border, inGroup }) => {
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
                flexDirection: isFieldConfigEditor ? "column" : "row",
                rowGap: "16px",
                border: isInEditMode && isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor && isEditMode ? "1px dashed #ddd" : border ? "1px solid #ddd" : "1px solid rgba(0,0,0,0)",
                borderRadius: "5px",
                padding: "16px 2px",
                background: isEditMode && !isFieldConfigEditor ? "#fff" : "transparent",
                boxShadow: isEditMode && !isFieldConfigEditor ? "1px 1px 1px 0px rgba(0,0,0,0.05)" : "none",
                minWidth: !isFieldConfigEditor ? getWidth(inGroup, isFieldConfigEditor, store.isEditMode, width) : "auto",
                maxWidth: getWidth(inGroup, isFieldConfigEditor, store.isEditMode, width)
            }}
            onContextMenu={(e) => {
                if (contextMenuRef && contextMenuRef.current) {
                    contextMenuRef.current.show(e);
                    store.setActiveContextMenuInput(path);
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) handleEditGroup(fieldsetId ? `{${fieldsetId}}.${path}` : path, e.shiftKey);
            }}
            onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement, fieldsetId) ? true : false)}
        >
            {isEditMode && !isFieldConfigEditor ? <BlockPathLabel onChangeBlockWidth={(width) => store.onChangeBlockWidth(path, width)} path={path} isHovered={isInEditMode} type="group" /> : null}
            {label ? <label style={{ marginLeft: "6px", flex: "0 0 100%", margin: "0 0 8px 8px" }}>{label}</label> : null}
            {secondaryText ? <div style={{ margin: "-4px 0 12px 8px", color: "#999", flex: "0 0 100%" }}>{secondaryText}</div> : null}
            {children}
        </div>
    );
};

export default GroupContainer;