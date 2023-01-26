import React, { useState, Fragment } from "react";
import { Form } from "./lib/form";
import { Stages, HashRouter, Debugger } from "./lib/stages";
import fields from "./lib/fieldsets/plain";

export const getStateFromLocalStorage = () => {
	if (typeof localStorage !== "undefined") {
		const stringifiedStoredState = localStorage.getItem("stages-demo-app") || "{}";
		const storedState = JSON.parse(stringifiedStoredState);
		return storedState;
	}
	return {};
};

export const saveStateToLocalStorage = (state = {}) => {
	if (typeof localStorage !== "undefined") {
		const stringifiedState = JSON.stringify(state);
		localStorage.setItem("stages-demo-app", stringifiedState);
	}
};

const Navigation = ({ currentStep, data, onChangeStep, errors, lastValidStep, keys, stepCount }) => {
    const items = [];

    for (let i = 0; i < keys.length; i++) {
        if (keys && keys[i] && keys[i].visible) {
            const stepName = keys && keys[i] ? keys[i].key : `Step ${i + 1}`;

            if (currentStep === i) {
                items.push(<li key={stepName} style={{ textTransform: "capitalize", marginBottom: "4px" }}><strong>{stepName}</strong></li>);
            } else if ((lastValidStep > -1 && lastValidStep + 1 < i) || lastValidStep === -1 && i > 0) {
                items.push(<li key={stepName} style={{ color: "#999", textTransform: "capitalize", marginBottom: "4px" }}>{stepName}</li>);
            } else {
                items.push(<li key={stepName} style={{ textTransform: "capitalize", marginBottom: "4px" }} onClick={() => onChangeStep(i)}>{stepName}</li>);
            }
        }
    }

    return (
        <ul style={{ listStyleType: "none", margin: "0 0 0 32px 0", padding: 0 }}>{items}</ul>
    );
};

