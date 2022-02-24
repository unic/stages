/*
    This is a default component for a Stages navigation. It is ment as
    a sample on how to build your own, but of course you can use it if it
    fits your usecase.
*/
const Progression = ({ stepCount, validSteps, percentage }) => {
    return (
        <div>{`${validSteps} / ${stepCount} (${Math.round(percentage)}%)`}</div>
    );
};

export default Progression;