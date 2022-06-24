import React, { useEffect, useState } from "react";
import beautify from 'json-beautify';
import get from "lodash.get";

const Debugger = () => {
    const [data, setData] = useState({});
    const [logHistory, setLogHistory] = useState({});
    const [selection, setSelection] = useState({});
    const [paths, setPaths] = useState({});
    const [showDebugger, setShowDebugger] = useState(false);

    const getData = (eventData, uniqId) => {
        if (typeof eventData === "string") {
            if (!logHistory[uniqId]) logHistory[uniqId] = [];
            logHistory[uniqId].push({
                action: eventData,
                time: + new Date()
            });
            setLogHistory(logHistory);
        } else {
            const newData = Object.assign(data, {});
            const firstKey = Object.keys(newData)[0];
            newData[eventData.id] = eventData;
            setData({...newData});
            setSelection(sel => {
                return {
                    key: !sel.key ? firstKey : sel.key,
                    tab: !sel.tab ? "data" : sel.tab
                };
            });
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.stagesLogging = getData;
        }
    }, []);

    if (Object.keys(data).length === 0) return null;

    return (
        <div
            style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "320px",
                padding: "8px",
                fontSize: "14px",
                color: "#333",
                border: "1px #bbb solid",
                borderRadius: "4px",
                background: "#fbfbfb",
                fontFamily: "Open Sans, Helvetica, Arial, sans"
            }}
        >
            <strong style={{lineHeight: "22px"}}>Debugger:</strong>
            <button
                type="button"
                style={{float: "right"}}
                onClick={() => setShowDebugger(!showDebugger)}
            >
                {showDebugger ? "hide" : "show"}
            </button>
            {showDebugger ? Object.keys(data).map(key => {
                const keySplit = key.split("-");
                keySplit.pop();
                let output = "";
                if (selection.tab === "logs") {
                    output = logHistory[selection.key] ? logHistory[selection.key].map(l => `${l.time}: ${l.action}`).join("\n") : "";
                } else {
                    output = beautify(paths[key] ? get(data[selection.key][selection.tab], paths[key] || "") : data[selection.key][selection.tab], null, 2);
                }
                return (
                    <div key={`${key}-${selection.tab}`}>
                        <h3 style={{
                            background: "#333",
                            color: "#fff",
                            margin: "8px 0 0 0",
                            padding: "2px 6px",
                            textTransform: "capitalize",
                            position: "relative"
                        }}>
                            {keySplit.join(" ")}:
                            {data[key].isDirty ? <span style={{
                                display: "inline-block",
                                position: "absolute",
                                top: "5px",
                                right: "4px",
                                background: "#f30",
                                color: "#fff",
                                fontSize: "11px",
                                padding: "1px 4px"
                            }}>dirty</span> : null}
                            {Object.keys(data[key].errors).length ? <span style={{
                                display: "inline-block",
                                position: "absolute",
                                top: "5px",
                                right: "48px",
                                background: "#f30",
                                color: "#fff",
                                fontSize: "11px",
                                padding: "1px 4px"
                            }}>errors</span> : null}
                            {data[key].loading ? <span style={{
                                display: "inline-block",
                                position: "absolute",
                                top: "5px",
                                right: "98px",
                                background: "#f30",
                                color: "#fff",
                                fontSize: "11px",
                                padding: "1px 4px"
                            }}>loading</span> : null}
                        </h3>
                        <ul style={{
                            listStyle: "none",
                            display: "flex",
                            margin: "8px 0 0 0",
                            padding: 0,
                            gap: "8px"
                        }}>
                            <li
                                style={{ cursor: "pointer", padding: 0, margin: 0, color: selection.key === key && selection.tab === "data" ? "#f30" : "#000" }}
                                onClick={() => setSelection({key: key, tab: "data"})}
                            >
                                Data
                            </li>
                            <li
                                style={{ cursor: "pointer", padding: 0, margin: 0, color: selection.key === key && selection.tab === "errors" ? "#f30" : "#000" }}
                                onClick={() => setSelection({key: key, tab: "errors"})}
                            >
                                Errors
                            </li>
                            <li
                                style={{ cursor: "pointer", padding: 0, margin: 0, color: selection.key === key && selection.tab === "parsedFieldConfig" ? "#f30" : "#000" }}
                                onClick={() => setSelection({key: key, tab: "parsedFieldConfig"})}
                            >
                                Field Config
                            </li>
                            <li
                                style={{ cursor: "pointer", padding: 0, margin: 0, color: selection.key === key && selection.tab === "logs" ? "#f30" : "#000" }}
                                onClick={() => setSelection({key: key, tab: "logs"})}
                            >
                                Logs
                            </li>
                        </ul>
                        <input value={paths[key] || ""} placeholder="your.data.filter.path" onChange={e => {
                            const newPaths = Object.assign({}, paths);
                            newPaths[key] = e.target.value;
                            setPaths(newPaths);
                        }} style={{
                            width: "calc(100% - 12px)",
                            minWidth: "calc(100% - 12px)",
                            maxWidth: "calc(100% - 12px)",
                            fontSize: "12px",
                            border: "1px #ccc solid",
                            background: "#fbfbfb",
                            marginTop: "4px",
                            padding: "4px",
                            overflowX: "scroll",
                            whiteSpace: "pre"
                        }} />
                        {selection && selection.key === key ? (
                            <textarea readOnly style={{
                                width: "calc(100% - 8px)",
                                minWidth: "calc(100% - 8px)",
                                maxWidth: "calc(100% - 8px)",
                                height: "200px",
                                fontSize: "10px",
                                border: "1px #ccc solid",
                                background: "#fbfbfb",
                                marginTop: "8px",
                                overflowX: "scroll",
                                whiteSpace: "pre"
                            }} value={output} />
                        ) : null}
                    </div>
                );
             }) : null}
        </div>
    );
};

export default Debugger;