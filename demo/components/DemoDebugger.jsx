import React, { useEffect, useState } from "react";
import { JsonFormatter } from 'react-json-formatter';

const DemoDebugger = () => {
    const [data, setData] = useState({});
    const [showDebugger, setShowDebugger] = useState(false);

    const getData = (eventData) => {
        const newData = Object.assign(data, {});
        newData[eventData.id] = eventData;
        setData(newData);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.stagesLogging = getData;
        }
    }, []);

    const jsonStyle = {
        propertyStyle: { color: '#5A99C1' },
        stringStyle: { color: '#333' },
        numberStyle: { color: '#333' }
    };

    if (Object.keys(data).length === 0) return null;

    return (
        <div
            style={{
                position: "absolute",
                top: "44px",
                right: 0,
                width: "280px",
                padding: "8px",
                fontSize: "14px",
                color: "#333",
                border: "1px #bbb solid",
                borderRadius: "4px",
                background: "#fbfbfb"
            }}
        >
            <strong style={{lineHeight: "22px"}}>Debugger:</strong>
            <button type="button" style={{float: "right"}} onClick={() => setShowDebugger(!showDebugger)}>{showDebugger ? "hide" : "show"}</button>
            {showDebugger ? (
                <div>
                    <JsonFormatter json={JSON.stringify(data)} tabWith='4' JsonStyle={jsonStyle} />
                </div> 
            ) : null}
            
        </div>
    );
};

export default DemoDebugger;