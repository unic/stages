import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

function FormPage() {
    const [data, setData] = useState({
        players: [
            { nr: "14", name: "Pele" },
            { nr: "10", name: "Maradona" }
        ],
        teams: [
            { 
                name: "Brasil",
                player: "14"
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
                                id: "teams",
                                type: "collection",
                                init: true,
                                fields: [
                                    {
                                        id: "name",
                                        type: "text",
                                        label: "Name"
                                    },
                                    {
                                        id: "player",
                                        type: "select",
                                        label: "Captain",
                                        computedOptions: {
                                            source: "players",
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
                        <Heading>Computed Options:</Heading>
                        <Paragraph>
                            In this demo, the teams added in the first collection, are automatically added as options to the 
                            team select in the second collection.
                        </Paragraph>
                        <Heading>Players:</Heading>
                        <fieldset>
                            {fieldProps.fields.players ? fieldProps.fields.players.map((subFields, index) => (
                                <div key={`team-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                    <div className="pure-g">
                                        <div className="pure-u-1-3">{subFields.nr}</div>
                                        <div className="pure-u-1-3">{subFields.name}</div>
                                    </div>
                                    <br />
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("players", "remove", index)}>-</button>
                                </div>)
                            ) : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction("players", "add")}>+</button>
                        </fieldset>
                        <br />
                        <Heading>Teams:</Heading>
                        <fieldset>
                            {fieldProps.fields.teams ? fieldProps.fields.teams.map((subFields, index) => (
                                <div key={`player-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                    <div className="pure-g">
                                        <div className="pure-u-1-3">{subFields.name}</div>
                                        <div className="pure-u-1-3">{subFields.player}</div>
                                    </div>
                                    <br />
                                    <button type="button" onClick={() => fieldProps.onCollectionAction("teams", "remove", index)}>-</button>
                                </div>)
                            ) : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction("teams", "add")}>+</button>
                        </fieldset>
                        <br />
                        <HR isDirty={fieldProps.isDirty} />
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