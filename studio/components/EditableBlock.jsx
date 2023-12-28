import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import useStagesStore from './store';
import BlockPathLabel from './BlockPathLabel';
import { pathIsSelected } from './helpers';

const EditableBlock = ({ field, path, selectedElement, inGroup, isFieldset, contextMenuRef, isFieldConfigEditor, fieldsetId, width }) => {
    const store = useStagesStore();
    const [isInEditMode, setIsInEditMode] = useState(store.isEditMode && pathIsSelected(path, selectedElement, fieldsetId));

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    useEffect(() => {
        if (!pathIsSelected(path, selectedElement, fieldsetId)) setIsInEditMode(false);
    }, [path, selectedElement]);

    const getWidth = (inGroup) => {
        if (isFieldConfigEditor) return "auto";
        if (store.previewSize === "desktop") {
            if (store.isEditMode) {
                if (width === "small") return inGroup ? "calc(25% - 56px)" : "25%";
                if (width === "medium") return inGroup ? "calc(50% - 58px)" : "50%";
                if (width === "large") return inGroup ? "calc(100% - 60px)" : "100%";
            } else {
                if (width === "small") return "25%";
                if (width === "medium") return "50%";
                if (width === "large") return "100%";
            }
        }
        if (store.previewSize === "tablet") {
            if (store.isEditMode) {
                if (width === "small" || width === "medium") return inGroup ? "calc(50% - 58px)" : "50%";
                if (width === "large") return inGroup ? "calc(100% - 60px)" : "100%";
            } else {
                if (width === "small" || width === "medium") return "50%";
                if (width === "large") return "100%";
            }
        }
        if (store.previewSize === "mobile") {
            if (store.isEditMode) {
                if (width === "small") return inGroup ? "calc(50% - 58px)" : "50%";
                if (width === "medium" || width === "large") return inGroup ? "calc(100% - 60px)" : "100%";
            } else {
                if (width === "small") return "50%";
                if (width === "medium" || width === "large") return "100%";
            }
        }
        return "auto";
    };

    return (
        <motion.div
            className={inGroup ? "flex-1" : undefined}
            style={{
                minWidth: !isFieldConfigEditor ? getWidth(inGroup) : "auto",
                position: "relative",
                padding: "8px",
                borderRadius: "5px",
                border: isInEditMode && store.isEditMode && !isFieldConfigEditor ? isFieldset ? "1px dashed #c10b99" : "1px dashed #0A94F8" : !isFieldConfigEditor && store.isEditMode ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
                maxWidth: getWidth(inGroup),
                background: store.isEditMode && !isFieldConfigEditor ? "#fff" : "transparent",
                boxShadow: store.isEditMode && !isFieldConfigEditor ? "1px 1px 1px 0px rgba(0,0,0,0.05)" : "none"
            }}
            onContextMenu={(e) => {
                if (contextMenuRef && contextMenuRef.current) {
                    contextMenuRef.current.show(e);
                    store.setActiveContextMenuInput(path);
                }
            }}
            onMouseOver={() => setIsInEditMode(store.isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement, fieldsetId) ? true : false)}
            onClick={(e) => {
                e.stopPropagation();
                if (isInEditMode && store.isEditMode && !isFieldConfigEditor) {
                    store.setSelectedElement(fieldsetId ? `{${fieldsetId}}.${path}` : path, e.shiftKey);
                    store.setEditorTabIndex(1);
                }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            {store.isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={path} fieldsetId={fieldsetId} isHovered={isInEditMode} type={isFieldset ? "fieldset" : "field"} /> : null}
            {field}
        </motion.div>
    );
};

export default EditableBlock;