const SizeButton = ({ size, isActive, type, onChangeBlockWidth }) => {
    return <button type="button" style={{
        border: "1px solid #ddd",
        borderColor: type === "fieldset" ? isActive ? "#c10b99" : "#bbb" : isActive ? "#0A94F8" : "#bbb",
        background: "#fff",
        borderRadius: "3px",
        cursor: "pointer",
        userSelect: "none",
        fontSize: "9px",
        color: type === "fieldset" ? isActive ? "#c10b99" : "#bbb" : isActive ? "#0A94F8" : "#bbb",
        margin: "0 0 1px 0",
        padding: "0 1px",
        width: "14px",
        textAlign: "center"
    }} onClick={() => onChangeBlockWidth ? onChangeBlockWidth(size) : null}>{size}</button>;
};

const BlockPathLabel = ({ path, inCollection, isHovered, type, fieldsetId, blockWidth, onChangeBlockWidth }) => {
    return (
        <>
            <span style={{
                display: "inline-block",
                position: "absolute",
                top: inCollection ? "-13px" : "-9px",
                right: "4px",
                fontSize: "11px",
                color: isHovered ? type === "fieldset" ? "#c10b99" : "#0A94F8" : "#ccc",
                background: "#fff",
                padding: "1px 4px",
                borderRadius: "3px",
                userSelect: "none",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden"
            }}>
                {type === "fieldset" ? `{${fieldsetId}} ` : null}
                {type === "group" ? "[••] " : null}{type === "collection" ? "[=] " : null}
                {type === "wizard" ? "[ : ] " : null}
                {type === "stage" ? "[ . ] " : null}
                {type === "field" ? "[ ] " : null}
                {path}
            </span>
            {isHovered && (
                <span style={{
                    display: "inline-block",
                    position: "absolute",
                    top: "calc(100% / 2 - 24px)",
                    right: "-12px",
                    fontSize: "11px",
                    color: isHovered ? type === "fieldset" ? "#c10b99" : "#0A94F8" : "#ccc",
                    background: "transparent",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    overflow: "hidden"
                }}>
                    <div style={{ display: "inline-block", borderRadius: "3px" }}>
                        <SizeButton isActive={blockWidth === "small"} size="S" type={type} onChangeBlockWidth={onChangeBlockWidth} />
                        <br />
                        <SizeButton isActive={blockWidth === "medium"} size="M" type={type} onChangeBlockWidth={onChangeBlockWidth} />
                        <br />
                        <SizeButton isActive={!blockWidth || blockWidth === "large"} size="L" type={type} onChangeBlockWidth={onChangeBlockWidth} />
                    </div>
                </span>
            )}
            
        </>
    );  
};

export default BlockPathLabel;