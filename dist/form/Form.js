"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.object.assign.js");

require("core-js/modules/es.promise.js");

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _lodash = _interopRequireDefault(require("lodash.find"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const isElementInViewport = el => {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
  /* or $(window).height() */
  rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  /* or $(window).width() */
  ;
};
/*
    This is the form component used in Stages. You can use it for individual steps in a wizard
    or on it's own for one stage forms.
*/


const Form = _ref => {
  let {
    config,
    data,
    render,
    fields,
    onChange,
    isVisible,
    isDisabled,
    id
  } = _ref;
  const [dataLoaded, setDataLoaded] = (0, _react.useState)(false);
  const [asyncData, setAsyncData] = (0, _react.useState)();
  const [errors, setErrors] = (0, _react.useState)({});
  const [loading, setLoading] = (0, _react.useState)(false);
  const parsedFieldConfig = typeof config.fields === "function" ? config.fields(data, asyncData) : [];
  const renderedFields = {};
  /*
      This function checks for all validation errors, based on each field types validation method
      and the fields config.
  */

  const validationErrors = () => {
    let errors = {};
    let firstErrorField;
    parsedFieldConfig.forEach(field => {
      if (!fields[field.type] && field.type !== "collection") return; // Is the data entered valid, check with default field function and optionally with custom validation:

      const isValid = field.type !== "collection" && fields[field.type].isValid(data[field.id], field);
      const fieldIsValid = field.type !== "collection" && field.customValidation ? field.customValidation(data[field.id], field, isValid) : isValid; // Regular non collection feilds:

      if (field.type !== "collection" && !fieldIsValid) {
        if (!firstErrorField) firstErrorField = field.id;
        errors[field.id] = {
          value: data[field.id],
          field
        }; // Collections which are required (need to have at least one entry!):
      } else if (field.type === "collection" && field.isRequired && (!data[field.id] || data[field.id].length === 0 || data[field.id].length === 1 && Object.keys(data[field.id][0]).length === 0)) {
        if (!firstErrorField) firstErrorField = field.id;
        errors[field.id] = {
          value: data[field.id],
          field
        }; // Collections which are not required will only be checked if data has been added:
      } else if (field.type === "collection") {
        field.fields.forEach(subField => {
          data[field.id] && data[field.id].forEach((dataEntry, index) => {
            // Is the data entered valid, check with default field function and optionally with custom validation:
            const isValid = fields[subField.type] && fields[subField.type].isValid(dataEntry[subField.id], subField);
            const fieldIsValid = subField.customValidation ? subField.customValidation(dataEntry[subField.id], subField, isValid) : isValid;

            if (fields[subField.type] && !fieldIsValid) {
              errors["".concat(field.id, "-").concat(index, "-").concat(subField.id)] = {
                value: data[field.id],
                subField
              };
            }
          });
        });
      }
    }); // Jump to the first field which has an error:

    if (firstErrorField && isVisible) {
      const element = document.getElementById(firstErrorField);
      if (element && !isElementInViewport(element)) element.scrollIntoView();
    }

    return errors;
  };
  /*
      Initialize collections if needed and run the validation (needed for
      the wizard to find out which steps are valid).
  */


  (0, _react.useEffect)(() => {
    let newData = Object.assign({}, data);
    parsedFieldConfig.forEach(field => {
      if (field.type === "collection" && field.init) {
        const minEntries = field.min ? Number(field.min) : 1; // Init collections if needed (will add empty object so the row is rendered):

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

    if (Array.isArray(fieldKey)) {
      newData[fieldKey[0]][index][fieldKey[1]] = value;
    } else {
      newData[fieldKey] = value;
    } // Now run over all computed value fields to recalculate all dynamic data:


    newData = computeValues(parsedFieldConfig, newData);
    onChange(newData, validationErrors(), id);
  };
  /*
      Create the rendered fields object, which contain the correct React components together
      with the correct data in them.
  */


  parsedFieldConfig.forEach(field => {
    if (!fields[field.type] && field.type !== "collection") return; // Ignore field types which don't exist!
    // Create regular fields:

    if (field.type !== "collection") {
      renderedFields[field.id] = /*#__PURE__*/_react.default.createElement(fields[field.type].component, Object.assign({
        key: field.id,
        value: data[field.id],
        error: errors[field.id],
        isDisabled: isDisabled || field.isDisabled,
        onChange: value => handleChange(field.id, value)
      }, field)); // Create collections:
    } else {
      if (!Array.isArray(renderedFields[field.id])) renderedFields[field.id] = []; // Add existing entries:

      if (data[field.id]) {
        data[field.id].forEach((dataEntry, index) => {
          const subRenderedFields = {};
          field.fields.forEach(subField => {
            if (fields[subField.type]) {
              subRenderedFields[subField.id] = /*#__PURE__*/_react.default.createElement(fields[subField.type].component, Object.assign({
                key: "".concat(field.id, "-").concat(index, "-").concat(subField.id),
                value: dataEntry[subField.id],
                error: errors["".concat(field.id, "-").concat(index, "-").concat(subField.id)],
                isDisabled: isDisabled || subField.isDisabled,
                onChange: value => handleChange([field.id, subField.id], value, index)
              }, subField));
            }
          });
          renderedFields[field.id].push(subRenderedFields);
        });
      }
    }
  });
  /*
      This function handles adding and removing collection entries. It is
      called by the forms render method.
  */

  const onCollectionAction = (fieldKey, action, index) => {
    const newData = Object.assign({}, data);
    const field = (0, _lodash.default)(parsedFieldConfig, {
      id: fieldKey
    });
    const minEntries = field && field.min ? Number(field.min) : 0;
    const maxEntries = field && field.max ? Number(field.max) : 99999999999999; // easiest to just add an impossible high number
    // This will addd a new entry to the collection:

    if (action === "add") {
      if (!Array.isArray(newData[fieldKey])) newData[fieldKey] = [];
      if (maxEntries > newData[fieldKey].length) newData[fieldKey].push({});
    } // This will remove a specific entry in the collection:


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
    let errors = validate ? validationErrors() : {};
    setErrors(errors);
    if (Object.keys(errors).length === 0) callback();
  }; // If the form isn't visible, render nothing (this is needed for the Wizards step validation):


  if (isVisible === false) return null; // Render all the render props:

  return render ? render({
    actionProps: {
      handleActionClick,
      isDisabled
    },
    fieldProps: {
      fields: renderedFields,
      onCollectionAction,
      data,
      errors,
      asyncData
    },
    loading
  }) : null;
};

Form.propTypes = {
  config: _propTypes.default.object.isRequired,
  data: _propTypes.default.object,
  render: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.func]).isRequired,
  fields: _propTypes.default.object.isRequired,
  onChange: _propTypes.default.func,
  isVisible: _propTypes.default.bool,
  isDisabled: _propTypes.default.bool,
  id: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]).isRequired
};
Form.defaultProps = {
  data: {},
  onChange: () => {},
  isVisible: true,
  isDisabled: false
};
var _default = Form;
exports.default = _default;