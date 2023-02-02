const Collection = ({ title, description, collectionKey, fields, onCollectionAction, errors }) => {
    return (
        <>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="pure-g" style={{ border: "1px #ccc dashed", padding: "20px 0" }}>
                <div className="pure-u-4-5">
                    {fields.collectionGroup && fields.collectionGroup[collectionKey] ? fields.collectionGroup[collectionKey].map((subFields, index) => (
                        <div key={`${`collectionGroup.${collectionKey}`}-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                            <div className="pure-u-8-24">{subFields.field1}</div>
                            <div className="pure-u-16-24">{subFields.field2}</div>
                            {subFields.result ? <div className="pure-u-8-24"><br />{subFields.result}</div> : null}
                            <button type="button" onClick={() => onCollectionAction(`collectionGroup.${collectionKey}`, "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                            <button type="button" onClick={() => onCollectionAction(`collectionGroup.${collectionKey}`, "duplicate", index)} style={{ position: "absolute", right: "38px" }}>Duplicate</button>
                        </div>)
                    ) : null}
                </div>
                <div className="pure-u-1-5">
                    <button type="button" onClick={() => onCollectionAction(`collectionGroup.${collectionKey}`, "add")} style={{ float: "right", margin: "8px" }}>+</button>
                </div>
            </div>
            {errors && errors[`collectionGroup.${collectionKey}`] ? <div style={{ color: "red", marginTop: "8px" }}>Please add at least one entry!</div> : null}
        </>
    );
};

const FormRenderer = ({ fields, onCollectionAction, modifyConfig, isDirty, dirtyFields, data, errors }) => {
    return (
        <div>
            <div>
                {fields.country}
            </div>
            <br />
            <div>
                {fields.postalcode}
            </div>
            <br />
            {fields.coords ? (
                <fieldset>
                    {fields.coords.lng}
                    <br />
                    {fields.coords.lat}
                </fieldset>
            ) : null}
        </div>
    );
};

export default FormRenderer;