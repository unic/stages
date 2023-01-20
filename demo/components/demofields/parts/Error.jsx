import React from "react";

const Error = ({
    error,
    text
}) => {
    return (
        <>
            <div style={{ color: "red", marginTop: "4px", fontSize: "14px" }}>{text}</div>
            {typeof error.errorCode === "string" ? (
                <div>Error code: {error.errorCode}</div>
            ) : null}
        </>
    );
}

export default Error;