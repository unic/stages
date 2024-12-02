import { useState, useEffect, useCallback } from "react";
import sanitizeHtml from "sanitize-html";
import styled from "@emotion/styled";
import useStagesStore from "./store";
import SizeButton from "./SizeButton";
import EditablePath from "./EditablePath";

const PathContainer = styled.span`
  display: inline-block;
  position: absolute;
  top: calc(100% / 2 - 24px);
  left: -14px;
  font-size: 11px;
  color: ${(props) =>
    props.isHovered
      ? props.type === "fieldset"
        ? "#c10b99"
        : "#0A94F8"
      : "#ccc"};
  background: transparent;
  padding: 1px 4px;
  border-radius: 3px;
  user-select: none;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;

  & > div {
    display: inline-block;
    borderradius: 3px;
  }
`;

const BlockPathLabel = ({
  path,
  inCollection,
  isHovered,
  type,
  fieldsetId,
  blockWidth,
  onChangeBlockWidth,
  setFormCounter,
}) => {
  const indexOfLastPathDot = path.lastIndexOf(".");
  const store = useStagesStore();
  const [editablePath, setEditablePath] = useState(
    indexOfLastPathDot === -1 ? path : path.substring(indexOfLastPathDot + 1)
  );
  const [nonEditablePath, setNonEditablePath] = useState(
    indexOfLastPathDot === -1 ? "" : path.substring(0, indexOfLastPathDot + 1)
  );

  useEffect(() => {
    const indexOfLastPathDot = path.lastIndexOf(".");
    setEditablePath(
      indexOfLastPathDot === -1 ? path : path.substring(indexOfLastPathDot + 1)
    );
    setNonEditablePath(
      indexOfLastPathDot === -1 ? "" : path.substring(0, indexOfLastPathDot + 1)
    );
  }, [path]);

  const handleEditPath = useCallback((evt) => {
    const sanitizeConf = {
      allowedTags: [],
      allowedAttributes: {},
    };
    const newEditablePath = sanitizeHtml(
      evt.currentTarget.innerHTML,
      sanitizeConf
    ).replace(/\s/g, "X");
    setEditablePath(newEditablePath);
    store.onUpdatePath(nonEditablePath, editablePath, newEditablePath);
    if (typeof setFormCounter === "function")
      setFormCounter((formCounter) => formCounter + 1);
  }, []);

  return (
    <>
      <EditablePath
        inCollection={inCollection}
        isHovered={isHovered}
        type={type}
        fieldsetId={fieldsetId}
        nonEditablePath={nonEditablePath}
        editablePath={editablePath}
        handleEditPath={handleEditPath}
      />
      {isHovered && (
        <PathContainer isHovered={isHovered} type={type}>
          <div>
            <SizeButton
              isActive={blockWidth === "small"}
              size="S"
              type={type}
              onChangeBlockWidth={onChangeBlockWidth}
            />
            <br />
            <SizeButton
              isActive={blockWidth === "medium"}
              size="M"
              type={type}
              onChangeBlockWidth={onChangeBlockWidth}
            />
            <br />
            <SizeButton
              isActive={!blockWidth || blockWidth === "large"}
              size="L"
              type={type}
              onChangeBlockWidth={onChangeBlockWidth}
            />
          </div>
        </PathContainer>
      )}
    </>
  );
};

export default BlockPathLabel;
