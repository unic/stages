import React from "react";

const FormRenderer = ({ fields, onCollectionAction, data }) => {
    return (
        <div>
            {fields.q1}
            <br />
            {fields.q2}
            <br />
            {fields.q3}
        </div>
    );
};

export default FormRenderer;