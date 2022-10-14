const FormRenderer = ({ fields, onCollectionAction, isDirty, dirtyFields, data, errors }) => {
    return (
        <div style={{ border: isDirty ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
            <div style={{ border: dirtyFields.country ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                {fields.country}
            </div>
            <br />
            <div style={{ border: dirtyFields.postalcode ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                {fields.postalcode}
            </div>
            <br />
            {fields.city}
            <br />
            {fields.city2}
            <br />
            {fields.city3}
            <br />
            {fields.q1}
            <br />
            <fieldset>
                {fields.group1.field1}
                <br />
                {fields.group1.field2}
                <br />
                <fieldset>
                    {fields.group1.subgroup1.field1}
                    <br />
                    {fields.group1.subgroup1.field2}
                    <br />
                    {fields.group1.subgroup1.field3}
                </fieldset>
            </fieldset>
            <br />
            <p>The first example filters away all non numbers which you enter:</p>
            <div>
                {fields.onlyNumbers}
            </div>
            <br />
            <p>In this example, we compute the sum of Field 1 and Filed 2 and display it in the Sum field:</p>
            <div className="pure-g">
                <div className="pure-u-1-3">{fields.field1}</div>
                <div className="pure-u-1-3">{fields.field2}</div>
                <div className="pure-u-1-3">{fields.sum}</div>
            </div>
            <br />
            {fields.atLeastOne}
            {fields.username}
            <br />
            <p>And you can compute collection item specific data, as well:</p>
            <fieldset>
                {fields.maths ? fields.maths.map((subFields, index) => (
                    <div key={`math-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        <div className="pure-g">
                            <div className="pure-u-1-3">{subFields.factor1}</div>
                            <div className="pure-u-1-3">{subFields.factor2}</div>
                            <div className="pure-u-1-3">{subFields.result}</div>
                        </div>
                        <br />
                        <button type="button" onClick={() => onCollectionAction("maths", "remove", index)}>-</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("maths", "add")}>+</button>
            </fieldset>
            <br />
            <fieldset>
                {fields.collection1 ? fields.collection1.map((subFields, index) => (
                    <div key={`collection1-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        <div className="pure-g">
                            <div className="pure-u-1-3">{subFields.field1}</div>
                            <div className="pure-u-1-3">{subFields.field2}</div>
                            <br />
                            <fieldset>
                                <div className="pure-u-1-3">{subFields.colGroup.field1}</div>
                                <br />
                                <fieldset>
                                    {subFields.colGroup.collection1 ? subFields.colGroup.collection1.map((subSubFields, subIndex) => (
                                        <div key={`subCollection1-${subIndex}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                                            <div className="pure-g">
                                                <div className="pure-u-1-3">{subSubFields.field1}</div>
                                            </div>
                                            <br />
                                            <button type="button" onClick={() => onCollectionAction(`collection1[${index}].colGroup.collection1`, "remove", subIndex)}>-</button>
                                        </div>)
                                    ) : null}
                                    <button type="button" onClick={() => onCollectionAction(`collection1[${index}].colGroup.collection1`, "add")}>+</button>
                                </fieldset>
                            </fieldset>
                        </div>
                        <br />
                        <button type="button" onClick={() => onCollectionAction("collection1", "remove", index)}>-</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("collection1", "add")}>+</button>
            </fieldset>
        </div>
    );
};

export default FormRenderer;