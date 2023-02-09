import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import find from "lodash.find";
import sortBy from "lodash.sortby";
import findIndex from "lodash.findindex";
import uniqWith from "lodash.uniqwith";
import isEqual from "lodash.isequal";
import get from "lodash.get";
import set from "lodash.set";
import unset from "lodash.unset";
import merge from "lodash.merge";
import stringify from "fast-json-stable-stringify";

import { getDataFromStorage, saveDataToStorage, removeDataFromStorage } from "../utils/storage";
import { isElementInViewport, isDebugging } from "../utils/browser";

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

const getCombosFromTwoArrays = (arr1 = [], arr2 = []) => {
    const res = [];

    arr1.forEach(arr1Item => {
        arr2.forEach(arr2Item => {
            res.push([arr1Item, arr2Item]);
        });
    });

    return res;
 };

const getFieldPaths = (fieldConfig, data) => {
    const paths = [];

    const getPathsForPath = (path = "", renderPath) => {
        let thisConfigs = [path ? get(fieldConfig, path) : fieldConfig];
        let thisKeys = [];
        if (!Array.isArray(thisConfigs[0])) {
            thisKeys = Object.keys(thisConfigs[0]);
            thisConfigs = Object.values(thisConfigs[0]);
        }
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
                    } else if (item.type === "group") {
                        getPathsForPath(`${path}[${index}].fields`, itemRenderPath);
                    }
                });
            }
        });
    }

    getPathsForPath();

    return paths;
};

