import { Group } from 'lucide-react';

const BlockPathLabel = ({ path, inCollection, isHovered, type }) => {
    return (
        <span style={{
            position: "absolute",
            top: inCollection ? "-13px" : "-9px",
            right: "16px",
            fontSize: "11px",
            color: isHovered ? "#0A94F8" : "#ccc",
            background: "#fff",
            padding: "1px 4px",
            borderRadius: "3px",
        }}>{type === "group" ? "[••] " : null}{type === "collection" ? "[=] " : null}{type === "field" ? "[ ] " : null}{path}</span>
    );  
};

export default BlockPathLabel;