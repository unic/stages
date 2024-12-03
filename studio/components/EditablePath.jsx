const EditablePath = ({
  inCollection,
  isHovered,
  type,
  fieldsetId,
  nonEditablePath,
  editablePath,
  handleEditPath,
}) => (
  <span
    style={{
      display: "inline-block",
      position: "absolute",
      top: inCollection ? "-13px" : "-9px",
      right: "6px",
      fontSize: "11px",
      color: isHovered ? (type === "fieldset" ? "#c10b99" : "#0A94F8") : "#ccc",
      background: "#fff",
      padding: "1px 4px",
      borderRadius: "3px",
      userSelect: "none",
      whiteSpace: "nowrap",
      maxWidth: "100%",
      overflow: "hidden",
    }}
  >
    {type === "fieldset" ? `{${fieldsetId}} ` : null}
    {type === "group" ? "[••] " : null}
    {type === "collection" ? "[=] " : null}
    {type === "wizard" ? "[ : ] " : null}
    {type === "stage" ? "[ . ] " : null}
    {type === "field" ? "[ ] " : null}
    {nonEditablePath}
    <span
      contentEditable
      dangerouslySetInnerHTML={{ __html: editablePath }}
      onClick={(e) => e.preventDefault()}
      onBlur={handleEditPath}
    />
  </span>
);

export default EditablePath;
