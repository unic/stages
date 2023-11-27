const GroupContainer = ({ children }) => {
    return <div className="flex" style={{ flexWrap: "wrap", border: "1px #bbb dashed", borderRadius: "5px", padding: "2px", margin: "0 4px 4px 0" }}>{children}</div>;
};

export default GroupContainer;