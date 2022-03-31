import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import find from "lodash.find";
import uniqWith from "lodash.uniqwith";

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
    id
}) => {
    const [dataLoaded, setDataLoaded] = useState(false);
    const [asyncData, setAsyncData] = useState();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const parsedFieldConfig = typeof config.fields === "function" ? config.fields(data, asyncData) : [];
    const renderedFields = {};

    const isReservedType = type => type === "collection" || type === "subform";

    /*
        This function checks for all validation errors, based on each field types validation method
        and the fields config.
    */
    const validationErrors = (isUserAction) => {
        let errors = {};
        let firstErrorField;

        parsedFieldConfig.forEach(field => {
            if (!fields[field.type] && !isReservedType(field.type)) return;

            // Is the data entered valid, check with default field function and optionally with custom validation:
            const isValid = !isReservedType(field.type) && fields[field.type].isValid(data[field.id], field);
            const fieldIsValid = !isReservedType(field.type) && field.customValidation ? field.customValidation({ data: data[field.id], allData: data, fieldConfig: field, isValid }) : isValid;

            // Regular non reserved type fields:
            if (!isReservedType(field.type) && !fieldIsValid) {
                if (!firstErrorField) firstErrorField = field.id;
                errors[field.id] = {
                    value: data[field.id],
                    field
                };
            // Collections which are required (need to have at least one entry!):
            } else if (field.type === "collection" && field.isRequired && (!data[field.id] || data[field.id].length === 0 || data[field.id].length === 1 && Object.keys(data[field.id][0]).length === 0)) {
                if (!firstErrorField) firstErrorField = field.id;
                errors[field.id] = {
                    value: data[field.id],
                    field
                };
            // Collections which are not required will only be checked if data has been added:
            } else if (field.type === "collection") {
                field.fields.forEach(subField => {
                    data[field.id] && data[field.id].forEach((dataEntry, index) => {
                        // Don't check fields if the collection isn't required and the object is empty:
                        if (!field.isRequired && (!dataEntry || Object.keys(dataEntry).length === 0)) return;

                        // Is the data entered valid, check with default field function and optionally with custom validation:
                        const isValid = fields[subField.type] && fields[subField.type].isValid(dataEntry[subField.id], subField);
                        const fieldIsValid = subField.customValidation ? subField.customValidation(dataEntry[subField.id], subField, isValid) : isValid;

                        if (fields[subField.type] && !fieldIsValid) {
                            errors[`${field.id}-${index}-${subField.id}`] = {
                                value: data[field.id],
                                subField
                            };
                        }
                    });
                });
            }

            if (field.type === "collection" && field.uniqEntries && data[field.id]) {
                // Add error if collection entries are not unique!
                if (uniqWith(data[field.id], (arrVal, othVal) => JSON.stringify(arrVal) === JSON.stringify(othVal)).length !== data[field.id].length) {
                    errors[field.id] = {
                        value: data[field.id],
                        field
                    };
                }
            }
        });

        // Jump to the first field which has an error:
        if (firstErrorField && isVisible && isUserAction) {
            const element = document.getElementById(firstErrorField);
            if (element && !isElementInViewport(element)) element.scrollIntoView();
        }

        return errors;
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
                    newData[field.id].push({});
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
                field.fields.forEach(subField => {
                    if (typeof subField.computedValue === "function") {
                        data[field.id].forEach((dataEntry, index) => {
                            data[field.id][index][subField.id] = subField.computedValue(data, data[field.id][index]);
                        });
                    }
                });
            }
        });
        return data;
    };

    /*
        This function is called on each fields onChange. It will trigger the forms onChange
        and run the validation on the new data (which is sent to the onChange, as well).
    */
    const handleChange = (fieldKey, value, index) => {
        let newData = Object.assign({}, data);

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
        
        if (Array.isArray(fieldKey)) {
            newData[fieldKey[0]][index][fieldKey[1]] = filterValue(value);
        } else {
            newData[fieldKey] = filterValue(value);
        }

        // Now run over all computed value fields to recalculate all dynamic data:
        newData = computeValues(parsedFieldConfig, newData);

        onChange(newData, validationErrors(), id);
    };

    /*
        Create the rendered fields object, which contain the correct React components together
        with the correct data in them.
    */
    parsedFieldConfig.forEach(field => {
        if (!fields[field.type] && !isReservedType(field.type)) return; // Ignore field types which don't exist!

        // Create regular fields:
        if (!isReservedType(field.type)) {
            renderedFields[field.id] = React.createElement(
                fields[field.type].component,
                Object.assign({
                    key: field.id,
                    value: data[field.id],
                    error: errors[field.id],
                    isDisabled: isDisabled || field.isDisabled,
                    onChange: value => handleChange(field.id, value)
                }, field)
            );
        // Create collections:
        } else if (field.type === "collection") {
            if (!Array.isArray(renderedFields[field.id])) renderedFields[field.id] = [];

            // Add existing entries:
            if (data[field.id]) {
                data[field.id].forEach((dataEntry, index) => {
                    const subRenderedFields = {};
                    field.fields.forEach(subField => {
                        if (fields[subField.type]) {
                            subRenderedFields[subField.id] = React.createElement(
                                fields[subField.type].component,
                                Object.assign({
                                    key: `${field.id}-${index}-${subField.id}`,
                                    value: dataEntry[subField.id],
                                    error: errors[`${field.id}-${index}-${subField.id}`],
                                    isDisabled: isDisabled || subField.isDisabled,
                                    onChange: value => handleChange([field.id, subField.id], value, index)
                                }, subField)
                            )
                        }
                    });
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
                    data={data && data[field.id]}
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

        // This will addd a new entry to the collection:
        if (action === "add") {
            if (!Array.isArray(newData[fieldKey])) newData[fieldKey] = [];
            if (maxEntries > newData[fieldKey].length) newData[fieldKey].push({});
        }

        // This will remove a specific entry in the collection:
        if (action === "remove") {
            if (minEntries < newData[fieldKey].length) newData[fieldKey].splice(index, 1);
        }

        onChange(newData, validationErrors(), id);
    };

    /*
        The function is called by the forms action buttons. It either runs the validation
        or just the supplied callback.
    */
    const handleActionClick = (callback, validate) => {
        let errors = validate ? validationErrors(true) : {};
        setErrors(errors);
        if (Object.keys(errors).length === 0) callback();
    };

    // If the form isn't visible, render nothing (this is needed for the Wizards step validation):
    if (isVisible === false) return null;

    // Render all the render props:
    return render ? render({
        actionProps: { handleActionClick, isDisabled },
        fieldProps: { fields: renderedFields, onCollectionAction, data, errors, asyncData },
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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

Form.defaultProps = {
    data: {},
    onChange: () => {},
    isVisible: true,
    isDisabled: false
};

export default Form;