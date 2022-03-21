import React, { Fragment } from "react";
import { Stages, Form, Actions, Navigation, Progression, HashRouter, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

import {
    basicsConfig, guestsConfig,
    BasicsRenderer, GuestsRenderer
} from "../testconfig";

const FormLayout = ({ loading, fields, actions }) => <div>
    {loading ? (
        <div>Loading data, please wait ...</div>
    ) : (
        <>
            {fields}
            <br />
            <hr />
            <br />
            {actions}
        </>
    )}
</div>;

function WizardPage() {

    const onSubmit = data => {
        console.log("submit:", data);
    };

    const createActionButtonConfig = (type, onNav, onSubmit, data) => {
        if (type === "first") {
            return [{
                title: "Next",
                type: "primary",
                validate: true,
                onClick: () => onNav("next")
            }];
        }
        return [
            {
                title: "Prev",
                type: "secondary",
                validate: false,
                onClick: () => onNav("prev")
            },
            {
                title: type === "last" ? "Submit" : "Next",
                type: "primary",
                validate: true,
                onClick: () => type === "last" ? onSubmit(data) : onNav("next")
            }
        ];
    };

    return (
        <Layout>
            <Stages
                initialData={{}}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div class="pure-g">
                        <div class="pure-u-1-5" style={{ marginTop: "64px" }}>
                            <Navigation {...navigationProps} />
                            <Progression {...progressionProps} /> 
                        </div>
                        <div class="pure-u-4-5">{steps}</div>
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
                                id={index}
                                data={data}
                                config={basicsConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<BasicsRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("first", onNav, onSubmit, data)}
                                            {...actionProps}
                                        />}
                                    />
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                            />
                        </Fragment>
                    );
                }}
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("guests", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Guests:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={guestsConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<GuestsRenderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("last", onNav, onSubmit, data)}
                                            {...actionProps}
                                        />}
                                    />
                                )}
                                fields={fields}
                                onChange={onChange}
                                isVisible={isActive}
                            />
                        </Fragment>
                    );
                }}
            </Stages>
        </Layout>
    );
};
  
export default WizardPage;