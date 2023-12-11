import { useState, useEffect } from 'react';
import BlockPathLabel from './BlockPathLabel';
import { pathIsSelected } from './helpers';

const GroupContainer = ({ children, handleEditGroup, isEditMode, path, selectedElement, isFieldConfigEditor }) => {
    const [isInEditMode, setIsInEditMode] = useState(isEditMode && pathIsSelected(path, selectedElement));

    useEffect(() => {
        if (!pathIsSelected(path, selectedElement)) setIsInEditMode(false);
    }, [path, selectedElement]);

    return (
        <div
            className="flex"
            style={{
                position: "relative",
                flexWrap: "wrap",
                border: isInEditMode && isEditMode && !isFieldConfigEditor ? "1px dashed #0A94F8" : !isFieldConfigEditor && isEditMode ? "1px dashed #ddd" : "1px solid rgba(0,0,0,0)",
                borderRadius: "5px",
                padding: "8px 2px",
                background: !isFieldConfigEditor ? "#fff" : "transparent",
                boxShadow: !isFieldConfigEditor ? "1px 1px 1px 0px rgba(0,0,0,0.05)" : "none"
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) handleEditGroup(path, e.shiftKey);
            }}
            onMouseOver={() => setIsInEditMode(isEditMode ? true : false)} onMouseOut={() => setIsInEditMode(pathIsSelected(path, selectedElement) ? true : false)}
        >
            {isEditMode && !isFieldConfigEditor ? <BlockPathLabel path={path} isHovered={isInEditMode} type="group" /> : null}
            {children}
        </div>
    );
};

export default GroupContainer;