const FormattedPath = ({ path }) => {
  const pathSplit = path.split(".");
  const lastItem = pathSplit[pathSplit.length - 1];
  const pathItems = pathSplit.slice(0, pathSplit.length - 1);
  return (
    <pre
      style={{
        margin: 0,
        fontSize: "14px",
        overflowWrap: "break-word",
        display: "inline-block",
        marginRight: "16px",
        whiteSpace: "nowrap",
        maxWidth: "324px",
        overflow: "hidden",
      }}
    >
      {pathItems.join(".")}
      {pathItems.length > 0 && "."}
      <span style={{ color: "#1A769D" }}>{lastItem}</span>
    </pre>
  );
};

export default FormattedPath;
