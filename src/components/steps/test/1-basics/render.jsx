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
        <div style={{ border: isDirty ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
            <div style={{ border: dirtyFields.country ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                {fields.country}
            </div>
            <br />
            <div style={{ border: dirtyFields.postalcode ? "4px #f30 solid" : "4px #eee solid", padding: "32px" }}>
                {fields.postalcode}
            </div>
            <br />
            {fields.seltest}
            <br />
            {fields.city}
            <br />
            {fields.city2}
            <br />
            {fields.city3}
            <br />
            {fields.q1}
            <br />
            <p>And you can compute collection item specific data, as well:</p>
            <fieldset>
                <p>Do some maths:</p>
                {fields.maths ? fields.maths.map((subFields, index) => (
                    <div key={`math-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        <div className="pure-g">
                            <div className="pure-u-1-3">{subFields.factor1}</div>
                            <div className="pure-u-1-3">{subFields.factor2}</div>
                            <div className="pure-u-1-3">{subFields.result}</div>
                        </div>
                        <br />
                        <button type="button" onClick={() => onCollectionAction("maths", "remove", index)}>-</button>
                        <button type="button" onClick={() => onCollectionAction("maths", "move", index, 0)}>Move to top</button>
                        <button type="button" onClick={() => onCollectionAction("maths", "move", index, fields.maths.length - 1)}>Move to bottom</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("maths", "add")}>+</button>
            </fieldset>
            <br />
            <fieldset>
                {fields.coords.lng}
                <br />
                {fields.coords.lat}
            </fieldset>
            <br />
            <fieldset>
                {fields.group1.field1}
                <br />
                {fields.group1.field2}
                <br />
                {fields.group1.coords ? (
                    <>
                        <fieldset>
                            {fields.group1.coords.lng}
                            <br />
                            {fields.group1.coords.lat}
                        </fieldset>
                        <br />
                    </>
                ) : null}
                {!fields.group1.coords ? <button onClick={() => modifyConfig("group1", "coordinates", "add")}>Add Coordinate Fields</button> : null}
                {fields.group1.coords ? <button onClick={() => modifyConfig("group1", "coordinates", "remove")}>Remove Coordinate Fields</button> : null}
                <fieldset>
                    {fields.group1.subgroup1.field1}
                    <br />
                    {fields.group1.subgroup1.field2}
                    <br />
                    {fields.group1.subgroup1.field3}
                    {fields.group1.subgroup1.coords ? (
                        <>
                            <fieldset>
                                {fields.group1.subgroup1.coords.lng}
                                <br />
                                {fields.group1.subgroup1.coords.lat}
                            </fieldset>
                            <br />
                        </>
                    ) : null}
                    {!fields.group1.subgroup1.coords ? <button onClick={() => modifyConfig("group1.subgroup1", "coordinates", "add")}>Add Coordinate Fields</button> : null}
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
            <fieldset>
                <p>Dynamic values from an async call populating a select:</p>
                {fields.dynamicValuesGroup.post}
                <br />
                {fields.dynamicValuesGroup.comment}
            </fieldset>
            <br />
            <fieldset>
                {fields.collection1 ? fields.collection1.map((subFields, index) => (
                    <div key={`collection1-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px" }}>
                        <div className="pure-g">
                            <div className="pure-u-1-3">{subFields.field1}</div>
                            <div className="pure-u-1-3">{subFields.field2}</div>
                            <fieldset>
                                {subFields.coords.lng}
                                <br />
                                {subFields.coords.lat}
                            </fieldset>
                            <br />
                            {subFields.dynSelect}
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
                                            {subSubFields.coords ? (
                                                <>
                                                    <fieldset>
                                                        {subSubFields.coords.lng}
                                                        <br />
                                                        {subSubFields.coords.lat}
                                                    </fieldset>
                                                    <br />
                                                </>
                                            ) : null}
                                            <button type="button" onClick={() => onCollectionAction(`collection1[${index}].colGroup.collection1`, "remove", subIndex)}>-</button>
                                        </div>)
                                    ) : null}
                                    {subFields.colGroup.collection1 && subFields.colGroup.collection1[0] && !subFields.colGroup.collection1[0].coords ? <button onClick={() => modifyConfig(`collection1[${index}].colGroup.collection1`, "coordinates", "add")}>Add Coordinate Fields</button> : null}
                                    <br />
                                    <button type="button" onClick={() => onCollectionAction(`collection1[${index}].colGroup.collection1`, "add")}>+</button>
                                </fieldset>
                            </fieldset>
                        </div>
                        <br />
                        <button type="button" onClick={() => onCollectionAction("collection1", "remove", index)}>-</button>
                    </div>)
                ) : null}
                <button type="button" onClick={() => onCollectionAction("collection1", "add")}>+</button>
                <button type="button" onClick={() => onCollectionAction("collection1", "sort", ["field1", "field2"])}>Sort</button>
            </fieldset>
            <fieldset>
                <div>
                    <Collection
                        title="Simple, non required, non initialized collection:"
                        description="User can add as many entries or as little as he wishes. No minimum or maximum requirements. And no entry is initialized."
                        collectionKey="collection1"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="Initialized collection:"
                        description="This will render the first empty entry and filling out data is optional."
                        collectionKey="collection2"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="Initialized and required collection:"
                        description="This will render the first empty entry and throw a collection error if you don't add any entries."
                        collectionKey="collection3"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="A minimum of 2 and maximum of 5 initialized entries:"
                        description="This will initialize two entries which are empty. You can't remove for less than two. They are not required, so can be left empty."
                        collectionKey="collection4"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="A minimum of 2 and maximum of 5 initialized entries, all required:"
                        description="This will initialize two entries which are required. If you don't fill out the required collection fields, it will show an error on all required fields."
                        collectionKey="collection5"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="Initial data:"
                        description="This one has initial data defined, so it will render those initial data, even without init being true."
                        collectionKey="collection6"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="Computed data on individual items:"
                        description="You can compute field values based on data of the same item. Try it out by adding numbers and additional collection items!"
                        collectionKey="collection7"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <Collection
                        title="Force entries to be uniq:"
                        description="Sometimes you only want uniq entries in a collection. With the isUniq property you can force Stages to validate that. Add two entries with the same values and submit to see the error:"
                        collectionKey="collection8"
                        fields={fields}
                        onCollectionAction={onCollectionAction}
                        errors={errors}
                    />
                    <h3>Union Type Collections</h3>
                    <p>These ones can have multiple different field configs, here "food" and "drink". When you add an entry, you have to choose the type which you want to add.</p>
                    <div className="pure-g" style={{ border: "1px #ccc dashed" }}>
                        <div className="pure-u-4-5">
                            {fields.collectionGroup && fields.collectionGroup.collection9 ? fields.collectionGroup.collection9.map((subFields, index) => (
                                <div key={`meal-${index}`} style={{ background: "#eee", margin: "8px", padding: "8px", position: "relative" }} className="pure-g">
                                    <div className="pure-u-8-24">{subFields.name}</div>
                                    <div className="pure-u-16-24">{subFields.calories || subFields.alcohol}</div>
                                    {subFields.fullName ? <div className="pure-u-8-24"><br />{subFields.fullName}</div> : null}
                                    <button type="button" onClick={() => onCollectionAction("collectionGroup.collection9", "remove", index)} style={{ position: "absolute", right: "8px" }}>-</button>
                                </div>)
                            ) : null}
                            <div className="pure-u-1-5">
                                <br />
                                <button type="button" onClick={() => onCollectionAction("collectionGroup.collection9", "add", "food")}>+ Food</button> 
                                {" "}
                                <button type="button" onClick={() => onCollectionAction("collectionGroup.collection9", "add", "drink")}>+ Drink</button>
                            </div>
                            {errors && errors.collection9 ? <div style={{ color: "red" }}>Please add at least one meal!</div> : null}
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
};

export default FormRenderer;