import { useState, useEffect, useCallback } from "react";
import sanitizeHtml from "sanitize-html";
import { useDraggable } from "@dnd-kit/core";
import { GripHorizontal } from "lucide-react";
import styled from "@emotion/styled";
import useStagesStore from "./store";
import BlockPathLabel from "./BlockPathLabel";
import Label from "./Label";
import {
  pathIsSelected,
  getWidth,
  parseTemplateLiterals,
  textHasTemplateLiterals,
} from "./helpers";

const Container = styled.div`
  position: relative;
  flex-wrap: wrap;
  border: ${(props) =>
    props.isInEditMode && props.isEditMode && !props.isFieldConfigEditor
      ? "1px dashed #0A94F8"
      : !props.isFieldConfigEditor && props.isEditMode
      ? "1px dashed #ddd"
      : "1px solid rgba(0,0,0,0)"};
  border-radius: 5px;
  padding: 2px;
  row-gap: ${(props) => (props.isFieldConfigEditor ? "4px" : "16px")};
  background: ${(props) =>
    props.isEditMode && !props.isFieldConfigEditor ? "#fff" : "transparent"};
  box-shadow: ${(props) =>
    props.isEditMode && !props.isFieldConfigEditor
      ? "1px 1px 1px 0px rgba(0,0,0,0.05)"
      : "none"};
  min-width: ${(props) =>
    !props.isFieldConfigEditor
      ? getWidth(
          props.inGroup,
          props.isFieldConfigEditor,
          props.store.isEditMode,
          props.width
        )
      : "auto"};
  max-width: ${(props) =>
    getWidth(
      props.inGroup,
      props.isFieldConfigEditor,
      props.store.isEditMode,
      props.width
    )};
  transform: ${(props) =>
    props.transform
      ? `translate3d(${props.transform.x}px, ${props.transform.y}px, 0)`
      : undefined};
  z-index: ${(props) => (props.transform ? 1000 : 1)};
  margin-bottom: ${(props) => (props.isFieldConfigEditor ? "16px" : 0)};
`;

const CollectionContainer = ({
  children,
  handleEditCollection,
  setFormCounter,
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
  const store = useStagesStore();
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
  }, []);

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
  }, []);

  return (
    <Container
      isInEditMode={isInEditMode}
      isEditMode={isEditMode}
      isFieldConfigEditor={isFieldConfigEditor}
      inGroup={inGroup}
      store={store}
      transform={transform}
      width={width}
      className="flex"
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
          handleEditCollection(
            fieldsetId ? `{${fieldsetId}}.${path}` : path,
            e.shiftKey
          );
      }}
      onMouseOver={() => setIsInEditMode(isEditMode ? true : false)}
      onMouseOut={() =>
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
          setFormCounter={setFormCounter}
          onChangeBlockWidth={(width) => store.onChangeBlockWidth(path, width)}
          path={path}
          blockWidth={width}
          isHovered={isInEditMode}
          type="collection"
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
          style={{ margin: "-22px 0 0 8px", color: "#999", flex: "0 0 100%" }}
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

export default CollectionContainer;
