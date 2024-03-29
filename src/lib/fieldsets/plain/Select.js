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

const Select = ({
    id,
    label,
    value,
    options,
    onChange,
    onBlur,
    onFocus,
    error,
    placeholder,
    isRequired,
    isDisabled,
    isValidating,
    prefix,
    suffix,
    secondaryText,
    errorRenderer,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    return (
        <div>
            {label ? <label htmlFor={id}>{label}{isRequired ? " *" : ""}</label> : null}
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <select
                    id={id}
                    name={id}
                    value={typeof value === "undefined" ? "" : value}
                    placeholder={placeholder}
                    disabled={!!isDisabled}
                    required={!!isRequired}
                    onChange={e => {
                        if (typeof onChange === "function") onChange(e.target.value);
                    }}
                    onBlur={e => {
                        if (typeof onBlur === "function") onBlur();
                    }}
                    onFocus={e => {
                        if (typeof onFocus === "function") onFocus();
                    }}
                >
                    {options.map(option => <option value={option.value} key={option.value} disabled={option.disabled ? true : null}>{option.text}</option>)}
                </select>
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <div>{secondaryText}</div> : null}
            {error && !isValidating ? errorRenderer ? errorRenderer(error) : (
                <div style={{ color: "red" }}>Please fill out this field!</div>
            ) : null}
            {isValidating ? <div style={{ color: "#999" }}>Field is validating ...</div> : null}
        </div>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default Select;