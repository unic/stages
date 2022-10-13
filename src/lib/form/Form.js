import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import find from "lodash.find";
import uniqWith from "lodash.uniqwith";
import isEqual from "lodash.isequal";
import get from "lodash.get";
import stringify from "fast-json-stable-stringify";

const isElementInViewport = el => {
    const rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
}

const getFieldPaths = (fieldConfig, data) => {
    const paths = [];

    const getPathsForPath = (path = "", renderPath) => {
        const thisConfig = path ? get(fieldConfig, path) : fieldConfig;
        if (Array.isArray(thisConfig)) {
            thisConfig.forEach((item, index) => {
                if (item.type === "collection") {
                    const thisData = renderPath ? get(data, `${renderPath}.${item.id}`) : data[item.id];
                    if (thisData && Array.isArray(thisData)) {
                        thisData.forEach((colItem, colIndex) => {
                            getPathsForPath(
                                `${path}[${index}].fields`, renderPath ?
                                    `${renderPath}.${item.id}[${colIndex}]` : 
                                    `${item.id}[${colIndex}]`
                            );
                        });
                    }
                } else if (item.type === "group") {
                    getPathsForPath(`${path}[${index}].fields`, renderPath ? `${renderPath}.${item.id}` : item.id);
                } else {
                    paths.push({
                        path: renderPath ? `${renderPath}.${item.id}` : item.id,
                        config: item,
                        data: get(data, renderPath ? `${renderPath}.${item.id}` : item.id)
                    });
                }
            });
        }
    }

    getPathsForPath();

    return paths;
};

const isDebugging = () => typeof window !== "undefined" && typeof window.stagesLogging === "function";

const latestOptionsRequestIDsPerField = {}; // Used to prevent race conditions in options loaders

let lastOnChange = 0; // Used to throttle onChange validations
let timeoutRef; // Timeout ref used to throttle onChange validations

let lastOnChangeData; // Used to prevent unnessesary onChange callbacks

