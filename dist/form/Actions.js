"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
    This is a default component for a forms action buttons. It is ment as
    a sample on how to build your own, but of course you can use it if it
    fits your usecase.
*/
const Actions = _ref => {
  let {
    config,
    handleActionClick,
    isDisabled
  } = _ref;
  return /*#__PURE__*/React.createElement(React.Fragment, null, config.map((action, index) => {
    if (action.type === "primary") {
      return /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => handleActionClick(action.onClick, action.validate),
        key: "action-".concat(index),
        disabled: isDisabled
      }, /*#__PURE__*/React.createElement("strong", null, action.title));
    }

    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleActionClick(action.onClick, action.validate),
      key: "action-".concat(index),
      disabled: isDisabled
    }, action.title);
  }));
};

var _default = Actions;
exports.default = _default;