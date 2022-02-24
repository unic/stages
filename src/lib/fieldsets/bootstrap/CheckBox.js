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

const CheckBox = ({
    id,
    label,
    value,
    onChange,
    error,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText,
    type
}) => {
    return (
        <Form.Group className="mb-3" controlId={id}>
            {prefix ? <span>{prefix}</span> : null}
            <Form.Check 
                type={type}
                id={`default-checkbox`}
                label={`${label}${isRequired ? " *" : ""}`}
                value="1"
                disabled={!!isDisabled}
                checked={!!value}
                onChange={() => {/* to make React and IE happy */}}
                onClick={e => {
                    if (typeof onChange === "function") onChange(e.target.checked ? true : false);
                }}
            />
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

export default CheckBox;