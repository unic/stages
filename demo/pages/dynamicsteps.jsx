import React, { Fragment } from "react";
import { Stages, Form, Actions, Progression, HashRouter } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import WizardNavigation from "../components/WizardNavigation";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

import {
    step1Config, step2Config, step3Config,
    Step1Renderer, Step2Renderer, Step3Renderer
} from "../dynamicconfig";

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
        if (type === "only") {
            return [{
                title: "Submit",
                type: "primary",
                validate: true,
                onClick: () => onSubmit(data)
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
                    <div className="pure-g">
                        <div className="pure-u-1-5" style={{ marginTop: "64px" }}>
                            <WizardNavigation {...navigationProps} />
                            <Progression {...progressionProps} /> 
                        </div>
                        <div className="pure-u-4-5">{steps}</div>
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
            >
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("step1", index);
                    if (initializing) return null;
                    
                    let stepType = "first";
                    if (allData.step1 && !allData.step1.step2 && !allData.step1.step3) stepType = "only";

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Step 1:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={step1Config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Step1Renderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig(stepType, onNav, onSubmit, data)}
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
                    const key = setStepKey("step2", index);
                    if (initializing) return null;

                    if (allData.step1 && !allData.step1.step2) return null;

                    let stepType = "regular";
                    if (allData.step1 && !allData.step1.step3) stepType = "last";

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Step 2:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={step2Config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Step2Renderer {...fieldProps} />}
                                        actions={<Actions
                                            config={createActionButtonConfig(stepType, onNav, onSubmit, data)}
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
                    const key = setStepKey("step3", index);
                    if (initializing) return null;

                    if (allData.step1 && !allData.step1.step3) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Step 3:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={step3Config}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Step3Renderer {...fieldProps} />}
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