import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import find from "lodash/find";
import sortBy from "lodash/sortBy";
import findIndex from "lodash/findIndex";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";
import get from "lodash/get";
import set from "lodash/set";
import unset from "lodash/unset";
import merge from "lodash/merge";
import stringify from "fast-json-stable-stringify";

import { getDataFromStorage, saveDataToStorage, removeDataFromStorage } from "../utils/storage";
import { isElementInViewport, isDebugging, isPromise } from "../utils/browser";

/**
 * Cast a value to a specific type
 * 
 * @param {*} value any type of value which should be casted to specific type
 * @param {string} type one of the following types: number, string, boolean, date
 * @param {boolean} [parseAsArray] should each element of an array be casted?
 * @returns {*} the casted value
 */
const castValueStrType = (value, type, parseAsArray) => {
    if (parseAsArray && Array.isArray(value)) {
        if (type === "number") return value.map(v => Number(v));
        if (type === "string") return value.map(v => String(v));
        if (type === "boolean") return value.map(v => Boolean(v));
        if (type === "date") return value.map(v => new Date(v));
        return value;
    }
    if (type === "number") return Number(value);
    if (type === "string") return String(value);
    if (type === "boolean") return Boolean(value);
    if (type === "date") return new Date(value);
    return value;
};

/**
 * Get all possible combinations of all the elements between two input arrays
 * 
 * @param {Array<any>} arr1 first input array
 * @param {Array<any>} arr2 second input array
 * @returns {Array<any>} all combinations
 */
const getCombosFromTwoArrays = (arr1 = [], arr2 = []) => {
    const res = [];

    arr1.forEach(arr1Item => {
        arr2.forEach(arr2Item => {
            res.push([arr1Item, arr2Item]);
        });
    });

    return res;
};

/**
 * A path config
 * @typedef {Object} PathConfig
 * @property {string} path - The path of this field
 * @property {Object} config - The configuration for this field
 * @property {Object} data - The fields data
 */

/**
 * Get all field paths based on the field config and the current data
 * 
 * @param {Object} fieldConfig the field configuration
 * @param {Object} data the current data
 * @returns {Array<Object>} an array of all paths
 */
const getFieldPaths = (fieldConfig, data, activeStages) => {
    /**
     * @type {Array<PathConfig>}
     */
    const paths = [];

    const isActiveStage = (activeStages, renderPath) => {
        let isActive = false;
        Object.keys(activeStages).forEach(key => {
            if (`${key}.${activeStages[key]}` === renderPath) isActive = true;
        });
        return isActive;
    }

    /**
     * Recursively get all the paths with their configs and data objects
     *
     * @param {string} [path] - the config path
     * @param {string} [renderPath] - the render path
     * @return {void}
     */
    const getPathsForPath = (path = "", renderPath = "", pathType = "") => {
        let thisConfigs = [path ? get(fieldConfig, path) : fieldConfig];
        let thisKeys = [];
        if (!Array.isArray(thisConfigs[0])) {
            thisKeys = Object.keys(thisConfigs[0]);
            thisConfigs = Object.values(thisConfigs[0]);
        }
        if (pathType === "stage" && !isActiveStage(activeStages, renderPath)) return;

        thisConfigs.forEach((thisConfig, unionIndex) => {
            const unionKey = typeof thisKeys[unionIndex] !== "undefined" ? thisKeys[unionIndex] : undefined;
            if (Array.isArray(thisConfig)) {
                thisConfig.forEach((item, index) => {
                    const itemRenderPath = renderPath ? `${renderPath}.${item.id}` : item.id;
                    const itemData = get(data, itemRenderPath);
                    const unionData = get(data, renderPath);
                    if ((unionKey && unionData && unionData.__typename === unionKey) || !unionKey) {
                        paths.push({
                            path: itemRenderPath,
                            config: item,
                            data: itemData,
                        });
                    }
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
                    } else if (item.type === "group" || item.type === "fieldset" || item.type === "stage") {
                        getPathsForPath(`${path}[${index}].fields`, itemRenderPath, item.type);
                    } else if (item.type === "wizard") {
                        getPathsForPath(`${path}[${index}].stages`, itemRenderPath, "wizard");
                    }
                });
            }
        });
    }

    getPathsForPath();

    return paths;
};

/**
 * 
 * @param {Object} t transform object
 * @param {string} event event to check for
 * @param {Array} activeCustomEvents currently active custom events
 * @returns {boolean} true if transform is for event
 */
const isTransformForEvent = (t, event, activeCustomEvents) => {
    return (
        (
            t.on === event || 
            activeCustomEvents.indexOf(t.on) > -1 || 
            (
                Array.isArray(t.on) && 
                (t.on.indexOf(event) > -1 || t.on.some(onEvent => activeCustomEvents.includes(onEvent)))
            )
        ) && 
        typeof t.fn === "function"
    );
};

/**
 * Computes the fieldset parameters based on the given field configuration and fieldset parameter configuration.
 * Additionally it warns the developer if a field is missing or has the wrong type
 *
 * @param {Object} fieldConfig - The configuration of the fields.
 * @param {Object} paramConfig - The configuration of the fielkdset parameters.
 * @return {Object} The computed fieldset parameters.
 */
const computeFieldsetParams = (fieldConfig, paramConfig) => {
    const params = {};
    Object.keys(paramConfig).forEach(key => {
        params[key] = typeof fieldConfig[key] !== "undefined" ? fieldConfig[key] : paramConfig[key].default;
        if (typeof fieldConfig[key] === "undefined" && paramConfig[key].required) console.warn(`Param "${key}" is required but is missing in field configs!`);
        if (typeof fieldConfig[key] !== "undefined" && typeof fieldConfig[key] !== paramConfig[key].type) console.warn(`Param "${key}" is not of type "${paramConfig[key].type}"!`);
    });
    return params;
};

/**
 * Parse the configuration using all the available data
 * 
 * @param {Object | Array<object> | function} config the dynamic form config
 * @param {Object} data the current data
 * @param {Object} asyncData all the loaded async data
 * @param {Object} interfaceState all the interface state
 * @param {Array<object>} modifiedConfigs config which was modified on runtime by user input
 * @param {Object} fieldsets fieldsets which contain config and render for multiple fields
 * @returns {Array<object>} the parsed config
 */
const parseConfig = (config, data, asyncData, interfaceState, modifiedConfigs, fieldsets, validateOn) => {
    let parsedConfig = typeof config.fields === "function" ? config.fields({ data, asyncData, interfaceState, validateOn }) : 
        typeof config === "function" ? config(data, asyncData, interfaceState) : 
        Array.isArray(config) ? config : 
        [];

    const parseConfigItem = configItem => {
        if (typeof configItem === "string" && config.fieldsets && typeof config.fieldsets[configItem] === "function") {
            return config.fieldsets[configItem]({ data, asyncData, interfaceState });
        } else if (typeof configItem === "string" && fieldsets && typeof fieldsets[configItem] === "function") {
            return fieldsets[configItem]({ data, asyncData, interfaceState });
        } else if (typeof configItem === "object" && config.fieldsets && typeof config.fieldsets[configItem.type] === "function") {
            const thisParsedConfig = config.fieldsets[configItem.type]({ data, asyncData, interfaceState });
            return Object.assign({}, thisParsedConfig, configItem, { type: thisParsedConfig.type });
        } else if (typeof configItem === "object" && fieldsets[configItem.type]) {
            return {
                id: configItem.id,
                type: "fieldset",
                fieldset: configItem.type,
                fields: fieldsets[configItem.type].config({ data, asyncData, interfaceState, params: computeFieldsetParams(configItem.params || {}, fieldsets[configItem.type].params) }),
                params: configItem.params
            };
        } else if (typeof configItem === "function") {
            return configItem({ data, asyncData, interfaceState });
        }
        return configItem;
    };

    parsedConfig = parsedConfig.map(configItem => {
        if (typeof configItem === "object" && (configItem.type === "group" || configItem.type === "collection" || configItem.type === "fieldset") && Array.isArray(configItem.fields)) {
            configItem.fields = configItem.fields.map(field => parseConfigItem(field));
        }
        if (typeof configItem === "object" && configItem.type === "wizard" && Array.isArray(configItem.stages)) {
            configItem.stages = configItem.stages.map(stage => parseConfigItem(stage));
        }
        return parseConfigItem(configItem);
    });

    modifiedConfigs.forEach(modifiedConfig => {
        const fields = get(parsedConfig, modifiedConfig.path);
        if (Array.isArray(fields)) {
            if (modifiedConfig.action === "add") fields.push(modifiedConfig.fields(data, asyncData));
            if (modifiedConfig.action === "remove") {
                const field = modifiedConfig.fields(data, asyncData);
                const index = findIndex(fields, { id: field.id });
                if (index > -1) fields.splice(index, 1);
            }
            set(parsedConfig, modifiedConfig.path, fields);
        }
    });

    return parsedConfig;
};

/**
 * This fuction parses all the possible field props variations into a single variant.
 * 
 * @param {Object} fields properties 
 * @returns {Object}
 */
const parseFieldProps = fields => {
    const parsedFields = {...fields};

    Object.keys(parsedFields).forEach(fieldKey => {
        const newPropsMapping = {};
        
        // "myProp" => "myProp": "myProp"
        // "myProp:myRenamedProp" => "myProp": "myRenamedProp"
        // { isRequired: "required" } => "isRequired": "required"
        // { options: (options) => options } => "options": (options) => options

        if (Array.isArray(parsedFields[fieldKey].props)) {
            parsedFields[fieldKey].props.forEach(prop => {

                // "myProp:myRenamedProp" => "myProp": "myRenamedProp"
                if (typeof prop === "string" && prop.indexOf(":") > -1) {
                    const propSplit = prop.split(":");
                    newPropsMapping[propSplit[0]] = propSplit[1];
                
                // "myProp" => "myProp": "myProp"
                } else if (typeof prop === "string") {
                    newPropsMapping[prop] = prop;
                
                // { isRequired: "required" } => "isRequired": "required"
                // { options: (options) => options } => "options": (options) => options
                } else if (typeof prop === "object") {
                    newPropsMapping[Object.keys(prop)[0]] = prop[Object.keys(prop)[0]];
                }
            });
            parsedFields[fieldKey].props = newPropsMapping;
        }
    });

    return parsedFields;
};

/**
 * Removes stale data
 * @param {Object} data the latest form data
 * @param {Array<object>} fieldPaths all the current paths
 * @returns {object} the cleaned up form data
 */
const cleanUpStaleData = (data, fieldPaths) => {
    const newData = {};
    fieldPaths.forEach(fieldPath => {
        const value = get(data, fieldPath.path);
        if (typeof value !== "undefined") set(newData, fieldPath.path, get(data, fieldPath.path));
    });
    return newData;
};

const latestOptionsRequestIDsPerField = {}; // Used to prevent race conditions in options loaders
let pendingAsyncValidations; // Used to prevent race conditions with async validations

let lastOnChange = 0; // Used to throttle onChange validations
let timeoutRef; // Timeout ref used to throttle onChange validations

