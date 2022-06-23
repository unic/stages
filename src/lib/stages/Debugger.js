import React, { useEffect, useState } from "react";
import beautify from 'json-beautify';

const Debugger = () => {
    const [data, setData] = useState({});
    const [showDebugger, setShowDebugger] = useState(false);

    const getData = (eventData) => {
        const newData = Object.assign(data, {});
        newData[eventData.id] = eventData;
        setData({...newData});
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
                width: "280px",
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
            <button type="button" style={{float: "right"}} onClick={() => setShowDebugger(!showDebugger)}>{showDebugger ? "hide" : "show"}</button>
            {showDebugger ? Object.keys(data).map(key => {
                const keySplit = key.split("-");
                keySplit.pop();
                return (
                    <div>
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
                                color: "#000",
                                fontSize: "11px",
                                padding: "1px 4px"
                            }}>dirty</span> : null}
                        </h3>
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
                        }}>{beautify(data[key], null, 2)}</textarea>
                    </div>
                );
             }) : null}
        </div>
    );
};

export default Debugger;