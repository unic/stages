import { useState, useEffect, useCallback } from 'react';
import sanitizeHtml from "sanitize-html";
import useStagesStore from './store';

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

const BlockPathLabel = ({ path, inCollection, isHovered, type, fieldsetId, blockWidth, onChangeBlockWidth, setFormCounter }) => {
    const indexOfLastPathDot = path.lastIndexOf(".");
    const store = useStagesStore();
    const [editablePath, setEditablePath] = useState(indexOfLastPathDot === -1 ? path : path.substring(indexOfLastPathDot + 1));
    const [nonEditablePath, setNonEditablePath] = useState(indexOfLastPathDot === -1 ? "" : path.substring(0, indexOfLastPathDot + 1));

    useEffect(() => {
        const indexOfLastPathDot = path.lastIndexOf(".");
        setEditablePath(indexOfLastPathDot === -1 ? path : path.substring(indexOfLastPathDot + 1));
        setNonEditablePath(indexOfLastPathDot === -1 ? "" : path.substring(0, indexOfLastPathDot + 1));
    }, [path]);

    const handleEditPath = useCallback(evt => {
        const sanitizeConf = {
            allowedTags: [],
            allowedAttributes: {}
        };
        const newEditablePath = sanitizeHtml(evt.currentTarget.innerHTML, sanitizeConf).replace(/\s/g, "X");
        setEditablePath(newEditablePath);
        store.onUpdatePath(nonEditablePath, editablePath, newEditablePath);
        if (typeof setFormCounter === "function") setFormCounter(formCounter => formCounter + 1);
    }, []);

    return (
        <>
            <span style={{
                display: "inline-block",
                position: "absolute",
                top: inCollection ? "-13px" : "-9px",
                right: "6px",
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
                {nonEditablePath}<span contentEditable dangerouslySetInnerHTML={{__html: editablePath}} onClick={(e) => e.preventDefault()} onBlur={handleEditPath} />
            </span>
            {isHovered && (
                <span style={{
                    display: "inline-block",
                    position: "absolute",
                    top: "calc(100% / 2 - 24px)",
                    left: "-14px",
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