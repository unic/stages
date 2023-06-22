import React from "react";

/**
 * This is a default component for a Stages navigation. It is ment as
 * a sample on how to build your own, but of course you can use it if it
 * fits your usecase.
 *
 * @param {number} currentStep - The current step of the navigation.
 * @param {Object} data - Current data in the wizard, can be used to display step summaries.
 * @param {function} onChangeStep - Function to call when the step should change.
 * @param {Object} errors - Object containing error data for each step.
 * @param {number} lastValidStep - The last valid step in the wizard.
 * @param {array<object>} keys - All the step keys in the wizard.
 * @param {number} stepCount - The number of steps in the wizard.
 * @param {function} reset - Function to call when the navigation is reset.
 * @return {JSX.Element} - The navigation component.
 */
const Navigation = ({ currentStep, data, onChangeStep, errors, lastValidStep, keys, stepCount, reset }) => {
    const items = [];

    for (let i = 0; i < keys.length; i++) {
        if (keys && keys[i] && keys[i].visible) {
            const stepName = keys && keys[i] ? keys[i].key : `Step ${i + 1}`;

            if (currentStep === i) {
                items.push(<li key={stepName} style={{ textTransform: "capitalize" }}><strong>{stepName}</strong></li>);
            } else if ((lastValidStep > -1 && lastValidStep + 1 < i) || lastValidStep === -1 && i > 0) {
                items.push(<li key={stepName} style={{ color: "#999", textTransform: "capitalize" }}>{stepName}</li>);
            } else {
                items.push(<li key={stepName} style={{ textTransform: "capitalize" }} onClick={() => onChangeStep(i)}>{stepName}</li>);
            }
        }
    }

    return (
        <ul>{items}</ul>
    );
};

export default Navigation;