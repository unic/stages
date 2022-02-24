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
const CheckBox = _ref => {
  let {
    id,
    label,
    value,
    onChange,
    error,
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
  }, prefix ? /*#__PURE__*/_react.default.createElement("span", null, prefix) : null, /*#__PURE__*/_react.default.createElement(_Form.default.Check, {
    type: type,
    id: "default-checkbox",
    label: "".concat(label).concat(isRequired ? " *" : ""),
    value: "1",
    disabled: !!isDisabled,
    checked: !!value,
    onChange: () => {
      /* to make React and IE happy */
    },
    onClick: e => {
      if (typeof onChange === "function") onChange(e.target.checked ? true : false);
    }
  }), suffix ? /*#__PURE__*/_react.default.createElement("span", null, suffix) : null, secondaryText ? /*#__PURE__*/_react.default.createElement(_Form.default.Text, {
    className: "text-muted"
  }, secondaryText) : null, error ? /*#__PURE__*/_react.default.createElement(_Form.default.Text, {
    className: "text-muted"
  }, "Bitte f\xFCllen Sie dieses Feld aus!") : null);
};

const isValid = (value, config) => {
  if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
  return true;
};

exports.isValid = isValid;
var _default = CheckBox;
exports.default = _default;