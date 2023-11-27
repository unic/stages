import { useState } from 'react';

const InsertBlock = ({ path, direction, isEditMode, setActiveContextMenuInput, contextMenuRef }) => {
    const [isHover, setIsHover] = useState(false);

   const handleMouseEnter = () => {
      setIsHover(true);
   };

   const handleMouseLeave = () => {
      setIsHover(false);
   };

    return (
        <div title={path} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{
            padding: "4px",
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
            opacity: isHover && isEditMode ? 1 : 0,
            cursor: isHover && isEditMode ? "pointer" : "default"
        }} onContextMenu={(e) => {
            if (contextMenuRef && contextMenuRef.current) {
                contextMenuRef.current.show(e);
                setActiveContextMenuInput(`insert > ${path}`, true);
            }
        }}><div>+</div></div>
    )
};

export default InsertBlock;