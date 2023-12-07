import { useState } from 'react';
import useStagesStore from './store';

const InsertBlock = ({ path, direction, contextMenuRef, grow }) => {
    const store = useStagesStore();
    const [isHover, setIsHover] = useState(false);

    const handleMouseEnter = () => {
        setIsHover(true);
    };

    const handleMouseLeave = () => {
        setIsHover(false);
    };

    if (!store.isEditMode) return null;

    return (
        <div title={path} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{
            padding: grow ? "4px 32px" : "4px",
            margin: direction === "row" ? "4px 0" : "0 4px",
            border: "1px dashed #0A94F8",
            borderRadius: "5px",
            color: "#0A94F8",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            flexDirection: "column",
            lineHeight: "100%",
            opacity: isHover && store.isEditMode ? 1 : 0,
            cursor: isHover && store.isEditMode ? "pointer" : "default"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                store.setActiveContextMenuInput(`insert > ${path}`, true);
            }
        }}><div>+</div></div>
    )
};

export default InsertBlock;