"use strict";

require("core-js/modules/web.dom-collections.iterator.js");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Input = _interopRequireWildcard(require("./Input"));

var _CheckBox = _interopRequireWildcard(require("./CheckBox"));

var _Select = _interopRequireWildcard(require("./Select"));

var _RadioGroup = _interopRequireWildcard(require("./RadioGroup"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const fields = {
  text: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  number: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  email: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  password: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  tel: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  time: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  date: {
    component: _Input.default,
    isValid: _Input.isValid
  },
  checkbox: {
    component: _CheckBox.default,
    isValid: _CheckBox.isValid
  },
  select: {
    component: _Select.default,
    isValid: _Select.isValid
  },
  radio: {
    component: _RadioGroup.default,
    isValid: _RadioGroup.isValid
  }
};
var _default = fields;
exports.default = _default;