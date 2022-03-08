import React, { Fragment } from "react";
import { Stages, Form, Actions, Navigation, Progression, HashRouter, plainFields as fields } from "react-stages";
import DemoNav from "../components/DemoNav";

import {
    easyConfig, mediumConfig, hardConfig,
    EasyRenderer, MediumRenderer, HardRenderer
} from "../quizconfig";

const FormLayout = ({ loading, fields, actions }) => <div>
    {loading ? (
        <div>Loading data, please wait ...</div>
    ) : (
        <>
            {fields}
            <hr />
            {actions}
        </>
    )}
</div>;

function QuizPage() {

    const onSubmit = data => {
        console.log("submit:", data);
    };

    const createActionButtonConfig = (type, onNav, onSubmit, data) => {
        return [{
            title: type === "last" ? "Submit" : "Next",
            type: "primary",
            validate: true,
            onClick: () => type === "last" ? onSubmit(data) : onNav("next")
        }];
    };

    return (
        <div>
            <DemoNav />
            <Stages
                initialData={{}}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div>
                        <Progression {...progressionProps} />
                        {steps}
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
            >
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("easy", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Easy questions:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={easyConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<EasyRenderer {...fieldProps} />}
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
                    const key = setStepKey("medium", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Medium difficulty questions:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={mediumConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<MediumRenderer {...fieldProps} />}
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
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("hard", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>Hard questions:</h2> : null}
                            <Form
                                id={index}
                                data={data}
                                config={hardConfig}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<HardRenderer {...fieldProps} />}
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
            </Stages>
        </div>

    );
};
  
export default QuizPage;