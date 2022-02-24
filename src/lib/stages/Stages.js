import { useState, useEffect } from "react";
import PropTypes from "prop-types";

/*
    The Stages component is your main component to build everything from simple wizards
    to complicated dynamic multi stage form constructs. Some of it's possible usecases:

    - Forms (one stage)
    - Wizards (multiple stages, linear progression)
    - Dynamic Wizard (multiple dynamic stages, non linear progression)
    - Text Adventure (multiple stages, free progression)
    - Quiz (One or multiple stages, with custom validation and locked fields)
    - Accordion Form (stages rendered inside an accordion)
    - Slideshow (multiple stages, no validation, keyboard navigation)
    - Router (for SPAs)
*/
const Stages = ({
    children,
    initialData,
    initialStep,
    render,
    validateOnStepChange
}) => {
    const [data, setData] = useState(initialData);
    const [activeChildren, setActiveChildren] = useState([]);
    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(initialStep || 0);
    const [keys, setKeys] = useState([]); // Todo: Keys need a isHidden property so we can hide steps correctly!

    /*
        Get only the data for a specific step.
    */
    const getStepData = index => {
        const key = keys && keys[index] ? keys[index].key : index;
        return data && data[key] ? data[key] : {};
    };

    /*
        This function receives the step key from each step and
        packs them into an array which is than used by the router.
    */
    const setStepKey = (key, index) => {
        if (!keys[index]) {
            keys[index] = {key, visible: true};
            setKeys([...keys]);
        }
        return key;
    };

    /*
        This function is called by step forms and updates data and errors.
    */
    const onChange = (changedData, stepErrors, id) => {
        const key = keys && keys[id] ? keys[id].key : id;

        errors[id] = stepErrors;
        setErrors(Object.assign({}, errors));

        data[key] = changedData;
        setData(Object.assign({}, data));
    };

    /*
        Run through steps first to get all the keys:
    */
    useEffect(() => {
        children.map((item, index) => item({
            index,
            setStepKey,
            initializing: true
        })).filter(item => item)
    }, []);

    /*
        On each step change, check if the new step is valid, but only if validation 
        is required by the Stages current setup.
    */
    useEffect(() => {
        if (validateOnStepChange) {
            const lastValidStep = calculateLastValidStep();
            if (lastValidStep < currentStep) {
                setCurrentStep(lastValidStep === -1 ? 0 : lastValidStep + 1);
            }
        }

        // render with new data:
        setActiveChildren(
            children.map((item, index) => item({
                data: getStepData(index),
                allData: data,
                onChange,
                onNav,
                isActive: index === currentStep,
                index,
                errors: errors[index] || {},
                setStepKey
            })).filter((item, index) => {
                const isVisible = item !== null;
                keys[index].visible = isVisible;
                return isVisible;
            })
        );
    }, [currentStep, data]);

    /*
        This function is called on navigations by sub components. Following actions are possible:
        - next: Jumps to the next step
        - prev: Jumps to the prev step if possible
        - first: Jumps to the first step
        - last: Jumps to the last step if possible
        - lastValid: Jumps ton the last valid step
        - step: Jumps to a specific step
    */
    const onNav = (navType, nr) => {
        let newStepNr = currentStep;
        
        if (navType === "next") {
            // Find the next step that is visible:
            let found = false;
            for (let i = currentStep + 1; i < keys.length; i++) {
                if (keys[i].visible && !found) {
                    newStepNr = i;
                    found = true;
                }
            }
        }
        if (navType === "prev") {
            // Find the next lower step that is visible:
            let found = false;
            for (let i = currentStep -1; i >= 0; i--) {
                if (keys[i].visible && !found) {
                    newStepNr = i;
                    found = true;
                }
            }
        }
        if (navType === "first") {
            // Find the first step that is visible:
            let found = false;
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].visible && !found) {
                    newStepNr = i;
                    found = true;
                }
            }
        }
        if (navType === "last") {
            // find the last step that is visible:
            let found = false;
            for (let i = keys.length - 1; i >= 0; i--) {
                if (keys[i].visible && !found) {
                    newStepNr = i;
                    found = true;
                }
            }
        };
        if (navType === "lastValid") newStepNr = calculateLastValidStep();
        if (navType === "step" && keys[nr] && keys[nr].visible) {
            newStepNr = Number(nr);
        }

        if (newStepNr < 0) newStepNr = 0;
        if (newStepNr > keys.length) newStepNr = keys.length;

        setCurrentStep(newStepNr);
    };

    /*
        The callback for the navigation component.
    */
    const onChangeStep = step => {
        const lastValidStep = calculateLastValidStep();
        if (lastValidStep + 1 >= step) setCurrentStep(step);
    };

    /*
        Calculates the last valid step. In other words, the last step which contains a form
        with no validation errors.
    */
    const calculateLastValidStep = () => {
        let lastValidStep = -1;
        let stepFailed = false;

        Object.keys(errors).forEach(index => {
            if ((Object.keys(errors[index]).length === 0 || !keys[index].visible) && !stepFailed) {
                lastValidStep = Number(index);
            } else {
                stepFailed = true;
            }
        });

        return lastValidStep;
    };

    /*
        Calculate the step progression based on the number of valid, filled out steps.
    */
    const calculateProgression = () => {
        const stepCount = activeChildren.length;
        const lastValidStep = calculateLastValidStep();
        let validSteps = 0;

        Object.keys(errors).forEach(index => {
            const stepData = getStepData(index);
            if (index <= lastValidStep && Object.keys(errors[index]).length === 0 && Object.keys(stepData).length > 0) validSteps++;
        });

        return {
            currentStep,
            stepCount,
            validSteps,
            percentage: 100 / stepCount * validSteps
        };
    };

    if (activeChildren.length === 0) return null;

    /*
        Now render all the render props:
    */
    return render ? render({
        navigationProps: {
            currentStep, data, onChangeStep, errors, keys, stepCount: activeChildren.length, lastValidStep: calculateLastValidStep()
        },
        progressionProps: calculateProgression(),
        routerProps: { step: currentStep, onChange: setCurrentStep, keys: keys },
        steps: activeChildren
    }) : null;
};

Stages.propTypes = {
    children: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.node, PropTypes.func])).isRequired,
    initialData: PropTypes.object,
    render: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    initialStep: PropTypes.number,
    validateOnStepChange: PropTypes.bool
};

Stages.defaultProps = {
    initialData: {},
    validateOnStepChange: true
};

export default Stages;