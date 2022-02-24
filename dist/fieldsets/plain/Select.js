"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValid = exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*

Each field must bring at least:
- id (acts as name etc.)
- label

Optional:
- value
- error
- onChange
- onValidate
- placeholder
- isRequired
- disabled
- prefix
- suffix
- secondaryText

*/
const Select = _ref => {
  let {
    id,
    label,
    value,
    options,
    onChange: _onChange,
    error,
    placeholder,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText
  } = _ref;
  return /*#__PURE__*/_react.default.createElement("div", {
    id: id
  }, label ? /*#__PURE__*/_react.default.createElement("label", {
    htmlFor: id
  }, label, isRequired ? " *" : "") : null, /*#__PURE__*/_react.default.createElement("div", null, prefix ? /*#__PURE__*/_react.default.createElement("span", null, prefix) : null, /*#__PURE__*/_react.default.createElement("select", {
    name: id,
    value: value,
    options: options,
    placeholder: placeholder,
    disabled: !!isDisabled,
    required: !!isRequired,
    onChange: e => {
      if (typeof _onChange === "function") _onChange(e.target.value);
    }
  }, options.map(option => /*#__PURE__*/_react.default.createElement("option", {
    value: option.value,
    key: option.value
  }, option.text))), suffix ? /*#__PURE__*/_react.default.createElement("span", null, suffix) : null), secondaryText ? /*#__PURE__*/_react.default.createElement("div", null, secondaryText) : null, error ? /*#__PURE__*/_react.default.createElement("div", {
    style: {
      color: "red"
    }
  }, "Bitte f\xFCllen Sie dieses Feld aus!") : null);
};

const isValid = (value, config) => {
  if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
  return true;
};

exports.isValid = isValid;
var _default = Select;
exports.default = _default;