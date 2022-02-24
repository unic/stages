"use strict";

require("core-js/modules/web.dom-collections.iterator.js");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValid = exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _Form = _interopRequireDefault(require("react-bootstrap/Form"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
const RadioGroup = _ref => {
  let {
    id,
    label,
    value,
    options,
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
  }, label ? /*#__PURE__*/_react.default.createElement(_Form.default.Label, null, label, isRequired ? " *" : "") : null, /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement("br", null), prefix ? /*#__PURE__*/_react.default.createElement("span", null, prefix) : null, /*#__PURE__*/_react.default.createElement("div", {
    key: "inline-".concat(type),
    className: "mb-3"
  }, options.map(option => {
    return /*#__PURE__*/_react.default.createElement(_react.Fragment, {
      key: "".concat(id, "-").concat(option.value)
    }, /*#__PURE__*/_react.default.createElement(_Form.default.Check, {
      type: "radio",
      id: "default-checkbox",
      label: "".concat(option.text).concat(isRequired ? " *" : ""),
      disabled: !!isDisabled,
      value: option.value,
      checked: value === option.value,
      onChange: () => {
        /* to make React and IE happy */
      },
      onClick: e => {
        if (typeof onChange === "function") onChange(option.value);
      }
    }));
  })), suffix ? /*#__PURE__*/_react.default.createElement("span", null, suffix) : null, secondaryText ? /*#__PURE__*/_react.default.createElement(_Form.default.Text, {
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
var _default = RadioGroup;
exports.default = _default;