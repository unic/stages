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

const Input = ({
    id,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    error,
    placeholder,
    isRequired,
    isDisabled,
    hasFocus,
    prefix,
    suffix,
    secondaryText,
    type,
    errorRenderer,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    return (
        <div>
            {label ? <label htmlFor={id}>{label}{isRequired ? " *" : ""}</label> : null}
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <input
                    id={id}
                    name={id}
                    value={value || ""}
                    placeholder={placeholder}
                    type={type || "text"}
                    disabled={!!isDisabled}
                    required={!!isRequired}
                    autoComplete={type === "password" ? "current-password" : "off"}
                    onChange={e => {
                        if (typeof onChange === "function") onChange(e.target.value);
                    }}
                    onFocus={e => {
                        if (typeof onFocus === "function") onFocus();
                    }}
                    onBlur={e => {
                        if (typeof onBlur === "function") onBlur();
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

export default Input;