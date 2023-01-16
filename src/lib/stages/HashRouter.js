import { useState, useEffect, useCallback } from "react";
import findIndex from "lodash.findindex";

// As the react-use library took up a large part of Stages and was only 
// used in this function, we extracted here what was needed.
// For the original implementation and docs head over to:
// https://github.com/streamich/react-use

const useEffectOnce = (effect) => {
    useEffect(effect, []);
};

const useMount = (fn) => {
    useEffectOnce(() => {
        fn();
    });
};

const on = (obj, ...args) => {
    if (obj && obj.addEventListener) {
        obj.addEventListener(...args);
    }
};

const off = (obj, ...args) => {
    if (obj && obj.removeEventListener) {
        obj.removeEventListener(...args);
    }
};

const useLifecycles = (mount, unmount) => {
    useEffect(() => {
        if (mount) {
            mount();
        }
        return () => {
            if (unmount) {
                unmount();
            }
        };
    }, []);
};

const useHash = () => {
    const [hash, setHash] = useState(() => window.location.hash);

    const onHashChange = useCallback(() => {
        setHash(window.location.hash);
    }, []);

    useLifecycles(
        () => {
            on(window, 'hashchange', onHashChange);
        },
        () => {
            off(window, 'hashchange', onHashChange);
        }
    );

    const _setHash = useCallback(
        (newHash) => {
            if (newHash !== hash) {
                window.location.hash = newHash;
            }
        },
        [hash]
    );

    return [hash, _setHash];
};

/*
    This is our default router for Stages. It uses URL hashes.
    It will fallback to numbers if you don't supply keys to
    Stages.

    With keys: #!mystep
    With numbers: #!1
*/
const HashRouter = ({ step, onChange, keys, prefix, hashFormat = "#!" }) => {
    const [hash, setHash] = useHash();
    const [isMounted, setIsMounted] = useState(false);

    const isPositiveInteger = str => {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
    }

    const getHashFromIndex = stepIndex => {
        if (keys && keys[stepIndex]) return keys[stepIndex].key;
        return prefix ? `${prefix}-${stepIndex}` : stepIndex;
    };

    const getIndexFromHash = hash => {
        // hash can be a number or id:
        // #!mystep
        // #!1
        const hashSplit = hash.split(hashFormat);
        if (hashSplit.length === 2) {
            const hashStr = hashSplit[1];
            if (isPositiveInteger(hashStr)) {
                return Number(hashStr);
            }
            return findIndex(keys, { key: hashStr });
        }
        return -1;
    };

    const handleHashes = () => {
        if (hash.indexOf(hashFormat) !== -1) {
            const index = getIndexFromHash(hash);
            if (index !== -1) {
                setHash(`${hashFormat}${getHashFromIndex(index)}`);
                onChange(index);
            }
        } else {
            setHash(`${hashFormat}${getHashFromIndex(step)}`);
        }
    };

    useEffect(() => {
        if (isMounted) {
            handleHashes();
        }
    }, [hash]);

    useEffect(() => {
        if (isMounted) {
            setHash(`${hashFormat}${getHashFromIndex(step)}`);
        }
    }, [step]);

    useMount(() => {
        handleHashes();
        setIsMounted(true);
    });

    return null;
};

export default HashRouter;