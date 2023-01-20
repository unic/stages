import React from "react";

const SecondaryText = ({
 isDisabled,
 children
}) => {
    return (
        <div style={{ fontSize: "14px", color: isDisabled ? "#999" : "#666", marginTop: "4px" }}>{children}</div>
    );
}

export default SecondaryText;