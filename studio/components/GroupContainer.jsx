const GroupContainer = ({ children, handleEditGroup, isEditMode, path }) => {
    return (
        <div className="flex" style={{ position: "relative", flexWrap: "wrap", border: "1px #bbb dashed", borderRadius: "5px", padding: "2px", margin: "0 4px 4px 0" }}>
            {children}
            {isEditMode ? <button style={{ position: "absolute", top: "-16px", right: "4px" }} type="button" onClick={() => handleEditGroup(path)}>edit group</button> : null}
        </div>
    );
};

export default GroupContainer;