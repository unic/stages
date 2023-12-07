// @ts-nocheck
import get from "lodash.get";
import findIndex from "lodash.findindex";

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