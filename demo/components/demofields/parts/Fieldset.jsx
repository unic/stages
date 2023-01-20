import React from "react";

const Fieldset = ({
    children
}) => {
    return (
        <fieldset style={{ border: "2px #bbb dashed", padding: "16px" }}>
            {children}
        </fieldset>
    );
}

export default Fieldset;