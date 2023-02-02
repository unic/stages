import { useState, useEffect, useCallback } from "react";

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

export {
    useEffectOnce,
    useMount,
    useLifecycles,
    useHash
};