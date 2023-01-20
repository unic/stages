import React from "react";
import Label from "./parts/Label";
import FieldWrapper from "./parts/FieldWrapper";
import PathInfo from "./parts/PathInfo";
import Error from "./parts/Error";
import SecondaryText from "./parts/SecondaryText";

/*

This field is to be used for additional error handling of a combination of fields.

*/

const Dummy = ({
    id,
    type,
    label,
    error,
    isRequired,
    isDirty,
    isDisabled,
    hasFocus,
    secondaryText,
    errorRenderer,
    ...props // this will give you all other props, things like validateOn, the computedValue function etc. or custom props
}) => {
    if (label || secondaryText || error) {
        return (
            <FieldWrapper id={id} isDirty={isDirty} hasFocus={hasFocus}>
                {label ? <Label id={id} label={label} isRequired={isRequired} isDisabled={isDisabled} /> : null}
                <PathInfo id={id} type={type} />
                {secondaryText ? <SecondaryText isDisabled={isDisabled}>{secondaryText}</SecondaryText> : null}
                {error ? errorRenderer ? errorRenderer(error) : (
                    <Error text="Please fill out this field!" error={error} />
                ) : null}
            </FieldWrapper>
        );
    }
    return null;
}

export default Dummy;