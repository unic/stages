import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
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
        <motion.div
            className={inGroup ? "flex-1" : undefined}
            style={{
                minWidth: "230px",
                position: "relative",
                padding: "8px",
                borderRadius: "5px",
                border: isInEditMode && store.isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor && store.isEditMode ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
                maxWidth: inGroup ? "33%" : "100%",
                background: store.isEditMode && !isFieldConfigEditor ? "#fff" : "transparent",
                boxShadow: store.isEditMode && !isFieldConfigEditor ? "1px 1px 1px 0px rgba(0,0,0,0.05)" : "none"
            }}
            onContextMenu={(e) => {
                if (contextMenuRef && contextMenuRef.current) {
                    contextMenuRef.current.show(e);
                    store.setActiveContextMenuInput(path);
                }
            }}
            onMouseOver={() => setIsInEditMode(store.isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement) ? true : false)}
            onClick={(e) => {
                e.stopPropagation();
                if (isInEditMode && store.isEditMode && !isFieldConfigEditor) {
                    store.setSelectedElement(path, e.shiftKey);
                    store.setEditorTabIndex(1);
                }
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            {store.isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={path} isHovered={isInEditMode} type="field" /> : null}
            {field}
        </motion.div>
    );
};

export default EditableBlock;