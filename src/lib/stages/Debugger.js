import React, { useEffect, useState } from "react";
import beautify from 'json-beautify';

const Debugger = () => {
    const [data, setData] = useState({});
    const [selection, setSelection] = useState({});
    const [showDebugger, setShowDebugger] = useState(false);

    const getData = (eventData) => {
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
                            {!data[key].loading ? <span style={{
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
                        </ul>
                        {selection && selection.key === key ? (
                            <textarea style={{
                                width: "calc(100% - 8px)",
                                minWidth: "calc(100% - 8px)",
                                maxWidth: "calc(100% - 8px)",
                                height: "50vh",
                                fontSize: "10px",
                                border: "1px #ccc solid",
                                background: "#fbfbfb",
                                marginTop: "8px",
                                overflowX: "scroll",
                                whiteSpace: "nowrap"
                            }} defaultValue={beautify(data[selection.key][selection.tab], null, 2)} />
                        ) : null}
                    </div>
                );
             }) : null}
        </div>
    );
};

export default Debugger;