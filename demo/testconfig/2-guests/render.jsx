import React from "react";

const FormRenderer = ({ fields, onCollectionAction, data, errors, asyncData }) => {
    return (
        <div>
            {fields.prename}
            <br />
            {fields.lastname}
        </div>
    );
};

export default FormRenderer;