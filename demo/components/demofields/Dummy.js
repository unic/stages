import React from "react";

/*

This field is to be used for additional error handling of a combination of fields.

*/

const Dummy = ({
    id,
    label,
    error,
    isRequired,
    secondaryText,
    errorRenderer,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    if (label || secondaryText || error) {
        return (
            <div id={id}>
                {label ? <label htmlFor={id}>{label}{isRequired ? " *" : ""}</label> : null}
                {secondaryText ? <div>{secondaryText}</div> : null}
                {error ? errorRenderer ? errorRenderer(error) : (
                    <div style={{ color: "red" }}>Please fill out this field!</div>
                ) : null}
            </div>
        );
    }
    return null;
}

export default Dummy;