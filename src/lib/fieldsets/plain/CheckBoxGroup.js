import React, { Fragment } from "react";

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

const CheckBoxGroup = ({
    id,
    label,
    value,
    options,
    onChange,
    onBlur,
    onFocus,
    error,
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
        <div id={id}>
            {label ? <label>{label}{isRequired ? " *" : ""}</label> : null}
            <div>
                {prefix ? <span>{prefix}</span> : null}
                {options.map(option => {
                    return (
                        <Fragment key={`${id}-${option.value}`}>
                            <input
                                type="checkbox"
                                name={id}
                                id={`${id}-${option.value}`}
                                value={option.value}
                                checked={Array.isArray(value) && value.indexOf(option.value) !== -1}
                                disabled={!!isDisabled}
                                onChange={() => {/* to make React and IE happy */}}
                                onClick={e => {
                                    if (typeof onChange === "function") {
                                        const newValues = Array.isArray(value) ? [...value] : [];
                                        if (newValues.indexOf(option.value) === -1) {
                                            newValues.push(option.value);
                                        } else {
                                            newValues.splice(newValues.indexOf(option.value), 1);
                                        }
                                        onChange(newValues);
                                    }
                                }}
                                onBlur={e => {
                                    if (typeof onBlur === "function") onBlur();
                                }}
                                onFocus={e => {
                                    if (typeof onFocus === "function") onFocus();
                                }}
                            />
                            <label htmlFor={`${id}-${option.value}`}>{option.text}</label>
                            {" "}
                        </Fragment>
                    );
                })}
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <div>{secondaryText}</div> : null}
            {error && !isValidating ? errorRenderer ? errorRenderer(error) : (
                <div style={{ color: "red" }}>Please fill out this field!</div>
            ) : null}
            {isValidating ? <div style={{ color: "#999" }}>Field is validating ...</div> : null}
        </div>
    );
};

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default CheckBoxGroup;