let lastOnChangeData; // Used to prevent unnessesary onChange callbacks

const chosenPlaceholders = {}; 

/**
 * This is the form component used in Stages. You can use it for individual steps in a wizard
 * or on it's own for one stage forms.
 * 
 * @param {Object} component properties 
 * @returns {React.ReactElement}
 */
const Form = ({
    config,
    data,
    render,
    renderFields,
    fields,
    onChange,
    isVisible,
    isDisabled,
    id,
    onValidation,
    parentRunValidation,
    validateOn,
    throttleWait,
    customEvents,
    enableUndo,
    undoMaxDepth,
    customRuleHandlers,
    autoSave,
    typeValidations,
    fieldsets,
    initialInterfaceState,
    hashSeparator,
    initialUndoData,
    cleanUpData
}) => {
    const mounted = useRef(false);

    // First we need to merge interfaceData with form data, whithout muting form data:
    const [interfaceState, setInterfaceState] = useState(initialInterfaceState);
    const alldata = Object.assign({}, data);
    merge(alldata, interfaceState);

    // Now we can setup all state:
    const [uniqId] = useState(`form-${id || "noid"}-${+ new Date()}`);
    const [isDirty, setIsDirty] = useState(false);
    const [dirtyFields, setDirtyFields] = useState({});
    const [initialData, setInitialData] = useState(false);
    const [undoData, setUndoData] = useState(Array.isArray(initialUndoData) ? initialUndoData :[]);
    const [activeUndoIndex, setActiveUndoIndex] = useState(Array.isArray(initialUndoData) ? initialUndoData.length : 0);
    const [runValidation, setRunValidation] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState({});
    const [optionsCache, setOptionsCache] = useState({});
    const [asyncData, setAsyncData] = useState();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState("");
    const [lastFocusedField, setLastFocusedField] = useState("");
    const [modifiedConfigs, setModifiedConfigs] = useState([]);
    const [activeStages, setActiveStages] = useState({});
    const [parsedFields, setParsedFields] = useState(parseFieldProps(fields));

    // Lastly, we craete the actual objects we will work with:
    const parsedFieldConfig = parseConfig(config, alldata, asyncData, interfaceState, modifiedConfigs, fieldsets, validateOn);
    const fieldPaths = getFieldPaths(parsedFieldConfig, alldata, activeStages);

    // As we have functions which can be triggered from outside and do state updates, we need to check if the component is still mounted!
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // Set active stages on init and whenever the config changes (and stage isn't set yet):
    useEffect(() => {
        // Set active wizard stages:
        const hash = typeof window !== "undefined" ? window.location.hash.substring(2) : "";
        const hashParts = hash.split(hashSeparator || ":");
        const newActiveStages = {...activeStages};
        hashParts.forEach(hashPart => {
            const partSplit = hashPart.split(".");
            const partPath = partSplit.slice(0, -1).join(".");
            const partStage = partSplit[partSplit.length - 1];
            if (partPath && partStage) newActiveStages[partPath] = partStage;
        });
        fieldPaths.forEach(fieldPath => {
            if (fieldPath.config.type === "wizard" && (!newActiveStages[fieldPath.path] || (newActiveStages[fieldPath.path] && !find(fieldPath.config.stages, { id: newActiveStages[fieldPath.path] })))) {
                newActiveStages[fieldPath.path] = fieldPath.config.stages[0].id;
            }
        });

        if (JSON.stringify(activeStages) !== JSON.stringify(newActiveStages)) setActiveStages(newActiveStages);

        if (cleanUpData) limitedOnChange(cleanUpStaleData(alldata, fieldPaths), errors, id);
    }, [config]);

    // Checks if the component is mounted, to prevent memory leaks for all callbacks from outside
    const isMounted = () => (mounted && mounted.current === true);

    // Save the initial data so we can compare it to the current data so we can decide if a form is dirty:
    useEffect(() => {
        if (data && !initialData) {
            // @ts-ignore
            if (isDebugging()) window.stagesLogging("Set initial data", uniqId);

            // Scan through the fieldPaths to find fields with default data:
            fieldPaths.forEach(fieldPath => {
                if (typeof fieldPath.config.value === "object" && typeof fieldPath.config.value.initial !== "undefined") {
                    const originalData = get(data, fieldPath.path);
                    if (typeof originalData === "undefined") {
                        const initialValue = typeof fieldPath.config.value.initial === "function" ? fieldPath.config.value.initial(data) : fieldPath.config.value.initial;
                        set(data, fieldPath.path, initialValue);
                        set(alldata, fieldPath.path, initialValue);
                    }
                }

                // Are there any custom events active?
                const activeCustomEvents = getActiveCustomEvents("init", data);

                let value = fieldPath.data;

                // Run field transform functions:
                if (fieldPath.config.transform && Array.isArray(fieldPath.config.transform)) {
                    let transformed = false;
                    fieldPath.config.transform.forEach((t) => {
                        if (isTransformForEvent(t, "init", activeCustomEvents)) {
                            value = t.fn(value);
                            transformed = true;
                        };
                    });
                    if (transformed) {
                        set(alldata, fieldPath.path, value);
                    }
                }

                const { hasNewErrors, newErrors } = handleValidation("init", fieldPath.path, fieldPath.config, activeCustomEvents, data, errors);
                if (hasNewErrors) {
                    setErrors(newErrors);
                }
            });

            const stringifiedData = stringify(data);
            setInitialData(JSON.parse(stringifiedData));

            let savedData;

            // If autosave is enabled, read the data and trigger an onChange with it:
            if (autoSave === "local" || autoSave === "session" || (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session"))) {
                savedData = getDataFromStorage(id, typeof autoSave === "object" ? autoSave.type : autoSave);
            } else if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.get === "function") {
                savedData = autoSave.get(id);
            }

            if (savedData) {
                if (Object.keys(savedData).length > 0) {
                    setTimeout(() => {
                        setIsDirty(!!savedData.isDirty);
                        setDirtyFields(typeof savedData.dirtyFields === "object" ? savedData.dirtyFields : {});
                        limitedOnChange(savedData.data, validateAllPaths("", savedData.data), id);
                    }, 0);   
                }
            }
        }
    }, [data]);

    /*
        If there is a logging function registered on the window (Stages browser extension), send data to it:
    */
    useEffect(() => {
        if (isDebugging()) {
            let savedData;
            if (autoSave === "local" || autoSave === "session" || (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session"))) {
                savedData = getDataFromStorage(id, typeof autoSave === "object" ? autoSave.type : autoSave);
            } else if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.get === "function") {
                savedData = autoSave.get(id);
            } else {
                savedData = {}
            }
            // @ts-ignore
            window.stagesLogging({
                id: uniqId,
                data,
                initialData,
                interfaceState,
                undoData,
                asyncData,
                errors,
                fieldPaths,
                isDirty,
                focusedField,
                lastFocusedField,
                dirtyFields,
                loading,
                parsedFieldConfig,
                savedData: savedData
            });
        }
    }, [data, errors, isDirty, focusedField, lastFocusedField, dirtyFields, loading]);

    /**
     * Helper function to detect reserved field types
     * 
     * @param {string} type string of the elemnts type
     * @returns {boolean} true if the type is a reserved type
     */
    const isReservedType = type => type === "collection" || type === "subform" || type === "group" || type === "fieldset" || type === "config" || type === "wizard" || type === "stage";

    /**
     * Is a specific field valid based on current data?
     * 
     * @param {string} fieldKey the path based key of the field
     * @param {Object} field the config for this field
     * @param {Object} fieldData data for this field
     * @param {string|string[]} triggeringEvent the event which triggered this validation
     * @returns {boolean} returns true if field value is valid
     */
    const isFieldValid = (fieldKey, field, fieldData, triggeringEvent) => {
        if (!parsedFields[field.type]) return true;
        const thisData = get(fieldData, fieldKey);
        const isValid = !isReservedType(field.type) && parsedFields[field.type].validate(thisData, field);
        if (typeValidations[field.type] && typeof typeValidations[field.type].validation === "function" && !field.customValidation) {
            // This field type has a global custom validation and no per field custom validation, 
            // so use the global custom validation!
            return typeValidations[field.type].validation({
                value: thisData,
                data: fieldData,
                interfaceState,
                fieldConfig: field,
                isValid,
                fieldHasFocus: !!(focusedField && focusedField === fieldKey),
                fieldIsDirty: typeof dirtyFields[fieldKey] !== "undefined",
                triggeringEvent
            });
        }
        if ((typeof field.regexValidation === "string" || field.regexValidation instanceof RegExp) && !field.customValidation) {
            let r;
            if (typeof field.regexValidation === "string") {
                try {
                    r = new RegExp(field.regexValidation);
                } catch(error) {
                    // supplied Regex is invalid
                }
            } else {
                r = field.regexValidation;
            }
            return isValid && (r.test(thisData) || !thisData);
        }

        if (!isReservedType(field.type) && typeof field.customValidation === "function") {
            // As this is an async call, only call it if data has changed!
            const customValidationResult = field.customValidation({
                value: thisData,
                data: fieldData,
                interfaceState,
                fieldConfig: field,
                isValid,
                fieldHasFocus: !!(focusedField && focusedField === fieldKey),
                fieldIsDirty: typeof dirtyFields[fieldKey] !== "undefined",
                triggeringEvent
            });
            if (isPromise(customValidationResult)) {
                (function(){
                    // Add to pending async validations, with timestamp and fieldkey, so that we can prevent race conditions:
                    const now = + new Date();
                    pendingAsyncValidations = {...pendingAsyncValidations, [fieldKey]: now };

                    customValidationResult.then((value) => {
                        // If validation result is false, add this field to errors and remove the pending async entry.
                        // If validation result is true, remove the pending async entry and any errors generated asynchronously.
                        // If there is already a new pending async validation for this key, than throw away this result 
                        // and remove the pending entry.
                        if (pendingAsyncValidations[fieldKey] !== now) return;
                        if (value !== true) {
                            delete pendingAsyncValidations[fieldKey];
                            setErrors({...errors, [fieldKey]: {
                                field: field
                            }});
                        } else {
                            delete pendingAsyncValidations[fieldKey];
                            setErrors({...errors});
                        }
                        pendingAsyncValidations = {...pendingAsyncValidations};
                    });
                })();
            } else {
                return customValidationResult;
            }
        }

        return isValid;
    };

    /**
     * This function is used to validate one single field. It returns the updated error and firstErrorField object
     * 
     * @param {string} fieldKey the path based key of the field
     * @param {string|string[]} triggeringEvent the event which triggered this validation
     * @param {Object} validationData current data
     * @param {Object} errors current error object
     * @param {string} [firstErrorField] key of first error field
     * @returns {object} an object containing the errors
     */
    const validateField = (fieldKey, triggeringEvent, validationData, errors, firstErrorField) => {
        const field = find(fieldPaths, { path: fieldKey }).config;
        // @ts-ignore
        if (isDebugging() && triggeringEvent !== "render") window.stagesLogging(`Validate field "${fieldKey}"`, uniqId);

        // Is the data entered valid, check with default field function and optionally with custom validation:
        const fieldIsValid = isFieldValid(fieldKey, field, validationData, triggeringEvent);
        const fieldValidationData = get(validationData, fieldKey);

        if (errors[fieldKey]) delete errors[fieldKey];

        // Regular non reserved type fields:
        if (!isReservedType(field.type) && fieldIsValid !== true) {
            if (!firstErrorField) firstErrorField = fieldKey;
            errors[fieldKey] = {
                value: fieldValidationData,
                field,
                errorCode: fieldIsValid !== false ? fieldIsValid : undefined
            };
        // Collections which are required (need to have at least one entry!):
        }

        return {
            errors,
            firstErrorField
        };
    };

    /**
     * This function checks for all validation errors, based on each field types validation method
     * and the fields config.
     * 
     * @param {boolean} [isUserAction] is this a user action or called internally (from the wizard)?
     * @param {Object} [validationData] the current data being validated
     * @returns {object} an object containing the errors
     */
    const validationErrors = (isUserAction, validationData, rootPath = "") => {
        let errors = {};
        let firstErrorField;

        if (!validationData) validationData = alldata;

        fieldPaths.forEach(fieldPath => {
            if (rootPath === "" || fieldPath.path.startsWith(rootPath)) {
                if (!parsedFields[fieldPath.config.type] && !isReservedType(fieldPath.config.type)) return;
                const result = validateField(fieldPath.path, rootPath !== "" ? "render" : "action", validationData, errors, firstErrorField);
                errors = result.errors;
                firstErrorField = result.firstErrorField;
            }
        });

        // Jump to the first field which has an error:
        if (firstErrorField && isVisible && isUserAction) {
            const element = document.getElementById(firstErrorField);
            if (element && !isElementInViewport(element)) element.scrollIntoView();
        }

        return errors;
    };

    /**
     * This function can be used to gather form errors without populating the error object,
     * which can be useful in certain cases where you don't want to display errors on the fields
     * but for example disabling submission of the form.
     * 
     * @returns {object} an object containing the errors
     */
    const silentlyGetValidationErrors = () => {
        return validateAllPaths("");
    };

    // To make sure that subforms are being validated, we have to run validation each time validation is being 
    // run on the parent component:
    useEffect(() => {
        if (typeof onValidation === "function" && parentRunValidation) {
            // @ts-ignore
            if (isDebugging()) window.stagesLogging(`Get errors on validation`, uniqId);
            let errors = validateAllPaths("");
            setErrors(errors);
            onValidation(errors);
        }
    }, [onValidation]);

    /**
     * This is the callback which sub forms call to bubble up validation errors from within the subform.
     * 
     * @param {string} subId the id of the sub form
     * @param {Object} subErrors the errors from the sub form
     */
    const handleSubValidation = (subId, subErrors) => {
        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Get sub form errors for sub id "${subId}"`, uniqId);
        validateAllPaths("");
        if (subErrors && Object.keys(subErrors).length > 0) {
            errors[subId] = subErrors;
        }
    };

    /**
     * Helper state function so we always get the latest options cache when updating from callback
     * 
     * @param {string} key the field path key
     * @param {Array<object>} options all the cached options
     */
    const updateOptionsCache = (key, options) => {
        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Update options cache for "${key}"`, uniqId);
        setOptionsCache(latestCache => {
            return Object.assign({}, latestCache, {[key]: options});
        });
    };

    /**
     * Helper state function so we always get the latest options loaded when updating from callback
     * 
     * @param {string} key the field path key
     * @param {Array<object>} options the new options which should be cached
     */
    const updateOptionsLoaded = (key, options) => {
        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Update options loaded for "${key}"`, uniqId);
        setOptionsLoaded(latestCache => {
            return Object.assign({}, latestCache, {[key]: options});
        });
    };

    /**
     * Create the dynamic options for a specific field
     * 
     * @param {string} fieldKey the field path key
     * @param {Object} optionsConfig configuration for the dynamicly loaded options
     * @param {Object} updatedData the latest form data
     */
    const createDynamicOptions = async (fieldKey, optionsConfig, updatedData) => {
        if (optionsConfig.loader && typeof optionsConfig.loader === "function") {
            const cacheKeyValues = {};
            let cacheKey;
            let options;

            // Variables used to prevent race conditions with the async options calls:
            const newNr = typeof latestOptionsRequestIDsPerField[fieldKey] === "number" ? latestOptionsRequestIDsPerField[fieldKey] + 1 : 0;
            let nrAfterAsyncCall = newNr;
            latestOptionsRequestIDsPerField[fieldKey] = newNr;

            // @ts-ignore
            if (isDebugging()) window.stagesLogging(`Create dynamic options for field "${fieldKey}"`, uniqId);

            // Handle caching of loaded options if enabled:
            if (optionsConfig.enableCaching) {
                optionsConfig.watchFields.forEach(f => {
                    const fieldData = get(updatedData, f);
                    if (fieldData) cacheKeyValues[f] = fieldData;
                });
                cacheKey = `${fieldKey}-${stringify(cacheKeyValues)}`;
            }

            // Load async data or use the cache:
            if (optionsConfig.enableCaching && optionsCache[cacheKey]) {
                options = optionsCache[cacheKey];
            } else {
                options = await optionsConfig.loader({ updatedData, handleChange });
                nrAfterAsyncCall = latestOptionsRequestIDsPerField[fieldKey];
            }

            if (optionsConfig.enableCaching) {
                updateOptionsCache(cacheKey, options);
            }

            // Only update options if this is the latest option call for this field:
            if (nrAfterAsyncCall === newNr) {
                updateOptionsLoaded(fieldKey, options);
                if (optionsConfig.onOptionsChange && typeof optionsConfig.onOptionsChange === "function") {
                    optionsConfig.onOptionsChange({ options, updatedData, handleChange });
                }
            }
        }
    };

    /**
     * This function removes interface data from the form data and packs it into the interface state
     * 
     * @param {Object} thisData the current form data
     * @returns {object} new data with all inteerface state removed
     */
    const removeInterfaceState = thisData => {
        // 1. Use fieldPaths to remove data which shouldn't be exposed.
        // 2. Put it into interFace state
        // 3. Add it again when working with the data (once, right on top)

        const interfaceState = {};
        const newData = Object.assign({}, thisData);

        fieldPaths.forEach(fieldPath => {
            if (typeof fieldPath.config.value === "object" && fieldPath.config.value.isInternal) {
                const pathData = get(thisData, fieldPath.path);
                if (typeof pathData !== "undefined") {
                    set(interfaceState, fieldPath.path, pathData);
                    unset(newData, fieldPath.path);
                }
            }
        });

        setInterfaceState(interfaceState);

        return newData;
    };

    /**
     * Improve the on change handler so that only real changes are bubbled up!
     * 
     * @param {Object} newData the latest form data
     * @param {Object} errors all the form errors
     * @param {string} id id of the form
     * @param {string} [fieldKey] the field path key
     */
    const limitedOnChange = (newData, errors, id, fieldKey, forceChange = false) => {
        let newLastOnChangeData;
        try {
            newLastOnChangeData = stringify({ newData, errors: Object.keys(errors), id, fieldKey, interfaceState });
        } catch(error) {};
        if (newLastOnChangeData !== lastOnChangeData || forceChange) {
            onChange(removeInterfaceState(newData), errors, id, fieldKey, interfaceState, validateAllPaths("", newData));
            lastOnChangeData = newLastOnChangeData;
        }
    };

    /**
     * Form action handler for undo
     */
    const handleUndo = () => {
        if (!isMounted()) return;
        if (enableUndo && activeUndoIndex > 0) {
            const newIndex = activeUndoIndex - 1;
            const oldState = JSON.parse(undoData[newIndex]);

            setActiveUndoIndex(newIndex);
            setErrors(oldState.errors);
            setIsDirty(oldState.isDirty);
            setDirtyFields(oldState.dirtyFields);

            limitedOnChange(oldState.data, oldState.errors, id);
        }
    };
    
    /**
     * Form action handler for redo
     */
    const handleRedo = () => {
        if (!isMounted()) return;
        if (enableUndo && activeUndoIndex < undoData.length - 1) {
            const newIndex = activeUndoIndex + 1;
            const oldState = JSON.parse(undoData[newIndex]);

            setActiveUndoIndex(newIndex);
            setErrors(oldState.errors);
            setIsDirty(oldState.isDirty);
            setDirtyFields(oldState.dirtyFields);

            limitedOnChange(oldState.data, oldState.errors, id);
        }
    };

    /**
     * Add new entry to the undo index
     * @param {Object} newData the latest form data
     */
    const addNewUndoEntry = newData => {
        if (enableUndo) {
            const newUndoData = [...undoData];
            newUndoData.length = activeUndoIndex + 1;
            newUndoData.push(stringify({
                data: newData,
                isDirty,
                dirtyFields,
                errors
            }));

            if (newUndoData.length > undoMaxDepth) newUndoData.shift();

            setUndoData(newUndoData);
            setActiveUndoIndex(newUndoData.length - 1);
        }
    };

    /*
        Initialize collections if needed and run the validation (needed for
        the wizard to find out which steps are valid).
    */
    useEffect(() => {
        let newData = Object.assign({}, alldata);
        
        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Is visible change to "${isVisible ? "visible" : "invisible"}"`, uniqId);

        fieldPaths.forEach(fieldPath => {
            const field = fieldPath.config;
            let fieldData = get(newData, fieldPath.path);
            if (field.type === "collection" && field.init) {
                const minEntries = field.min ? Number(field.min) : 1;
                // Init collections if needed (will add empty object so the row is rendered):
                if (!fieldData || fieldData.length === 0) fieldData = [];
                for (let i = fieldData.length; i < minEntries; i++) {
                    if (typeof field.init === "string") {
                        // Init union types with a specific type:
                        if (typeof field.setInitialData === "function") {
                            fieldData.push(field.setInitialData({ value: fieldData, data: newData, init: field.init }));
                        } else {
                            fieldData.push({ __typename: field.init });
                        }
                    } else {
                        if (typeof field.setInitialData === "function") {
                            fieldData.push(field.setInitialData({ value: fieldData, data: newData }));
                        } else {
                            fieldData.push({});
                        }
                    }
                }
                set(newData, fieldPath.path, fieldData);
            }
        });

        newData = computeValues(newData);

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
            if (Array.isArray(fieldPaths)) {
                fieldPaths.forEach(fieldPath => {
                    if (typeof fieldPath.config.compute === "object" && typeof fieldPath.config.compute.options === "object" && fieldPath.config.compute.options.events && fieldPath.config.compute.options.events.indexOf("init") > -1) {
                        createDynamicOptions(fieldPath.path, fieldPath.config.compute.options, newData);
                    }
                });
            }
            if (activeUndoIndex === 0 && undoData.length === 0) {
                setUndoData([stringify({
                    data: newData,
                    isDirty,
                    dirtyFields,
                    errors
                })]);
            }
        }

        limitedOnChange(newData, validateAllPaths(""), id); // will trigger validations even with no inits
    }, [isVisible]);

    /**
     * This function finds all fields with computed values and computes them
     * with the current data.
     * 
     * @param {Object} data the current form data
     * @returns {object} the newly computed form data
     */
    const computeValues = (data) => {
        const newData = Object.assign({}, data);
        fieldPaths.forEach(fieldPath => {
            if (typeof fieldPath.config.compute === "object" && typeof fieldPath.config.compute.value === "function") {
                const itemData = get(alldata, fieldPath.path.split(".").slice(0, -1).join("."));
                const computedValue = fieldPath.config.compute.value({ data, value: itemData, interfaceState });
                set(newData, fieldPath.path, computedValue);
            }
        });
        return newData;
    };

    /**
     * This function returns the field configuration for a specific field, given the key of that 
     * field (or keys for collection fields)
     * 
     * @param {string} fieldKey the path key of the field
     * @returns {object} the field configuration
     */
    const getConfigForField = fieldKey => {
        const fieldPath = find(fieldPaths, { path: fieldKey });
        return fieldPath ? fieldPath.config : {};
    };

    /**
     * Returns an array of active custom events given a triggering event and event data.
     *
     * @param {string} triggeringEvent - the event that triggered the custom events
     * @param {Object} eventData - the data passed to the event handler
     * @returns {Array<string>} an array of active custom events
     */
    const getActiveCustomEvents = (triggeringEvent, eventData, fieldValue) => {
        const activeCustomEvents = [];

        if (typeof customEvents === "object") {
            Object.keys(customEvents).forEach(key => {
                if (typeof customEvents[key] === "function" && customEvents[key]({
                    value: fieldValue,
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

    /**
     * Collapse arrays with only one element into a string
     * 
     * @param {Array<string>} arr the array to process
     * @returns {string|Array<string>} the first element of the array or the whole array
     */
    const arrayToStringIfOnlyOneEntry = arr => {
        if (Array.isArray(arr) && arr.length === 1) return arr[0];
        return arr;
    };

    /**
     * Returns true if the field is a collection
     * 
     * @param {string} path the path of the field
     * @returns {boolean} true if the field is a collection
     */
    const isCollectionField = (path) => {
        const pathSplit = path.split(".");
        const secondLastEntry = pathSplit.at(-2);
        const lastChar = secondLastEntry ? secondLastEntry.slice(-1) : "";
        return lastChar === "]";
    };

    /**
     * Returns the parent path of a given path.
     *
     * @param {string} path - The path to extract the parent path from.
     * @return {string} The parent path of the given path.
     */
    const getParentPath = (path) => {
        const pathParts = path.split(".");
        pathParts.pop();
        let newPath = pathParts.join(".");
        const lastChar = newPath.slice(-1);
        if (lastChar === "]") {
            const lastIndex = newPath.lastIndexOf("[");
            newPath = newPath.substring(0, lastIndex);
        }
        return newPath;
    };

    const validateCollection = (event, fieldKey, fieldConfig, newData, errors) => {
        const fieldValidationData = get(newData, fieldKey);

        if (
            fieldConfig.isRequired && 
            (
                !fieldValidationData || 
                fieldValidationData.length === 0 || 
                (fieldValidationData.length === 1 && 
                Object.keys(fieldValidationData[0]).length === 0)
            )
        ) {
            errors[fieldKey] = {
                value: fieldValidationData,
                fieldConfig
            };
        // Collections which are not required will only be checked if data has been added:
        } else {
            if (Array.isArray(fieldConfig.fields)) {
                fieldConfig.fields.forEach(subField => {
                    fieldValidationData && fieldValidationData.forEach((dataEntry, index) => {
                        const arrayFieldPath = `${fieldKey}[${index}].${subField.id}`;

                        // Don't check fields if the collection isn't required and the object is empty:
                        if (!fieldConfig.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                        // Is the data entered valid, check with default field function and optionally with custom validation:
                        const fieldIsValid = isFieldValid(subField, arrayFieldPath, dataEntry, event);

                        if (parsedFields[subField.type] && fieldIsValid !== true) {
                            errors[fieldKey] = {
                                value: fieldValidationData,
                                subField,
                                errorCode: fieldIsValid !== false ? fieldIsValid : undefined
                            };
                        } else if (parsedFields[subField.type] && subField.isUnique) {
                            // Check if field is unique in collection:
                            let collectionData = get(newData, fieldKey, [])
                                .filter(item => typeof item[subField.id] !== "undefined")
                                .map(item => item[subField.id]);
                            
                            const uniqCollectionData = [...new Set(collectionData)];

                            if (uniqCollectionData.length !== collectionData.length) {
                                errors[fieldKey] = {
                                    value: fieldValidationData,
                                    subField,
                                    errorCode: "notUnique"
                                };
                            }
                        }
                    });
                });
            } else {
                // This is a union type collection, so we need to get the validation config inside the types object:
                fieldValidationData && fieldValidationData.forEach((dataEntry, index) => {
                    // Don't check fields if the collection isn't required and the object is empty:
                    if (!fieldConfig.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                    if (fieldConfig.fields[dataEntry.__typename]) {
                        const subFields = fieldConfig.fields[dataEntry.__typename];
                        subFields.forEach(subField => {
                            const arrayFieldPath = `${fieldKey}[${index}].${subField.id}`;

                            // Is the data entered valid, check with default field function and optionally with custom validation:
                            const fieldIsValid = isFieldValid(subField, arrayFieldPath, dataEntry, event);

                            if (parsedFields[subField.type] && fieldIsValid !== true) {
                                errors[fieldKey] = {
                                    value: fieldValidationData,
                                    subField,
                                    errorCode: fieldIsValid !== false ? fieldIsValid : undefined
                                };
                            }
                        });
                    }
                });
            }
        }

        // Check if data is unique if that's a requirement:
        if (fieldConfig.uniqEntries && fieldValidationData) {
            // Add error if collection entries are not unique!
            if (uniqWith(fieldValidationData, (arrVal, othVal) => stringify(arrVal) === stringify(othVal)).length !== fieldValidationData.length) {
                errors[fieldKey] = {
                    value: fieldValidationData,
                    fieldConfig
                };
            }
        }

        // If the collection has rules set, check them against the data:
        if (fieldConfig.rules && typeof fieldConfig.rules === "object" && fieldValidationData) {
            Object.keys(fieldConfig.rules).forEach(ruleField => {
                const rules = fieldConfig.rules[ruleField];
                Object.keys(rules).forEach((value) => {
                    const valueRules = rules[value]; // An object of rules for this field/value combo
                    
                    // Convert fields and values to array, even if they are a primitive value:
                    const ruleFields = ruleField.indexOf(",") > -1 ? ruleField.split(",") : [ruleField];
                    const values = value.indexOf(",") > -1 ? value.split(",") : [value];
                    const fieldValueCombos = getCombosFromTwoArrays(ruleFields, values);

                    let ruleConformsToData = true;

                    /*
                        For rule: "position": { "goalkeeper": { maxCount: 1 } }

                        ruleFields: ["position"]
                        values: ["goalkeeper"] or [] (for calculation on a field)
                        valueRules: { maxCount: 1 }
                        fieldValidationData: collection data array -> [{}, {}, ...]

                        Multiple fields or values can be added, by comma separating them like this: "prename,lastname"
                        Fields can use dot syntax, for nested properties: "coords.lat"
                    */

                    // max occurence of value, example: "position": { "goalkeeper": { maxCount: 1, errorCode: "goalkeeperOne" } }
                    if (valueRules.maxCount && typeof valueRules.maxCount === "number") {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let count = 0;
                            fieldValidationData.forEach(d => get(d, fieldValueCombo[0]) === fieldValueCombo[1] ? count++ : undefined);
                            if (count > valueRules.maxCount) ruleConformsToData = false;
                        });
                    }

                    // min occurence of value, example: "position": { "defender": { minCount: 3, errorCode: "defenderMiminum" } }
                    if (valueRules.minCount && typeof valueRules.minCount === "number") {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let count = 0;
                            fieldValidationData.forEach(d => get(d, fieldValueCombo[0]) === fieldValueCombo[1] ? count++ : undefined);
                            if (count < valueRules.minCount) ruleConformsToData = false;
                        });
                    }

                    // exact occurence of value, example: "position": { "defender": { exactCount: 3 } }
                    if (valueRules.exactCount && typeof valueRules.exactCount === "number") {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let count = 0;
                            fieldValidationData.forEach(d => get(d, fieldValueCombo[0]) === fieldValueCombo[1] ? count++ : undefined);
                            if (count !== valueRules.exactCount) ruleConformsToData = false;
                        });
                    }

                    // same occurence of value as another field, example: "position": { "defender": { sameCountAs: "midfield" } }
                    if (valueRules.sameCountAs && typeof valueRules.sameCountAs === "string") {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let count = 0;
                            let otherValueCount = 0;
                            fieldValidationData.forEach(d => {
                                if (get(d, fieldValueCombo[0]) === fieldValueCombo[1]) count++;
                                if (get(d, fieldValueCombo[0]) === valueRules.sameCountAs) otherValueCount++;
                            });
                            if (count !== otherValueCount) ruleConformsToData = false;
                        });
                    }

                    // same occurence of value as another field, example: "position": { "defender": { differentCountAs: "midfield" } }
                    if (valueRules.differentCountAs && typeof valueRules.differentCountAs === "string") {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let count = 0;
                            let otherValueCount = 0;
                            fieldValidationData.forEach(d => {
                                if (get(d, fieldValueCombo[0]) === fieldValueCombo[1]) count++;
                                if (get(d, fieldValueCombo[0]) === valueRules.differentCountAs) otherValueCount++;
                            });
                            if (count === otherValueCount) ruleConformsToData = false;
                        });
                    }

                    // same sum as, example: "spending": { "": { sameSumAs: "income" } }
                    if (
                        (valueRules.sameSumAs && typeof valueRules.sameSumAs === "string") ||
                        (valueRules.differentSumAs && typeof valueRules.differentSumAs === "string") || 
                        (valueRules.biggerSumAs && typeof valueRules.biggerSumAs === "string") ||
                        (valueRules.smallerSumAs && typeof valueRules.smallerSumAs === "string")
                    ) {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let sum1 = 0;
                            let sum2 = 0;
                            fieldValidationData.forEach(d => {
                                const thisValue1 = Number(get(d, fieldValueCombo[0]));
                                const thisValue2 = Number(get(d, valueRules.sameSumAs || valueRules.differentSumAs || valueRules.biggerSumAs || valueRules.smallerSumAs));
                                if (!isNaN(thisValue1)) sum1 = sum1 + thisValue1;
                                if (!isNaN(thisValue2)) sum2 = sum2 + thisValue2;
                            });
                            if (valueRules.sameSumAs && sum1 !== sum2) ruleConformsToData = false;
                            if (valueRules.differentSumAs && sum1 === sum2) ruleConformsToData = false;
                            if (valueRules.biggerSumAs && sum1 <= sum2) ruleConformsToData = false;
                            if (valueRules.smallerSumAs && sum1 >= sum2) ruleConformsToData = false;
                        });
                    }

                    // Check if multi field value combinations are unique, example: "prename,lastname": { "": { isUnique: true } }
                    if (valueRules.isUnique && ruleFields.length > 0) {
                        const valueCombos = [];
                        let duplicateFound = false;
                        fieldValidationData.forEach(d => {
                            const combo = ruleFields.map(f => get(d, f));
                            valueCombos.forEach(c => {
                                if (isEqual(combo, c)) duplicateFound = true;
                            });
                            valueCombos.push(combo);
                        });
                        if (duplicateFound) ruleConformsToData = false;
                    }

                    // Disallow certain values if something is set, example: "gender": { "ms": { disallow: "mr" } }
                    if (valueRules.disallow) {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let bannedValueFound = false;
                            let searchValueFound = false;
                            fieldValidationData.forEach(d => {
                                if (get(d, fieldValueCombo[0]) === fieldValueCombo[1]) searchValueFound = true;
                                if (Array.isArray(valueRules.disallow)) {
                                    valueRules.disallow.forEach(str => {
                                        if (get(d, fieldValueCombo[0]) === str) bannedValueFound = true;
                                    });
                                } else {
                                    if (get(d, fieldValueCombo[0]) === valueRules.disallow) bannedValueFound = true;
                                }
                            });
                            if (searchValueFound && bannedValueFound) ruleConformsToData = false;
                        });
                    }

                    // Require certain values if something is set, example: "gender": { "ms": { require: "mr" } }
                    if (valueRules.disallow) {
                        fieldValueCombos.forEach(fieldValueCombo => {
                            let requiredValueFound = false;
                            let searchValueFound = false;
                            fieldValidationData.forEach(d => {
                                if (get(d, fieldValueCombo[0]) === fieldValueCombo[1]) searchValueFound = true;
                                if (Array.isArray(valueRules.disallow)) {
                                    valueRules.disallow.forEach(str => {
                                        if (get(d, fieldValueCombo[0]) === str) requiredValueFound = true;
                                    });
                                } else {
                                    if (get(d, fieldValueCombo[0]) === valueRules.disallow) requiredValueFound = true;
                                }
                            });
                            if (searchValueFound && !requiredValueFound) ruleConformsToData = false;
                        });
                    }

                    // Check all custom rule handlers
                    if (ruleConformsToData && typeof customRuleHandlers === "object") {
                        Object.keys(customRuleHandlers).forEach(customRule => {
                            if (typeof valueRules[customRule] !== "undefined" && typeof customRuleHandlers[customRule] === "function") {
                                const result = customRuleHandlers[customRule]({ fieldValueCombos, fieldValidationData, valueRules, get });
                                if (!result) ruleConformsToData = false;
                            }
                        });
                    }

                    if (!ruleConformsToData) {
                        errors[fieldKey] = {
                            value: fieldValidationData,
                            errorCode: valueRules.errorCode || "invalidRule",
                            event
                        };
                    }
                });
            });
        }

        return errors;
    };

    const handleValidation = (event, fieldKey, fieldConfig, activeCustomEvents, newData, errors) => {
        const value = get(newData, fieldKey);
        const isValid = !isReservedType(fieldConfig.type) && parsedFields[fieldConfig.type].validate(value, fieldConfig);
        let newErrors = {...errors};
        delete newErrors[fieldKey];
        let hasNewErrors = false;
        const isGlobalValidationEvent = validateOn.indexOf(event) > -1 || activeCustomEvents.some(r => validateOn.indexOf(r) > -1);

        if (fieldConfig.validation && typeof fieldConfig.validation === "object" && !isReservedType(fieldConfig.type)) {
            Object.keys(fieldConfig.validation).forEach(errorCode => {
                if (errorCode !== "render") {
                    const validationRule = fieldConfig.validation[errorCode];

                    // Regex validation, only global events:
                    if (typeof validationRule === "string" && isGlobalValidationEvent) {
                        const regexRule = new RegExp(validationRule);
                        if (typeof value === "string" && !regexRule.test(value)) {
                            newErrors[fieldKey] = { errorCode, value, event };
                            hasNewErrors = true;
                        }
                    // Function validation, only global events:
                    } else if (typeof validationRule === "function" && isGlobalValidationEvent) {
                        const fieldIsValid = validationRule({
                            value,
                            data: newData,
                            event,
                            interfaceState,
                            fieldConfig,
                            isValid,
                            fieldHasFocus: !!(focusedField && focusedField === fieldKey),
                            fieldIsDirty: typeof dirtyFields[fieldKey] !== "undefined"
                        });
                        if (!fieldIsValid) {
                            newErrors[fieldKey] = { errorCode, value, event };
                            hasNewErrors = true;
                        }
                    // Object validation, events defined in object:
                    } else if (typeof validationRule === "object") {
                        const isFieldValidationEvent = Array.isArray(validationRule.on) && (validationRule.on.indexOf(event) > -1 || activeCustomEvents.some(r => validationRule.on.indexOf(r) > -1));
                        const isValidationEvent = (Array.isArray(validationRule.on) && isFieldValidationEvent) || (!Array.isArray(validationRule.on) && isGlobalValidationEvent);
                        let ruleHasNewErrors = false;
                        if (isValidationEvent) {
                            if (typeof validationRule.check === "string") {
                                const regexRule = new RegExp(validationRule.check);
                                if (typeof value === "string" && regexRule.test(value)) {
                                    newErrors[fieldKey] = { errorCode, value, event };
                                    ruleHasNewErrors = true;
                                }
                            } else if (typeof validationRule.check === "function") {
                                const fieldIsValid = validationRule.check({
                                    value,
                                    data: newData,
                                    event,
                                    interfaceState,
                                    fieldConfig,
                                    isValid,
                                    fieldHasFocus: !!(focusedField && focusedField === fieldKey),
                                    fieldIsDirty: typeof dirtyFields[fieldKey] !== "undefined"
                                });
                                if (!fieldIsValid) {
                                    newErrors[fieldKey] = { errorCode, value, event };
                                    ruleHasNewErrors = true;
                                }
                            }
                        }
                        if (ruleHasNewErrors) {
                            if (Array.isArray(validationRule.then)) {
                                validationRule.then.forEach(thenField => {
                                    const result = handleValidation(event, thenField, getConfigForField(thenField), activeCustomEvents, newData, newErrors);
                                    newErrors = Object.assign({}, newErrors, result.errors);
                                    hasNewErrors = true;
                                });
                            }
                            hasNewErrors = true;
                        }
                    }
                }
            });
        } else if (fieldConfig.type === "collection") {
            const collectionErrors = validateCollection(event, fieldKey, fieldConfig, newData, {});
            if (Object.keys(collectionErrors).length > 0) {
                newErrors = Object.assign({}, newErrors, collectionErrors);
                hasNewErrors = true;
            }
        }
        
        if (!hasNewErrors && !isValid) {
            hasNewErrors = true;
            newErrors[fieldKey] = { errorCode: "required", value, event };
        }

        return { hasNewErrors, newErrors };
    };

    /**
     * Validates all paths for the given event and returns any errors found.
     *
     * @param {string} event - The event to validate paths for
     * @return {object} The errors found during validation
     */
    const validateAllPaths = (event, newData, path) => {
        const activeCustomEvents = getActiveCustomEvents(event, newData || data);
        let allErrors = {};
        let firstErrorField;

        fieldPaths.forEach(fieldPath => {
            if (!path || (path && fieldPath.path.startsWith(path))) {
                const { hasNewErrors, newErrors } = handleValidation(event, fieldPath.path, fieldPath.config, activeCustomEvents, newData || data, allErrors);
                if (hasNewErrors) {
                    allErrors = newErrors;
                    if (!firstErrorField) firstErrorField = fieldPath.path;
                }
            }
        });

        // Jump to the first field which has an error:
        if (firstErrorField && isVisible && event) {
            const element = document.getElementById(firstErrorField);
            if (element && !isElementInViewport(element)) element.scrollIntoView();
        }

        return allErrors;
    };

    /**
     * This function is called on each fields onChange. It will trigger the forms onChange
     * and run the validation on the new data (which is sent to the onChange, as well).
     * 
     * @param {string} fieldKey field path key
     * @param {any} value the new value for this field
     * @param {Object} outsideData the outside data to be processed
     * @param {boolean} syntheticCall true if this is a synthetic call
     */
    const handleChange = (fieldKey, value, outsideData, syntheticCall = false) => {
        if (!isMounted()) return;

        let throttleValidation = false;
        const timestamp = +new Date();
        const fieldConfig = getConfigForField(fieldKey);
        let newValue = value;

        if (!syntheticCall) lastOnChange = timestamp;
        
        let newData = Object.assign({}, outsideData || alldata);
        
        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("change", newData, newValue);

        // Run field transform functions:
        if (fieldConfig.transform && Array.isArray(fieldConfig.transform) && newValue) {
            let transformed = false;
            fieldConfig.transform.forEach((t) => {
                if (isTransformForEvent(t, "change", activeCustomEvents)) {
                    newValue = t.fn(newValue);
                    transformed = true;
                };
            });
            if (transformed) {
                set(newData, fieldKey, newValue);
                limitedOnChange(newData, errors, id, fieldKey);
            }
        }

        if (fieldConfig.cast && typeof fieldConfig.cast.data === "function") newValue = fieldConfig.cast.data(newValue);
        if (fieldConfig.cast && typeof fieldConfig.cast.data === "string") newValue = castValueStrType(newValue, fieldConfig.cast.data);
        if (fieldConfig.cast && Array.isArray(fieldConfig.cast.data)) newValue = castValueStrType(newValue, fieldConfig.cast.data[0], true);

        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Handle change for field "${fieldKey}"`, uniqId);
        if (fieldConfig.isLogged) console.log(`Change event for field "${fieldKey}" with value:`, newValue);

        if (newValue) {
            set(newData, fieldKey, newValue);
        } else {
            // Remove if false, to make sure isDirty is calculated correctly!
            set(newData, fieldKey, undefined);
        }

        // Now run over all computed value fields to recalculate all dynamic data:
        newData = computeValues(newData);

        // prepare the params for the validateOnCallback:
        const validateOnParams = {
            data: get(newData, fieldKey),
            fieldIsDirty: !!dirtyFields[fieldKey],
            fieldConfig,
            fieldHasFocus: !!(focusedField && focusedField === fieldKey)
        };

        if (!syntheticCall) {
            if (lastOnChange === 0 || timestamp - lastOnChange < Number(throttleWait || 400)) {
                if (
                    (!fieldConfig.validateOn && Array.isArray(validateOn) && validateOn.indexOf('throttledChange') > -1) ||
                    (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && fieldConfig.validateOn.indexOf('throttledChange') > -1) || 
                    (!fieldConfig.validateOn && typeof validateOn === "function" && validateOn(validateOnParams).indexOf('throttledChange') > -1) ||
                    (fieldConfig.validateOn && typeof fieldConfig.validateOn === "function" && fieldConfig.validateOn(validateOnParams).indexOf('throttledChange') > -1)
                ) {
                    if (timeoutRef) clearTimeout(timeoutRef);
                    timeoutRef = setTimeout(() => handleChange(fieldKey, value, outsideData, true), throttleWait || 400);
                    throttleValidation = true;
                }
            }
        }

        // Only validate if change or throttledChange or a custom event validation is enabled:
        const { newErrors } = handleValidation(throttleValidation ? "throttledChange" : "change", fieldKey, fieldConfig, activeCustomEvents, newData, errors);

        // Set the isDirty flag and per field object:
        if (initialData) {
            if (!isEqual(get(newData, fieldKey), get(initialData, fieldKey))) {
                dirtyFields[fieldKey] = {
                    oldData: get(initialData, fieldKey),
                    newData: get(newData, fieldKey)
                };
            } else if (typeof dirtyFields[fieldKey] !== "undefined") {
                delete dirtyFields[fieldKey];
            }
            setIsDirty(Object.keys(dirtyFields).length > 0);
            setDirtyFields(dirtyFields);
        }

        // If there are any fields to be cleared, do that now:
        if (fieldConfig.clearFields && (Array.isArray(fieldConfig.clearFields) || typeof fieldConfig.clearFields === "function")) {
            const newOptionsLoaded = Object.assign({}, optionsLoaded);
            const fields = Array.isArray(fieldConfig.clearFields) ? fieldConfig.clearFields : fieldConfig.clearFields({ value: newValue, data: newData, errors: newErrors });
            fields.forEach((field) => {
                set(newData, field, undefined);
                delete newOptionsLoaded[field];
            });
            setOptionsLoaded(newOptionsLoaded);
        }

        // Check if a field has dynamic options which have to be loaded:
        if (Array.isArray(fieldPaths)) {
            fieldPaths.forEach(fieldPath => {
                if (
                    typeof fieldPath.config.compute === "object" &&
                    typeof fieldPath.config.compute.options === "object" &&
                    fieldPath.config.compute.options.events &&
                    fieldPath.config.compute.options.events.indexOf('change') > -1 &&
                    fieldPath.config.compute.options.watchFields &&
                    fieldPath.config.compute.options.watchFields.indexOf(fieldKey) > -1 &&
                    (!fieldConfig.compute.options ||
                    (fieldConfig.compute.options &&
                        optionsLoaded[fieldPath.path] &&
                        optionsLoaded[fieldPath.path].indexOf(get(newData, fieldKey)) > -1) ||
                    !optionsLoaded[fieldPath.path])
                ) {
                    createDynamicOptions(fieldPath.path, fieldPath.config.compute.options, newData);
                }
            });
        }

        // Do we have to sort a collection?
        if (isCollectionField(fieldKey)) {
            const collectionKey = getParentPath(fieldKey);
            const collectionConfig = getConfigForField(collectionKey);
            if (collectionConfig.sort && collectionConfig.sort.by && collectionConfig.sort.by.indexOf(fieldConfig.id) > -1) {
                let collectionData = get(newData, collectionKey, []);
                collectionData = sortBy(collectionData, collectionConfig.sort.by);
                if (collectionConfig.sort.dir === "desc") collectionData = collectionData.reverse();
                set(newData, collectionKey, collectionData);
            }
        }

        limitedOnChange(newData, validateAllPaths("", newData), id, fieldKey);
    };

    /*
        This function is called on each fields onFocus. It is currently used 
        to track which field has focus and what the last field in focus was.
    */
    /**
     * This function is called on each fields onFocus. It is currently used 
     * to track which field has focus and what the last field in focus was.
     * 
     * @param {string} fieldKey path key of the field
     */
    const handleFocus = (fieldKey) => {
        if (!isMounted()) return;

        const fieldConfig = getConfigForField(fieldKey);
        const newData = Object.assign({}, alldata);
        let value = get(newData, fieldKey);

        if (fieldConfig.isLogged) console.log(`Focus event for field "${fieldKey}" with value:`, value);

        setFocusedField(fieldKey);
        setLastFocusedField(fieldKey);

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("focus", newData, value);

        // Run field transform functions:
        if (fieldConfig.transform && Array.isArray(fieldConfig.transform)) {
            let transformed = false;
            fieldConfig.transform.forEach((t) => {
                if (isTransformForEvent(t, "focus", activeCustomEvents)) {
                    value = t.fn(value);
                    transformed = true;
                };
            });
            if (transformed) {
                set(newData, fieldKey, value);
                limitedOnChange(newData, errors, id, fieldKey);
            }
        }

        const { hasNewErrors, newErrors } = handleValidation("focus", fieldKey, fieldConfig, activeCustomEvents, newData, errors);
        if (hasNewErrors) {
            setErrors(newErrors);
            limitedOnChange(newData, newErrors, id, fieldKey);
        }
    };

    /**
     * This function is called on each fields onBlur. It only runs validation 
     * if validation is enabled for blur events.
     * 
     * @param {string} fieldKey path key of the field
     */
    const handleBlur = (fieldKey) => {
        if (!isMounted()) return;

        setFocusedField("");
        const fieldConfig = getConfigForField(fieldKey);
        const newData = Object.assign({}, alldata);
        const autoSavedData = Object.assign({}, alldata);
        let value = get(newData, fieldKey);

        if (fieldConfig.isLogged) console.log(`Blur event for field "${fieldKey}" with value:`, value);

        lastOnChange = 0; // Reset the throttled change, so it starts from fresh again

        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Handle blur for field "${fieldKey}"`, uniqId);

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("blur", newData, value);

        // Run field transform functions:
        if (fieldConfig.transform && Array.isArray(fieldConfig.transform)) {
            let transformed = false;
            fieldConfig.transform.forEach((t) => {
                if (isTransformForEvent(t, "blur", activeCustomEvents)) {
                    value = t.fn(value);
                    transformed = true;
                };
            });
            if (transformed) {
                set(newData, fieldKey, value);
                limitedOnChange(newData, errors, id, fieldKey);
            }
        }

        const { hasNewErrors, newErrors } = handleValidation("blur", fieldKey, fieldConfig, activeCustomEvents, newData, errors);
        if (hasNewErrors) {
            setErrors(newErrors);
            limitedOnChange(newData, newErrors, id, fieldKey);
        }

        // Check if a field has dynamic options which have to be loaded:
        if (Array.isArray(fieldPaths)) {
            fieldPaths.forEach(fieldPath => {
                if (
                    typeof fieldPath.config.compute === "object" && 
                    typeof fieldPath.config.compute.options === "object" && 
                    fieldPath.config.compute.options.events && 
                    fieldPath.config.compute.options.events.indexOf("blur") > -1 && 
                    fieldPath.config.compute.options.watchFields && 
                    fieldPath.config.compute.options.watchFields.indexOf(fieldConfig.id) > -1
                ) {
                    createDynamicOptions(fieldPath.config.id, fieldPath.config.compute.options, newData);
                }
                if (typeof autoSave !== "undefined") {
                    // if autoSave is enabled, but a field has autoSave disabled, remove it from autoSavedData:
                    if (fieldPath.config.disableAutoSave) {
                        unset(autoSavedData, fieldPath.path);
                    }
                }
            });
        }

        addNewUndoEntry(newData);

        // Auto save data if enabled:
        if (typeof autoSave !== "undefined") {
            if (autoSave === "local" || autoSave === "session") {
                const currentErrors = validateAllPaths("", newData);
                if (Object.keys(currentErrors).length === 0) saveDataToStorage(id, { data: autoSavedData, isDirty, dirtyFields }, autoSave);
            } else if (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")) {
                const currentErrors = validateAllPaths("", newData);
                if ((autoSave.validDataOnly && Object.keys(currentErrors).length === 0) || !autoSave.validDataOnly) {
                    saveDataToStorage(id, { data: autoSavedData, isDirty, dirtyFields }, autoSave.type);
                }
            } else if (typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.save === "function") {
                const currentErrors = validateAllPaths("", newData);
                if ((autoSave.validDataOnly && Object.keys(currentErrors).length === 0) || !autoSave.validDataOnly) {
                    autoSave.save(id, { data: autoSavedData, isDirty, dirtyFields });
                }
            }
        }
        
    };

    /**
     * Create the rendered fields object, which contain the correct React components together
     * with the correct data in them.
     * 
     * @return {object} An object of rendered fields, with each field represented as a React component.
     */
    const createRenderedFields = (startPath) => {
        const renderedFields = {};
        const notRenderedPaths = [];

        const createField = (fieldConfig, fieldData, path) => {
            let isInsideHiddenPath = false;
            notRenderedPaths.forEach(nrp => {
                if (path.startsWith(nrp)) isInsideHiddenPath = true;
            });
            if (isInsideHiddenPath) return null;
            if (!parsedFields[fieldConfig.type] && fieldConfig.type !== "subform" && fieldConfig.type !== "group") return null;
            if (typeof fieldConfig.isRendered === "function" && !fieldConfig.isRendered({ path, value: fieldData, data: alldata, interfaceState })) {
                if (fieldConfig.type === "group") notRenderedPaths.push(path);
                return null;
            }
            if (fieldConfig.type === "group") return null;

            const cleanedField = Object.assign({}, fieldConfig);
            cleanedField.id = path;

            if (optionsLoaded[path]) {
                cleanedField.options = optionsLoaded[path];
            } else if (typeof cleanedField.options === "function") {
                cleanedField.options = cleanedField.options({ path, value: fieldData, data: alldata });
            } else if (typeof cleanedField.compute === "object" && typeof cleanedField.compute.options === "function") {
                cleanedField.options = cleanedField.compute.options({ path, value: fieldData, data: alldata });
            } else if (typeof cleanedField.compute === "object" && typeof cleanedField.compute.options === "object") {
                // Compute options from the data of a collection:
                let options = get(data, cleanedField.compute.options.source, []);
                let fieldValue = get(alldata, path);

                if (typeof cleanedField.compute.options.filter === "function") options = options.filter(cleanedField.compute.options.filter);
                if (typeof cleanedField.compute.options.sort === "function") options = options.sort(cleanedField.compute.options.sort);
                if (typeof cleanedField.compute.options.map === "function") options = options.map(cleanedField.compute.options.map);
                if (cleanedField.compute.options.initWith && Array.isArray(cleanedField.compute.options.initWith)) options = cleanedField.compute.options.initWith.concat(options);
                
                // If isUnique is set on this field, than disable all already selected options from other items in the collection:
                if (fieldConfig.isUnique) {
                    options = options.map(option => {
                        if (option.value === "") return option;
                        const collectionPath = path.substring(0, path.lastIndexOf("["));
                        let collectionData = get(data, collectionPath, []);
                        const dataIndex = findIndex(collectionData, { [fieldConfig.id]: option.value });
                        if (dataIndex > -1 && option.value !== fieldValue) return {...option, disabled: true};
                        return option;
                    });
                }

                cleanedField.options = options;
                
                if (!find(options, { value: fieldValue })) {
                    cleanedField.value = "";
                    set(alldata, path, "");
                }
            }

            // If placeholder is an array, pick one randomly
            if (cleanedField.placeholder && Array.isArray(cleanedField.placeholder) && cleanedField.placeholder.length > 1) {
                if (typeof chosenPlaceholders[path] === "undefined") {
                    chosenPlaceholders[path] = cleanedField.placeholder[Math.floor(Math.random() * cleanedField.placeholder.length)];
                }
                cleanedField.placeholder = chosenPlaceholders[path];
            }

            // If this field has a custom error renderer:
            if (fields[fieldConfig.type] && typeof fields[fieldConfig.type].errorRenderer === "function") {
                cleanedField.errorRenderer = fields[fieldConfig.type].errorRenderer;
            }

            // If this field type has a global custom error renderer:
            if (typeValidations[fieldConfig.type] && typeof typeValidations[fieldConfig.type].errorRenderer === "function") {
                cleanedField.errorRenderer = typeValidations[fieldConfig.type].errorRenderer;
            }
            
            // If this errorCode has a custom error renderer:
            if (errors[path] && errors[path].errorCode && fieldConfig.validation && fieldConfig.validation[errors[path].errorCode] && typeof fieldConfig.validation[errors[path].errorCode].render === "function") {
                cleanedField.errorRenderer = fieldConfig.validation[errors[path].errorCode].render;
            }

            // If this field has a pending async validation, set isValidationg to true
            if (pendingAsyncValidations && pendingAsyncValidations[path]) cleanedField.isValidating = true;

            const castValue = value => {
                if (fieldConfig.cast && typeof fieldConfig.cast.field === "function") return fieldConfig.cast.field(value);
                if (fieldConfig.cast && typeof fieldConfig.cast.field === "string") return castValueStrType(value, fieldConfig.cast.field);
                if (fieldConfig.cast && Array.isArray(fieldConfig.cast.field)) return castValueStrType(value, fieldConfig.cast.field[0], true);
                return value;
            };

            // Each prop can be a dynamic property, by a naming convention. We need to loop through all props to find them.
            // Convention is that xxxFn becomes xxx after executing the function with the current Form state.
            if (!isReservedType(fieldConfig.type)) {
                Object.keys(cleanedField).forEach(prop => {
                    if (prop !== "id" && typeof cleanedField[prop] === "function" && prop.endsWith("Fn")) {
                        cleanedField[prop.substring(0, prop.length - 2)] = cleanedField[prop]({ path, value: fieldData, data: alldata, interfaceState, config: fieldConfig });
                        delete cleanedField[prop];
                    }
                });
            }

            if (fieldConfig.type === "fieldset") {
                return null;
            }

            // Map all field props to their new names or delete them if not set:
            if (parsedFields[cleanedField.type] && parsedFields[fieldConfig.type].props) {
                Object.keys(cleanedField).forEach(key => {
                    const newKey = parsedFields[fieldConfig.type].props[key];
                    if (
                        typeof newKey === "undefined"
                    ) {
                        delete cleanedField[key];
                    } else if (typeof newKey === "string" && key !== newKey) {
                        cleanedField[newKey] = cleanedField[key];
                        delete cleanedField[key];
                    } else if (typeof newKey === "function") {
                        cleanedField[key] = newKey(cleanedField[key]);
                    }
                });
            }
            
            if (fieldConfig.type !== "subform") {
                return React.createElement(
                    parsedFields[fieldConfig.type].component,
                    Object.assign({}, cleanedField, {
                        key: path,
                        value: typeof parsedFields[fieldConfig.type].transform === "function" ? parsedFields[fieldConfig.type].transform(castValue(fieldData)) : castValue(fieldData),
                        initialValue: typeof parsedFields[fieldConfig.type].transform === "function" ? parsedFields[fieldConfig.type].transform(get(initialData, path)) : get(initialData, path),
                        error: errors[path],
                        isDirty: !!dirtyFields[path],
                        isDisabled: isDisabled || fieldConfig.isDisabled,
                        hasFocus: !!(focusedField && focusedField === path),
                        onChange: value => handleChange(path, value),
                        onFocus: () => handleFocus(path),
                        onBlur: () => handleBlur(path)
                    })
                );
            } else {
                return (
                    <Form
                        config={fieldConfig.config}
                        render={({ props }) => React.createElement(fieldConfig.render, props)}
                        fields={fields}
                        id={path}
                        onChange={(value, subErrors) => handleChange(path, value)}
                        onValidation={errors => handleSubValidation(path, errors)}
                        parentRunValidation={runValidation}
                        data={alldata && get(alldata, path)}
                        isVisible={isVisible}
                        isDisabled={isDisabled}
                        validateOn={validateOn}
                    />
                );
            } 
        };

        fieldPaths.forEach(fieldPath => {
            if (startPath && !fieldPath.path.startsWith(`${startPath}.`)) return;

            if (fieldPath.config.type === "fieldset" && fieldsets[fieldPath.config.fieldset]) {
                // Fieldsets need to be rendered here, with the render function from the fieldset:
                const fieldsetFields = createRenderedFields(fieldPath.path);
                set(renderedFields, fieldPath.path, fieldsets[fieldPath.config.fieldset].render({
                    params: computeFieldsetParams(fieldPath.config.params || {}, fieldsets[fieldPath.config.fieldset].params),
                    fields: get(fieldsetFields, fieldPath.path),
                    onCollectionAction,
                    onWizardNav,
                    getWizardNavHash,
                    isWizardStepActive,
                    isWizardStepDisabled,
                    modifyConfig,
                    data,
                    interfaceState,
                    errors,
                    asyncData,
                    isDirty,
                    focusedField,
                    lastFocusedField,
                    dirtyFields,
                    get,
                    getConfig,
                    handleActionClick,
                    handleUndo,
                    handleRedo,
                    isDisabled,
                    silentlyGetValidationErrors
                }));
            } else {
                // Regular fields:
                const fieldComponent = createField(fieldPath.config, fieldPath.data, fieldPath.path);
                if (fieldComponent) set(renderedFields, fieldPath.path, fieldComponent);
            }
        });

        return renderedFields;
    };

    /**
     * This function handles adding and removing collection entries. It is
     * called by the forms render method.
     * 
     * @param {string} fieldKey the key for the field the collection belongs to
     * @param {string} action the type of action to perform on the collection
     * @param {number|string} index the index of the collection entry to perform the action on, or a string index if the collection is a union type
     * @param {number|string} toIndex the index to move the entry to when the action is "move"
     */
    const onCollectionAction = (fieldKey, action, index, toIndex) => {
        if (!isMounted()) return;

        const newData = Object.assign({}, alldata);
        const field = getConfigForField(fieldKey);
        const minEntries = field && field.min ? Number(field.min) : 0;
        const maxEntries = field && field.max ? Number(field.max) : 99999999999999; // easiest to just add an impossible high number
        let updatedCollection = get(newData, fieldKey, []);
        let collectionIsUpdated = false;
        if (index === "last") index = updatedCollection.length - 1;
        if (toIndex === "last") toIndex = updatedCollection.length - 1;

        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`On collection action "${fieldKey}"`, uniqId);

        // This will add a new entry to the collection:
        if (action === "add") {
            if (typeof index === "string" && field.fields[index]) {
                // This is a union type collection, we're adding a specific entry:
                if (maxEntries > updatedCollection.length) {
                    if (typeof field.setInitialData === "function") {
                        updatedCollection.push(field.setInitialData(updatedCollection, newData, index));
                    } else {
                        updatedCollection.push({__typename: index});
                    }
                }
            } else {
                if (maxEntries > updatedCollection.length) {
                    if (typeof field.setInitialData === "function") {
                        updatedCollection.push(field.setInitialData(updatedCollection, newData));
                    } else {
                        updatedCollection.push({});
                    }
                }
            }
            collectionIsUpdated = true;
        }

        // This will remove a specific entry in the collection:
        if (action === "remove") {
            if (minEntries < updatedCollection.length) updatedCollection.splice(index, 1);
            collectionIsUpdated = true;
        }

        // This action will move a certain entry from one index to another index, which is very useful with 
        // react-beautiful-dnd
        if (action === "move" && typeof index === "number" && typeof toIndex === "number" && index > -1 && toIndex > -1) {
            const [removed] = updatedCollection.splice(index, 1);
            updatedCollection.splice(toIndex, 0, removed);
            collectionIsUpdated = true;
        }

        // This action uses Lodash sortBy to sort the collection:
        if (action === "sort" && updatedCollection.length > 0 && index) {
            updatedCollection = sortBy(updatedCollection, index);
            collectionIsUpdated = true;
        }

        // This action duplicates a specific collection entry:
        if (action === "duplicate" && typeof index === "number" && index > -1) {
            updatedCollection.splice(index+1, 0, Object.assign({}, updatedCollection[index]));
            collectionIsUpdated = true;
        }

        if (field.sort && field.sort.by) {
            updatedCollection = sortBy(updatedCollection, field.sort.by);
            if (field.sort.dir === "desc") updatedCollection = updatedCollection.reverse();
            collectionIsUpdated = true;
        }

        // Use this one if you manually updated the collection and want Stages to recalculate isDirty and validations:
        if (action === "update" && Array.isArray(index)) {
            collectionIsUpdated = true;
            set(newData, fieldKey, index);
        } else {
            set(newData, fieldKey, updatedCollection);
        }

        if (collectionIsUpdated) {
            const oldCollectionData = get(initialData, fieldKey);
            const newCollectionData = get(newData, fieldKey);
            try {
                if (JSON.stringify(oldCollectionData) !== JSON.stringify(newCollectionData)) {
                    setIsDirty(true);
                    dirtyFields[fieldKey] = {
                        oldData: oldCollectionData,
                        newData: newCollectionData
                    }
                    setDirtyFields(dirtyFields);
                } else {
                    delete dirtyFields[fieldKey];
                    Object.keys(dirtyFields).forEach(key => {
                        if (key.startsWith(fieldKey)) delete dirtyFields[key];
                    });
                    setDirtyFields(dirtyFields);
                    setIsDirty(Object.keys(dirtyFields).length > 0);
                }
            } catch (e) {}
        }

        const activeCustomEvents = getActiveCustomEvents("collectionAction", data);

        const { hasNewErrors, newErrors } = handleValidation("collectionAction", fieldKey, field, activeCustomEvents, data, errors);
        if (hasNewErrors) {
            setErrors(newErrors);
        }

        limitedOnChange(newData, newErrors || validateAllPaths(""), id, fieldKey);
    };

    const onWizardNav = (navType, path, stage) => {
        const newActiveStages = {...activeStages};
        const currentStage = newActiveStages[path];
        const fieldConfig = getConfigForField(path);

        if (navType === "step") newActiveStages[path] = stage;

        if (navType === "next") {
            // Find the next step and set it active:
            const nextIndex = findIndex(fieldConfig.stages, { id: currentStage }) + 1;
            if (fieldConfig.stages[nextIndex]) {
                newActiveStages[path] = fieldConfig.stages[nextIndex].id;
            }
        }

        if (navType === "prev") {
            // Find the previous step and set it active:
            const prevIndex = findIndex(fieldConfig.stages, { id: currentStage }) - 1;
            if (fieldConfig.stages[prevIndex]) {
                newActiveStages[path] = fieldConfig.stages[prevIndex].id;
            }
        }

        if (navType === "first") {
            // Find the first step and set it active:
            newActiveStages[path] = fieldConfig.stages[0].id;
        }

        if (navType === "last") {
            // Find the last step and set it active:
            newActiveStages[path] = fieldConfig.stages[fieldConfig.stages.length - 1].id;
        }

        setActiveStages(newActiveStages);
    };

    const getWizardNavHash = (path, stage, action = "step") => {
        const currentStage = activeStages[path];
        const fieldConfig = getConfigForField(path);
        const hashes = [];

        if (action === "step" || action === "first" || action === "last") {
            Object.keys(activeStages).forEach(key => {
                if (key.startsWith(path)) {
                    if (action === "step") hashes.push(`${key}.${stage}`);
                    if (action === "first") hashes.push(`${key}.${fieldConfig.stages[0].id}`);
                    if (action === "last") hashes.push(`${key}.${fieldConfig.stages[fieldConfig.stages.length - 1].id}`);
                } else {
                    hashes.push(`${key}.${activeStages[key]}`);
                }
            });
            return `#!${hashes.join(hashSeparator || ":")}`;
        }

        if (action === "prev") {
            const prevIndex = findIndex(fieldConfig.stages, { id: currentStage }) - 1;
            if (fieldConfig.stages[prevIndex]) {
                Object.keys(activeStages).forEach(key => {
                    if (key.startsWith(path)) {
                        hashes.push(`${key}.${fieldConfig.stages[prevIndex].id}`);
                    } else {
                        hashes.push(`${key}.${activeStages[key]}`);
                    }
                });
                return `#!${hashes.join(hashSeparator || ":")}`;
            }
            return false;
        }

        if (action === "next") {
            const nextIndex = findIndex(fieldConfig.stages, { id: currentStage }) + 1;
            if (fieldConfig.stages[nextIndex]) {
                Object.keys(activeStages).forEach(key => {
                    if (key.startsWith(path)) {
                        hashes.push(`${key}.${fieldConfig.stages[nextIndex].id}`);
                    } else {
                        hashes.push(`${key}.${activeStages[key]}`);
                    }
                });
                return `#!${hashes.join(hashSeparator || ":")}`;
            }
            return false;
        }

        return false;
    };

    const isWizardStepActive = (path, stage) => {
        return activeStages[path] === stage;
    };

    const isWizardStepDisabled = (path, hash, disableIfActive = false) => {
        // Depending on validation rules, a step can be disabled
        const hashesSplit = hash.substring(2).split(hashSeparator || ":");
        let stage = "";
        hashesSplit.forEach(hash => {
            if (hash.startsWith(`${path}.`)) stage = hash.substring(path.length + 1);
        });
        if (stage) {
            const fieldConfig = getConfigForField(path);
            const thisIndex = findIndex(fieldConfig.stages, { id: stage });
            const activeIndex = findIndex(fieldConfig.stages, { id: activeStages[path] });

            // Only advance one step at a time:
            if (thisIndex > activeIndex + 1) return true;

            // if "disableIfActive" is "true", disable the step if it's active:
            if (disableIfActive && isWizardStepActive(path, stage)) return true;

            // Only advance if all previous steps are valid:
            for (let i = 0; i < thisIndex; i++) {
                const thisErrors = validateAllPaths("", data, `${path}.${fieldConfig.stages[i].id}`);
                if (Object.keys(thisErrors).length > 0) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * This adds a specific config to the field configuration at a certain path
     * 
     * @param {string} path The path to the field config which should be modified
     * @param {string} configKey The key of the `fieldsets` property to modify
     * @param {string} action The action to perform on the `fieldsets` property
     */
    const modifyConfig = (path, configKey, action) => {
        if (config.fieldsets && typeof config.fieldsets[configKey] === "function") {
            const pathParts = path.split(".");
            let configPath = "";

            pathParts.forEach(pathPart => {
                const thisConfig = configPath ? get(parsedFieldConfig, configPath) : parsedFieldConfig;
                if (pathPart.endsWith("]")) {
                    const pathPartSplit = pathPart.split("[");
                    const realPathPart = pathPartSplit[0];
                    const configIndex = findIndex(thisConfig, { id: realPathPart });
                    if (configIndex > -1) configPath += `[${configIndex}].fields`;
                } else {
                    const configIndex = findIndex(thisConfig, { id: pathPart });
                    if (configIndex > -1) configPath += `[${configIndex}].fields`;
                }
            });

            if (configPath !== "") {
                modifiedConfigs.push({
                    fields: config.fieldsets[configKey],
                    path: configPath,
                    action
                });
                setModifiedConfigs([...modifiedConfigs]);
            }
        }
    };

    /**
     * The function is called by the forms action buttons. It either runs the validation
     * or just the supplied callback.
     * 
     * @param {function} callback function called if no validation errors
     * @param {boolean} validate  whether to run validation or not
     * @param {boolean} reset whether to reset back to initial data or not
     */
    const handleActionClick = (callback, validate, reset) => {
        // @ts-ignore
        if (isDebugging()) window.stagesLogging(`Handle action click`, uniqId);

        // If this is a reset action, we reset back to the initial data:
        if (reset) {
            if (autoSave === "local" || autoSave === "session") removeDataFromStorage(id, autoSave);
            if (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")) {
                removeDataFromStorage(id, autoSave.type);
            }
            if (id && typeof autoSave === "object" && autoSave.type === "custom" && typeof autoSave.remove === "function") {
                autoSave.remove(id);
            }
            limitedOnChange(initialData, validateAllPaths(""), id);
            setDirtyFields({});
            setIsDirty(false);
        }

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("action", alldata);
        let suppressCallback = false;

        fieldPaths.forEach(fieldPath => {
            let value = fieldPath.data;
            // Run field transform functions:
            if (fieldPath.config.transform && Array.isArray(fieldPath.config.transform)) {
                let transformed = false;
                fieldPath.config.transform.forEach((t) => {
                    if (isTransformForEvent(t, "action", activeCustomEvents)) {
                        value = t.fn(value);
                        transformed = true;
                    };
                });
                if (transformed) {
                    const newData = Object.assign({}, alldata);
                    set(newData, fieldPath.path, value);
                    limitedOnChange(newData, errors, id, fieldPath.path);
                }
            }
        });

        // Only validate if action validation is enabled (which is the default):
        if (
            (Array.isArray(validateOn) && validateOn.indexOf("action") > -1) || 
            (Array.isArray(validateOn) && activeCustomEvents.some(r=> validateOn.indexOf(r) > -1))
        ) {
            if (validate) {
                setRunValidation(true);
                setTimeout(() => setRunValidation(false), 0);
            }
            let errors = validate ? validateAllPaths("action") : {};
            setErrors(errors);
            if (Object.keys(errors).length > 0) suppressCallback = true;
        }

        if (!suppressCallback) callback();
    };

    const updateData = (data) => {
        limitedOnChange(data, validateAllPaths(""), id);

        // We need to recalculate dirty fields!
        let newIsDirty = false;
        let newDirtyFields = {};
        fieldPaths.forEach(fieldPath => {
            if (!(typeof fieldPath.config.value === "object" &&fieldPath.config.value.isInternal)) {
                const newPathData = get(data, fieldPath.path);
                const initialPathData = get(initialData, fieldPath.path);
                if (newPathData !== initialPathData) {
                    newIsDirty = true;
                    if (typeof newPathData !== "undefined") {
                        newDirtyFields[fieldPath.path] = { oldData: initialPathData, newData: newPathData };
                    }
                }
            }
        });
        setIsDirty(newIsDirty);
        setDirtyFields(newDirtyFields);
    };

    const getConfig = (path) => {
        const fieldPath = find(fieldPaths, { path: path });
        return fieldPath ? fieldPath.config : undefined;
    };

    // If the form isn't visible, render nothing (this is needed for the Wizards step validation):
    if (isVisible === false) return null;

    // Render all the render props:
    return render ? render({
        handleActionClick,
        handleUndo,
        handleRedo,
        isDisabled: pendingAsyncValidations && Object.keys(pendingAsyncValidations).length > 0 ? true : isDisabled,
        isDirty,
        focusedField,
        lastFocusedField,
        dirtyFields,
        silentlyGetValidationErrors,
        updateData,
        fields: createRenderedFields(),
        onCollectionAction,
        onWizardNav,
        getWizardNavHash,
        isWizardStepActive,
        isWizardStepDisabled,
        modifyConfig,
        data,
        interfaceState,
        errors,
        asyncData,
        get,
        getConfig,
        loading
    }) : renderFields ? renderFields(createRenderedFields()) : null;
};

Form.propTypes = {
    //** @type {Object} The form configuration, can be a function or an object describing all fields */
    config: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]).isRequired,
    //** @type {Object} The form data, which sould come from React state and be udated from the onChange callback */
    data: PropTypes.object,
    //** @type {React.ReactElement|Function} The render function which renders all the forms fields */
    render: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    //** @type {React.ReactElement|Function} The simplified render function which renders only the forms fields */
    renderFields: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    //** @type {Object} An object containing all the possible fields */
    fields: PropTypes.object.isRequired,
    //** @type {Function} A callback which is called when data has been changed. This should update the Form data. */
    onChange: PropTypes.func,
    //** @type {boolean} Whether the form is visible */
    isVisible: PropTypes.bool,
    //** @type {boolean} Whether the form is disabled */
    isDisabled: PropTypes.bool,
    //** @type {string|number} The forms id. Will be displayed in the debugger and is used for the data key in a wizard */
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    //** @type {Function} A callback which is called when the form is being validated */
    onValidation: PropTypes.func,
    //** @type {boolean} Whether the form is being validated */
    parentRunValidation: PropTypes.bool,
    //** @type {string[]} An array of events on when to run validation */
    validateOn: PropTypes.array,
    //** @type {Object} Custom collection rule handlers */
    customRuleHandlers: PropTypes.object,
    //** @type {number} The maximum depth of undo steps */
    undoMaxDepth: PropTypes.number,
    //** @type {Object} Global per type based custom validations */
    typeValidations: PropTypes.object,
    //** @type {Object} Definition for fieldsets containing fields config and a render function for multiple fields */
    fieldsets: PropTypes.object,
    //** @type {Object} The initial value for the forms interface state */
    initialInterfaceState: PropTypes.object,
    //** @type {boolean} Whether the form should clean up stale data if the config changes */
    cleanUpData: PropTypes.bool
};

Form.defaultProps = {
    data: {},
    onChange: () => {},
    isVisible: true,
    isDisabled: false,
    validateOn: ["action"],
    customRuleHandlers: {},
    undoMaxDepth: 10,
    autoSave: false,
    typeValidations: {},
    fieldsets: {},
    initialInterfaceState: {},
    cleanUpData: false
};

export default Form;