/*
    This is the form component used in Stages. You can use it for individual steps in a wizard
    or on it's own for one stage forms.
*/
const Form = ({
    config,
    data,
    render,
    fields,
    onChange,
    isVisible,
    isDisabled,
    id,
    onValidation,
    parentRunValidation,
    validateOn,
    throttleWait,
    customEvents
}) => {
    const [uniqId] = useState(`form-${id || "noid"}-${+ new Date()}`);
    const [isDirty, setIsDirty] = useState(false);
    const [dirtyFields, setDirtyFields] = useState({});
    const [initialData, setInitialData] = useState(false);
    const [runValidation, setRunValidation] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState({});
    const [optionsCache, setOptionsCache] = useState({});
    const [asyncData, setAsyncData] = useState();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState();
    const [lastFocusedField, setLastFocusedField] = useState();
    const parsedFieldConfig = typeof config.fields === "function" ? config.fields(data, asyncData) : [];
    const fieldPaths = getFieldPaths(parsedFieldConfig, data);

    console.log({ fieldPaths });

    // Save the initial data so we can compare it to the current data so we can decide if a form is dirty:
    useEffect(() => {
        if (data && !initialData) {
            if (isDebugging()) window.stagesLogging("Set initial data", uniqId);
            setInitialData(data);
        }
    }, [data]);

    /*
        If there is a logging function registered on the window (Stages browser extension), send data to it:
    */
    useEffect(() => {
        if (isDebugging()) {
            window.stagesLogging({ id: uniqId, data, errors, isDirty, focusedField, lastFocusedField, dirtyFields, loading, parsedFieldConfig }); 
        }
    }, [data, errors, isDirty, focusedField, lastFocusedField, dirtyFields, loading]);

    // Helper function to detect reserved field types:
    const isReservedType = type => type === "collection" || type === "subform" || type === "group";

    // Is a specific field valid based on current data:
    const isFieldValid = (field, fieldData, triggeringEvent) => {
        const isValid = !isReservedType(field.type) && fields[field.type].isValid(fieldData[field.id], field);
        return !isReservedType(field.type) && field.customValidation ? field.customValidation({
            data: fieldData[field.id],
            allData: fieldData,
            fieldConfig: field,
            isValid,
            fieldHasFocus: !!(focusedField && focusedField.key === field.id),
            fieldIsDirty: typeof dirtyFields[field.id] !== "undefined",
            triggeringEvent
        }) : isValid;
    };

    /*
        This function is used to validate one single field. It returns the updated error and firstErrorField object
    */
    const validateField = (field, triggeringEvent, validationData, errors, firstErrorField) => {
        if (isDebugging()) window.stagesLogging(`Validate field "${field.id}"`, uniqId);

        // Is the data entered valid, check with default field function and optionally with custom validation:
        const fieldIsValid = isFieldValid(field, validationData, triggeringEvent);

        if (errors[field.id]) delete errors[field.id];

        // Regular non reserved type fields:
        if (!isReservedType(field.type) && fieldIsValid !== true) {
            if (!firstErrorField) firstErrorField = field.id;
            errors[field.id] = {
                value: validationData[field.id],
                field,
                errorCode: fieldIsValid !== false ? fieldIsValid : undefined
            };
        // Collections which are required (need to have at least one entry!):
        } else if (field.type === "collection" && field.isRequired && (!validationData[field.id] || validationData[field.id].length === 0 || validationData[field.id].length === 1 && Object.keys(validationData[field.id][0]).length === 0)) {
            if (!firstErrorField) firstErrorField = field.id;
            errors[field.id] = {
                value: validationData[field.id],
                field
            };
        // Collections which are not required will only be checked if data has been added:
        } else if (field.type === "collection") {
            if (Array.isArray(field.fields)) {
                field.fields.forEach(subField => {
                    validationData[field.id] && validationData[field.id].forEach((dataEntry, index) => {
                        // Don't check fields if the collection isn't required and the object is empty:
                        if (!field.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                        // Is the data entered valid, check with default field function and optionally with custom validation:
                        const fieldIsValid = isFieldValid(subField, dataEntry, triggeringEvent);

                        if (fields[subField.type] && fieldIsValid !== true) {
                            errors[`${field.id}-${index}-${subField.id}`] = {
                                value: validationData[field.id],
                                subField,
                                errorCode: fieldIsValid !== false ? fieldIsValid : undefined
                            };
                        }
                    });
                });
            } else {
                // This is a union type collection, so we need to get the validation config inside the types object:
                validationData[field.id] && validationData[field.id].forEach((dataEntry, index) => {
                    // Don't check fields if the collection isn't required and the object is empty:
                    if (!field.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                    if (field.fields[dataEntry.__typename]) {
                        const subFields = field.fields[dataEntry.__typename];
                        subFields.forEach(subField => {
                            // Is the data entered valid, check with default field function and optionally with custom validation:
                            const fieldIsValid = isFieldValid(subField, dataEntry, triggeringEvent);

                            if (fields[subField.type] && fieldIsValid !== true) {
                                errors[`${field.id}-${index}-${subField.id}`] = {
                                    value: validationData[field.id],
                                    subField,
                                    errorCode: fieldIsValid !== false ? fieldIsValid : undefined
                                };
                            }
                        });
                    }
                });
            }
        }

        if (field.type === "collection" && field.uniqEntries && validationData[field.id]) {
            // Add error if collection entries are not unique!
            if (uniqWith(validationData[field.id], (arrVal, othVal) => stringify(arrVal) === stringify(othVal)).length !== validationData[field.id].length) {
                errors[field.id] = {
                    value: validationData[field.id],
                    field
                };
            }
        }

        return {
            errors,
            firstErrorField
        };
    };

    /*
        This function checks for all validation errors, based on each field types validation method
        and the fields config.
    */
    const validationErrors = (isUserAction, validationData) => {
        let errors = {};
        let firstErrorField;

        if (!validationData) validationData = data;

        parsedFieldConfig.forEach(field => {
            if (!fields[field.type] && !isReservedType(field.type)) return;
            const result = validateField(field, "action", validationData, errors, firstErrorField);
            errors = result.errors;
            firstErrorField = result.firstErrorField;
        });

        // Jump to the first field which has an error:
        if (firstErrorField && isVisible && isUserAction) {
            const element = document.getElementById(firstErrorField);
            if (element && !isElementInViewport(element)) element.scrollIntoView();
        }

        return errors;
    };

    /*
        This function can be used to gather form errors without populating the error object, 
        which can be useful in certain cases where you don't want to display errors on the fields 
        but for example disabling submission of the form
    */
    const silentlyGetValidationErrors = () => {
        return validationErrors(false);
    };

    // To make sure that subforms are being validated, we have to run validation each time validation is being run on the parent component:
    useEffect(() => {
        if (typeof onValidation === "function" && parentRunValidation) {
            if (isDebugging()) window.stagesLogging(`Get errors on validation`, uniqId);
            let errors = validationErrors(true);
            setErrors(errors);
            onValidation(errors);
        }
    }, [onValidation]);

    /*
        This is the callback which sub forms call to bubble up validation errors from within the subform.
    */
    const handleSubValidation = (subId, subErrors) => {
        if (isDebugging()) window.stagesLogging(`Get sub form errors for sub id "${subId}"`, uniqId);
        validationErrors(true);
        if (subErrors && Object.keys(subErrors).length > 0) {
            errors[subId] = subErrors;
        }
    };

    // Helper state function so we always get the latest options cache when updating from callback:
    const updateOptionsCache = (key, options) => {
        if (isDebugging()) window.stagesLogging(`Update options cache for "${key}"`, uniqId);
        setOptionsCache(latestCache => {
            return Object.assign({}, latestCache, {[key]: options});
        });
    };

    // Helper state function so we always get the latest options loaded when updating from callback:
    const updateOptionsLoaded = (key, options) => {
        if (isDebugging()) window.stagesLogging(`Update options loaded for "${key}"`, uniqId);
        setOptionsLoaded(latestCache => {
            return Object.assign({}, latestCache, {[key]: options});
        });
    };

    // Create the dynamic options for a specific field
    const createDynamicOptions = async (field, optionsConfig, updatedData) => {
        if (optionsConfig.loader && typeof optionsConfig.loader === "function") {
            const cacheKeyValues = {};
            let cacheKey;
            let options;

            // Variables used to prevent race conditions with the async options calls:
            const newNr = typeof latestOptionsRequestIDsPerField[field] === "number" ? latestOptionsRequestIDsPerField[field] + 1 : 0;
            let nrAfterAsyncCall = newNr;
            latestOptionsRequestIDsPerField[field] = newNr;

            if (isDebugging()) window.stagesLogging(`Create dynamic options for field "${field}"`, uniqId);

            // Handle caching of loaded options if enabled:
            if (optionsConfig.enableCaching) {
                optionsConfig.watchFields.forEach(f => {
                    if (updatedData[f]) cacheKeyValues[f] = updatedData[f];
                });
                cacheKey = `${field}-${stringify(cacheKeyValues)}`;
            }

            // Load async data or use the cache:
            if (optionsConfig.enableCaching && optionsCache[cacheKey]) {
                options = optionsCache[cacheKey];
            } else {
                options = await optionsConfig.loader(updatedData, handleChange);
                nrAfterAsyncCall = latestOptionsRequestIDsPerField[field];
            }

            if (optionsConfig.enableCaching) {
                updateOptionsCache(cacheKey, options);
            }


            // Only update options if this is the latest option call for this field:
            if (nrAfterAsyncCall === newNr) {
                updateOptionsLoaded(field, options);
                if (optionsConfig.onOptionsChange && typeof optionsConfig.onOptionsChange === "function") {
                    optionsConfig.onOptionsChange(options, updatedData, handleChange);
                }
            }
        }
    };

    // Improve the on change handler so that only real changes are bubbled up!
    const limitedOnChange = (newData, errors, id, fieldKey, index) => {
        let newLastOnChangeData;
        try {
            newLastOnChangeData = stringify({ newData, errors: Object.keys(errors), id, fieldKey, index });
        } catch(error) {};
        if (newLastOnChangeData !== lastOnChangeData) {
            onChange(newData, errors, id, fieldKey, index);
            lastOnChangeData = newLastOnChangeData;
        }
    };

    /*
        Initialize collections if needed and run the validation (needed for
        the wizard to find out which steps are valid).
    */
    useEffect(() => {
        let newData = Object.assign({}, data);
        
        if (isDebugging()) window.stagesLogging(`Is visible change to "${isVisible ? "visible" : "invisible"}"`, uniqId);

        parsedFieldConfig.forEach(field => {
            if (field.type === "collection" && field.init) {
                const minEntries = field.min ? Number(field.min) : 1;
                // Init collections if needed (will add empty object so the row is rendered):
                if (!newData[field.id] || newData[field.id].length === 0) newData[field.id] = [];
                for (let i = newData[field.id].length; i < minEntries; i++) {
                    if (typeof field.init === "string") {
                        // Init union types with a specific type:
                        newData[field.id].push({
                            __typename: field.init
                        });
                    } else {
                        newData[field.id].push({});
                    }
                }
            }
        });

        newData = computeValues(parsedFieldConfig, newData);

        if (typeof config.asyncDataLoader === "function" && isVisible && !dataLoaded) {
            // Load async data if an asyncDataLoader has been provided:
            (async () => {
                setLoading(true);
                const asyncData = await config.asyncDataLoader();
                setAsyncData(asyncData);
                setDataLoaded(true);
                setLoading(false);
            })();
        }

        if (isVisible) {
            // Check if a field has dynamic options and needs to initialize them:
            parsedFieldConfig.forEach(field => {
                if (field.dynamicOptions && field.dynamicOptions.events && field.dynamicOptions.events.indexOf("init") > -1) {
                    createDynamicOptions(field.id, field.dynamicOptions, newData);
                }
            });
        }

        limitedOnChange(newData, validationErrors(), id); // will trigger validations even with no inits
    }, [isVisible]);

    /*
        This function finds all fields with computed values and computes them
        with the current data.
    */
    const computeValues = (config, data) => {
        config.forEach(field => {
            if (typeof field.computedValue === "function") {
                data[field.id] = field.computedValue(data);
            }
            if (field.type === "collection") {
                if (Array.isArray(field.fields)) {
                    field.fields.forEach(subField => {
                        if (typeof subField.computedValue === "function") {
                            data[field.id].forEach((dataEntry, index) => {
                                data[field.id][index][subField.id] = subField.computedValue(data, data[field.id][index]);
                            });
                        }
                    });
                } else {
                    // This is a union type collection, so we need to loop differently:
                    data[field.id].forEach((dataEntry, index) => {
                        if (data[field.id][index].__typename) {
                            const unionType = data[field.id][index].__typename;
                            if (field.fields[unionType]) {
                                const subFields = field.fields[unionType];
                                subFields.forEach(subField => {
                                    if (typeof subField.computedValue === "function") {
                                        data[field.id][index][subField.id] = subField.computedValue(data, data[field.id][index]);
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
        return data;
    };

    /*
        This function returns the field configuration for a specific field, given the key of that field (or keys for collection fields)
    */
    const getConfigForField = fieldKey => {
        let fieldConfig = {};
        if (typeof fieldKey === "string") fieldConfig = find(parsedFieldConfig, { id: fieldKey });
        if (Array.isArray(fieldKey) && fieldKey.length > 1) fieldConfig = find(parsedFieldConfig, { id: fieldKey[0] });
        return fieldConfig;
    };

    const getActiveCustomEvents = (triggeringEvent, eventData) => {
        const activeCustomEvents = [];

        if (typeof customEvents === "object") {
            Object.keys(customEvents).forEach(key => {
                if (typeof customEvents[key] === "function" && customEvents[key]({
                    data: eventData,
                    dirtyFields,
                    optionsLoaded,
                    asyncData,
                    errors,
                    focusedField,
                    triggeringEvent
                })) activeCustomEvents.push(key);
            });
        }

        return activeCustomEvents;
    };

    const arrayToStringIfOnlyOneEntry = arr => {
        if (Array.isArray(arr) && arr.length === 1) return arr[0];
        return arr;
    };

    /*
        This function is called on each fields onChange. It will trigger the forms onChange
        and run the validation on the new data (which is sent to the onChange, as well).
    */
    const handleChange = (fieldKey, value, index, outsideData, syntheticCall = false) => {
        let throttleValidation = false;
        let newErrors;
        const timestamp = +new Date();

        if (lastOnChange === 0 || timestamp - lastOnChange < Number(throttleWait || 400)) {
            if (timeoutRef) clearTimeout(timeoutRef);
            timeoutRef = setTimeout(() => handleChange(fieldKey, value, index, outsideData, true), 100);
            throttleValidation = true;
        }

        if (!syntheticCall) lastOnChange = timestamp;

        const fieldConfig = getConfigForField(fieldKey);
        let newData = Object.assign({}, outsideData || data);
        let newValue;

        if (isDebugging()) window.stagesLogging(`Handle change for field "${fieldKey}"`, uniqId);

        const filterValue = v => {
            let field;
            if (Array.isArray(fieldKey)) {
                const rootField = find(parsedFieldConfig, { id: fieldKey[0] });
                field = find(rootField.fields, { id: fieldKey[1] });
            } else {
                field = find(parsedFieldConfig, { id: fieldKey });
            }
            if (field && typeof field.filter === "function") return field.filter(value);
                return v;
        };

        newValue = filterValue(value);
        
        if (Array.isArray(fieldKey)) {
            if (newValue) {
                newData[fieldKey[0]][index][fieldKey[1]] = newValue;
            } else {
                // Remove if false, to make sure isDirty is calculated correctly!
                delete newData[fieldKey[0]][index][fieldKey[1]];
            }
        } else {
            if (newValue) {
                newData[fieldKey] = newValue;
            } else {
                // Remove if false, to make sure isDirty is calculated correctly!
                delete newData[fieldKey];
            }
        }

        // Now run over all computed value fields to recalculate all dynamic data:
        newData = computeValues(parsedFieldConfig, newData);

        // prepare the params for the validateOnCallback:
        const validateOnParams = {
            data: newData[fieldKey],
            fieldIsDirty: !!dirtyFields[fieldKey],
            fieldConfig,
            fieldHasFocus: !!(focusedField && focusedField.key === fieldKey)
        };

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("change", newData);

        // Only validate if change or throttledChange or a custom event validation is enabled:
        if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && activeCustomEvents.some(r=> validateOn.indexOf(r) > -1)) ||
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && activeCustomEvents.some(r=> fieldConfig.validateOn.indexOf(r) > -1))
        ) {
            const result = validateField(fieldConfig, arrayToStringIfOnlyOneEntry(activeCustomEvents), newData, errors);
            newErrors = Object.assign({}, errors, result.errors);
            setErrors(newErrors);
        } else if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && validateOn.indexOf('change') > -1) ||
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && fieldConfig.validateOn.indexOf('change') > -1) ||
            (!fieldConfig.validateOn && Array.isArray(validateOn) && validateOn.indexOf('throttledChange') > -1 && !throttleValidation) ||
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && fieldConfig.validateOn.indexOf('throttledChange') > -1 && !throttleValidation) || 
            (!fieldConfig.validateOn && typeof validateOn === "function" && validateOn(validateOnParams).indexOf('change') > -1) ||
            (fieldConfig.validateOn && typeof fieldConfig.validateOn === "function" && fieldConfig.validateOn(validateOnParams).indexOf('change') > -1) ||
            (!fieldConfig.validateOn && typeof validateOn === "function" && validateOn(validateOnParams).indexOf('throttledChange') > -1 && !throttleValidation) ||
            (fieldConfig.validateOn && typeof fieldConfig.validateOn === "function" && fieldConfig.validateOn(validateOnParams).indexOf('throttledChange') > -1 && !throttleValidation)
        ) {
            const result = validateField(fieldConfig, "change", newData, errors);
            newErrors = Object.assign({}, errors, result.errors);
            setErrors(newErrors);
        }

        // Set the isDirty flag and per field object:
        if (initialData) {
            setIsDirty(!isEqual(newData, initialData));
            if (!isEqual(newData[fieldKey], initialData[fieldKey])) {
                dirtyFields[fieldKey] = {
                    oldData: initialData[fieldKey],
                    newData: newData[fieldKey]
                };
            } else if (typeof dirtyFields[fieldKey] !== "undefined") {
                delete dirtyFields[fieldKey];
            }
            setDirtyFields(dirtyFields);
        }

        // If there are any fields to be cleared, do that now:
        if (fieldConfig.clearFields && Array.isArray(fieldConfig.clearFields)) {
            const newOptionsLoaded = Object.assign({}, optionsLoaded);
            fieldConfig.clearFields.forEach((field) => {
                delete newData[field];
                delete newOptionsLoaded[field];
            });
            setOptionsLoaded(newOptionsLoaded);
        }

        // Check if a field has dynamic options which have to be loaded:
        parsedFieldConfig.forEach(field => {
            if (
                field.dynamicOptions &&
                field.dynamicOptions.events &&
                field.dynamicOptions.events.indexOf('change') > -1 &&
                field.dynamicOptions.watchFields &&
                field.dynamicOptions.watchFields.indexOf(fieldConfig.id) > -1 &&
                (!fieldConfig.dynamicOptions ||
                  (fieldConfig.dynamicOptions &&
                    optionsLoaded[fieldConfig.id] &&
                    optionsLoaded[fieldConfig.id].indexOf(newData[fieldConfig.id]) > -1) ||
                  !optionsLoaded[fieldConfig.id])
            ) {
                createDynamicOptions(field.id, field.dynamicOptions, newData);
            }
        });

        limitedOnChange(newData, newErrors || errors, id, fieldKey, index);
    };

    /*
        This function is called on each fields onFocus. It is currently used 
        to track which field has focus and what the last field in focus was.
    */
    const handleFocus = (fieldKey, index) => {
        setFocusedField({ key: fieldKey, index });
        setLastFocusedField({ key: fieldKey, index });
    };

    /*
        This function is called on each fields onBlur. It only runs validation 
        if validation is enabled for blur events.
    */
    const handleBlur = (fieldKey, index) => {
        setFocusedField();
        const fieldConfig = getConfigForField(fieldKey);
        const newData = Object.assign({}, data);

        lastOnChange = 0; // Reset the throttled change, so it starts from fresh again

        if (isDebugging()) window.stagesLogging(`Handle blur for field "${fieldKey}"`, uniqId);

        // Run field cleanUp function if one is set:
        if (fieldConfig.cleanUp && typeof fieldConfig.cleanUp === "function" && newData[fieldConfig.id]) {
            newData[fieldConfig.id] = fieldConfig.cleanUp(newData[fieldConfig.id]);
            limitedOnChange(newData, errors, id, fieldKey, index);
        }

        // prepare the params for the validateOnCallback:
        const validateOnParams = {
            data: newData[fieldKey],
            fieldIsDirty: !!dirtyFields[fieldKey],
            fieldConfig,
            fieldHasFocus: !!(focusedField && focusedField.key === fieldKey)
        };

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("blur", newData);

        // Only validate if blur validation or a custom event is enabled:
        if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && activeCustomEvents.some(r=> validateOn.indexOf(r) > -1)) ||
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && activeCustomEvents.some(r=> fieldConfig.validateOn.indexOf(r) > -1))
        ) {
            const result = validateField(fieldConfig, arrayToStringIfOnlyOneEntry(activeCustomEvents), newData, errors);
            setErrors(Object.assign({}, errors, result.errors));
            limitedOnChange(newData, result.errors, id, fieldKey, index);
        } else if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && validateOn.indexOf("blur") > -1) || 
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && fieldConfig.validateOn.indexOf("blur") > -1) || 
            (!fieldConfig.validateOn && typeof validateOn === "function" && validateOn(validateOnParams).indexOf("blur") > -1) || 
            (fieldConfig.validateOn && typeof fieldConfig.validateOn === "function" && fieldConfig.validateOn(validateOnParams).indexOf("blur") > -1)
        ) {
            const result = validateField(fieldConfig, "blur", newData, errors);
            setErrors(Object.assign({}, errors, result.errors));
            limitedOnChange(newData, result.errors, id, fieldKey, index);
        }

        // Check if a field has dynamic options which have to be loaded:
        parsedFieldConfig.forEach(field => {
            if (
                field.dynamicOptions && 
                field.dynamicOptions.events && 
                field.dynamicOptions.events.indexOf("blur") > -1 && 
                field.dynamicOptions.watchFields && 
                field.dynamicOptions.watchFields.indexOf(fieldConfig.id) > -1
            ) {
                createDynamicOptions(field.id, field.dynamicOptions, newData);
            }
        });
    };

    /*
        Create the rendered fields object, which contain the correct React components together
        with the correct data in them.
    */
    const createRenderedFields = () => {
        const renderedFields = {};

        fieldPaths.forEach(fieldPath => {

        });

        parsedFieldConfig.forEach(field => {
            const cleanedField = Object.assign({}, field);
            if (!fields[field.type] && !isReservedType(field.type)) return; // Ignore field types which don't exist!

            if (optionsLoaded[field.id]) cleanedField.options = optionsLoaded[field.id];

            // Remove special props from field before rendering:
            delete cleanedField.computedValue;
            delete cleanedField.filter;
            delete cleanedField.clearFields;
            delete cleanedField.dynamicOptions;

            // Create regular fields:
            if (!isReservedType(field.type)) {
                renderedFields[field.id] = React.createElement(
                    fields[field.type].component,
                    Object.assign({
                        key: field.id,
                        value: data[field.id],
                        initialValue: initialData[field.id],
                        error: errors[field.id],
                        isDirty: !!dirtyFields[field.id],
                        isDisabled: isDisabled || field.isDisabled,
                        onChange: value => handleChange(field.id, value),
                        onFocus: () => handleFocus(field.id),
                        onBlur: () => handleBlur(field.id)
                    }, cleanedField)
                );
            // Create collections:
            } else if (field.type === "collection") {
                if (!Array.isArray(renderedFields[field.id])) renderedFields[field.id] = [];
                // Add existing entries:
                if (data[field.id]) {
                    data[field.id].forEach((dataEntry, index) => {
                        const subRenderedFields = {};
                        if (Array.isArray(field.fields)) {
                            field.fields.forEach(subField => {
                                if (fields[subField.type]) {
                                    subRenderedFields[subField.id] = React.createElement(
                                        fields[subField.type].component,
                                        Object.assign({
                                            key: `${field.id}-${index}-${subField.id}`,
                                            value: dataEntry[subField.id],
                                            error: errors[`${field.id}-${index}-${subField.id}`],
                                            isDisabled: isDisabled || subField.isDisabled,
                                            onChange: value => handleChange([field.id, subField.id], value, index),
                                            onFocus: () => handleFocus([field.id, subField.id], index),
                                            onBlur: () => handleBlur([field.id, subField.id], index)
                                        }, subField)
                                    )
                                }
                            });
                        } else {
                            // This is a union type collection, so we need to infer the type so we can select the right field config:
                            if (dataEntry.__typename && field.fields[dataEntry.__typename]) {
                                // This entries type was found, so render it:
                                field.fields[dataEntry.__typename].forEach(subField => {
                                    if (fields[subField.type]) {
                                        subRenderedFields[subField.id] = React.createElement(
                                            fields[subField.type].component,
                                            Object.assign({
                                                key: `${field.id}-${index}-${subField.id}`,
                                                value: dataEntry[subField.id],
                                                error: errors[`${field.id}-${index}-${subField.id}`],
                                                isDisabled: isDisabled || subField.isDisabled,
                                                onChange: value => handleChange([field.id, subField.id], value, index),
                                                onFocus: () => handleFocus([field.id, subField.id], index),
                                                onBlur: () => handleBlur([field.id, subField.id], index)
                                            }, subField)
                                        )
                                    }
                                });
                            }
                        }
                        renderedFields[field.id].push(subRenderedFields);
                    });
                }
            // Create subforms:
            } else if (field.type === "subform") {
                renderedFields[field.id] = (
                    <Form
                        config={field.config}
                        render={({ fieldProps }) => React.createElement(field.render, fieldProps)}
                        fields={fields}
                        id={`${id}-${field.id}`}
                        onChange={(value, subErrors) => handleChange(field.id, value)}
                        onValidation={errors => handleSubValidation(field.id, errors)}
                        parentRunValidation={runValidation}
                        data={data && data[field.id]}
                        isVisible={isVisible}
                        isDisabled={isDisabled}
                        validateOn={validateOn}
                    />
                );
            }
        });

        return renderedFields;
    };

    /*
        This function handles adding and removing collection entries. It is
        called by the forms render method.
    */
    const onCollectionAction = (fieldKey, action, index) => {
        const newData = Object.assign({}, data);
        const field = find(parsedFieldConfig, { id: fieldKey });
        const minEntries = field && field.min ? Number(field.min) : 0;
        const maxEntries = field && field.max ? Number(field.max) : 99999999999999; // easiest to just add an impossible high number
        let newErrors;

        if (isDebugging()) window.stagesLogging(`On collection action "${fieldKey}"`, uniqId);

        // This will add a new entry to the collection:
        if (action === "add") {
            if (!Array.isArray(newData[fieldKey])) newData[fieldKey] = [];
            if (typeof index === "string" && field.fields[index]) {
                // This is a union type collection, we're adding a specific entry:
                if (maxEntries > newData[fieldKey].length) newData[fieldKey].push({__typename: index});
            } else {
                if (maxEntries > newData[fieldKey].length) newData[fieldKey].push({});
            }
        }

        // This will remove a specific entry in the collection:
        if (action === "remove") {
            if (minEntries < newData[fieldKey].length) newData[fieldKey].splice(index, 1);
        }

        // Only validate if collection action validation is enabled:
        if (validateOn.indexOf("collectionAction") > -1) {
            newErrors = validationErrors();
            setErrors(newErrors);
        }

        limitedOnChange(newData, newErrors || validationErrors(), id, fieldKey, index);
    };

    /*
        The function is called by the forms action buttons. It either runs the validation
        or just the supplied callback.
    */
    const handleActionClick = (callback, validate) => {
        if (isDebugging()) window.stagesLogging(`Handle action click`, uniqId);

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("action", data);

        // Only validate if action validation is enabled (which is the default):
        if (
            (Array.isArray(validateOn) && validateOn.indexOf("action") > -1) || 
            (Array.isArray(validateOn) && activeCustomEvents.some(r=> validateOn.indexOf(r) > -1))
        ) {
            if (validate) {
                setRunValidation(true);
                setTimeout(() => setRunValidation(false), 0);
            }
            let errors = validate ? validationErrors(true) : {};
            setErrors(errors);
        }

        // A zero second timout is needed to make sure sub form errors become available in the parent component
        setTimeout(() => {
            if (Object.keys(errors).length === 0) callback();
        }, 0);
    };

    // If the form isn't visible, render nothing (this is needed for the Wizards step validation):
    if (isVisible === false) return null;

    // Render all the render props:
    return render ? render({
        actionProps: { handleActionClick, isDisabled, isDirty, focusedField, lastFocusedField, dirtyFields, silentlyGetValidationErrors },
        fieldProps: { fields: createRenderedFields(), onCollectionAction, data, errors, asyncData, isDirty, focusedField, lastFocusedField, dirtyFields },
        loading
    }) : null;
};

Form.propTypes = {
    config: PropTypes.object.isRequired,
    data: PropTypes.object,
    render: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    fields: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    isVisible: PropTypes.bool,
    isDisabled: PropTypes.bool,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onValidation: PropTypes.func,
    parentRunValidation: PropTypes.bool,
    validateOn: PropTypes.array
};

Form.defaultProps = {
    data: {},
    onChange: () => {},
    isVisible: true,
    isDisabled: false,
    validateOn: ["action"]
};

export default Form;