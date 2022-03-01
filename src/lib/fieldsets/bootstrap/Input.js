import React from "react";
import Form from "react-bootstrap/Form";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Button from "react-bootstrap/Button";

const InputTooltip = ({ text }) => {
    return (
        <div
            style={{
                position: "absolute",
                content: "",
                top: "30px",
                right: "9px"
            }}
        >
            <OverlayTrigger
                placement="left"
                overlay={(
                    <Tooltip>{text}</Tooltip>
                )}
            >
                <Button
                    variant="secondary"
                    style={{
                        borderRadius: "100%",
                        backgroundColor: "#fff",
                        border: "1px #333 solid",
                        fontSize: "11px",
                        fontWeight: "bold",
                        color: "#333",
                        padding: 0,
                        width: "18px",
                        height: "18px"
                    }}
                >?</Button>
            </OverlayTrigger>
        </div>
    );
};

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
    error,
    placeholder,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText,
    tooltip,
    type
}) => {
    return (
        <Form.Group className="mb-3" controlId={id} style={{ position: "relative" }}>
            {label ? <Form.Label>{label}{isRequired ? " *" : ""}</Form.Label> : null}
            {secondaryText ? <Form.Text className="text-muted">{secondaryText}</Form.Text> : null}
            {prefix ? <span>{prefix}</span> : null}
            <Form.Control
                type={type || "text"}
                placeholder={placeholder}
                isInvalid={typeof error !== "undefined"}
                disabled={!!isDisabled}
                value={value || ""}
                onChange={e => {
                    if (typeof onChange === "function") onChange(e.target.value);
                }}
            />
            {tooltip ? <InputTooltip text={tooltip} /> : null}
            {suffix ? <span>{suffix}</span> : null}
            {error ? <Form.Text className="text-muted">Bitte füllen Sie dieses Feld aus!</Form.Text> : null}
        </Form.Group>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default Input;