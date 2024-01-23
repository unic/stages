import { useEffect, useState } from "react";
import { useDroppable } from '@dnd-kit/core';
import useStagesStore from './store';

const InsertBlock = ({ path, direction, contextMenuRef, grow, isFieldConfigEditor, isStage, fieldsetId }) => {
    const store = useStagesStore();
    const [isHover, setIsHover] = useState(false);
    const {isOver, setNodeRef} = useDroppable({
        id: `droppable-${path}`,
      });

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    const handleMouseEnter = () => {
        setIsHover(true);
    };

    const handleMouseLeave = () => {
        setIsHover(false);
    };

    if (!store.isEditMode || isFieldConfigEditor) return null;

    return (
        <div ref={setNodeRef} title={path} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{
            padding: grow ? "4px 32px" : "4px",
            margin: direction === "row" ? "4px 0" : "0 4px",
            border: isOver ? "1px dashed #000" : "1px dashed #0A94F8",
            borderRadius: "5px",
            color: "#0A94F8",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            flexDirection: "column",
            lineHeight: "100%",
            opacity: (isHover || isOver) && store.isEditMode ? 1 : 0,
            cursor: isHover && store.isEditMode ? "pointer" : "default"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                store.setActiveContextMenuInput(isStage ? `stage > ${fieldsetId ? `{${fieldsetId}}.${path}` : path}` : `insert > ${fieldsetId ? `{${fieldsetId}}.${path}` : path}`, true);
            }
        }}><div>+</div></div>
    )
};

export default InsertBlock;