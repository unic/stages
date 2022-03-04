import React, { Fragment } from "react";
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

const CheckBoxGroup = ({
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
    secondaryText,
    type,
    errorRenderer
}) => {
    return (
        <Form.Group className="mb-3" controlId={id}>
            {prefix ? <span>{prefix}</span> : null}
            {label ? <Form.Label>{label}{isRequired ? " *" : ""}</Form.Label> : null}
            <br /><br />
            <div key={`inline-${type}`} className="mb-3">
                {options.map(option => {
                        return (
                            <Fragment key={`${id}-${option.value}`}>
                                <Form.Check 
                                    type="checkbox"
                                    id={`default-checkbox`}
                                    label={`${option.text}${isRequired ? " *" : ""}`}
                                    disabled={!!isDisabled}
                                    value={option.value}
                                    checked={value && value.indexOf(option.value) > -1}
                                    onChange={() => {/* to make React and IE happy */}}
                                    onClick={e => {
                                        if (typeof onChange === "function") {
                                            let newValue = value;
                                            if (!newValue || !Array.isArray(newValue)) newValue = [];
                                            if (newValue.indexOf(option.value) === -1) {
                                                newValue.push(option.value);
                                            } else {
                                                newValue.splice(newValue.indexOf(option.value), 1);
                                            }
                                            onChange(newValue);
                                        }
                                    }}
                                />
                            </Fragment>
                        );
                    })
                }
            </div>
            {suffix ? <span>{suffix}</span> : null}
            {secondaryText ? <Form.Text className="text-muted">{secondaryText}</Form.Text> : null}
            {error ? errorRenderer ? errorRenderer(error) : (
                <Form.Text className="text-muted">Please fill out this field!</Form.Text>
            ) : null}
        </Form.Group>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default CheckBoxGroup;