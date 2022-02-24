"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValid = exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Form = _interopRequireDefault(require("react-bootstrap/Form"));

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
const Input = _ref => {
  let {
    id,
    label,
    value,
    onChange: _onChange,
    error,
    placeholder,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText,
    type
  } = _ref;
  return /*#__PURE__*/_react.default.createElement(_Form.default.Group, {
    className: "mb-3",
    controlId: id
  }, label ? /*#__PURE__*/_react.default.createElement(_Form.default.Label, null, label, isRequired ? " *" : "") : null, secondaryText ? /*#__PURE__*/_react.default.createElement(_Form.default.Text, {
    className: "text-muted"
  }, secondaryText) : null, prefix ? /*#__PURE__*/_react.default.createElement("span", null, prefix) : null, /*#__PURE__*/_react.default.createElement(_Form.default.Control, {
    type: type || "text",
    placeholder: placeholder,
    isInvalid: typeof error !== "undefined",
    disabled: !!isDisabled,
    value: value || "",
    onChange: e => {
      if (typeof _onChange === "function") _onChange(e.target.value);
    }
  }), suffix ? /*#__PURE__*/_react.default.createElement("span", null, suffix) : null, error ? /*#__PURE__*/_react.default.createElement(_Form.default.Text, {
    className: "text-muted"
  }, "Bitte f\xFCllen Sie dieses Feld aus!") : null);
};

const isValid = (value, config) => {
  if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
  return true;
};

exports.isValid = isValid;
var _default = Input;
exports.default = _default;