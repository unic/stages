import React from "react";

const PathInfo = ({
    id,
    type
}) => {
    return (
        <div style={{ fontSize: "11px", fontFamily: "Courier New, Courier", color: "#999", marginBottom: "4px" }}>
            <strong>path:</strong> {id} | <strong>type:</strong> {type}
        </div>
    );
}

export default PathInfo;