import React from "react";
import Label from "./parts/Label";
import FieldWrapper from "./parts/FieldWrapper";
import PathInfo from "./parts/PathInfo";
import Error from "./parts/Error";

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
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    return (
        <FieldWrapper id={id} isDirty={isDirty} hasFocus={hasFocus} hideDebugInfo={hideDebugInfo}>
            {label ? <Label id={id} label={label} isRequired={isRequired} isDisabled={isDisabled} /> : null}
            <PathInfo id={id} type={type} />
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <input
                    name={id}
                    value="1"
                    placeholder={placeholder}
                    type={type}
                    disabled={!!isDisabled}
                    required={!!isRequired}
                    checked={!!value}
                    onChange={() => {/* to make React and IE happy */}}
                    onClick={e => {
                        if (typeof onChange === "function") onChange(e.target.checked ? true : false);
                    }}
                    onBlur={e => {
                        if (typeof onBlur === "function") onBlur();
                    }}
                    onFocus={e => {
                        if (typeof onFocus === "function") onFocus();
                    }}
                />
                {suffix ? <span>{suffix}</span> : null} {secondaryText ? <span style={{ verticalAlign: "2px", marginLeft: "2px", fontSize: "14px", color: isDisabled ? "#999" : "#000" }}>{secondaryText}</span> : null}
            </div>
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

export default CheckBox;