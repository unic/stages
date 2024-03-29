import React, { Fragment } from "react";
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

const RadioGroup = ({
    id,
    type,
    label,
    value,
    options,
    onChange,
    onBlur,
    onFocus,
    error,
    isRequired,
    isDisabled,
    isDirty,
    isValidating,
    hasFocus,
    prefix,
    suffix,
    secondaryText,
    errorRenderer,
    hideDebugInfo,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    return (
        <FieldWrapper id={id} isDirty={isDirty} hasFocus={hasFocus} hideDebugInfo={hideDebugInfo}>
            {label ? <Label label={label} isRequired={isRequired} isDisabled={isDisabled} /> : null}
            {hideDebugInfo ? null : <PathInfo id={id} type={type} />}
            <div>
                {prefix ? <span>{prefix}</span> : null}
                {options.map(option => {
                    return (
                        <span key={`${id}-${option.value}`} style={{ marginRight: "8px", color: isDisabled ? "#999" : "#000" }}>
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
                                onBlur={e => {
                                    if (typeof onBlur === "function") onBlur();
                                }}
                                onFocus={e => {
                                    if (typeof onFocus === "function") onFocus();
                                }}
                            />
                            {" "}
                            <label htmlFor={`${id}-${option.value}`}>{option.text}</label>
                            {" "}
                        </span>
                    );
                })}
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <SecondaryText isDisabled={isDisabled}>{secondaryText}</SecondaryText> : null}
            {error && !isValidating ? errorRenderer ? errorRenderer(error) : (
                <Error text="Please fill out this field!" error={error} />
            ) : null}
            {isValidating ? <div style={{ color: "#999" }}>Field is validating ...</div> : null}
        </FieldWrapper>
    );
};

export const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

export default RadioGroup;