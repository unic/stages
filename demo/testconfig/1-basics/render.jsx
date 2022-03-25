import React from "react";

const FormRenderer = ({ fields, onCollectionAction, data }) => {
    return (
        <div>
            {fields.username}
            <br />
            {fields.email}
            <br />
            {fields.password}
            <br />
            {fields.signedIn}
            <br />
            {fields.duration}
            <br />
            {fields.onTheRadio}
        </div>
    );
};

export default FormRenderer;