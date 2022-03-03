import React from "react";

/*
    This is a default component for a forms action buttons. It is ment as
    a sample on how to build your own, but of course you can use it if it
    fits your usecase.
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