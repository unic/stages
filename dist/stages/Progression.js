"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
    This is a default component for a Stages navigation. It is ment as
    a sample on how to build your own, but of course you can use it if it
    fits your usecase.
*/
const Progression = _ref => {
  let {
    stepCount,
    validSteps,
    percentage
  } = _ref;
  return /*#__PURE__*/React.createElement("div", null, "".concat(validSteps, " / ").concat(stepCount, " (").concat(Math.round(percentage), "%)"));
};

var _default = Progression;
exports.default = _default;