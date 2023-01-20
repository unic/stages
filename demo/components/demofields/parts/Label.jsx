import React from "react";

const Label = ({
    id,
    label,
    isRequired,
    isDisabled
}) => {
    return (
        <label htmlFor={id} style={{ margin: "4px 0 0 0", display: "inline-block", color: isDisabled ? "#666" : "#000" }}>
            {label}{isRequired ? " *" : ""}
        </label>
    );
}

export default Label;