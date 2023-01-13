import React, { useState } from "react";
import { Form, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

function FormPage() {
    const [data, setData] = useState({
        teams: [
            { nr: "2332", name: "France" },
            { nr: "435", name: "Brasil" }
        ],
        players: [
            { 
                name: "Pele",
                team: "435"
            }
        ]
    });
    return (
        <Layout>
            <Form
                data={data}
                fields={fields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "players",
                                type: "collection",
                                init: true,
                                min: 11,
                                max: 11,
                                rules: {
                                    "position": {
                                        "goalkeeper": { exactCount: 1, errorCode: "oneGoalie" },
                                        "defender": { min: 2, sameCountAs: "midfield", errorCode: "defenderCount" },
                                        "midfield": { min: 2, errorCode: "midfieldCount" },
                                        "striker": { min: 1, errorCode: "strikerCount" }
                                    },
                                    "prename,lastname": { "": { isUnique: true, errorCode: "uniqueNames" } }
                                },
                                fields: [
                                    {
                                        id: "prename",
                                        type: "text",
                                        label: "Prename",
                                        isRequired: true
                                    },
                                    {
                                        id: "lastname",
                                        type: "text",
                                        label: "Lastname",
                                        isRequired: true
                                    },
                                    {
                                        id: "position",
                                        type: "radio",
                                        label: "Position",
                                        isRequired: true,
                                        options: [
                                            { value: "goalkeeper", text: "Goalie" },
                                            { value: "defender", text: "Defender" },
                                            { value: "midfield", text: "Midfield" },
                                            { value: "striker", text: "Striker" }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <h3>Collection Rules:</h3>
                        <p>
                            In this demo we have to create a football (soccer) team. There has to be exactly one goal keeper, 
                            at least two defenders, two midfielders and one striker. Defenders and midfielders need to 
                            be the same amout, to make it balanced. And finally, all name combos need to be unique.
                        </p>
                        <h3>Players:</h3>
                        <fieldset>
                            {fieldProps.fields.players ? fieldProps.fields.players.map((subFields, index) => (
                                <div key={`player-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                    <div className="pure-g">
                                        <div className="pure-u-1-3">{subFields.prename}</div>
                                        <div className="pure-u-1-3">{subFields.lastname}</div>
                                        <div className="pure-u-1-3">{subFields.position}</div>
                                    </div>
                                </div>)
                            ) : null}
                            {fieldProps.errors.players ? <div style={{ color: "red" }}>Error, entries not conforming to rules: {fieldProps.errors.players.errorCode}!</div> : null}
                        </fieldset>
                        <br />
                        <hr />
                        <br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                        >
                            Submit
                        </button>
                    </>
                )}
                onChange={payload => setData(payload)}
            /> 
        </Layout>
    );
};
  
export default FormPage;