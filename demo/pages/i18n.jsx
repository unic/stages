import React, { Fragment, useState } from "react";
import { Stages, Form, Actions, Progression, HashRouter, plainFields as fields } from "react-stages";
import Layout from "../components/Layout";
import WizardNavigation from "../components/I18nWizardNavigation";

import {
    step1Config, step2Config,
    Step1Renderer, Step2Renderer
} from "../i18nconfig";

import i18n from "../i18nconfig/i18n";

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
    const [locale, setLocale] = useState("en");
    const [data, setData] = useState({});

    const onSubmit = data => {
        console.log("submit:", data);
    };

    const switchLocale = () => {
        if (locale === "en") {
            setLocale("de");
        } else {
            setLocale("en");
        }
    };

    const createActionButtonConfig = (type, onNav, onSubmit, data, locale) => {
        if (type === "first") {
            return [{
                title: i18n.actions.next[locale],
                type: "primary",
                validate: true,
                onClick: () => onNav("next")
            }];
        }
        if (type === "only") {
            return [{
                title: i18n.actions.submit[locale],
                type: "primary",
                validate: true,
                onClick: () => onSubmit(data)
            }];
        }
        return [
            {
                title: i18n.actions.prev[locale],
                type: "secondary",
                validate: false,
                onClick: () => onNav("prev")
            },
            {
                title: type === "last" ? i18n.actions.submit[locale] : i18n.actions.next[locale],
                type: "primary",
                validate: true,
                onClick: () => type === "last" ? onSubmit(data) : onNav("next")
            }
        ];
    };

    return (
        <Layout>
            <div>
                <button type="button" onClick={switchLocale}>Switch locale</button> <span style={{ background: "#f30", color: "#fff", display: "inline-block", padding: "3px 6px" }}>Current locale: {locale}</span>
            </div>
            <Stages
                initialData={data}
                onChange={({ data }) => setData(data)}
                render={({ navigationProps, progressionProps, routerProps, steps }) => (
                    <div className="pure-g">
                        <div className="pure-u-1-5" style={{ marginTop: "64px" }}>
                            <WizardNavigation {...navigationProps} locale={locale} i18n={i18n} />
                            <Progression {...progressionProps} /> 
                        </div>
                        <div className="pure-u-4-5">{steps}</div>
                        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
                    </div>
                )}
                key={locale}
            >
                {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
                    const key = setStepKey("one", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{i18n.steps.one.name[locale]}:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={step1Config(locale, i18n)}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Step1Renderer {...fieldProps} locale={locale} i18n={i18n} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("first", onNav, onSubmit, data, locale)}
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
                    const key = setStepKey("two", index);
                    if (initializing) return null;

                    return (
                        <Fragment key={`step-${key}`}>
                            {isActive ? <h2>{i18n.steps.two.name[locale]}:</h2> : null}
                            <Form
                                id={key}
                                data={data}
                                config={step2Config(locale, i18n)}
                                render={({ actionProps, fieldProps, loading }) => (
                                    <FormLayout
                                        loading={loading}
                                        fields={<Step2Renderer {...fieldProps} locale={locale} i18n={i18n} />}
                                        actions={<Actions
                                            config={createActionButtonConfig("last", onNav, onSubmit, data, locale)}
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