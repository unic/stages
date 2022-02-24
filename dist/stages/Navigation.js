"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/web.dom-collections.iterator.js");

/*
    This is a default component for a Stages navigation. It is ment as
    a sample on how to build your own, but of course you can use it if it
    fits your usecase.
*/
const Navigation = _ref => {
  let {
    currentStep,
    data,
    onChangeStep,
    errors,
    lastValidStep,
    keys,
    stepCount
  } = _ref;
  const items = [];

  for (let i = 0; i < keys.length; i++) {
    if (keys && keys[i] && keys[i].visible) {
      const stepName = keys && keys[i] ? keys[i].key : "Step ".concat(i + 1);

      if (currentStep === i) {
        items.push( /*#__PURE__*/React.createElement("li", {
          key: stepName,
          style: {
            textTransform: "capitalize"
          }
        }, /*#__PURE__*/React.createElement("strong", null, stepName)));
      } else if (lastValidStep > -1 && lastValidStep + 1 < i || lastValidStep === -1 && i > 0) {
        items.push( /*#__PURE__*/React.createElement("li", {
          key: stepName,
          style: {
            color: "#999",
            textTransform: "capitalize"
          }
        }, stepName));
      } else {
        items.push( /*#__PURE__*/React.createElement("li", {
          key: stepName,
          style: {
            textTransform: "capitalize"
          },
          onClick: () => onChangeStep(i)
        }, stepName));
      }
    }
  }

  return /*#__PURE__*/React.createElement("ul", null, items);
};

var _default = Navigation;
exports.default = _default;