import React from "react";
import Form from "react-bootstrap/Form";

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
    onChange,
    error,
    options,
    placeholder,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText,
}) => {
    return (
        <Form.Group className="mb-3" controlId={id}>
            {label ? <Form.Label>{label}{isRequired ? " *" : ""}</Form.Label> : null}
            {prefix ? <span>{prefix}</span> : null}
            <Form.Select
                aria-label={`${label}${isRequired ? " *" : ""}`}
                name={id}
                value={value}
                options={options}
                placeholder={placeholder}
                disabled={!!isDisabled}
                required={!!isRequired}
                onChange={e => {
                    if (typeof onChange === "function") onChange(e.target.value);
                }}
            >
                {options.map(option => <option value={option.value} key={option.value}>{option.text}</option>)}
            </Form.Select>
            {suffix ? <span>{suffix}</span> : null}
            {secondaryText ? <Form.Text className="text-muted">{secondaryText}</Form.Text> : null}
            {error ? <Form.Text className="text-muted">Bitte füllen Sie dieses Feld aus!</Form.Text> : null}
        </Form.Group>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default Select;