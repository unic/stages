import React from "react";

/**
 * This is a default component for a forms action buttons. It is ment as
 * a sample on how to build your own, but of course you can use it if it
 * fits your usecase.
 *
 * @param {Array} config - an array of objects containing `title`,
 * `type`, `onClick`, and `validate` properties for each button
 * @param {Function} handleActionClick - a function that handles clicks
 * on the buttons
 * @param {Boolean} isDisabled - a boolean value that determines whether
 * the buttons are disabled or not
 * @return {JSX.Element} a list of button components
 */
const Actions = ({ config, handleActionClick, isDisabled }) => (
    <>
        {config.map((action, index) =>{
            if (action.type === "primary") {
                return (
                    <button
                        type="button"
                        onClick={() => handleActionClick(action.onClick, action.validate)}
                        key={`action-${index}`}
                        disabled={isDisabled}
                    >
                        <strong>{action.title}</strong>
                    </button>
                );
            }
            return (
                <button
                    type="button"
                    onClick={() => handleActionClick(action.onClick, action.validate)}
                    key={`action-${index}`}
                    disabled={isDisabled}
                >
                    {action.title}
                </button>
            );
        })}
    </>
);

export default Actions;