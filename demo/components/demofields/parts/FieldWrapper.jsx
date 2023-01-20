import React from "react";

const FieldWrapper = ({
    id,
    isDirty,
    children
}) => {
    return (
        <div id={id} style={{ borderLeft: isDirty ? "4px #f30 solid" : "4px #eee solid", paddingLeft: "16px" }}>
            {children}
        </div>
    );
}

export default FieldWrapper;