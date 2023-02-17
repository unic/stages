import React from "react";

const FieldWrapper = ({
    id,
    isDirty,
    hasFocus,
    hideDebugInfo,
    children
}) => {
    return (
        <div
            id={id}
            style={{
                borderLeft: hideDebugInfo ? "none" : isDirty ? "4px #b88466 solid" : "4px #ddd solid",
                paddingLeft: hideDebugInfo ? "6px" : "16px",
                paddingBottom: "6px",
                background: hasFocus ? "#f2f2f2" : "transparent",
                maxWidth: "600px"
            }}
        >
            {children}
        </div>
    );
}

export default FieldWrapper;