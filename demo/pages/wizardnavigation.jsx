import React, { Fragment } from "react";
import { Stages, Form, Actions, Progression, HashRouter, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

import Navigation from "../components/WizardNavigation";

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

const config = {
    fields: () => {
        return [
            {
                id: "field",
                label: "Field",
                type: "text"
            }
        ]
    }
};

const Render = ({ fields }) => {
    return (
        <div>
            {fields.field}
        </div>
    );
};

function WizardPage() {

    const onSubmit = data => {
        console.log("submit:", data);
    };

    const createActionButtonConfig = (type, onNav, onSubmit, data) => {
        const options = [
            {
                title: "First",
                type: "secondary",
                validate: true,
                onClick: () => onNav("first")
            },
            {
                title: "Last",
                type: "secondary",
                validate: true,
                onClick: () => onNav("last")
            },
            {
                title: "Step 4",
                type: "secondary",
                validate: true,
                onClick: () => onNav("step", 4)
            },
            {
                title: "Step 7",
                type: "secondary",
                validate: true,
                onClick: () => onNav("step", 7)
            },
            {
                title: "Last Valid (no required fields, so the last step)",
                type: "secondary",
                validate: true,
                onClick: () => onNav("lastValid")
            }
        ];

        if (type !== "first") {
            options.unshift(
                {
                    title: "Prev",
                    type: "secondary",
                    validate: false,
                    onClick: () => onNav("prev")
                }
            );
        }

        if (type !== "last") {
            options.push(
                {
                    title: "Next",
                    type: "secondary",
                    validate: false,
                    onClick: () => onNav("next")
                }
            );
        }

        if (type === "last") {
            options.push(
                {
                    title: type === "last" ? "Submit" : "Next",
                    type: "primary",
                    validate: true,
                    onClick: () => type === "last" ? onSubmit(data) : onNav("next")
                }
            );
        }

        return options;
    };

    return (
        <Layout>
            <p>In this example all steps are the same, just one non required field on each step. This is purely to showcase all the different wizard navigation options.</p>
            <Stages
                initialData={{}}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div className="pure-g">
                        <div className="pure-u-1-5" style={{ marginTop: "64px" }}>
                            <Navigation {...navigationProps} />
                            <Progression {...progressionProps} /> 
                        </div>
                        <div className="pure-u-4-5">{steps}</div>
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
            >
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("regular", onNav, onSubmit, data)}
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
                {({ data, isActive, onChange, onNav, index, setStepKey, initializing }) => {
                    const key = setStepKey(`step${index}`, index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{`Step ${index}`}:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Render {...fieldProps} />}
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