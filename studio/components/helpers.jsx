// @ts-nocheck
import _ from "lodash";
import Mustache from 'mustache';
import fieldProps from "./fieldProps";

export const parseJSONConfig = (config, data) => {
    if (!config) return [];
    const parsedConfig = config.map((item) => {
        const newItem = { ...item };
        if (newItem.type === "group" || newItem.type === "collection" || newItem.type === "wizard") {
            newItem.fields = parseJSONConfig(newItem.fields, data);
        }
        if (newItem.computedValue && typeof newItem.computedValue === "string") {
            let computedValueFunction;
            try {
                computedValueFunction = new Function("data", `"use strict"; let result; try { result = ${newItem.computedValue}; } catch (e) { console.warn("error in computed function"); } return result;`);
                const testResult = computedValueFunction(data);
            } catch (error) {
                console.error("computed value error", error);
            }
           // eslint-disable-next-line no-new-func
           if (typeof computedValueFunction === "function") newItem.computedValue = computedValueFunction;
        }
        if (newItem.isRendered && typeof newItem.isRendered === "string") {
            let isRenderedFunction;
            try {
                isRenderedFunction = new Function("path, fieldData, data, interfaceState", `"use strict"; let result = true; try { result = ${newItem.isRendered}; } catch (e) { console.warn("error in isRendered function"); } return result;`);
                const testResult = isRenderedFunction(data);
            } catch (error) {
                console.error("is rendered error", error);
            }
            // eslint-disable-next-line no-new-func
            if (typeof isRenderedFunction === "function") newItem.isRendered = isRenderedFunction;
        }
        return newItem;
    });
    return parsedConfig;
};

export const getConfigPathFromDataPath = (path, config) => {
    if (typeof path !== "string") return '';
    const pathSplit = path.startsWith("{") ? path.substring(path.indexOf("}") + 2).split(".") : path.split(".");
    let realPath = '';
    pathSplit.forEach((key) => {
        const index = _.findIndex(realPath ? _.get(config, realPath) : config, { id: key.replace(/\[(\d+)\]/, "") });
        realPath = realPath === "" ? `[${index}]` : `${realPath}[${index}]`;
        const thisConfig = _.get(config, realPath);
        if (thisConfig && thisConfig.fields) realPath += ".fields";
        if (thisConfig && thisConfig.stages) realPath += ".stages";
    });
    return realPath.endsWith(".fields") || realPath.endsWith(".stages") ? realPath.substring(0, realPath.length - 7) : realPath;
};

export const doesPathExist = (path, store) => {
    if (!path) return false;
    const configPath = getConfigPathFromDataPath(path, store.currentConfig);
    const config = _.get(store.currentConfig, configPath);
    return configPath !== '' && config;
};

export const createNewFieldID = (path, type, store) => {
    const parentPath = path.substring(0, path.lastIndexOf("."));
    let counter = "";
    let newFieldID = `${type}${counter}`;
    while (doesPathExist(parentPath ? `${parentPath}.${newFieldID}` : newFieldID, store)) {
        if (counter) {
            counter++;
        } else {
            counter = 2;
        }
        newFieldID = `${type}${counter}`;
    }
    return newFieldID;
};

export const downloadFile = ({ data, fileName, fileType }) => {
    // Create a blob with the data we want to download as a file
    const blob = new Blob([data], { type: fileType });
    // Create an anchor element and dispatch a click event on it
    // to trigger a download
    const a = document.createElement('a');
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
};

export const getAllPaths = (config, path = "") => {
    let paths = [];
    if (Array.isArray(config)) {
        config.forEach((item) => {
            if (item) {
                paths.push(path ? `${path}.${item.id}` : item.id);
                if (item.type === "group" || item.type === "collection" || item.type === "wizard") {
                    paths = paths.concat(getAllPaths(item.fields, path ? `${path}.${item.id}` : item.id));
                }
            }
        });
    }
    return paths;
};

export const pathIsSelected = (path, selectedElement, fieldsetId) => {
    const actualPath = fieldsetId ? `{${fieldsetId}}.${path}` : path;
    return selectedElement === actualPath || (Array.isArray(selectedElement) && selectedElement.includes(actualPath));
};

function removeEmptyArraysFromObject(obj) {
    const newObj = _.cloneDeep(obj);
    for (let key in newObj) {
        if (Array.isArray(newObj[key]) && (newObj[key].length === 0 || _.isEmpty(newObj[key][0]))) {
            delete newObj[key];
        } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
            removeEmptyArraysFromObject(newObj[key]);
        }
    }
    return newObj;
}

export const parseTemplateLiterals = (text, data) => {
    let parsedText = text;
    try {
        parsedText = Mustache.render(text, removeEmptyArraysFromObject(data));
    } catch (error) {
        console.error("Template literal parsing error:", error);
    }
    return parsedText.replace(/\[object HTMLInputElement\]/g, "").replace(/\[object Object\]/g, "");
};

export const truncateString = (str, num) => {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
};

export const initNewCollections = (config, data) => {
    // Stages isn't automatically initializimng collections when copied by Stages Studio, so do it manually:
    const newData = {...data};
    config.forEach((item) => {
        if (item.type === "collection" && item.init) {
            if (Array.isArray(newData[item.id]) && newData[item.id].length === 0) {
                newData[item.id].push({});
            } else if (!Array.isArray(newData[item.id])) {
                newData[item.id] = [{}];
            }
        }
    });
    return newData;
};

export const removeEmptyElements = (obj) => {
    if (Array.isArray(obj)) {
        obj.forEach((element, index) => obj.splice(index, 1, removeEmptyElements(element)));
        return obj.filter(item => !!item);
    }
    return Object.fromEntries(Object.entries(obj)
        .filter(([, v]) => (Array.isArray(v) ? v.length !== 0 : (v !== null && v !== '' && v !== undefined)))
        .map(([k, v]) => [k, v === (Object(v)) ? removeEmptyElements(v) : v]));
};

export const arrayMove = (arr, old_index, new_index) => {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

export const getWidth = (inGroup, isFieldConfigEditor, isEditMode, width) => {
    if (isFieldConfigEditor) return "auto";
    if (isEditMode) {
        if (width === "small") return inGroup ? "calc(25% - 56px)" : "25%";
        if (width === "medium") return inGroup ? "calc(50% - 58px)" : "50%";
        if (width === "large") return inGroup ? "calc(100% - 60px)" : "100%";
    } else {
        if (width === "small") return "25%";
        if (width === "medium") return "50%";
        if (width === "large") return "100%";
    }
    return "auto";
};

export const removeNonMatchingProperties = (config, type) => {
    if (typeof config === "object" && fieldProps[type]) {
        Object.keys(config).forEach(key => {
            if (_.findIndex(fieldProps[type], {id: key}) === -1) delete config[key];
        });
    }
    return config;
};

export const textHasTemplateLiterals = (text) => {
    return text.indexOf("{{") !== -1 && text.indexOf("}}") !== -1;
}