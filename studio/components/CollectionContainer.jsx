import { useState, useEffect } from 'react';
import BlockPathLabel from './BlockPathLabel';
import { pathIsSelected } from './helpers';

const CollectionContainer = ({ children, handleEditCollection, isEditMode, path, selectedElement, isFieldConfigEditor }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && pathIsSelected(path, selectedElement));

    useEffect(() => {
        if (!pathIsSelected(path, selectedElement)) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div
            style={{
                position: "relative",
                flexWrap: "wrap",
                border: isInEditMode && isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor && isEditMode ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
                borderRadius: "5px",
                padding: "2px",
                background: !isFieldConfigEditor ? "rgba(255, 255, 255, 0.2)" : "transparent"
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) handleEditCollection(path, e.shiftKey);
            }}
            onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement) ? true : false)}
        >
            {isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={path} isHovered={isInEditMode} type="collection" /> : null}
            {children}
        </div>
    );
};

export default CollectionContainer;