import React from 'react';

const HR = ({ isDirty }) => (
    <div style={{ height: "4px", width: "620px", background: isDirty ? "#b88466" : "#ddd" }} />
);

export default HR;