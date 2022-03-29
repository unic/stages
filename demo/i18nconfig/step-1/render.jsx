import React from "react";

const FormRenderer = ({ fields, locale, i18n }) => {
    return (
        <div>
            <p>{i18n.steps.one.intro[locale]}</p>
            <br />
            {fields.field1}
            <br />
            {fields.field2}
        </div>
    );
};

export default FormRenderer;