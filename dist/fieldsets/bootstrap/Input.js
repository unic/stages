"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValid = exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Form = _interopRequireDefault(require("react-bootstrap/Form"));

var _Tooltip = _interopRequireDefault(require("react-bootstrap/Tooltip"));

var _OverlayTrigger = _interopRequireDefault(require("react-bootstrap/OverlayTrigger"));

var _Button = _interopRequireDefault(require("react-bootstrap/Button"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const InputTooltip = _ref => {
  let {
    text
  } = _ref;
  return /*#__PURE__*/_react.default.createElement("div", {
    style: {
      position: "absolute",
      content: "",
      top: "30px",
      right: "9px"
    }
  }, /*#__PURE__*/_react.default.createElement(_OverlayTrigger.default, {
    placement: "left",
    overlay: /*#__PURE__*/_react.default.createElement(_Tooltip.default, null, text)
  }, /*#__PURE__*/_react.default.createElement(_Button.default, {
    variant: "secondary",
    style: {
      borderRadius: "100%",
      backgroundColor: "#fff",
      border: "1px #333 solid",
      fontSize: "11px",
      fontWeight: "bold",
      color: "#333",
      padding: 0,
      width: "18px",
      height: "18px"
    }
  }, "?")));
};
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


const Input = _ref2 => {
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
    tooltip,
    type
  } = _ref2;
  return /*#__PURE__*/_react.default.createElement(_Form.default.Group, {
    className: "mb-3",
    controlId: id,
    style: {
      position: "relative"
    }
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
  }), tooltip ? /*#__PURE__*/_react.default.createElement(InputTooltip, {
    text: tooltip
  }) : null, suffix ? /*#__PURE__*/_react.default.createElement("span", null, suffix) : null, error ? /*#__PURE__*/_react.default.createElement(_Form.default.Text, {
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