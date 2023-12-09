import { useState, useEffect } from 'react';
import BlockPathLabel from './BlockPathLabel';

const CollectionContainer = ({ children, handleEditCollection, isEditMode, path, selectedElement, isFieldConfigEditor }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && selectedElement === path);

    useEffect(() => {
        if (selectedElement !== path) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div
            style={{ position: "relative", flexWrap: "wrap", border: isInEditMode && isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor ? "1px dashed #ccc" : "1px solid rgba(0,0,0,0)", borderRadius: "5px", padding: "2px", margin: "0 4px 4px 0" }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) handleEditCollection(path);
            }}
            onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}
        >
            <BlockPathLabel path={path} />
            {children}
            {isEditMode && isInEditMode && !isFieldConfigEditor ? (
                <span style={{ position: "absolute", top: "6px", right: "6px", color: "#0A94F8", fontSize: "11px" }}>edit collection</span>
            ) : null}
        </div>
    );
};

export default CollectionContainer;