import React from "react";

const FieldWrapper = ({
    id,
    isDirty,
    hasFocus,
    children
}) => {
    return (
        <div
            id={id}
            style={{
                borderLeft: isDirty ? "4px #b88466 solid" : "4px #ddd solid",
                paddingLeft: "16px",
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