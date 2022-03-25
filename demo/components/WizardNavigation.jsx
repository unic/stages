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

export default WizardNavigation;