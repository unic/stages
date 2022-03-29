import React from "react";

/*
    This is a default component for a Stages navigation. It is ment as
    a sample on how to build your own, but of course you can use it if it
    fits your usecase.
*/
const WizardNavigation = ({ currentStep, data, onChangeStep, errors, lastValidStep, keys, stepCount }) => {
    const items = [];

    for (let i = 0; i < keys.length; i++) {
        if (keys && keys[i] && keys[i].visible) {
            const stepName = keys && keys[i] ? keys[i].key : `Step ${i + 1}`;
            let stepSummary;

            if (i === 0 && data && data.basics && data.basics.username) stepSummary = <div><small>Username: {data.basics.username}</small></div>;
            if (i === 1 && data && data.guests && data.guests.lastname) stepSummary = <div><small>Guest: {data.guests.lastname}</small></div>;
            if (i === 2 && data && data.program && data.program.program) stepSummary = <div><small>Program entries: {data.program.program.length}</small></div>;

            if (currentStep === i) {
                items.push(<li key={stepName} style={{ textTransform: "capitalize", marginBottom: "8px" }}><strong>{stepName}</strong>{stepSummary}</li>);
            } else if ((lastValidStep > -1 && lastValidStep + 1 < i) || lastValidStep === -1 && i > 0) {
                items.push(<li key={stepName} style={{ color: "#999", textTransform: "capitalize", marginBottom: "8px" }}>{stepName}{stepSummary}</li>);
            } else {
                items.push(<li key={stepName} style={{ textTransform: "capitalize", marginBottom: "8px" }} onClick={() => onChangeStep(i)}>{stepName}{stepSummary}</li>);
            }
        }
    }

    return (
        <ul style={{ listStyleType: "none", margin: "0 0 0 32px 0", padding: 0 }}>{items}</ul>
    );
};

export default WizardNavigation;