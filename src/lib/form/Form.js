import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import find from "lodash.find";
import uniqWith from "lodash.uniqwith";
import isEqual from "lodash.isequal";

const isElementInViewport = el => {
    const rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
}

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
    validateOn
}) => {
    const [uniqId] = useState(`form-${id || "noid"}-${+ new Date()}`);
    const [isDirty, setIsDirty] = useState(false);
    const [initialData, setInitialData] = useState(false);
    const [runValidation, setRunValidation] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState({});
    const [optionsCache, setOptionsCache] = useState({});
    const [asyncData, setAsyncData] = useState();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const parsedFieldConfig = typeof config.fields === "function" ? config.fields(data, asyncData) : [];
    const renderedFields = {};

    // Save the initial data so we can compare it to the current data so we can decide if a form is dirty:
    useEffect(() => {
        if (data && !initialData) setInitialData(data);
    }, [data]);

    /*
        If there is a logging function registered on the window (Stages browser extension), send data to it:
    */
    useEffect(() => {
        if (typeof window !== "undefined" && typeof window.stagesLogging === "function") {
            window.stagesLogging({ id: uniqId, data, errors, isDirty, loading, parsedFieldConfig }); 
        }
    }, [data, errors, isDirty, loading]);

    // Helper function to detect reserved field types:
    const isReservedType = type => type === "collection" || type === "subform";

    /*
        This function is used to validate one single field. It returns the updated error and firstErrorField object
    */
    const validateField = (field, validationData, errors, firstErrorField) => {
        // Is the data entered valid, check with default field function and optionally with custom validation:
        const isValid = !isReservedType(field.type) && fields[field.type].isValid(validationData[field.id], field);
        const fieldIsValid = !isReservedType(field.type) && field.customValidation ? field.customValidation({ data: validationData[field.id], allData: validationData, fieldConfig: field, isValid }) : isValid;

        if (errors[field.id]) delete errors[field.id];

        // Regular non reserved type fields:
        if (!isReservedType(field.type) && !fieldIsValid) {
            if (!firstErrorField) firstErrorField = field.id;
            errors[field.id] = {
                value: validationData[field.id],
                field
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
                        const isValid = fields[subField.type] && fields[subField.type].isValid(dataEntry[subField.id], subField);
                        const fieldIsValid = subField.customValidation ? subField.customValidation(dataEntry[subField.id], subField, isValid) : isValid;

                        if (fields[subField.type] && !fieldIsValid) {
                            errors[`${field.id}-${index}-${subField.id}`] = {
                                value: validationData[field.id],
                                subField
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
                            const isValid = fields[subField.type] && fields[subField.type].isValid(dataEntry[subField.id], subField);
                            const fieldIsValid = subField.customValidation ? subField.customValidation(dataEntry[subField.id], subField, isValid) : isValid;

                            if (fields[subField.type] && !fieldIsValid) {
                                errors[`${field.id}-${index}-${subField.id}`] = {
                                    value: validationData[field.id],
                                    subField
                                };
                            }
                        });
                    }
                });
            }
        }

        if (field.type === "collection" && field.uniqEntries && validationData[field.id]) {
            // Add error if collection entries are not unique!
            if (uniqWith(validationData[field.id], (arrVal, othVal) => JSON.stringify(arrVal) === JSON.stringify(othVal)).length !== validationData[field.id].length) {
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
            const result = validateField(field, validationData, errors, firstErrorField);
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

    // To make sure that subforms are being validated, we have to run validation each time validation is being run on the parent component:
    useEffect(() => {
        if (typeof onValidation === "function" && parentRunValidation) {
            let errors = validationErrors(true);
            setErrors(errors);
            onValidation(errors);
        }
    }, [onValidation]);

    /*
        This is the callback which sub forms call to bubble up validation errors from within the subform.
    */
    const handleSubValidation = (subId, subErrors) => {
        validationErrors(true);
        if (subErrors && Object.keys(subErrors).length > 0) {
            errors[subId] = subErrors;
        }
    };

    // Helper state function so we always get the latest options cache when updating from callback:
    const updateOptionsCache = (key, options) => {
        setOptionsCache(latestCache => {
            return Object.assign({}, latestCache, {[key]: options});
        });
    };

    // Helper state function so we always get the latest options loaded when updating from callback:
    const updateOptionsLoaded = (key, options) => {
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

            // Handle caching of loaded options if enabled:
            if (optionsConfig.enableCaching) {
                optionsConfig.watchFields.forEach(f => {
                    if (updatedData[f]) cacheKeyValues[f] = updatedData[f];
                });
                cacheKey = `${field}-${JSON.stringify(cacheKeyValues)}`;
            }

            // Load async data or use the cache:
            if (optionsConfig.enableCaching && optionsCache[cacheKey]) {
                options = optionsCache[cacheKey];
            } else {
                options = await optionsConfig.loader(updatedData, handleChange);
            }

            if (optionsConfig.enableCaching) {
                updateOptionsCache(cacheKey, options);
            }

            updateOptionsLoaded(field, options);
        }
    };

    /*
        Initialize collections if needed and run the validation (needed for
        the wizard to find out which steps are valid).
    */
    useEffect(() => {
        let newData = Object.assign({}, data);
        
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

        onChange(newData, validationErrors(), id); // will trigger validations even with no inits
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

    /*
        This function is called on each fields onChange. It will trigger the forms onChange
        and run the validation on the new data (which is sent to the onChange, as well).
    */
    const handleChange = (fieldKey, value, index) => {
        const fieldConfig = getConfigForField(fieldKey);
        let newData = Object.assign({}, data);
        let newValue;

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

        // Only validate if change validation is enabled:
        if (validateOn.indexOf("change") > -1 || (fieldConfig.validateOn && fieldConfig.validateOn.indexOf("change") > -1)) {
            const result = validateField(fieldConfig, newData, errors);
            setErrors(result.errors);
        }

        // Set the isDirty flag correctly:
        if (initialData) setIsDirty(!isEqual(newData, initialData));

        // If there are any fields to be cleared, do that now:
        if (fieldConfig.clearFields && Array.isArray(fieldConfig.clearFields)) {
            fieldConfig.clearFields.forEach(field => delete newData[field]);
        }

        // Check if a field has dynamic options which have to be loaded:
        parsedFieldConfig.forEach(field => {
            if (
                field.dynamicOptions && 
                field.dynamicOptions.events && 
                field.dynamicOptions.events.indexOf("change") > -1 && 
                field.dynamicOptions.watchFields && 
                field.dynamicOptions.watchFields.indexOf(fieldConfig.id) > -1
            ) {
                createDynamicOptions(field.id, field.dynamicOptions, newData);
            }
        });

        onChange(newData, validationErrors(), id, fieldKey, index);
    };

    /*
        This function is called on each fields onBlur. It only runs validation 
        if validation is enabled for blur events.
    */
    const handleBlur = (fieldKey, index) => {    
        const fieldConfig = getConfigForField(fieldKey);

        // Only validate if blur validation is enabled:
        if (validateOn.indexOf("blur") > -1 || (fieldConfig.validateOn && fieldConfig.validateOn.indexOf("blur") > -1)) {
            const result = validateField(fieldConfig, data, errors);
            setErrors(result.errors);
            onChange(data, result.errors, id, fieldKey, index);
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
                createDynamicOptions(field.id, field.dynamicOptions, data);
            }
        });
    };

    /*
        Create the rendered fields object, which contain the correct React components together
        with the correct data in them.
    */
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
                    error: errors[field.id],
                    isDisabled: isDisabled || field.isDisabled,
                    onChange: value => handleChange(field.id, value),
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

        onChange(newData, newErrors || validationErrors(), id, fieldKey, index);
    };

    /*
        The function is called by the forms action buttons. It either runs the validation
        or just the supplied callback.
    */
    const handleActionClick = (callback, validate) => {
        // Only validate if action validation is enabled (which is the default):
        if (validateOn.indexOf("action") > -1) {
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
        actionProps: { handleActionClick, isDisabled, isDirty },
        fieldProps: { fields: renderedFields, onCollectionAction, data, errors, asyncData, isDirty },
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