const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div>
            {fields.country}
            <br />
            {fields.postalcode}
            <br />
            {fields.city}
            <br />
            {fields.username}
            <br />
            {fields.post} {fields.comment1} {fields.comment2}
            <br />
            <h3>Meals:</h3>
            <fieldset>
                {fields.meals ? fields.meals.map((subFields, index) => (
                    <div key={`meal-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        {subFields.name}
                        <br />
                        {subFields.calories || subFields.alcohol}
                        <br />
                        {subFields.fullName}
                        <button type="button" onClick={() => onCollectionAction("meals", "remove", index)}>-</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("meals", "add", "food")}>+ Food</button> 
                <button type="button" onClick={() => onCollectionAction("meals", "add", "drink")}>+ Drink</button>
                {errors && errors.meals ? <div style={{ color: "red" }}>Please add at least one meal!</div> : null}
            </fieldset>
        </div>
    );
};

export default FormRenderer;