const WinzardNavButton = ({ fieldKey, hash, onClick, isStepDisabled, disableIfActive, children }) => {
    const mainStyles = {
        display: "inline-block",
        border: "1px solid #ddd",
        borderRadius: "3px",
        padding: "1px 8px",
        fontSize: "14px",
        textDecoration: "none",
        color: "#000",
        background: "#f8f8f8",
        minWidth: "64px",
        textAlign: "center"
    };
    return (
        <a
            href={hash}
            onClick={onClick}
            style={isStepDisabled(fieldKey, hash, disableIfActive) ? Object.assign({}, mainStyles, { color: "#bbb", pointerEvents: "none" }) : Object.assign({}, mainStyles)}>{children}</a>
    );
};

const WizardNavigation = ({ config, fieldKey, onNav, getHash, isStepActive, isStepDisabled }) => {
    const prevHash = getHash(fieldKey, "", "prev");
    const nextHash = getHash(fieldKey, "", "next");
    const firstHash = getHash(fieldKey, "", "first")
    const lastHash = getHash(fieldKey, "", "last")
    return (
        <div>
            <ul style={{ margin: "0 0 16px 0", padding: 0, listStyleType: "none", display: "flex" }}>
                <li style={{ padding: 0, margin: "0 8px 0 0" }}>
                    <WinzardNavButton fieldKey={fieldKey} hash={firstHash} onClick={() => onNav("first", fieldKey)} disableIfActive isStepDisabled={isStepDisabled}>First</WinzardNavButton>
                </li>
                {prevHash && (
                    <li style={{ padding: 0, margin: "0 8px 0 0" }}>
                        <WinzardNavButton fieldKey={fieldKey} hash={prevHash} onClick={() => onNav("prev", fieldKey)} isStepDisabled={isStepDisabled}>Prev</WinzardNavButton>
                    </li>
                )}
                {Array.isArray(config.stages) && config.stages.map((stage) => {
                    const stepHash = getHash(fieldKey, stage.id);
                    return (
                        <li style={{ padding: 0, margin: "0 8px 0 0" }} key={`#${fieldKey}.${stage.id}`}>
                            <WinzardNavButton fieldKey={fieldKey} hash={stepHash} onClick={() => onNav("step", fieldKey, stage.id)} isStepDisabled={isStepDisabled}>{isStepActive(fieldKey, stage.id) ? <strong>{stage.label}</strong> : stage.label}</WinzardNavButton>
                        </li>
                    );
                })}
                {nextHash && (
                    <li style={{ padding: 0, margin: "0 8px 0 0" }}>
                        <WinzardNavButton fieldKey={fieldKey} hash={nextHash} onClick={() => onNav("next", fieldKey)} isStepDisabled={isStepDisabled}>Next</WinzardNavButton>
                    </li>
                )}
                <li style={{ padding: 0, margin: "0 8px 0 0" }}>
                    <WinzardNavButton fieldKey={fieldKey} hash={lastHash} onClick={() => onNav("last", fieldKey)} disableIfActive isStepDisabled={isStepDisabled}>Last</WinzardNavButton>
                </li>
            </ul>
        </div>
    );
};

export default WizardNavigation;