const parseConfig = (config, data, asyncData, interfaceState, modifiedConfigs) => {
    let parsedConfig = typeof config.fields === "function" ? config.fields(data, asyncData, interfaceState) : [];

    const parseConfigItem = configItem => {
        if (typeof configItem === "string" && config.fieldConfigs && typeof config.fieldConfigs[configItem] === "function") {
            return config.fieldConfigs[configItem](data, asyncData, interfaceState);
        } else if (typeof configItem === "function") {
            return configItem(data, asyncData, interfaceState);
        }
        return configItem;
    };

    parsedConfig = parsedConfig.map(configItem => {
        if (typeof configItem === "object" && (configItem.type === "group" || configItem.type === "collection") && Array.isArray(configItem.fields)) {
            configItem.fields = configItem.fields.map(field => parseConfigItem(field));
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

const latestOptionsRequestIDsPerField = {}; // Used to prevent race conditions in options loaders

let lastOnChange = 0; // Used to throttle onChange validations
let timeoutRef; // Timeout ref used to throttle onChange validations

let lastOnChangeData; // Used to prevent unnessesary onChange callbacks

const chosenPlaceholders = {}; 

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
    customEvents,
    enableUndo,
    undoMaxDepth,
    customRuleHandlers,
    autoSave
}) => {
    // First we need to merge interfaceData with form data, whithout muting form data:
    const [interfaceState, setInterfaceState] = useState({});
    const alldata = Object.assign({}, data);
    merge(alldata, interfaceState);

    // Now we can setup all state:
    const [uniqId] = useState(`form-${id || "noid"}-${+ new Date()}`);
    const [isDirty, setIsDirty] = useState(false);
    const [dirtyFields, setDirtyFields] = useState({});
    const [initialData, setInitialData] = useState(false);
    const [undoData, setUndoData] = useState([]);
    const [activeUndoIndex, setActiveUndoIndex] = useState(0);
    const [runValidation, setRunValidation] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState({});
    const [optionsCache, setOptionsCache] = useState({});
    const [asyncData, setAsyncData] = useState();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState();
    const [lastFocusedField, setLastFocusedField] = useState();
    const [modifiedConfigs, setModifiedConfigs] = useState([]);

    // Lastly, we craete the actual objects we will work with:
    const parsedFieldConfig = parseConfig(config, alldata, asyncData, interfaceState, modifiedConfigs);
    const fieldPaths = getFieldPaths(parsedFieldConfig, alldata);

    // Save the initial data so we can compare it to the current data so we can decide if a form is dirty:
    useEffect(() => {
        if (data && !initialData) {
            if (isDebugging()) window.stagesLogging("Set initial data", uniqId);

            // Scan through the fieldPaths to find fields with default data:
            fieldPaths.forEach(fieldPath => {
                if (typeof fieldPath.config.defaultValue !== "undefined") {
                    const originalData = get(data, fieldPath.path);
                    if (typeof originalData === "undefined") {
                        const defaultValue = typeof fieldPath.config.defaultValue === "function" ? fieldPath.config.defaultValue(data) : fieldPath.config.defaultValue;
                        set(data, fieldPath.path, defaultValue);
                        set(alldata, fieldPath.path, defaultValue);
                    }
                }
            });

            const stringifiedData = stringify(data);
            setInitialData(JSON.parse(stringifiedData));

            // If autosave is enabled, read the data and trigger an onChange with it:
            if (autoSave === "local" || autoSave === "session" || (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session"))) {
                const savedData = getDataFromStorage(id, typeof autoSave === "object" ? autoSave.type : autoSave);
                if (Object.keys(savedData).length > 0) {
                    setTimeout(() => {
                        setIsDirty(!!savedData.isDirty);
                        setDirtyFields(typeof savedData.dirtyFields === "object" ? savedData.dirtyFields : {});
                        limitedOnChange(savedData.data, validationErrors(false, savedData.data), id);
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
            if (autoSave === "local" || autoSave === "session" || (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session"))) {
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
                    savedData: getDataFromStorage(id, typeof autoSave === "object" ? autoSave.type : autoSave)
                });
            } else {
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
                    savedData: {}
                });
            } 
        }
    }, [data, errors, isDirty, focusedField, lastFocusedField, dirtyFields, loading]);

    // Helper function to detect reserved field types:
    const isReservedType = type => type === "collection" || type === "subform" || type === "group" || type === "config";

    // Is a specific field valid based on current data:
    const isFieldValid = (fieldKey, field, fieldData, triggeringEvent) => {
        if (!fields[field.type]) return true;
        const thisData = get(fieldData, fieldKey);
        const isValid = !isReservedType(field.type) && fields[field.type].isValid(thisData, field);
        return !isReservedType(field.type) && field.customValidation ? field.customValidation({
            data: thisData,
            allData: fieldData,
            interfaceState,
            fieldConfig: field,
            isValid,
            fieldHasFocus: !!(focusedField && focusedField === fieldKey),
            fieldIsDirty: typeof dirtyFields[fieldKey] !== "undefined",
            triggeringEvent
        }) : isValid;
    };

    /*
        This function is used to validate one single field. It returns the updated error and firstErrorField object
    */
    const validateField = (fieldKey, triggeringEvent, validationData, errors, firstErrorField) => {
        const field = find(fieldPaths, { path: fieldKey }).config;
        if (isDebugging()) window.stagesLogging(`Validate field "${fieldKey}"`, uniqId);

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
        } else if (
            field.type === "collection" && 
            field.isRequired && 
            (
                !fieldValidationData || 
                fieldValidationData.length === 0 || 
                (fieldValidationData.length === 1 && 
                Object.keys(fieldValidationData[0]).length === 0)
            )
        ) {
            if (!firstErrorField) firstErrorField = fieldKey;
            errors[fieldKey] = {
                value: fieldValidationData,
                field
            };
        // Collections which are not required will only be checked if data has been added:
        } else if (field.type === "collection") {
            if (Array.isArray(field.fields)) {
                field.fields.forEach(subField => {
                    fieldValidationData && fieldValidationData.forEach((dataEntry) => {
                        // Don't check fields if the collection isn't required and the object is empty:
                        if (!field.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                        // Is the data entered valid, check with default field function and optionally with custom validation:
                        const fieldIsValid = isFieldValid(subField, dataEntry, triggeringEvent);

                        if (fields[subField.type] && fieldIsValid !== true) {
                            errors[fieldKey] = {
                                value: fieldValidationData,
                                subField,
                                errorCode: fieldIsValid !== false ? fieldIsValid : undefined
                            };
                        } else if (fields[subField.type] && subField.isUnique) {
                            // Check if field is unique in collection:
                            let collectionData = get(validationData, fieldKey, [])
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
                fieldValidationData && fieldValidationData.forEach((dataEntry) => {
                    // Don't check fields if the collection isn't required and the object is empty:
                    if (!field.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                    if (field.fields[dataEntry.__typename]) {
                        const subFields = field.fields[dataEntry.__typename];
                        subFields.forEach(subField => {
                            // Is the data entered valid, check with default field function and optionally with custom validation:
                            const fieldIsValid = isFieldValid(subField, dataEntry, triggeringEvent);

                            if (fields[subField.type] && fieldIsValid !== true) {
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
        if (field.type === "collection" && field.uniqEntries && fieldValidationData) {
            // Add error if collection entries are not unique!
            if (uniqWith(fieldValidationData, (arrVal, othVal) => stringify(arrVal) === stringify(othVal)).length !== fieldValidationData.length) {
                errors[fieldKey] = {
                    value: fieldValidationData,
                    field
                };
            }
        }

        // If the collection has rules set, check them against the data:
        if (field.type === "collection" && field.rules && typeof field.rules === "object" && fieldValidationData) {
            Object.keys(field.rules).forEach(ruleField => {
                const rules = field.rules[ruleField];
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
                            field,
                            errorCode: valueRules.errorCode || "invalidRule"
                        };
                    }
                });
            });
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

        if (!validationData) validationData = alldata;

        fieldPaths.forEach(fieldPath => {
            if (!fields[fieldPath.config.type] && !isReservedType(fieldPath.config.type)) return;
            const result = validateField(fieldPath.path, "action", validationData, errors, firstErrorField);
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
    const createDynamicOptions = async (fieldKey, optionsConfig, updatedData) => {
        if (optionsConfig.loader && typeof optionsConfig.loader === "function") {
            const cacheKeyValues = {};
            let cacheKey;
            let options;

            // Variables used to prevent race conditions with the async options calls:
            const newNr = typeof latestOptionsRequestIDsPerField[fieldKey] === "number" ? latestOptionsRequestIDsPerField[fieldKey] + 1 : 0;
            let nrAfterAsyncCall = newNr;
            latestOptionsRequestIDsPerField[fieldKey] = newNr;

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
                options = await optionsConfig.loader(updatedData, handleChange);
                nrAfterAsyncCall = latestOptionsRequestIDsPerField[fieldKey];
            }

            if (optionsConfig.enableCaching) {
                updateOptionsCache(cacheKey, options);
            }

            // Only update options if this is the latest option call for this field:
            if (nrAfterAsyncCall === newNr) {
                updateOptionsLoaded(fieldKey, options);
                if (optionsConfig.onOptionsChange && typeof optionsConfig.onOptionsChange === "function") {
                    optionsConfig.onOptionsChange(options, updatedData, handleChange);
                }
            }
        }
    };

    // This function removes interface data from the form data and packs it into the interface state:
    const removeInterfaceState = thisData => {
        // 1. Use fieldPaths to remove data which shouldn't be exposed.
        // 2. Put it into interFace state
        // 3. Add it again when working with the data (once, right on top)

        const interfaceState = {};
        const newData = Object.assign({}, thisData);

        fieldPaths.forEach(fieldPath => {
            if (fieldPath.config.isInterfaceState) {
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

    // Improve the on change handler so that only real changes are bubbled up!
    const limitedOnChange = (newData, errors, id, fieldKey) => {
        let newLastOnChangeData;
        try {
            newLastOnChangeData = stringify({ newData, errors: Object.keys(errors), id, fieldKey });
        } catch(error) {};
        if (newLastOnChangeData !== lastOnChangeData) {
            onChange(removeInterfaceState(newData), errors, id, fieldKey);
            lastOnChangeData = newLastOnChangeData;
        }
    };

    // Form action handler for undo
    const handleUndo = () => {
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
    
    // Form action handler for redo
    const handleRedo = () => {
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

    // Add new entry to the undo index
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
                            fieldData.push(field.setInitialData(fieldData, newData, field.init));
                        } else {
                            fieldData.push({ __typename: field.init });
                        }
                    } else {
                        if (typeof field.setInitialData === "function") {
                            fieldData.push(field.setInitialData(fieldData, newData));
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
                    if (fieldPath.config.dynamicOptions && fieldPath.config.dynamicOptions.events && fieldPath.config.dynamicOptions.events.indexOf("init") > -1) {
                        createDynamicOptions(fieldPath.path, fieldPath.config.dynamicOptions, newData);
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

        limitedOnChange(newData, validationErrors(), id); // will trigger validations even with no inits
    }, [isVisible]);

    /*
        This function finds all fields with computed values and computes them
        with the current data.
    */
    const computeValues = (data) => {
        const newData = Object.assign({}, data);
        fieldPaths.forEach(fieldPath => {
            if (typeof fieldPath.config.computedValue === "function") {
                const itemData = get(alldata, fieldPath.path.split(".").slice(0, -1).join("."));
                const computedValue = fieldPath.config.computedValue(data, itemData, interfaceState);
                set(newData, fieldPath.path, computedValue);
            }
        });
        return newData;
    };

    /*
        This function returns the field configuration for a specific field, given the key of that field (or keys for collection fields)
    */
    const getConfigForField = fieldKey => {
        return find(fieldPaths, { path: fieldKey }).config;
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
    const handleChange = (fieldKey, value, outsideData, syntheticCall = false) => {
        let throttleValidation = false;
        let newErrors;
        const timestamp = +new Date();

        if (lastOnChange === 0 || timestamp - lastOnChange < Number(throttleWait || 400)) {
            if (timeoutRef) clearTimeout(timeoutRef);
            timeoutRef = setTimeout(() => handleChange(fieldKey, value, outsideData, true), 100);
            throttleValidation = true;
        }

        if (!syntheticCall) lastOnChange = timestamp;

        const fieldConfig = getConfigForField(fieldKey);
        
        let newData = Object.assign({}, outsideData || alldata);
        let newValue = typeof fieldConfig.filter === "function" ? fieldConfig.filter(value) : value; //Filter data if needed

        if (fieldConfig.cast && typeof fieldConfig.cast.data === "function") newValue = fieldConfig.cast.data(newValue);
        if (fieldConfig.cast && typeof fieldConfig.cast.data === "string") newValue = castValueStrType(newValue, fieldConfig.cast.data);
        if (fieldConfig.cast && Array.isArray(fieldConfig.cast.data)) newValue = castValueStrType(newValue, fieldConfig.cast.data[0], true);

        if (isDebugging()) window.stagesLogging(`Handle change for field "${fieldKey}"`, uniqId);

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

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("change", newData);

        // Only validate if change or throttledChange or a custom event validation is enabled:
        if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && activeCustomEvents.some(r=> validateOn.indexOf(r) > -1)) ||
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && activeCustomEvents.some(r=> fieldConfig.validateOn.indexOf(r) > -1))
        ) {
            const result = validateField(fieldKey, arrayToStringIfOnlyOneEntry(activeCustomEvents), newData, errors);
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
            const result = validateField(fieldKey, "change", newData, errors);
            newErrors = Object.assign({}, errors, result.errors);
            setErrors(newErrors);
        }

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
            const fields = Array.isArray(fieldConfig.clearFields) ? fieldConfig.clearFields : fieldConfig.clearFields(newValue, newData, newErrors);
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
                    fieldPath.config.dynamicOptions &&
                    fieldPath.config.dynamicOptions.events &&
                    fieldPath.config.dynamicOptions.events.indexOf('change') > -1 &&
                    fieldPath.config.dynamicOptions.watchFields &&
                    fieldPath.config.dynamicOptions.watchFields.indexOf(fieldKey) > -1 &&
                    (!fieldConfig.dynamicOptions ||
                    (fieldConfig.dynamicOptions &&
                        optionsLoaded[fieldPath.path] &&
                        optionsLoaded[fieldPath.path].indexOf(get(newData, fieldKey)) > -1) ||
                    !optionsLoaded[fieldPath.path])
                ) {
                    createDynamicOptions(fieldPath.path, fieldPath.config.dynamicOptions, newData);
                }
            });
        }

        limitedOnChange(newData, newErrors || errors, id, fieldKey);
    };

    /*
        This function is called on each fields onFocus. It is currently used 
        to track which field has focus and what the last field in focus was.
    */
    const handleFocus = (fieldKey) => {
        setFocusedField(fieldKey);
        setLastFocusedField(fieldKey);
    };

    /*
        This function is called on each fields onBlur. It only runs validation 
        if validation is enabled for blur events.
    */
    const handleBlur = (fieldKey) => {
        setFocusedField();
        const fieldConfig = getConfigForField(fieldKey);
        const newData = Object.assign({}, alldata);

        lastOnChange = 0; // Reset the throttled change, so it starts from fresh again

        if (isDebugging()) window.stagesLogging(`Handle blur for field "${fieldKey}"`, uniqId);

        // Run field cleanUp function if one is set:
        if (fieldConfig.cleanUp && typeof fieldConfig.cleanUp === "function" && get(newData, fieldKey)) {
            set(newData, fieldKey, fieldConfig.cleanUp(get(newData, fieldKey)));
            limitedOnChange(newData, errors, id, fieldKey);
        }

        // If precision is set, parse the value accordingly:
        if (typeof fieldConfig.precision === "number") {
            set(newData, fieldKey, Number(get(newData, fieldKey)).toFixed(fieldConfig.precision));
            limitedOnChange(newData, errors, id, fieldKey);
        }

        // prepare the params for the validateOnCallback:
        const validateOnParams = {
            data: get(newData, fieldKey),
            fieldIsDirty: !!dirtyFields[fieldKey],
            fieldConfig,
            fieldHasFocus: !!(focusedField && focusedField === fieldKey)
        };

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("blur", newData);

        // Only validate if blur validation or a custom event is enabled:
        if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && activeCustomEvents.some(r=> validateOn.indexOf(r) > -1)) ||
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && activeCustomEvents.some(r=> fieldConfig.validateOn.indexOf(r) > -1))
        ) {
            const result = validateField(fieldKey, arrayToStringIfOnlyOneEntry(activeCustomEvents), newData, errors);
            setErrors(Object.assign({}, errors, result.errors));
            limitedOnChange(newData, result.errors, id, fieldKey);
        } else if (
            (!fieldConfig.validateOn && Array.isArray(validateOn) && validateOn.indexOf("blur") > -1) || 
            (fieldConfig.validateOn && Array.isArray(fieldConfig.validateOn) && fieldConfig.validateOn.indexOf("blur") > -1) || 
            (!fieldConfig.validateOn && typeof validateOn === "function" && validateOn(validateOnParams).indexOf("blur") > -1) || 
            (fieldConfig.validateOn && typeof fieldConfig.validateOn === "function" && fieldConfig.validateOn(validateOnParams).indexOf("blur") > -1)
        ) {
            const result = validateField(fieldKey, "blur", newData, errors);
            setErrors(Object.assign({}, errors, result.errors));
            limitedOnChange(newData, result.errors, id, fieldKey);
        }

        // Check if a field has dynamic options which have to be loaded:
        if (Array.isArray(fieldPaths)) {
            fieldPaths.forEach(fieldPath => {
                if (
                    fieldPath.config.dynamicOptions && 
                    fieldPath.config.dynamicOptions.events && 
                    fieldPath.config.dynamicOptions.events.indexOf("blur") > -1 && 
                    fieldPath.config.dynamicOptions.watchFields && 
                    fieldPath.config.dynamicOptions.watchFields.indexOf(fieldConfig.id) > -1
                ) {
                    createDynamicOptions(fieldPath.config.id, fieldPath.config.dynamicOptions, newData);
                }
            });
        }

        addNewUndoEntry(newData);

        // Auto save data if enabled:
        if (autoSave === "local" || autoSave === "session") {
            const currentErrors = validationErrors(false, newData);
            if (Object.keys(currentErrors).length === 0) saveDataToStorage(id, { data: newData, isDirty, dirtyFields }, autoSave);
        } else if (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")) {
            const currentErrors = validationErrors(false, newData);
            if ((autoSave.validDataOnly && Object.keys(currentErrors).length === 0) || !autoSave.validDataOnly) saveDataToStorage(id, { data: newData, isDirty, dirtyFields }, autoSave.type);
        }
    };

    /*
        Create the rendered fields object, which contain the correct React components together
        with the correct data in them.
    */
    const createRenderedFields = () => {
        const renderedFields = {};

        const createField = (fieldConfig, fieldData, path) => {
            if (
                (!fields[fieldConfig.type] && fieldConfig.type !== "subform") || 
                (typeof fieldConfig.isRendered === "function" && !fieldConfig.isRendered(path, fieldData, alldata))
            ) return null;

            const cleanedField = Object.assign({}, fieldConfig);
            cleanedField.id = path;

            if (optionsLoaded[path]) {
                cleanedField.options = optionsLoaded[path];
            } else if (typeof cleanedField.options === "function") {
                cleanedField.options = cleanedField.options(path, fieldData, alldata);
            } else if (typeof cleanedField.computedOptions === "object") {
                // Compute options from the data of a collection:
                let options = get(data, cleanedField.computedOptions.source, []);
                let fieldValue = get(alldata, path);

                if (typeof cleanedField.computedOptions.filter === "function") options = options.filter(cleanedField.computedOptions.filter);
                if (typeof cleanedField.computedOptions.sort === "function") options = options.sort(cleanedField.computedOptions.sort);
                if (typeof cleanedField.computedOptions.map === "function") options = options.map(cleanedField.computedOptions.map);
                if (cleanedField.computedOptions.initWith && Array.isArray(cleanedField.computedOptions.initWith)) options = cleanedField.computedOptions.initWith.concat(options);
                
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

            // Remove special props from field before rendering:
            delete cleanedField.computedValue;
            delete cleanedField.computedOptions;
            delete cleanedField.filter;
            delete cleanedField.clearFields;
            delete cleanedField.dynamicOptions;
            delete cleanedField.isRendered;
            delete cleanedField.defaultValue;
            delete cleanedField.cleanUp;
            delete cleanedField.precision;

            // If placeholder is an array, pick one randomly
            if (cleanedField.placeholder && Array.isArray(cleanedField.placeholder) && cleanedField.placeholder.length > 1) {
                if (typeof chosenPlaceholders[path] === "undefined") {
                    chosenPlaceholders[path] = cleanedField.placeholder[Math.floor(Math.random() * cleanedField.placeholder.length)];
                }
                cleanedField.placeholder = chosenPlaceholders[path];
            }

            const castValue = value => {
                if (fieldConfig.cast && typeof fieldConfig.cast.field === "function") return fieldConfig.cast.field(value);
                if (fieldConfig.cast && typeof fieldConfig.cast.field === "string") return castValueStrType(value, fieldConfig.cast.field);
                if (fieldConfig.cast && Array.isArray(fieldConfig.cast.field)) return castValueStrType(value, fieldConfig.cast.field[0], true);
                return value;
            };

            if (fieldConfig.type !== "subform") {
                return React.createElement(
                    fields[fieldConfig.type].component,
                    Object.assign({
                        key: path,
                        value: castValue(fieldData),
                        initialValue: get(initialData, path),
                        error: errors[path],
                        isDirty: !!dirtyFields[path],
                        isDisabled: isDisabled || fieldConfig.isDisabled,
                        hasFocus: !!(focusedField && focusedField === path),
                        onChange: value => handleChange(path, value),
                        onFocus: () => handleFocus(path),
                        onBlur: () => handleBlur(path)
                    }, cleanedField)
                );
            } else {
                return (
                    <Form
                        config={fieldConfig.config}
                        render={({ fieldProps }) => React.createElement(fieldConfig.render, fieldProps)}
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
            const fieldComponent = createField(fieldPath.config, fieldPath.data, fieldPath.path);
            if (fieldComponent) set(renderedFields, fieldPath.path, fieldComponent);
        });

        return renderedFields;
    };

    /*
        This function handles adding and removing collection entries. It is
        called by the forms render method.
    */
    const onCollectionAction = (fieldKey, action, index, toIndex) => {
        const newData = Object.assign({}, alldata);
        const field = getConfigForField(fieldKey);
        const minEntries = field && field.min ? Number(field.min) : 0;
        const maxEntries = field && field.max ? Number(field.max) : 99999999999999; // easiest to just add an impossible high number
        let updatedCollection = get(newData, fieldKey, []);
        let newErrors;

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
        }

        // This will remove a specific entry in the collection:
        if (action === "remove") {
            if (minEntries < updatedCollection.length) updatedCollection.splice(index, 1);
        }

        // This action will move a certain entry from one index to another index, which is very useful with react-beautiful-dnd
        if (action === "move" && index > -1 && toIndex > -1) {
            const [removed] = updatedCollection.splice(index, 1);
            updatedCollection.splice(toIndex, 0, removed);
        }

        // This action uses Lodash sortBy to sort the collection:
        if (action === "sort" && updatedCollection.length > 0 && index) {
            updatedCollection = sortBy(updatedCollection, index);
        }

        // This action duplicates a specific collection entry:
        if (action === "duplicate" && index > -1) {
            updatedCollection.splice(index+1, 0, Object.assign({}, updatedCollection[index]));
        }

        set(newData, fieldKey, updatedCollection);

        // Only validate if collection action validation is enabled:
        if (validateOn.indexOf("collectionAction") > -1) {
            newErrors = validationErrors();
            setErrors(newErrors);
        }

        limitedOnChange(newData, newErrors || validationErrors(), id, fieldKey);
    };

    /*
        This adds a specific config to the field configuration at a certain path
    */
    const modifyConfig = (path, configKey, action) => {
        if (config.fieldConfigs && typeof config.fieldConfigs[configKey] === "function") {
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
                    fields: config.fieldConfigs[configKey],
                    path: configPath,
                    action
                });
                setModifiedConfigs([...modifiedConfigs]);
            }
        }
    };

    /*
        The function is called by the forms action buttons. It either runs the validation
        or just the supplied callback.
    */
    const handleActionClick = (callback, validate, reset) => {
        if (isDebugging()) window.stagesLogging(`Handle action click`, uniqId);

        // If this is a reset action, we reset back to the initial data:
        if (reset) {
            if (autoSave === "local" || autoSave === "session") removeDataFromStorage(id, autoSave);
            if (typeof autoSave === "object" && (autoSave.type === "local" || autoSave.type === "session")) removeDataFromStorage(id, autoSave.type);
            limitedOnChange(initialData, validationErrors(), id);
            setDirtyFields({});
            setIsDirty(false);
        }

        // Are there any custom events active?
        const activeCustomEvents = getActiveCustomEvents("action", alldata);
        let suppressCallback = false;

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
            if (Object.keys(errors).length > 0) suppressCallback = true;
        }

        if (!suppressCallback) callback();
    };

    // If the form isn't visible, render nothing (this is needed for the Wizards step validation):
    if (isVisible === false) return null;

    // Render all the render props:
    return render ? render({
        actionProps: { handleActionClick, handleUndo, handleRedo, isDisabled, isDirty, focusedField, lastFocusedField, dirtyFields, silentlyGetValidationErrors },
        fieldProps: { fields: createRenderedFields(), onCollectionAction, modifyConfig, data, interfaceState, errors, asyncData, isDirty, focusedField, lastFocusedField, dirtyFields },
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
    validateOn: PropTypes.array,
    customRuleHandlers: PropTypes.object,
    undoMaxDepth: PropTypes.number
};

Form.defaultProps = {
    data: {},
    onChange: () => {},
    isVisible: true,
    isDisabled: false,
    validateOn: ["action"],
    customRuleHandlers: {},
    undoMaxDepth: 10,
    autoSave: false
};

export default Form;