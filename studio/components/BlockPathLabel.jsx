const BlockPathLabel = ({ path, inCollection }) => {
    return (
        <span style={{
            position: "absolute",
            top: inCollection ? "-13px" : "-9px",
            right: "16px",
            fontSize: "11px",
            color: "#ccc",
            background: "#fff",
            padding: "1px 4px",
            borderRadius: "3px",
        }}>{path}</span>
    );  
};

export default BlockPathLabel;