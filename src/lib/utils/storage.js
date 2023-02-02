const getDataFromStorage = (id, type, prefix = "stages-form-") => {
    if ((type === "local" && typeof localStorage !== 'undefined') || (type === "session" && typeof sessionStorage !== 'undefined')) {
        const stringifiedStoredState = localStorage.getItem(`${prefix}${id}`) || '{}';
        let storedState = {};
        try {
            storedState = JSON.parse(stringifiedStoredState);
        } catch (e) {};
        return storedState;
    }
    return {};
};
  
const saveDataToStorage = (id, data = {}, type, prefix = "stages-form-") => {
    if (((type === "local" && typeof localStorage !== 'undefined') || (type === "session" && typeof sessionStorage !== 'undefined')) && typeof data === "object") {
        let stringifiedState = "{}";
        try {
            stringifiedState = JSON.stringify(data);
        } catch (e) {};
        localStorage.setItem(`${prefix}${id}`, stringifiedState);
    }
};

const removeDataFromStorage = (id, type, prefix = "stages-form-") => {
    if ((type === "local" && typeof localStorage !== 'undefined') || (type === "session" && typeof sessionStorage !== 'undefined')) {
        localStorage.removeItem(`${prefix}${id}`);
    }
};

export {
    getDataFromStorage,
    saveDataToStorage,
    removeDataFromStorage
};