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

const RadioGroup = ({
    id,
    label,
    value,
    options,
    onChange,
    error,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText
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
                                type="radio"
                                name={id}
                                id={`${id}-${option.value}`}
                                value={option.value}
                                checked={value === option.value}
                                disabled={!!isDisabled}
                                onChange={() => {/* to make React and IE happy */}}
                                onClick={e => {
                                    if (typeof onChange === "function") onChange(option.value);
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
            {error ? <div style={{ color: "red" }}>Bitte füllen Sie dieses Feld aus!</div> : null}
        </div>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default RadioGroup;