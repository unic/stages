const SizeButton = ({ size, isActive, type, onChangeBlockWidth }) => {
    return <button type="button" style={{
        border: "1px solid #ddd",
        borderColor: type === "fieldset" ? isActive ? "#c10b99" : "#bbb" : isActive ? "#0A94F8" : "#bbb",
        background: "#fff",
        borderRadius: "3px",
        cursor: "pointer",
        userSelect: "none",
        fontSize: "10px",
        color: type === "fieldset" ? isActive ? "#c10b99" : "#bbb" : isActive ? "#0A94F8" : "#bbb",
        margin: "0 0 1px 0",
        padding: "0 1px",
        width: "14px",
        textAlign: "center"
    }} onClick={(e) => {
        e.preventDefault();
        if (onChangeBlockWidth) onChangeBlockWidth(size);
    }}>{size}</button>;
};

export default SizeButton;