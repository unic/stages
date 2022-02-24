"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/web.dom-collections.iterator.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.split.js");

var _react = _interopRequireWildcard(require("react"));

var _reactUse = require("react-use");

var _lodash = _interopRequireDefault(require("lodash.findindex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/*
    This is our default router for Stages. It uses URL hashes.
    It will fallback to numbers if you don't supply keys to
    Stages.

    With keys: #/mystep
    With numbers: #/1
*/
const HashRouter = _ref => {
  let {
    step,
    onChange,
    keys
  } = _ref;
  const [hash, setHash] = (0, _reactUse.useHash)();
  const [isMounted, setIsMounted] = (0, _react.useState)(false);

  const isPositiveInteger = str => {
    var n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
  };

  const getHashFromIndex = stepIndex => {
    if (keys && keys[stepIndex]) return keys[stepIndex].key;
    return "step-".concat(stepIndex);
  };

  const getIndexFromHash = hash => {
    // hash can be a number or id:
    // #/mystep
    // #/1
    const hashSplit = hash.split("#/");

    if (hashSplit.length === 2) {
      const hashStr = hashSplit[1];

      if (isPositiveInteger(hashStr)) {
        return Number(hashStr);
      }

      return (0, _lodash.default)(keys, {
        key: hashStr
      });
    }

    return -1;
  };

  const handleHashes = () => {
    if (hash.indexOf("#/") !== -1) {
      const index = getIndexFromHash(hash);

      if (index !== -1) {
        setHash("#/".concat(getHashFromIndex(index)));
        onChange(index);
      }
    } else {
      setHash("#/".concat(getHashFromIndex(0)));
    }
  };

  (0, _react.useEffect)(() => {
    if (isMounted) {
      handleHashes();
    }
  }, [hash]);
  (0, _react.useEffect)(() => {
    if (isMounted) {
      setHash("#/".concat(getHashFromIndex(step)));
    }
  }, [step]);
  (0, _reactUse.useMount)(() => {
    handleHashes();
    setIsMounted(true);
  });
  return null;
};

var _default = HashRouter;
exports.default = _default;