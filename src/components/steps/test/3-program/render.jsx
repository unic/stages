const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div>
            <fieldset>
                {fields.program ? fields.program.map((subFields, index) => (
                    <div key={`program-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        {subFields.sport}
                        <br />
                        {subFields.time}
                        <br />
                        <button type="button" onClick={() => onCollectionAction("program", "remove", index)}>-</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("program", "add")}>+</button>
                {errors && errors.program ? <div style={{ color: "red" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </fieldset>
        </div>
    );
};

export default FormRenderer;