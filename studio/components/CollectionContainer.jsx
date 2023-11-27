const CollectionContainer = ({ children, handleEditCollection, isEditMode, path }) => {
    return (
        <div style={{ position: "relative", flexWrap: "wrap", border: "1px #bbb dashed", borderRadius: "5px", padding: "2px", margin: "0 4px 4px 0" }}>
            {children}
            {isEditMode ? <button style={{ position: "absolute", top: "-16px", right: "4px" }} type="button" onClick={() => handleEditCollection(path)}>edit collection</button> : null}
        </div>
    );
};

export default CollectionContainer;