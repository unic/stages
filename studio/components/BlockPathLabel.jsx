const BlockPathLabel = ({ path }) => {
    return (
        <span style={{
            position: "absolute",
            top: "-8px",
            right: "16px",
            fontSize: "11px",
            color: "#bbb",
            background: "#fff",
            padding: "1px 4px",
            borderRadius: "3px",
        }}>{path}</span>
    );  
};

export default BlockPathLabel;