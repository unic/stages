import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import findIndex from "lodash.findindex";

import { getDataFromStorage, saveDataToStorage, removeDataFromStorage } from "../utils/storage";
import { isDebugging } from "../utils/browser";

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
    validateOnStepChange,
    onChange,
    autoSave,
    id
}) => {
    const createInitialData = () => {
        // If autosave is enabled, read the data and trigger an onChange with it:
        if (id && (autoSave === "local" || autoSave === "session" || (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")))) {
            const savedData = getDataFromStorage(id, typeof autoSave === "object" ? autoSave.type : autoSave);
            if (Object.keys(savedData).length > 0) {
                return savedData;
            }
        } else if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.get === "function") {
            const savedData = autoSave.get(id);
            if (Object.keys(savedData).length > 0) {
                return savedData;
            }
        }
        return initialData;
    };

    const [uniqId] = useState(`stages-${id ? id : + new Date()}`);
    const [data, setData] = useState(createInitialData());
    const [activeChildren, setActiveChildren] = useState([]);
    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(initialStep || 0);
    const [keys, setKeys] = useState([]);

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
    const handleOnChange = (changedData, stepErrors, formId) => {
        const newData = Object.assign({}, data);
        const key = keys && keys[formId] ? keys[formId].key : formId;

        if (isDebugging()) window.stagesLogging(`Handle onChange for "${key}"`, uniqId);

        errors[formId] = stepErrors;
        setErrors(Object.assign({}, errors));

        newData[key] = changedData;
        setData(Object.assign({}, newData));

        if (typeof onChange === "function") onChange({ data: newData, errors });

        // Auto save data if enabled:
        if (id) {
            if (autoSave === "local" || autoSave === "session") {
                if (Object.keys(errors).length === 0) saveDataToStorage(id, newData, autoSave);
            } else if (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")) {
                if ((autoSave.validDataOnly && Object.keys(errors).length === 0) || !autoSave.validDataOnly) {
                    saveDataToStorage(id, newData, autoSave.type);
                }
            } else if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.save === "function") {
                if ((autoSave.validDataOnly && Object.keys(errors).length === 0) || !autoSave.validDataOnly) {
                    autoSave.save(id, newData);
                }
            }
        }
    };

    const reset = () => {
        if (id) {
            if (autoSave === "local" || autoSave === "session") removeDataFromStorage(id, autoSave);
            if (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")) removeDataFromStorage(id, autoSave.type);
            if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.remove === "function") {
                autoSave.remove(id);
            }
        }
        setData(initialData);
        setCurrentStep(0);
        if (typeof onChange === "function") onChange({ data: initialData, errors });
    }

    /*
        If there is a logging function registered on the window (Stages browser extension), send data to it:
    */
    useEffect(() => {
        if (isDebugging()) {
            if (id && (autoSave === "local" || autoSave === "session" || (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")))) {
                window.stagesLogging({ id: uniqId, keys, data, initialData, initialStep, errors, currentStep, savedData: getDataFromStorage(id, typeof autoSave === "object" ? autoSave.type : autoSave) });
            } else if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.get === "function") {
                window.stagesLogging({ id: uniqId, keys, data, initialData, initialStep, errors, currentStep, savedData: autoSave.get(id) });
            } else {
                window.stagesLogging({ id: uniqId, keys, data, initialData, initialStep, errors, currentStep, savedData: {} });
            }
        }
    }, [keys, data, errors, currentStep]);

    /*
        Run through steps first to get all the keys:
    */
    useEffect(() => {
        if (isDebugging()) window.stagesLogging(`Init Stages`, uniqId);

        children.map((item, index) => item({
            index,
            setStepKey,
            initializing: true
        })).filter(item => item);
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
                onChange: handleOnChange,
                reset,
                onNav,
                isActive: index === currentStep,
                index,
                errors: errors[index] || {},
                setStepKey
            })).filter((item, index) => {
                const isVisible = item !== null;
                if (keys[index]) keys[index].visible = isVisible;
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

        if (isDebugging()) window.stagesLogging(`On nav "${navType}" -> "${nr}"`, uniqId);
        
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
        } else if (navType === "step" && typeof nr === "string") {
            const index = findIndex(keys, { key: nr });
            if (index > -1) newStepNr = index;
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
        if (isDebugging()) window.stagesLogging(`On change step "${step}"`, uniqId);
        if (lastValidStep + 1 >= step || validateOnStepChange === false) setCurrentStep(step);
    };

    /*
        Calculates the last valid step. In other words, the last step which contains a form
        with no validation errors.
    */
    const calculateLastValidStep = () => {
        let lastValidStep = -1;
        let stepFailed = false;

        Object.keys(errors).forEach(index => {
            const keysIndex = findIndex(keys, { key: index });
            if ((Object.keys(errors[index]).length === 0 || (keysIndex > -1 && !keys[keysIndex].visible)) && !stepFailed) {
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
            percentage: 100 / stepCount * validSteps,
            data,
            errors
        };
    };

    if (activeChildren.length === 0) return null;

    /*
        Now render all the render props:
    */
    return render ? render({
        navigationProps: {
            currentStep, data, onChangeStep, errors, keys, stepCount: activeChildren.length, lastValidStep: calculateLastValidStep(), reset
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
    validateOnStepChange: PropTypes.bool,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

Stages.defaultProps = {
    initialData: {},
    validateOnStepChange: true,
    autoSave: false
};

export default Stages;