/**
 * Check if the element is in the browser viewport
 * 
 * @param {*} el the element
 * @returns {boolean} true if the element is in the browser viewport
 */
const isElementInViewport = el => {
    const rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
}

// @ts-ignore
const isDebugging = () => typeof window !== "undefined" && typeof window.stagesLogging === "function";

function isPromise(p) {
    return p && Object.prototype.toString.call(p) === "[object Promise]";
}

export {
    isElementInViewport,
    isDebugging,
    isPromise
};