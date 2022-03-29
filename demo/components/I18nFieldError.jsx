import React from 'react';

const FieldError = ({ locale, i18n }) => (
    <div style={{ color: "red" }}>
        {i18n.errors.generalFieldError[locale]}
    </div>
);

export default FieldError;