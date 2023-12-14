// @ts-nocheck
import _ from "lodash";

export const parseJSONConfig = (config, data) => {
    const parsedConfig = config.map((item) => {
        const newItem = { ...item };
        if (newItem.type === "group" || newItem.type === "collection") {
            newItem.fields = parseJSONConfig(newItem.fields, data);
        }
        if (newItem.computedValue && typeof newItem.computedValue === "string") {
            let computedValueFunction;
            try {
                computedValueFunction = new Function("data", `return ${newItem.computedValue};`);
            } catch (error) {
                console.error("computed value error", error);
            }
           // eslint-disable-next-line no-new-func
           if (typeof computedValueFunction === "function") newItem.computedValue = computedValueFunction;
        }
        return newItem;
    });
    return parsedConfig;
};

export const getConfigPathFromDataPath = (path, config) => {
    const pathSplit = path.split(".");
    let realPath = '';
    pathSplit.forEach((key) => {
        const index = _.findIndex(realPath ? _.get(config, realPath) : config, { id: key.replace(/\[(\d+)\]/, "") });
        realPath = realPath === "" ? `[${index}]` : `${realPath}[${index}]`;
        const thisConfig = _.get(config, realPath);
        if (thisConfig && thisConfig.fields) realPath += ".fields";
    });
    return realPath;
};

export const doesPathExist = (path, store) => {
    const configPath = getConfigPathFromDataPath(path, store.currentConfig);
    const config = _.get(store.currentConfig, configPath);
    return configPath !== '' && config;
};

export const createNewFieldID = (path, type, store) => {
    const parentPath = path.substring(0, path.lastIndexOf("."));
    let counter = 1;
    let newFieldID = `${type}${counter}`;
    while (doesPathExist(parentPath ? `${parentPath}.${newFieldID}` : newFieldID, store)) {
        counter++;
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
            paths.push(path ? `${path}.${item.id}` : item.id);
            if (item.type === "group" || item.type === "collection") {
                paths = paths.concat(getAllPaths(item.fields, path ? `${path}.${item.id}` : item.id));
            }
        });
    }
    return paths;
};

export const pathIsSelected = (path, selectedElement) => {
    return selectedElement === path || (Array.isArray(selectedElement) && selectedElement.includes(path));
}