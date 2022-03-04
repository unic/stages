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

const TextArea = ({
    id,
    label,
    value,
    onChange,
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
        <Form.Group className="mb-3" controlId={id}>
            {label ? <Form.Label>{label}{isRequired ? " *" : ""}</Form.Label> : null}
            {secondaryText ? <Form.Text className="text-muted">{secondaryText}</Form.Text> : null}
            {prefix ? <span>{prefix}</span> : null}
            <Form.Control
                as="textarea"
                rows={3}
                placeholder={placeholder}
                isInvalid={typeof error !== "undefined"}
                disabled={!!isDisabled}
                value={value || ""}
                onChange={e => {
                    if (typeof onChange === "function") onChange(e.target.value);
                }}
            />
            {suffix ? <span>{suffix}</span> : null}
            {error ? errorRenderer ? errorRenderer(error) : (
                <Form.Control.Feedback type="invalid">Please fill out this field!</Form.Control.Feedback>
            ) : null}
        </Form.Group>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default TextArea;