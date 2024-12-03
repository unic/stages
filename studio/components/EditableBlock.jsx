import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { GripHorizontal } from "lucide-react";
import useStagesStore from "./store";
import BlockPathLabel from "./BlockPathLabel";
import { pathIsSelected, getWidth } from "./helpers";

const EditableBlock = ({
  field,
  path,
  selectedElement,
  inGroup,
  isFieldset,
  contextMenuRef,
  isFieldConfigEditor,
  fieldsetId,
  width,
}) => {
  const store = useStagesStore();
  const [isInEditMode, setIsInEditMode] = useState(
    store.isEditMode && pathIsSelected(path, selectedElement, fieldsetId)
  );
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${path}`,
  });

  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!pathIsSelected(path, selectedElement, fieldsetId))
      setIsInEditMode(false);
  }, [path, selectedElement]);

  return (
    <motion.div
      className={inGroup ? "flex-1" : undefined}
      style={{
        minWidth: !isFieldConfigEditor
          ? getWidth(inGroup, isFieldConfigEditor, store.isEditMode, width)
          : "auto",
        position: "relative",
        padding: "8px",
        borderRadius: "5px",
        border:
          isInEditMode && store.isEditMode && !isFieldConfigEditor
            ? isFieldset
              ? "1px dashed #c10b99"
              : "1px dashed #0A94F8"
            : !isFieldConfigEditor && store.isEditMode
            ? "1px dashed #ddd"
            : "1px solid rgba(0,0,0,0)",
        maxWidth: getWidth(
          inGroup,
          isFieldConfigEditor,
          store.isEditMode,
          width
        ),
        background:
          store.isEditMode && !isFieldConfigEditor ? "#fff" : "transparent",
        boxShadow:
          store.isEditMode && !isFieldConfigEditor
            ? "1px 1px 1px 0px rgba(0,0,0,0.05)"
            : "none",
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        zIndex: transform ? 1000 : 1,
      }}
      onContextMenu={(e) => {
        if (contextMenuRef && contextMenuRef.current) {
          contextMenuRef.current.show(e);
          store.setActiveContextMenuInput(
            fieldsetId ? `{${fieldsetId}}.${path}` : path
          );
        }
      }}
      onMouseOver={() => setIsInEditMode(store.isEditMode ? true : false)}
      onMouseOut={() =>
        setIsInEditMode(
          pathIsSelected(path, selectedElement, fieldsetId) ? true : false
        )
      }
      onClick={(e) => {
        e.stopPropagation();
        if (isInEditMode && store.isEditMode && !isFieldConfigEditor) {
          store.setSelectedElement(
            fieldsetId ? `{${fieldsetId}}.${path}` : path,
            e.shiftKey
          );
          store.setEditorTabIndex(1);
        }
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {store.isEditMode && !isFieldConfigEditor ? (
        <div
          style={{
            position: "absolute",
            top: "6px",
            right: "8px",
            cursor: "grab",
          }}
          ref={setNodeRef}
          {...listeners}
          {...attributes}
        >
          <GripHorizontal
            size={20}
            color={isInEditMode ? "#0A94F8" : "transparent"}
          />
        </div>
      ) : null}
      {store.isEditMode && !isFieldConfigEditor ? (
        <BlockPathLabel
          onChangeBlockWidth={(width) => store.onChangeBlockWidth(path, width)}
          blockWidth={width || "large"}
          path={path}
          fieldsetId={fieldsetId}
          isHovered={isInEditMode}
          type={isFieldset ? "fieldset" : "field"}
        />
      ) : null}
      {field}
    </motion.div>
  );
};

export default EditableBlock;
