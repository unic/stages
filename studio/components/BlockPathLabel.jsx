const BlockPathLabel = ({ path, inCollection, isHovered, type, fieldsetId }) => {
    return (
        <span style={{
            display: "inline-block",
            position: "absolute",
            top: inCollection ? "-13px" : "-9px",
            right: "16px",
            fontSize: "11px",
            color: isHovered ? type === "fieldset" ? "#c10b99" : "#0A94F8" : "#ccc",
            background: "#fff",
            padding: "1px 4px",
            borderRadius: "3px",
            userSelect: "none",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            overflow: "hidden"
        }}>{type === "fieldset" ? `{${fieldsetId}} ` : null}{type === "group" ? "[••] " : null}{type === "collection" ? "[=] " : null}{type === "wizard" ? "[ : ] " : null}{type === "stage" ? "[ . ] " : null}{type === "field" ? "[ ] " : null}{path}</span>
    );  
};

export default BlockPathLabel;