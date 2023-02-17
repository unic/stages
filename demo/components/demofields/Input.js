import React from "react";
import Label from "./parts/Label";
import FieldWrapper from "./parts/FieldWrapper";
import PathInfo from "./parts/PathInfo";
import Error from "./parts/Error";
import SecondaryText from "./parts/SecondaryText";

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
    isDirty,
    hasFocus,
    prefix,
    suffix,
    secondaryText,
    type,
    errorRenderer,
    hideDebugInfo,
    highlighted,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    return (
        <FieldWrapper id={id} isDirty={isDirty} hasFocus={hasFocus} hideDebugInfo={hideDebugInfo}>
            {label ? <Label id={id} label={label} isRequired={isRequired} isDisabled={isDisabled} /> : null}
            {hideDebugInfo ? null : <PathInfo id={id} type={type} />}
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <input
                    name={id}
                    value={value || ""}
                    placeholder={placeholder}
                    type={type || "text"}
                    disabled={!!isDisabled}
                    required={!!isRequired}
                    onChange={e => {
                        if (typeof onChange === "function") onChange(e.target.value);
                    }}
                    onFocus={e => {
                        if (typeof onFocus === "function") onFocus();
                    }}
                    onBlur={e => {
                        if (typeof onBlur === "function") onBlur();
                    }}
                    style={highlighted ? { 
                        padding: "4px", fontWeight: "bold", minWidth: type === "number" ? "75px" : "208px", maxWidth: type === "number" ? "75px" : "208px"
                    } : { 
                        padding: "4px 8px", minWidth: type === "number" ? "75px" : "200px", maxWidth: type === "number" ? "75px" : "200px"
                    }}
                />
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <SecondaryText isDisabled={isDisabled}>{secondaryText}</SecondaryText> : null}
            {error ? errorRenderer ? errorRenderer(error) : (
                <Error text="Please fill out this field!" error={error} />
            ) : null}
        </FieldWrapper>
    );
}

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default Input;