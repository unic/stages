import { useState, useEffect } from 'react';
import BlockPathLabel from './BlockPathLabel';

const CollectionContainer = ({ children, handleEditCollection, isEditMode, path, selectedElement, isFieldConfigEditor }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && selectedElement === path);

    useEffect(() => {
        if (selectedElement !== path) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div
            style={{
                position: "relative",
                flexWrap: "wrap",
                border: isInEditMode && isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
                borderRadius: "5px",
                padding: "2px",
                background: !isFieldConfigEditor ? "rgba(255, 255, 255, 0.2)" : "transparent"
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) handleEditCollection(path);
            }}
            onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(selectedElement === path ? true : false)}
        >
            {!isFieldConfigEditor ? <BlockPathLabel path={path} /> : null}
            {children}
        </div>
    );
};

export default CollectionContainer;