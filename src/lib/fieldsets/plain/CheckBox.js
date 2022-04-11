import React from "react";

/*

Each field must bring at least:
- id (acts as name etc.)
- label

Optional:
- value
- error
- onChange
- onValidate
- placeholder
- isRequired
- disabled
- prefix
- suffix
- secondaryText

*/

const CheckBox = ({
    id,
    label,
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText,
    type,
    errorRenderer
}) => {
    return (
        <div id={id}>
            {label ? <label htmlFor={id}>{label}{isRequired ? " *" : ""}</label> : null}
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <input
                    name={id}
                    value="1"
                    placeholder={placeholder}
                    type={type}
                    disabled={!!isDisabled}
                    required={!!isRequired}
                    checked={!!value}
                    onChange={() => {/* to make React and IE happy */}}
                    onClick={e => {
                        if (typeof onChange === "function") onChange(e.target.checked ? true : false);
                        if (typeof onBlur === "function") onBlur(e.target.checked ? true : false);
                    }}
                />
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <div>{secondaryText}</div> : null}
            {error ? errorRenderer ? errorRenderer(error) : (
                <div style={{ color: "red" }}>Please fill out this field!</div>
            ) : null}
        </div>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default CheckBox;