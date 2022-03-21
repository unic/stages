import React, { Fragment } from "react";
import { Stages, Form, Actions, HashRouter, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";

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
            <br />
            <hr />
            <br />
            {actions}
        </>
    )}
</div>;

const Progression = ({ data, verbose }) => {
    let correctAnwsers = 0;
    let totalAnswers = 0;

    if (data && data.easy && data.medium && data.hard) {
        correctAnwsers = Number(data.easy.result || 0) + Number(data.medium.result || 0) + Number(data.hard.result || 0);
        totalAnswers = Object.keys(data.easy).length + Object.keys(data.medium).length + Object.keys(data.hard).length - 3;

        if (totalAnswers === 0) return null;
        const percentage = Math.round(100 / totalAnswers * correctAnwsers);

        if (verbose) {
            return (
                <div>
                    You have answered {correctAnwsers} out of {totalAnswers} questions correctly. 
                    That is a {percentage}% success rate.
                    <br />
                    {percentage < 50 ? "You could have done better!" : null}
                    <br />
                    {percentage < 20 ? "I mean, what the f***?" : null}
                    <br />
                    {percentage >= 80 ? "That is really, really good!" : null}
                </div>
            );
        }

        return (
            <div>{correctAnwsers} correctly answered out of {totalAnswers}, {percentage}% success rate.</div>
        );
    }

    return null;
};

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
        <Layout>
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
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("results", index);
                    if (initializing) return null;

                    if (!isActive) return <Fragment key={`step-${key}`}></Fragment>;

                    return (
                        <div key={`step-${key}`}>
                            <h2>Congratulations!</h2>
                            <Progression data={allData} verbose={true} />
                        </div>
                    );
                }}
            </Stages>
        </Layout>
    );
};
  
export default QuizPage;