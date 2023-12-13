// @ts-nocheck
import get from "lodash.get";
import findIndex from "lodash.findindex";
import safeEval from "safe-eval";

export const parseJSONConfig = (config, data) => {
    const parsedConfig = config.map((item) => {
        if (item.type === "group" || item.type === "collection") {
            item.fields = parseJSONConfig(item.fields, data);
        }
        if (item.computedValue) {
            /*
            try {
                safeEval(item.computedValue, data);
            } catch (error) {
                console.log("!!!!!!!! Eval not safe!!!!!!!!!");
                //item.computedValue = undefined;
            }
            */
           // eslint-disable-next-line no-new-func
           item.computedValue = new Function("data", `return ${item.computedValue};`)
        }
        return item;
    });
    return parsedConfig;
};

export const getConfigPathFromDataPath = (path, config) => {
    const pathSplit = path.split(".");
    let realPath = '';
    pathSplit.forEach((key) => {
        const index = findIndex(realPath ? get(config, realPath) : config, { id: key.replace(/\[(\d+)\]/, "") });
        realPath = realPath === "" ? `[${index}]` : `${realPath}[${index}]`;
        const thisConfig = get(config, realPath);
        if (thisConfig && thisConfig.fields) realPath += ".fields";
    });
    return realPath;
};

export const doesPathExist = (path, store) => {
    const configPath = getConfigPathFromDataPath(path, store.currentConfig);
    const config = get(store.currentConfig, configPath);
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