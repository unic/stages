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
                                id: "teams",
                                type: "collection",
                                init: true,
                                fields: [
                                    {
                                        id: "nr",
                                        type: "number",
                                        label: "Nr.",
                                        precision: 2,
                                        isUnique: true
                                    },
                                    {
                                        id: "name",
                                        type: "text",
                                        label: "Name"
                                    }
                                ]
                            },
                            {
                                id: "players",
                                type: "collection",
                                init: true,
                                fields: [
                                    {
                                        id: "name",
                                        type: "text",
                                        label: "Name"
                                    },
                                    {
                                        id: "team",
                                        type: "select",
                                        label: "Team",
                                        computedOptions: {
                                            source: "teams",
                                            initWith: [
                                                { value: "", text: "Please select ..." }
                                            ],
                                            map: (item) => {
                                                return {
                                                    value: item.nr,
                                                    text: item.name
                                                };
                                            },
                                            sort: (a, b) => a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
                                            filter: (item) => !!item.nr
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <>
                        <h3>Computed Options:</h3>
                        <p>
                            In this demo, the teams added in the first collection, are automatically added as options to the 
                            team select in the second collection.
                        </p>
                        <h3>Teams:</h3>
                        <fieldset>
                            {fieldProps.fields.teams ? fieldProps.fields.teams.map((subFields, index) => (
                                <div key={`team-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                    <div className="pure-g">
                                        <div className="pure-u-1-3">{subFields.nr}</div>
                                        <div className="pure-u-1-3">{subFields.name}</div>
                                    </div>
                                    <br />
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("teams", "remove", index)}>-</button>
                                </div>)
                            ) : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction("teams", "add")}>+</button>
                        </fieldset>
                        <br />
                        <h3>Players:</h3>
                        <fieldset>
                            {fieldProps.fields.players ? fieldProps.fields.players.map((subFields, index) => (
                                <div key={`player-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                    <div className="pure-g">
                                        <div className="pure-u-1-3">{subFields.name}</div>
                                        <div className="pure-u-1-3">{subFields.team}</div>
                                    </div>
                                    <br />
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("players", "remove", index)}>-</button>
                                </div>)
                            ) : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction("players", "add")}>+</button>
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