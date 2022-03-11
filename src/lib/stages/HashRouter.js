import React, { useState, useEffect } from "react";
import { useHash, useMount } from 'react-use';
import findIndex from "lodash.findindex";

/*
    This is our default router for Stages. It uses URL hashes.
    It will fallback to numbers if you don't supply keys to
    Stages.

    With keys: #/mystep
    With numbers: #/1
*/
const HashRouter = ({ step, onChange, keys }) => {
    const [hash, setHash] = useHash();
    const [isMounted, setIsMounted] = useState(false);

    const isPositiveInteger = str => {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
    }

    const getHashFromIndex = stepIndex => {
        if (keys && keys[stepIndex]) return keys[stepIndex].key;
        return `step-${stepIndex}`;
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
            return findIndex(keys, { key: hashStr });
        }
        return -1;
    };

    const handleHashes = () => {
        if (hash.indexOf("#/") !== -1) {
            const index = getIndexFromHash(hash);
            if (index !== -1) {
                setHash(`#/${getHashFromIndex(index)}`);
                onChange(index);
            }
        } else {
            setHash(`#/${getHashFromIndex(step)}`);
        }
    };

    useEffect(() => {
        if (isMounted) {
            handleHashes();
        }
    }, [hash]);

    useEffect(() => {
        if (isMounted) {
            setHash(`#/${getHashFromIndex(step)}`);
        }
    }, [step]);

    useMount(() => {
        handleHashes();
        setIsMounted(true);
    });

    return null;
};

export default HashRouter;