function App() {
    const [data, setData] = useState({
        teams: [
            { nr: "2332", name: "Team 1" },
            { nr: "435", name: "Team 2" }
        ],
        players: [
            { 
                prename: "Hans",
                lastname: "Muster",
                team: "435",
                position: "goalkeeper"
            }
        ]
    });

    const handleChange = (data, errors) => {
        console.log("handle change", {data, errors});
        setData(data);
    };

    /*
    return (
        <Stages
            validateOnStepChange={false}
            render={({ navigationProps, routerProps, steps }) => (
                <div className="pure-g">
                    <div className="pure-u-1-5" style={{ marginTop: "64px" }}>
                        <Navigation {...navigationProps} />
                    </div>
                    <div className="pure-u-4-5">{steps}</div>
                    {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                </div>
            )}
        >
            {({ isActive, data, onChange, onNav, index, setStepKey, initializing }) => {
                const key = setStepKey("home", index);
                if (initializing) return null;
                if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                return (
                    <Fragment key={`step-${key}`}>
                        <h2>Home</h2>
                        <p>Page content ...</p>
                        <button type="button" onClick={() => onNav("step", "about")}>Read the About</button>
                    </Fragment>
                );
            }}
            {({ isActive, data, onNav, onChange, index, setStepKey, initializing }) => {
                const key = setStepKey("about", index);
                if (initializing) return null;
                if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;
                if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                return (
                    <Fragment key={`step-${key}`}>
                        <h2>About</h2>
                        <p>Page content ...</p>
                        <button type="button" onClick={() => onNav("step", "home")}>Go back to Home</button>
                    </Fragment>
                );
            }}
        </Stages>
    );
    */

    return (
        <>
            <Debugger />
            <Form
                id="basics"
                data={data}
                validateOn={["change", "blur", "action"]}
                autoSave="local"
                customRuleHandlers={{
                    disallowOddNumbers: ({ fieldValueCombos, fieldValidationData, valueRules, get }) => {
                        // "age": { "": { disallowOddNumbers: true } }
                        let ruleConformsToData = true;

                        if (valueRules.disallowOddNumbers) {
                            fieldValueCombos.forEach(fieldValueCombo => {
                                fieldValidationData.forEach(d => {
                                    const value = get(d, fieldValueCombo[0]);
                                    if (value && value % 2 === 1) ruleConformsToData = false;
                                });
                            });
                        }

                        return ruleConformsToData;
                    }
                }}
                config={{
                    fields: () => {
                        const fieldConfig = [
                            {
                                id: "field1",
                                type: "text",
                                label: "Default Test",
                                placeholder: ["Placeholder 1", "Placeholder 2", "Placeholder 3"],
                                cleanUp: value => value.trim(),
                                isRequired: true
                            },
                            () => {
                                return {
                                    id: "field2",
                                    type: "text",
                                    label: "Default Test 2"
                                };
                            },
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
                                rules: {
                                    "position": {
                                        "goalkeeper": { exactCount: 1 }
                                    },
                                    "spending": { "": { disallowOddNumbers: true } },
                                    "prename,lastname": { "": { isUnique: true } }
                                },
                                fields: [
                                    {
                                        id: "prename",
                                        type: "text",
                                        label: "Prename"
                                    },
                                    {
                                        id: "lastname",
                                        type: "text",
                                        label: "Lastname"
                                    },
                                    {
                                        id: "spending",
                                        type: "text",
                                        label: "Spending"
                                    },
                                    {
                                        id: "income",
                                        type: "text",
                                        label: "Income"
                                    },
                                    {
                                        id: "position",
                                        type: "radio",
                                        label: "Position",
                                        options: [
                                            { value: "goalkeeper", text: "Goalkeeper" },
                                            { value: "defender", text: "Defender" },
                                            { value: "midfield", text: "Midfield" },
                                            { value: "striker", text: "Striker" }
                                        ]
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
                        ];

                        return fieldConfig;
                    }
                }}
                enableUndo
                render={({ actionProps, fieldProps }) => (
                    <div>
                        <button onClick={actionProps.handleUndo}>Undo</button>
                        <button onClick={actionProps.handleRedo}>Redo</button>
                        <div>
                            <h2>Teams:</h2>
                            <div>{fieldProps.fields.field1}</div><div>{fieldProps.fields.field2}</div>
                            <br /><br />
                            <fieldset>
                                {fieldProps.fields.teams ? fieldProps.fields.teams.map((subFields, index) => (
                                    <div key={`team-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                        <div className="pure-g" style={{ display: "flex", gap: "4px 16px" }}>
                                            <div className="pure-u-1-3">{subFields.nr}</div>
                                            <div className="pure-u-1-3">{subFields.name}</div>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("teams", "remove", index)}>-</button>
                                        </div>
                                    </div>)
                                ) : null}
                                <button type="button" onClick={() => fieldProps.onCollectionAction("teams", "add")}>+</button>
                            </fieldset>
                            <h2>Players:</h2>
                            <fieldset>
                                {fieldProps.fields.players ? fieldProps.fields.players.map((subFields, index) => (
                                    <div key={`player-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                        <div className="pure-g" style={{ display: "flex", gap: "4px 16px" }}>
                                            <div className="pure-u-1-3">{subFields.prename}</div>
                                            <div className="pure-u-1-3">{subFields.lastname}</div>
                                            <div className="pure-u-1-3">{subFields.team}</div>
                                            <div className="pure-u-1-3">{subFields.spending}</div>
                                            <div className="pure-u-1-3">{subFields.income}</div>
                                            <div className="pure-u-1-3">{subFields.position}</div>
                                            <button type="button" onClick={() => fieldProps.onCollectionAction("players", "remove", index)}>-</button>
                                        </div>
                                    </div>)
                                ) : null}
                                <button type="button" onClick={() => fieldProps.onCollectionAction("players", "add")}>+</button>
                                {fieldProps.errors.players ? <div style={{ color: "red" }}>Error: {fieldProps.errors.players.errorCode}!</div> : null}
                            </fieldset>
                        </div>
                        <br /><br />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                        >
                            Submit
                        </button>
                        {" "}
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(() => {}, false, true)}
                        >
                            Reset
                        </button>
                    </div>
                )}
                fields={fields}
                onChange={handleChange}
            />
        </>
    );

    /*
    return (
        <>
            <Form
                id="basics"
                data={data}
                config={basicsConfig}
                enableUndo
                render={({ actionProps, fieldProps, loading }) => (
                    <div>
                        <button onClick={actionProps.handleUndo}>Undo</button>
                        <button onClick={actionProps.handleRedo}>Redo</button>
                        <FormLayout
                            loading={loading}
                            fields={<BasicsRenderer {...fieldProps} />}
                            actions={<Actions
                                config={createActionButtonConfig("first", () => {}, onSubmit, data)}
                                {...actionProps}
                            />}
                        />
                    </div>
                )}
                fields={fields}
                onChange={handleChange}
                customEvents={{
                    'autocompleteChange': ({ data, dirtyFields, optionsLoaded, asyncData, errors, focusedField, triggeringEvent }) => {
                        if (data.country && triggeringEvent === "change") return true;
                        return false;
                    }
                }}
                validateOn={["action", "autocompleteChange"]}
            />
            <Debugger />
        </>
    );
    */

    /*
    return (
        <>
            <h1>Wizard</h1>
            <Stages
                initialData={initialData}
                onChange={({data, errors}) => handleChange(data, errors)}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div>
                        <Navigation {...navigationProps} />
                        <Progression {...progressionProps} />
                        {steps}
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
            >
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("basics", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Basics:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={basicsConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                <div>
                                    <FormLayout
                                        loading={loading}
                                        fields={<BasicsRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("first", onNav, onSubmit, data)}
                                            {...actionProps}
                                        />}
                                    />
                                </div>
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                                validateOn={["action", "blur"]}
                            />
                        </Fragment>
                    );
                }}

                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("guests", index);
                    if (initializing) return null;

                    if (allData.basics && allData.basics.password === "test1234") return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Guests:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={guestsConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                <div>
                                    <FormLayout
                                        loading={loading}
                                        fields={<GuestsRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
                                            {...actionProps}
                                        />}
                                    />
                                </div>
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                                validateOn={["action", "blur"]}
                            />
                        </Fragment>
                    );
                }}

                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("empty", index);
                    if (initializing) return null;

                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;

                    // Validate this step on mount by adding random data to this steps data:
                    if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);

                    return (
                        <div key={`step-${key}`}>
                            <h2>An empty Step</h2>
                            <p>You don't need to put froms on a step!</p>
                            <button type="button" onClick={() => onNav("prev")}>Prev</button>
                            <button type="button" onClick={() => onNav("next")}>Next</button>
                        </div>
                    );
                }}

                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("program", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Program:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={programConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                <div>
                                    <FormLayout
                                        loading={loading}
                                        fields={<ProgramRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("last", onNav, onSubmit, data)}
                                            {...actionProps}
                                        />}
                                    />
                                </div>
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                                validateOn={["action", "blur"]}
                            />
                        </Fragment>
                    );
                }}
            </Stages>
        </>
    );
    */
}

export default App;
