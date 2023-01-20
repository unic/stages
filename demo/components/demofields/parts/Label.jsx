import React from "react";

const Label = ({
    id,
    label,
    isRequired
}) => {
    return (
        <label htmlFor={id} style={{ margin: "4px 0 4px 0", display: "inline-block" }}>
            {label}{isRequired ? " *" : ""}
        </label>
    );
}

export default Label;