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

const Select = ({
    id,
    type,
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
    isDirty,
    hasFocus,
    prefix,
    suffix,
    secondaryText,
    errorRenderer,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    return (
        <FieldWrapper id={id} isDirty={isDirty} hasFocus={hasFocus}>
            {label ? <Label id={id} label={label} isRequired={isRequired} isDisabled={isDisabled} /> : null}
            <PathInfo id={id} type={type} />
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <select
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
                    style={{ padding: "4px 0", minWidth: "220px" }}
                >
                    {options.map(option => <option value={option.value} key={option.value} disabled={option.disabled ? true : null}>{option.text}</option>)}
                </select>
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <div>{secondaryText}</div> : null}
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

export default Select;