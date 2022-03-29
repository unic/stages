const FormRenderer = ({ fields, onCollectionAction, data }) => {
    return (
        <div>
            {fields.username}
            <br />
            {fields.email}
            <br />
            {fields.password}
            <br />
            {fields.onlyNumbers}
            <br />
            {fields.signedIn}
            <br />
            {fields.duration}
            <br />
            {fields.onTheRadio}
            <br />
            <fieldset>
                {fields.maths ? fields.maths.map((subFields, index) => (
                    <div key={`math-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        {subFields.factor1}
                        <br />
                        {subFields.factor2}
                        <br />
                        {subFields.result}
                        <br />
                        <button type="button" onClick={() => onCollectionAction("maths", "remove", index)}>-</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("maths", "add")}>+</button>
            </fieldset>
        </div>
    );
};

export default FormRenderer;