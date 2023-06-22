import React from "react";

/**
 * This is a default component for a Stages navigation. It is ment as
 * a sample on how to build your own, but of course you can use it if it
 * fits your usecase.
 *
 * @param {number} stepCount - the total number of steps
 * @param {number} validSteps - the number of valid steps
 * @param {number} percentage - the percentage of valid steps
 * @return {JSX.Element} - a React component displaying the valid steps, the total steps, and the percentage of valid steps
 */
const Progression = ({ stepCount, validSteps, percentage }) => {
    return (
        <div>{`${validSteps} / ${stepCount} (${Math.round(percentage)}%)`}</div>
    );
};

export default Progression;