import React from "react";

const Paragraph = ({
    children
}) => {
    return (
        <p style={{ color: "#666", maxWidth: "600px", lineHeight: "22px", marginBottom: "24px" }}>
            {children}
        </p>
    );
}

export default Paragraph;