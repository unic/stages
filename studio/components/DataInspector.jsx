import { Message } from "primereact/message";
import InspectorSpacer from "./InspectorSpacer";
import useStagesStore from "./store";
import { truncateString } from "./helpers";

const DataInspector = () => {
  const store = useStagesStore();
  return (
    <div>
      <h3>Data Snapshots</h3>
      <ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
        {store.snapshots.map((snapshot, i) => (
          <li
            key={`snapshot${i}`}
            className="flex"
            style={{ margin: "0 0 8px 0", padding: 0 }}
          >
            <span style={{ minWidth: "20px" }}>
              <strong>{i + 1}</strong>
            </span>
            <span style={{ flexGrow: 1 }}>
              {truncateString(JSON.stringify(store.snapshots[i]), 26)}
            </span>
            <span>
              <button onClick={() => store.useSnapshot(i)}>Use</button>{" "}
              <button onClick={() => store.removeSnapshot(i)}>Remove</button>
            </span>
          </li>
        ))}
        {store.snapshots.length === 0 && (
          <Message
            severity="info"
            text="Click camera icon to take a data snapshot."
          />
        )}
      </ul>
      <InspectorSpacer />
      <h3>User Data</h3>
      <Message severity="info" text="Publish form to collect user data." />
    </div>
  );
};

export default DataInspector;
