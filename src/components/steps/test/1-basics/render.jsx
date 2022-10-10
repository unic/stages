const Collection = ({ title, description, collectionKey, fieldProps, errors }) => {
    return (
        <>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="pure-g" style={{ border: "1px #ccc dashed" }}>
                <div className="pure-u-4-5">
                    {fieldProps.fields[collectionKey] ? fieldProps.fields[collectionKey].map((subFields, index) => (
                        <div key={`${collectionKey}-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                            <div className="pure-u-8-24">{subFields.field1}</div>
                            <div className="pure-u-16-24">{subFields.field2}</div>
                            {subFields.result ? <div className="pure-u-8-24"><br />{subFields.result}</div> : null}
                            <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                        </div>)
                    ) : null}
                </div>
                <div className="pure-u-1-5">
                    <button type="button" onClick={() => fieldProps.onCollectionAction(collectionKey, "add")} style={{ float: "right", margin: "8px" }}>+</button>
                </div>
            </div>
            {errors && errors[collectionKey] ? <div style={{ color: "red", marginTop: "8px" }}>Please add at least one entry!</div> : null}
        </>
    );
};

const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div>
            {fields.country}
            <br />
            {fields.postalcode}
            <br />
            {fields.city}
            <br />
            {fields.city2}
            <br />
            {fields.city3}
            <br />
            {fields.q1}
            <br />
            <Collection
                title="Simple, non required, non initialized collection:"
                description="User can add as many entries or as little as he wishes. No minimum or maximum requirements. And no entry is initialized."
                collectionKey="collection1"
                fieldProps={{fields, onCollectionAction}}
                errors={fields.errors}
            />
        </div>
    );
};

export default FormRenderer;