import { useState, useEffect, useCallback } from "react";
import sanitizeHtml from "sanitize-html";
import { useDraggable } from "@dnd-kit/core";
import { GripHorizontal } from "lucide-react";
import useStagesStore from "./store";
import BlockPathLabel from "./BlockPathLabel";
import Label from "./Label";
import {
  pathIsSelected,
  parseTemplateLiterals,
  textHasTemplateLiterals,
} from "./helpers";
import Container from "./Container";
import { useShallow } from "zustand/react/shallow";

const EMPTY_DATA = Object.freeze({});

const GroupContainer = ({
  children,
  handleEditGroup,
  isEditMode,
  path,
  label,
  secondaryText,
  selectedElement,
  isFieldConfigEditor,
  contextMenuRef,
  fieldsetId,
  width,
  inGroup,
}) => {
  const usesTemplateData = textHasTemplateLiterals(label)
    || textHasTemplateLiterals(secondaryText);
  const store = useStagesStore(useShallow((state) => ({
    data: usesTemplateData ? state.data : EMPTY_DATA,
    onChangeBlockWidth: state.onChangeBlockWidth,
    onUpdateLabel: state.onUpdateLabel,
    onUpdateSecondaryText: state.onUpdateSecondaryText,
    setActiveContextMenuInput: state.setActiveContextMenuInput,
  })));
  const [isInEditMode, setIsInEditMode] = useState(
    isEditMode && pathIsSelected(path, selectedElement, fieldsetId)
  );
  const [labelText, setLabelText] = useState(
    label ? parseTemplateLiterals(label, store.data) : ""
  );
  const [secText, setSecText] = useState(
    secondaryText ? parseTemplateLiterals(secondaryText, store.data) : ""
  );
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${path}`,
  });

  useEffect(() => {
    if (!pathIsSelected(path, selectedElement, fieldsetId))
      setIsInEditMode(false);
  }, [path, selectedElement]);

  useEffect(() => {
    setLabelText(label ? parseTemplateLiterals(label, store.data) : "");
  }, [label, store.data]);

  useEffect(() => {
    setSecText(
      secondaryText ? parseTemplateLiterals(secondaryText, store.data) : ""
    );
  }, [secondaryText, store.data]);

  const handleEditLabel = useCallback((evt) => {
    const sanitizeConf = {
      allowedTags: [],
      allowedAttributes: {},
    };
    const newLabel = sanitizeHtml(evt.currentTarget.innerHTML, sanitizeConf);
    setLabelText(newLabel);
    store.onUpdateLabel(path, newLabel);
  }, [path, store.onUpdateLabel]);

  const handleEditSecondaryText = useCallback((evt) => {
    const sanitizeConf = {
      allowedTags: [],
      allowedAttributes: {},
    };
    const newSecondaryText = sanitizeHtml(
      evt.currentTarget.innerHTML,
      sanitizeConf
    );
    setSecText(newSecondaryText);
    store.onUpdateSecondaryText(path, newSecondaryText);
  }, [path, store.onUpdateSecondaryText]);

  return (
    <Container
      isInEditMode={isInEditMode}
      isEditMode={isEditMode}
      isFieldConfigEditor={isFieldConfigEditor}
      inGroup={inGroup}
      transform={transform}
      width={width}
      className="flex"
      colums={isFieldConfigEditor}
      onContextMenu={(e) => {
        if (contextMenuRef && contextMenuRef.current) {
          contextMenuRef.current.show(e);
          store.setActiveContextMenuInput(
            fieldsetId ? `{${fieldsetId}}.${path}` : path
          );
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isEditMode)
          handleEditGroup(
            fieldsetId ? `{${fieldsetId}}.${path}` : path,
            e.shiftKey
          );
      }}
      onMouseEnter={() => setIsInEditMode(isEditMode ? true : false)}
      onMouseLeave={() =>
        setIsInEditMode(
          pathIsSelected(path, selectedElement, fieldsetId) ? true : false
        )
      }
    >
      {isEditMode && !isFieldConfigEditor ? (
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
      {isEditMode && !isFieldConfigEditor ? (
        <BlockPathLabel
          onChangeBlockWidth={(width) => store.onChangeBlockWidth(path, width)}
          blockWidth={width}
          path={path}
          isHovered={isInEditMode}
          type="group"
        />
      ) : null}
      {label ? (
        <Label>
          <span
            contentEditable={!textHasTemplateLiterals(label)}
            dangerouslySetInnerHTML={{ __html: labelText }}
            onClick={(e) => e.preventDefault()}
            onBlur={handleEditLabel}
          />
        </Label>
      ) : null}
      {secondaryText ? (
        <div
          style={{ margin: "-22px 0 2px 8px", color: "#999", flex: "0 0 100%" }}
        >
          <span
            contentEditable={!textHasTemplateLiterals(secondaryText)}
            dangerouslySetInnerHTML={{ __html: secText }}
            onClick={(e) => e.preventDefault()}
            onBlur={handleEditSecondaryText}
          />
        </div>
      ) : null}
      {children}
    </Container>
  );
};

export default GroupContainer;
